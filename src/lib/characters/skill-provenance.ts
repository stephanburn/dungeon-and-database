import type { Background, Class, Species } from '@/lib/types/database'
import type { SkillProficiencyInput } from '@/lib/characters/choice-persistence'
import { SKILLS, normalizeSkillKey, type SkillKey } from '@/lib/skills'

type SkillChoiceBucketsArgs = {
  skillProficiencies: string[]
  background: Background | null
  selectedClass: Class | null
  species: Species | null
}

type SpeciesSkillChoiceConfig = {
  count: number
  from: Set<SkillKey>
  sourceFeatureKey: string
}

export type SkillChoiceBuckets = {
  bgAutoSkills: Set<SkillKey>
  bgChoiceFrom: Set<SkillKey>
  bgChoiceCount: number
  classChoiceFrom: Set<SkillKey>
  classChoiceCount: number
  speciesChoiceFrom: Set<SkillKey>
  speciesChoiceCount: number
  bgChosen: Set<SkillKey>
  classChosen: Set<SkillKey>
  speciesChosen: Set<SkillKey>
  manualChosen: Set<SkillKey>
}

function getSpeciesSkillChoiceConfig(species: Species | null): SpeciesSkillChoiceConfig | null {
  if (!species) return null

  if (species.name === 'Orc' && species.source === 'ERftLW') {
    return {
      count: 2,
      from: new Set<SkillKey>([
        'animal_handling',
        'insight',
        'intimidation',
        'medicine',
        'nature',
        'perception',
        'survival',
      ]),
      sourceFeatureKey: 'species_trait:primal_intuition',
    }
  }

  if (species.name === 'Changeling' && species.source === 'ERftLW') {
    return {
      count: 2,
      from: new Set<SkillKey>([
        'deception',
        'insight',
        'intimidation',
        'persuasion',
      ]),
      sourceFeatureKey: 'species_trait:changeling_instincts',
    }
  }

  if (species.name === 'Warforged' && species.source === 'ERftLW') {
    return {
      count: 1,
      from: new Set<SkillKey>(SKILLS.map((skill) => skill.key)),
      sourceFeatureKey: 'species_trait:specialized_design',
    }
  }

  return null
}

export function deriveSkillChoiceBuckets({
  skillProficiencies,
  background,
  selectedClass,
  species,
}: SkillChoiceBucketsArgs): SkillChoiceBuckets {
  const bgAutoSkills = new Set(
    (background?.skill_proficiencies ?? []).map((skill) => normalizeSkillKey(skill))
  )
  const bgChoiceFrom = new Set(
    (background?.skill_choice_from ?? []).map((skill) => normalizeSkillKey(skill))
  )
  const bgChoiceCount = background?.skill_choice_count ?? 0

  const rawClassChoices = selectedClass?.skill_choices as { count?: number; from?: string[] } | null
  const classChoiceFrom = new Set((rawClassChoices?.from ?? []).map(normalizeSkillKey))
  const classChoiceCount = rawClassChoices?.count ?? 0

  const speciesConfig = getSpeciesSkillChoiceConfig(species)
  const speciesChoiceFrom = speciesConfig?.from ?? new Set<SkillKey>()
  const speciesChoiceCount = speciesConfig?.count ?? 0

  const chosen = Array.from(
    new Set(skillProficiencies.map((skill) => normalizeSkillKey(skill)).filter((skill) => !bgAutoSkills.has(skill)))
  )

  const classChosen = new Set(
    chosen.filter((skill) => classChoiceFrom.has(skill))
  )
  const bgChosen = new Set(
    chosen.filter((skill) => bgChoiceFrom.has(skill) && !classChoiceFrom.has(skill))
  )
  const speciesChosen = new Set(
    chosen.filter((skill) => (
      speciesChoiceFrom.has(skill) &&
      !classChoiceFrom.has(skill) &&
      !bgChoiceFrom.has(skill)
    ))
  )
  const manualChosen = new Set(
    chosen.filter((skill) => (
      !classChoiceFrom.has(skill) &&
      !bgChoiceFrom.has(skill) &&
      !speciesChoiceFrom.has(skill)
    ))
  )

  return {
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
  }
}

export function buildTypedSkillProficiencies(args: SkillChoiceBucketsArgs): SkillProficiencyInput[] {
  const { skillProficiencies, background, selectedClass, species } = args
  const buckets = deriveSkillChoiceBuckets(args)
  const speciesConfig = getSpeciesSkillChoiceConfig(species)

  return Array.from(
    new Set(skillProficiencies.map((skill) => normalizeSkillKey(skill)))
  ).map((skill) => {
    if (buckets.classChosen.has(skill)) {
      return {
        skill,
        expertise: false,
        character_level_id: null,
        source_category: 'class_choice',
        source_entity_id: selectedClass?.id ?? null,
        source_feature_key: null,
      }
    }

    if (buckets.bgChosen.has(skill)) {
      return {
        skill,
        expertise: false,
        character_level_id: null,
        source_category: 'background_choice',
        source_entity_id: background?.id ?? null,
        source_feature_key: null,
      }
    }

    if (buckets.speciesChosen.has(skill)) {
      return {
        skill,
        expertise: false,
        character_level_id: null,
        source_category: 'species_choice',
        source_entity_id: species?.id ?? null,
        source_feature_key: speciesConfig?.sourceFeatureKey ?? null,
      }
    }

    return {
      skill,
      expertise: false,
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    }
  })
}
