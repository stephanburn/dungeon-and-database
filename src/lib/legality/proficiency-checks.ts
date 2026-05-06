import type { DerivedCharacter } from '@/lib/characters/derived'
import { allocateSkillChoices, getSpeciesSkillChoiceConfig } from '@/lib/characters/skill-provenance'
import { normalizeSkillKey, type SkillKey } from '@/lib/skills'
import type { LegalityCheck, LegalityInput } from './types'

export function checkSkillProficiencies(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
  const classPool = new Set<SkillKey>((input.classes[0]?.skillChoices.from ?? []).map(normalizeSkillKey))
  const backgroundPool = new Set<SkillKey>((input.background?.skillChoiceFrom ?? []).map(normalizeSkillKey))
  const backgroundAuto = new Set(input.background?.skillProficiencies ?? [])
  const speciesConfig = getSpeciesSkillChoiceConfig(
    input.speciesName && input.speciesSource
      ? {
          id: input.speciesName.toLowerCase(),
          name: input.speciesName,
          size: input.speciesSize ?? 'medium',
          speed: input.speciesSpeed ?? 30,
          ability_score_bonuses: [],
          languages: input.speciesLanguages,
          traits: input.speciesTraits.map((trait) => trait.id),
          senses: input.speciesSenses,
          damage_resistances: input.speciesDamageResistances,
          condition_immunities: input.speciesConditionImmunities,
          source: input.speciesSource,
          amended: false,
          amendment_note: null,
        }
      : null
  )
  const speciesPool = speciesConfig?.from ?? new Set<SkillKey>()
  const selected = new Set(input.skillProficiencies.map(normalizeSkillKey))

  const invalid = Array.from(selected).filter((skill) => {
    if (backgroundAuto.has(skill)) return false
    return !classPool.has(skill) && !backgroundPool.has(skill) && !speciesPool.has(skill)
  })
  if (invalid.length > 0) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Skill(s) not available to this build: ${invalid.join(', ')}.`,
      severity: 'error',
    }
  }

  const allocated = allocateSkillChoices({
    chosenSkills: Array.from(selected),
    classChoiceFrom: classPool,
    classChoiceCount: derived.choiceCaps.classSkillChoices,
    bgChoiceFrom: backgroundPool,
    bgChoiceCount: derived.choiceCaps.backgroundSkillChoices,
    speciesChoiceFrom: speciesPool,
    speciesChoiceCount: speciesConfig?.count ?? 0,
  })
  const classChosen = Array.from(allocated.classChosen)
  const backgroundChosen = Array.from(allocated.bgChosen)
  const speciesChosen = Array.from(allocated.speciesChosen)
  const overflowChosen = Array.from(allocated.manualChosen).filter((skill) => (
    classPool.has(skill) || backgroundPool.has(skill) || speciesPool.has(skill)
  ))

  if (overflowChosen.length > 0) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Too many skill choices selected for the available class/background/species slots: ${overflowChosen.join(', ')}.`,
      severity: 'error',
    }
  }

  if (classChosen.length > derived.choiceCaps.classSkillChoices) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Too many class skill choices: selected ${classChosen.length}, maximum is ${derived.choiceCaps.classSkillChoices}.`,
      severity: 'error',
    }
  }

  if (backgroundChosen.length > derived.choiceCaps.backgroundSkillChoices) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Too many background skill choices: selected ${backgroundChosen.length}, maximum is ${derived.choiceCaps.backgroundSkillChoices}.`,
      severity: 'error',
    }
  }

  if (speciesChosen.length > (speciesConfig?.count ?? 0)) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Too many species skill choices: selected ${speciesChosen.length}, maximum is ${speciesConfig?.count ?? 0}.`,
      severity: 'error',
    }
  }

  return {
    key: 'skill_proficiencies',
    passed: true,
    message: `Skill choices valid (${classChosen.length}/${derived.choiceCaps.classSkillChoices} class, ${backgroundChosen.length}/${derived.choiceCaps.backgroundSkillChoices} background, ${speciesChosen.length}/${speciesConfig?.count ?? 0} species).`,
    severity: 'error',
  }
}
