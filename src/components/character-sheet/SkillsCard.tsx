'use client'

import { Circle, Disc, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SKILLS, SAVING_THROW_NAMES, normalizeSkillKey } from '@/lib/skills'
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
  // All actively-chosen skill proficiencies (class + background choices combined)
  skillProficiencies: string[]
  canEdit: boolean
  onChange: (skills: string[]) => void
}

function mod(score: number) { return Math.floor((score - 10) / 2) }
function profBonus(level: number) { return Math.floor((Math.max(level, 1) - 1) / 4) + 2 }
function fmtMod(n: number) { return n >= 0 ? `+${n}` : `${n}` }

function SkillStateIcon({
  proficient,
  locked,
}: {
  proficient: boolean
  locked: boolean
}) {
  if (locked) return <Lock className="h-3.5 w-3.5 text-blue-400" />
  if (proficient) return <Disc className="h-3.5 w-3.5 fill-current text-green-400" />
  return <Circle className="h-3.5 w-3.5 text-neutral-500" />
}

export function SkillsCard({
  stats, totalLevel, selectedClass, background,
  skillProficiencies, canEdit, onChange,
}: SkillsCardProps) {
  const pb = profBonus(totalLevel)

  // Background: auto-granted (locked)
  const bgAutoSkills = new Set(
    (background?.skill_proficiencies ?? []).map((s) => normalizeSkillKey(s))
  )

  // Background: choosable pool
  const bgChoiceFrom = new Set(
    (background?.skill_choice_from ?? []).map((s) => normalizeSkillKey(s))
  )
  const bgChoiceCount = background?.skill_choice_count ?? 0

  // Class skill choices config
  const rawChoices = selectedClass?.skill_choices as { count?: number; from?: string[] } | null
  const classChoiceCount = rawChoices?.count ?? 0
  const classChoiceFrom = new Set((rawChoices?.from ?? []).map(normalizeSkillKey))

  // All actively chosen (excludes auto-granted)
  const allChosen = new Set(skillProficiencies.filter((s) => !bgAutoSkills.has(s as SkillKey)))

  // Count bg-chosen: in bgChoiceFrom, NOT in classChoiceFrom (class takes priority on overlap)
  const allChosenArr = Array.from(allChosen)
  const bgChosen = new Set(allChosenArr.filter((s) => bgChoiceFrom.has(s as SkillKey) && !classChoiceFrom.has(s as SkillKey)))
  const classChosen = new Set(allChosenArr.filter((s) => classChoiceFrom.has(s as SkillKey)))

  function isProficient(key: SkillKey) {
    return bgAutoSkills.has(key) || allChosen.has(key)
  }

  function toggleSkill(key: SkillKey) {
    if (!canEdit) return
    if (bgAutoSkills.has(key)) return // auto-granted, locked

    const isInClassPool = classChoiceFrom.has(key)
    const isInBgPool = bgChoiceFrom.has(key)

    if (!isInClassPool && !isInBgPool) return // not available

    const isChosen = allChosen.has(key)
    const next = new Set(allChosen)

    if (isChosen) {
      next.delete(key)
    } else {
      const canAddClass = isInClassPool && classChosen.size < classChoiceCount
      const canAddBg = isInBgPool && !isInClassPool && bgChosen.size < bgChoiceCount
      if (!canAddClass && !canAddBg) return // at limit for both applicable pools
      next.add(key)
    }
    onChange(Array.from(next))
  }

  // Class saving throws
  const savingThrows = new Set(
    (selectedClass?.saving_throw_proficiencies ?? []).map((s) => s.toLowerCase() as AbilityKey)
  )

  const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  const choiceCountLabel = [
    classChoiceCount > 0 ? `${classChosen.size}/${classChoiceCount} class` : null,
    bgChoiceCount > 0 ? `${bgChosen.size}/${bgChoiceCount} background` : null,
  ].filter(Boolean).join(' · ')

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
            {canEdit && choiceCountLabel && (
              <p className="text-xs text-neutral-500">{choiceCountLabel}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {SKILLS.map((skill) => {
              const proficient = isProficient(skill.key)
              const abilityMod = mod(stats[skill.ability])
              const modifier = abilityMod + (proficient ? pb : 0)
              const fromBgAuto = bgAutoSkills.has(skill.key)
              const fromBgChoice = bgChosen.has(skill.key)
              const fromClassChoice = classChosen.has(skill.key)

              const isClassChoosable = canEdit && classChoiceFrom.has(skill.key) && !fromBgAuto
              const isBgChoosable = canEdit && bgChoiceFrom.has(skill.key) && !classChoiceFrom.has(skill.key) && !fromBgAuto
              const isChoosable = isClassChoosable || isBgChoosable

              const atClassLimit = classChosen.size >= classChoiceCount && !fromClassChoice
              const atBgLimit = bgChosen.size >= bgChoiceCount && !fromBgChoice
              const atLimit = (isClassChoosable && atClassLimit) && (!isBgChoosable || atBgLimit)

              const isEligible = isChoosable && !atLimit

              return (
                <button
                  key={skill.key}
                  type="button"
                  onClick={() => toggleSkill(skill.key)}
                  disabled={!isChoosable || (atLimit && !proficient)}
                  className={`flex items-center gap-2 text-sm text-left rounded px-1 py-0.5 w-full transition-colors
                    ${isEligible
                      ? 'hover:bg-neutral-800 cursor-pointer ring-1 ring-neutral-700'
                      : 'cursor-default'}
                  `}
                >
                  <span className="flex-shrink-0">
                    <SkillStateIcon proficient={proficient} locked={fromBgAuto} />
                  </span>
                  <span className="text-neutral-400 w-6 font-mono text-xs">{fmtMod(modifier)}</span>
                  <span className={proficient ? 'text-neutral-200' : isEligible ? 'text-neutral-400' : 'text-neutral-600'}>
                    {skill.name}
                  </span>
                  {fromBgChoice && (
                    <span className="rounded-full border border-amber-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                      BG
                    </span>
                  )}
                  <span className="text-neutral-600 text-xs ml-auto">{skill.ability.toUpperCase()}</span>
                </button>
              )
            })}
          </div>
          {canEdit && (
            <p className="text-xs text-neutral-500 mt-2">
              Filled = selected · Lock = fixed by background · BG = chosen from background options
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
