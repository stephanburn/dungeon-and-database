import type {
  Background,
  Class,
  Species,
  Subclass,
} from '@/lib/types/database'
import type {
  LanguageChoiceInput,
  SkillProficiencyInput,
  ToolChoiceInput,
} from '@/lib/characters/choice-persistence'
import {
  getBackgroundLanguageChoiceConfig,
  getClassToolChoiceConfig,
  getSpeciesLanguageChoiceConfig,
  getSubclassLanguageChoiceConfig,
  getSpeciesToolChoiceConfig,
} from '@/lib/characters/language-tool-provenance'
import {
  getSpeciesSkillChoiceConfig,
  getSubclassSkillChoiceConfig,
} from '@/lib/characters/skill-provenance'
import { normalizeSkillKey, type SkillKey } from '@/lib/skills'

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

export type SkillChoiceBlocker = {
  label: string
  skills: string[]
}

export function getSkillChoiceDuplicateReason(skill: string, sources: SkillChoiceBlocker[]) {
  const normalized = normalizeSkillKey(skill)
  const source = sources.find((entry) => (
    entry.skills.some((sourceSkill) => normalizeSkillKey(sourceSkill) === normalized)
  ))

  return source ? `Already selected from ${source.label}.` : null
}

export function filterDuplicateSkillChoices(skills: string[], sources: SkillChoiceBlocker[]) {
  const seen = new Set<string>()

  return skills.filter((skill) => {
    const normalized = normalizeSkillKey(skill)
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return !getSkillChoiceDuplicateReason(skill, sources)
  })
}

export function mergeCreationSkillSelections(args: {
  speciesSkillChoices: string[]
  backgroundSkillChoices: string[]
  classSkillChoices?: string[]
  subclassSkillChoices?: string[]
}) {
  return dedupe([
    ...args.speciesSkillChoices.map((skill) => normalizeSkillKey(skill)),
    ...args.backgroundSkillChoices.map((skill) => normalizeSkillKey(skill)),
    ...(args.classSkillChoices ?? []).map((skill) => normalizeSkillKey(skill)),
    ...(args.subclassSkillChoices ?? []).map((skill) => normalizeSkillKey(skill)),
  ])
}

export function buildCreationSkillProficiencies(args: {
  species: Species | null
  background: Background | null
  selectedClass: Class | null
  selectedSubclass?: Subclass | null
  speciesSkillChoices: string[]
  backgroundSkillChoices: string[]
  classSkillChoices?: string[]
  subclassSkillChoices?: string[]
}): SkillProficiencyInput[] {
  const speciesConfig = getSpeciesSkillChoiceConfig(args.species)
  const subclassConfig = getSubclassSkillChoiceConfig(args.selectedSubclass ?? null)
  const classChoiceCount = typeof args.selectedClass?.skill_choices?.count === 'number'
    ? args.selectedClass.skill_choices.count
    : 0
  const classChoiceFrom = new Set<string>(
    Array.isArray(args.selectedClass?.skill_choices?.from)
      ? args.selectedClass.skill_choices.from.map((skill) => normalizeSkillKey(skill))
      : []
  )
  const backgroundChoiceFrom = new Set<string>(
    (args.background?.skill_choice_from ?? []).map((skill) => normalizeSkillKey(skill))
  )

  const speciesSkills = dedupe(args.speciesSkillChoices.map((skill) => normalizeSkillKey(skill)))
    .filter((skill) => speciesConfig?.from.has(skill as SkillKey) ?? false)
    .slice(0, speciesConfig?.count ?? 0)
  const backgroundSkills = dedupe(args.backgroundSkillChoices.map((skill) => normalizeSkillKey(skill)))
    .filter((skill) => backgroundChoiceFrom.has(skill))
    .slice(0, args.background?.skill_choice_count ?? 0)
  const classSkills = dedupe((args.classSkillChoices ?? []).map((skill) => normalizeSkillKey(skill)))
    .filter((skill) => classChoiceFrom.has(skill))
    .slice(0, classChoiceCount)
  const subclassSkills = dedupe((args.subclassSkillChoices ?? []).map((skill) => normalizeSkillKey(skill)))
    .filter((skill) => subclassConfig?.from.has(skill as SkillKey) ?? false)
    .slice(0, subclassConfig?.count ?? 0)

  return [
    ...speciesSkills.map((skill) => ({
      skill,
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: args.species?.id ?? null,
      source_feature_key: speciesConfig?.sourceFeatureKey ?? null,
    })),
    ...backgroundSkills.map((skill) => ({
      skill,
      expertise: false,
      character_level_id: null,
      source_category: 'background_choice',
      source_entity_id: args.background?.id ?? null,
      source_feature_key: null,
    })),
    ...classSkills.map((skill) => ({
      skill,
      expertise: false,
      character_level_id: null,
      source_category: 'class_choice',
      source_entity_id: args.selectedClass?.id ?? null,
      source_feature_key: null,
    })),
    ...subclassSkills.map((skill) => ({
      skill,
      expertise: subclassConfig?.expertise ?? false,
      character_level_id: null,
      source_category: 'subclass_choice',
      source_entity_id: args.selectedSubclass?.id ?? null,
      source_feature_key: subclassConfig?.sourceFeatureKey ?? null,
    })),
  ] satisfies SkillProficiencyInput[]
}

export function mergeCreationLanguageSelections(args: {
  speciesLanguageChoices: string[]
  backgroundLanguageChoices: string[]
  subclassLanguageChoices?: string[]
}) {
  return dedupe([
    ...args.speciesLanguageChoices,
    ...args.backgroundLanguageChoices,
    ...(args.subclassLanguageChoices ?? []),
  ])
}

export function buildCreationLanguageChoices(args: {
  species: Species | null
  background: Background | null
  selectedSubclass?: Subclass | null
  speciesLanguageChoices: string[]
  backgroundLanguageChoices: string[]
  subclassLanguageChoices?: string[]
  availableLanguageNames?: string[]
}): LanguageChoiceInput[] {
  const speciesConfig = getSpeciesLanguageChoiceConfig(args.species, args.availableLanguageNames)
  const backgroundConfig = getBackgroundLanguageChoiceConfig(args.background, args.availableLanguageNames)
  const subclassConfig = getSubclassLanguageChoiceConfig(
    args.selectedSubclass ?? null,
    args.availableLanguageNames,
    [
      ...(args.species?.languages ?? []),
      ...(args.background?.languages ?? []),
      ...args.speciesLanguageChoices,
      ...args.backgroundLanguageChoices,
    ]
  )
  const speciesLanguages = dedupe(args.speciesLanguageChoices)
    .filter((language) => speciesConfig?.options.includes(language) ?? false)
    .slice(0, speciesConfig?.count ?? 0)
  const backgroundLanguages = dedupe(args.backgroundLanguageChoices)
    .filter((language) => backgroundConfig?.options.includes(language) ?? false)
    .slice(0, backgroundConfig?.count ?? 0)
  const subclassLanguages = dedupe(args.subclassLanguageChoices ?? [])
    .filter((language) => subclassConfig?.options.includes(language) ?? false)
    .slice(0, subclassConfig?.count ?? 0)

  return [
    ...speciesLanguages.map((language) => ({
      language,
      character_level_id: null,
      source_category: speciesConfig?.sourceCategory ?? 'species_choice',
      source_entity_id: speciesConfig?.sourceEntityId ?? null,
      source_feature_key: speciesConfig?.sourceFeatureKey ?? null,
    })),
    ...backgroundLanguages.map((language) => ({
      language,
      character_level_id: null,
      source_category: backgroundConfig?.sourceCategory ?? 'background_choice',
      source_entity_id: backgroundConfig?.sourceEntityId ?? null,
      source_feature_key: backgroundConfig?.sourceFeatureKey ?? null,
    })),
    ...subclassLanguages.map((language) => ({
      language,
      character_level_id: null,
      source_category: subclassConfig?.sourceCategory ?? 'subclass_choice',
      source_entity_id: subclassConfig?.sourceEntityId ?? null,
      source_feature_key: subclassConfig?.sourceFeatureKey ?? null,
    })),
  ] satisfies LanguageChoiceInput[]
}

export function mergeCreationToolSelections(args: {
  speciesToolChoices: string[]
  classToolChoices?: string[]
}) {
  return dedupe([
    ...args.speciesToolChoices,
    ...(args.classToolChoices ?? []),
  ])
}

export function buildCreationToolChoices(args: {
  species: Species | null
  selectedClass: Class | null
  speciesToolChoices: string[]
  classToolChoices?: string[]
  availableToolNames?: string[]
}): ToolChoiceInput[] {
  const speciesConfig = getSpeciesToolChoiceConfig(args.species, args.availableToolNames)
  const classConfig = getClassToolChoiceConfig(args.selectedClass, args.availableToolNames)
  const speciesTools = dedupe(args.speciesToolChoices)
    .filter((tool) => speciesConfig?.options.includes(tool) ?? false)
    .slice(0, speciesConfig?.count ?? 0)
  const classTools = dedupe(args.classToolChoices ?? [])
    .filter((tool) => classConfig?.options.includes(tool) ?? false)
    .slice(0, classConfig?.count ?? 0)

  return [
    ...speciesTools.map((tool) => ({
      tool,
      character_level_id: null,
      source_category: speciesConfig?.sourceCategory ?? 'species_choice',
      source_entity_id: speciesConfig?.sourceEntityId ?? null,
      source_feature_key: speciesConfig?.sourceFeatureKey ?? null,
    })),
    ...classTools.map((tool) => ({
      tool,
      character_level_id: null,
      source_category: classConfig?.sourceCategory ?? (args.selectedClass ? 'class_choice' : 'manual'),
      source_entity_id: classConfig?.sourceEntityId ?? args.selectedClass?.id ?? null,
      source_feature_key: classConfig?.sourceFeatureKey ?? null,
    })),
  ] satisfies ToolChoiceInput[]
}
