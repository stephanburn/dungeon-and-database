'use client'

import { Circle, Disc, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SKILLS, SAVING_THROW_NAMES } from '@/lib/skills'
import type { AbilityKey, SkillKey } from '@/lib/skills'
import type { DerivedCharacter } from '@/lib/characters/build-context'
import { abilityModifier, proficiencyBonusFromLevel } from '@/lib/characters/derived'
import { deriveSkillChoiceBuckets } from '@/lib/characters/skill-provenance'
import type { Class, Background, Species } from '@/lib/types/database'

interface Stats {
  str: number; dex: number; con: number
  int: number; wis: number; cha: number
}

interface SkillsCardProps {
  stats: Stats
  totalLevel: number
  selectedClass: Class | null
  background: Background | null
  species?: Species | null
  derived?: Pick<DerivedCharacter, 'savingThrows' | 'skills'>
  // All actively-chosen skill proficiencies (class + background choices combined)
  skillProficiencies: string[]
  canEdit: boolean
  onChange: (skills: string[]) => void
}

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
  species = null,
  derived,
  skillProficiencies, canEdit, onChange,
}: SkillsCardProps) {
  const pb = proficiencyBonusFromLevel(totalLevel)
  const {
    bgAutoSkills,
    bgChoiceFrom,
    bgChoiceCount,
    classChoiceFrom,
    classChoiceCount,
    speciesChoiceFrom,
    speciesChoiceCount,
    bgChosen,
    classChosen,
    speciesChosen,
    manualChosen,
  } = deriveSkillChoiceBuckets({
    skillProficiencies,
    background,
    selectedClass,
    species,
  })
  const allChosen = new Set(
    Array.from(classChosen).concat(Array.from(bgChosen), Array.from(speciesChosen), Array.from(manualChosen))
  )

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
    speciesChoiceCount > 0 ? `${speciesChosen.size}/${speciesChoiceCount} species` : null,
  ].filter(Boolean).join(' · ')

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-4">
        <CardTitle className="text-neutral-200">Skills &amp; Proficiencies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Saving throws */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Saving Throws</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {abilities.map((ability) => {
              const derivedSave = derived?.savingThrows.find((save) => save.ability === ability)
              const proficient = derivedSave?.proficient ?? savingThrows.has(ability)
              const modifier = derivedSave?.modifier ?? (abilityModifier(stats[ability]) + (proficient ? pb : 0))
              return (
                <div key={ability} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${proficient ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  <span className="w-7 font-mono text-xs text-neutral-400">{fmtMod(modifier)}</span>
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Skills</p>
            {canEdit && choiceCountLabel && (
              <p className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-neutral-400">{choiceCountLabel}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SKILLS.map((skill) => {
              const derivedSkill = derived?.skills.find((entry) => entry.key === skill.key)
              const proficient = derivedSkill?.proficient ?? isProficient(skill.key)
              const abilityMod = abilityModifier(stats[skill.ability])
              const modifier = derivedSkill?.modifier ?? (abilityMod + (proficient ? pb : 0))
              const fromBgAuto = bgAutoSkills.has(skill.key)
              const fromBgChoice = bgChosen.has(skill.key)
              const fromClassChoice = classChosen.has(skill.key)
              const fromSpeciesChoice = speciesChosen.has(skill.key)

              const isClassChoosable = canEdit && classChoiceFrom.has(skill.key) && !fromBgAuto
              const isBgChoosable = canEdit && bgChoiceFrom.has(skill.key) && !classChoiceFrom.has(skill.key) && !fromBgAuto
              const isSpeciesChoosable =
                canEdit &&
                speciesChoiceFrom.has(skill.key) &&
                !classChoiceFrom.has(skill.key) &&
                !bgChoiceFrom.has(skill.key) &&
                !fromBgAuto
              const isChoosable = isClassChoosable || isBgChoosable || isSpeciesChoosable

              const atClassLimit = classChosen.size >= classChoiceCount && !fromClassChoice
              const atBgLimit = bgChosen.size >= bgChoiceCount && !fromBgChoice
              const atSpeciesLimit = speciesChosen.size >= speciesChoiceCount && !fromSpeciesChoice
              const atLimit =
                (isClassChoosable && atClassLimit) ||
                (isBgChoosable && atBgLimit) ||
                (isSpeciesChoosable && atSpeciesLimit)

              const isEligible = isChoosable && !atLimit

              return (
                <button
                  key={skill.key}
                  type="button"
                  onClick={() => toggleSkill(skill.key)}
                  disabled={!isChoosable || (atLimit && !proficient)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors
                    ${isEligible
                      ? 'cursor-pointer border-white/12 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05]'
                      : 'cursor-default border-white/8 bg-white/[0.02]'}
                  `}
                >
                  <span className="flex-shrink-0">
                    <SkillStateIcon proficient={proficient} locked={fromBgAuto} />
                  </span>
                  <span className="w-7 font-mono text-xs text-neutral-400">{fmtMod(modifier)}</span>
                  <span className={proficient ? 'text-neutral-200' : isEligible ? 'text-neutral-400' : 'text-neutral-600'}>
                    {skill.name}
                  </span>
                  {fromBgChoice && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-100">
                      BG
                    </span>
                  )}
                  {fromSpeciesChoice && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-100">
                      Species
                    </span>
                  )}
                  <span className="ml-auto text-xs text-neutral-600">{skill.ability.toUpperCase()}</span>
                </button>
              )
            })}
          </div>
          {canEdit && (
            <p className="mt-2 text-xs text-neutral-500">
              Filled = selected. Lock = granted by background. BG = chosen from background options. Species = chosen from a species feature.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
