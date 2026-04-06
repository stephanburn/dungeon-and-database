'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SKILLS, SKILL_BY_KEY, SAVING_THROW_NAMES, normalizeSkillKey } from '@/lib/skills'
import type { AbilityKey, SkillKey } from '@/lib/skills'
import type { Class, Background } from '@/lib/types/database'

interface Stats {
  str: number; dex: number; con: number
  int: number; wis: number; cha: number
}

interface SkillsCardProps {
  stats: Stats
  totalLevel: number
  selectedClass: Class | null
  background: Background | null
  // Class-chosen skill proficiencies (canonical keys)
  skillProficiencies: string[]
  canEdit: boolean
  onChange: (skills: string[]) => void
}

function mod(score: number) { return Math.floor((score - 10) / 2) }
function profBonus(level: number) { return Math.floor((Math.max(level, 1) - 1) / 4) + 2 }
function fmtMod(n: number) { return n >= 0 ? `+${n}` : `${n}` }

export function SkillsCard({
  stats, totalLevel, selectedClass, background,
  skillProficiencies, canEdit, onChange,
}: SkillsCardProps) {
  const pb = profBonus(totalLevel)

  // Background skills (auto-granted, locked)
  const bgSkills = new Set(
    (background?.skill_proficiencies ?? []).map((s) => normalizeSkillKey(s))
  )

  // Class skill choices config
  const rawChoices = selectedClass?.skill_choices as { count?: number; from?: string[] } | null
  const choiceCount = rawChoices?.count ?? 0
  const choiceFrom = new Set((rawChoices?.from ?? []).map(normalizeSkillKey))

  // Class-chosen skills (what player has picked, excluding bg auto-grants)
  const chosen = new Set(skillProficiencies.filter((s) => !bgSkills.has(s as SkillKey)))

  // All proficient skills = bg + class-chosen
  function isProficient(key: SkillKey) { return bgSkills.has(key) || chosen.has(key) }

  function toggleSkill(key: SkillKey) {
    if (!canEdit) return
    if (bgSkills.has(key)) return // can't toggle bg skills
    if (!choiceFrom.has(key) && !chosen.has(key)) return // not available to this class

    const next = new Set(chosen)
    if (next.has(key)) {
      next.delete(key)
    } else {
      if (next.size >= choiceCount) return // at limit
      next.add(key)
    }
    onChange(Array.from(next))
  }

  // Class saving throws
  const savingThrows = new Set(
    (selectedClass?.saving_throw_proficiencies ?? []).map((s) => s.toLowerCase() as AbilityKey)
  )

  const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-neutral-200">Skills &amp; Proficiencies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Saving throws */}
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Saving Throws</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {abilities.map((ability) => {
              const proficient = savingThrows.has(ability)
              const modifier = mod(stats[ability]) + (proficient ? pb : 0)
              return (
                <div key={ability} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${proficient ? 'bg-green-400' : 'bg-neutral-600'}`} />
                  <span className="text-neutral-400 w-6 font-mono text-xs">{fmtMod(modifier)}</span>
                  <span className={proficient ? 'text-neutral-200' : 'text-neutral-500'}>
                    {SAVING_THROW_NAMES[ability]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Skills</p>
            {canEdit && choiceCount > 0 && (
              <p className="text-xs text-neutral-500">
                {chosen.size}/{choiceCount} class skill{choiceCount !== 1 ? 's' : ''} chosen
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {SKILLS.map((skill) => {
              const proficient = isProficient(skill.key)
              const abilityMod = mod(stats[skill.ability])
              const modifier = abilityMod + (proficient ? pb : 0)
              const fromBg = bgSkills.has(skill.key)
              const isChoosable = canEdit && choiceFrom.has(skill.key) && !fromBg
              const isChosen = chosen.has(skill.key)
              const atLimit = chosen.size >= choiceCount && !isChosen

              return (
                <button
                  key={skill.key}
                  type="button"
                  onClick={() => toggleSkill(skill.key)}
                  disabled={!isChoosable || (atLimit && !isChosen)}
                  className={`flex items-center gap-2 text-sm text-left rounded px-1 py-0.5 w-full transition-colors
                    ${isChoosable && !(atLimit && !isChosen) ? 'hover:bg-neutral-800 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    proficient
                      ? fromBg ? 'bg-blue-400' : 'bg-green-400'
                      : 'bg-neutral-600'
                  }`} />
                  <span className="text-neutral-400 w-6 font-mono text-xs">{fmtMod(modifier)}</span>
                  <span className={proficient ? 'text-neutral-200' : 'text-neutral-500'}>
                    {skill.name}
                  </span>
                  <span className="text-neutral-600 text-xs ml-auto">{skill.ability.toUpperCase()}</span>
                </button>
              )
            })}
          </div>
          {canEdit && (
            <p className="text-xs text-neutral-600 mt-2">
              Green dot = class choice · Blue dot = background (locked)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
