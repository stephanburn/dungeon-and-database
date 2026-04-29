'use client'

import { Circle, Disc, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SKILLS, SAVING_THROW_NAMES } from '@/lib/skills'
import type { AbilityKey, SkillKey } from '@/lib/skills'
import {
  deriveAbilityScores,
  buildSavingThrowSourceMap,
  deriveSheetSavingThrows,
  deriveSheetSkills,
  formatModifier,
  proficiencyBonusFromLevel,
  type DerivedCharacter,
} from '@/lib/characters/derived'
import { buildSkillDisplaySummaries, deriveSkillChoiceBuckets, type SkillSourceRowLike } from '@/lib/characters/skill-provenance'
import type { Class, Background, Feat, Species, Subclass } from '@/lib/types/database'

interface Stats {
  str: number; dex: number; con: number
  int: number; wis: number; cha: number
}

interface SkillsCardProps {
  stats: Stats
  totalLevel: number
  selectedClass: Class | null
  classOptions?: Array<Pick<Class, 'id' | 'name'>>
  background: Background | null
  species?: Species | null
  subclasses?: Array<Pick<Subclass, 'id' | 'name'>>
  feats?: Array<Pick<Feat, 'id' | 'name'>>
  derived?: Pick<DerivedCharacter, 'savingThrows' | 'skills'>
  typedSkillRows?: SkillSourceRowLike[]
  // All actively-chosen skill proficiencies (class + background choices combined)
  skillProficiencies: string[]
  canEdit: boolean
  onChange: (skills: string[]) => void
}

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
  stats, totalLevel, selectedClass, classOptions = [], background,
  species = null,
  subclasses = [],
  feats = [],
  derived,
  typedSkillRows = [],
  skillProficiencies, canEdit, onChange,
}: SkillsCardProps) {
  const pb = proficiencyBonusFromLevel(totalLevel)
  const fallbackAbilities = deriveAbilityScores(stats, {})
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
  const fallbackSavingThrows = deriveSheetSavingThrows({
    abilities: fallbackAbilities,
    proficiencyBonus: pb,
    proficientAbilities: Array.from(savingThrows),
    proficiencySources: buildSavingThrowSourceMap(selectedClass
      ? [{
          className: selectedClass.name,
          savingThrowProficiencies: selectedClass.saving_throw_proficiencies,
        }]
      : []
    ),
  })
  const fallbackSkills = deriveSheetSkills({
    abilities: fallbackAbilities,
    proficiencyBonus: pb,
    proficientSkills: Array.from(allChosen).concat(Array.from(bgAutoSkills)),
  })
  const skillDisplays = buildSkillDisplaySummaries({
    rows: typedSkillRows,
    background,
    species,
    classes: classOptions,
    subclasses,
    feats,
  })

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
              const fallbackSave = fallbackSavingThrows.find((save) => save.ability === ability)
              const proficient = derivedSave?.proficient ?? fallbackSave?.proficient ?? false
              const modifier = derivedSave?.modifier ?? fallbackSave?.modifier ?? 0
              const abilityMod = derivedSave?.abilityModifier ?? fallbackSave?.abilityModifier ?? 0
              const profBonus = derivedSave?.proficiencyBonus ?? fallbackSave?.proficiencyBonus ?? 0
              const sourceLabel = (derivedSave?.proficiencySources ?? fallbackSave?.proficiencySources ?? []).join(', ')
              return (
                <div key={ability} className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${proficient ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                    <span className="w-7 font-mono text-xs text-neutral-400">{formatModifier(modifier)}</span>
                    <span className={proficient ? 'text-neutral-200' : 'text-neutral-500'}>
                      {SAVING_THROW_NAMES[ability]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 pl-8 text-[11px] text-neutral-500">
                    <span>{formatModifier(abilityMod)}</span>
                    {proficient && (
                      <>
                        <span>+</span>
                        <span>{formatModifier(profBonus)} prof</span>
                      </>
                    )}
                    <span>=</span>
                    <span>{formatModifier(modifier)}</span>
                    {sourceLabel && (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-100">
                        {sourceLabel}
                      </span>
                    )}
                  </div>
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
              const fallbackSkill = fallbackSkills.find((entry) => entry.key === skill.key)
              const proficient = derivedSkill?.proficient ?? fallbackSkill?.proficient ?? isProficient(skill.key)
              const modifier = derivedSkill?.modifier ?? fallbackSkill?.modifier ?? 0
              const abilityModifier = derivedSkill?.abilityModifier ?? fallbackSkill?.abilityModifier ?? 0
              const proficiencyBonus = derivedSkill?.proficiencyBonus ?? fallbackSkill?.proficiencyBonus ?? 0
              const expertise = derivedSkill?.expertise ?? fallbackSkill?.expertise ?? skillDisplays.get(skill.key)?.expertise ?? false
              const sources = skillDisplays.get(skill.key)?.sources ?? []
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
                  className={`flex w-full flex-col items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors
                    ${isEligible
                      ? 'cursor-pointer border-white/12 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05]'
                      : 'cursor-default border-white/8 bg-white/[0.02]'}
                  `}
                >
                  <div className="flex w-full items-center gap-3">
                    <span className="flex-shrink-0">
                      <SkillStateIcon proficient={proficient} locked={fromBgAuto} />
                    </span>
                    <span className="w-7 font-mono text-xs text-neutral-400">{formatModifier(modifier)}</span>
                    <span className={proficient ? 'text-neutral-200' : isEligible ? 'text-neutral-400' : 'text-neutral-600'}>
                      {skill.name}
                    </span>
                    {expertise && (
                      <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-100">
                        Expertise
                      </span>
                    )}
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
                  </div>
                  <div className="pl-10 text-[11px] text-neutral-500">
                    {formatModifier(abilityModifier)}
                    {proficient && (
                      <>
                        {' + '}
                        {formatModifier(proficiencyBonus)}
                        {expertise ? ' expertise' : ' prof'}
                      </>
                    )}
                    {' = '}
                    {formatModifier(modifier)}
                  </div>
                  {sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-10">
                      {sources.map((source) => (
                        <span
                          key={`${skill.key}-${source.category}-${source.label}`}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-neutral-300"
                        >
                          {source.label}
                        </span>
                      ))}
                    </div>
                  )}
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
