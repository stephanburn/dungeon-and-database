import type { Background, Class, Species } from '@/lib/types/database'
import type { LanguageChoiceInput, ToolChoiceInput } from '@/lib/characters/choice-persistence'

type LanguageToolArgs = {
  languageChoices: string[]
  toolChoices: string[]
  background: Background | null
  selectedClass: Class | null
  species: Species | null
}

type LanguageChoiceConfig = {
  count: number
  options: string[]
  sourceCategory: string
  sourceEntityId: string | null
  sourceFeatureKey: string | null
}

type ToolChoiceConfig = {
  count: number
  options: string[]
  sourceCategory: string
  sourceEntityId: string | null
  sourceFeatureKey: string | null
}

type SpeciesChoiceRule = {
  names: string[]
  sources?: string[]
  count: number
  sourceFeatureKey: string
}

type SpeciesToolChoiceRule = {
  names: string[]
  count: number
  options: string[]
  sourceFeatureKey: string
}

type ParsedBackgroundLanguages = {
  fixed: string[]
  choiceCount: number
}

export const STANDARD_LANGUAGE_OPTIONS = [
  'Common',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
  'Abyssal',
  'Celestial',
  'Draconic',
  'Deep Speech',
  'Infernal',
  'Primordial',
  'Sylvan',
  'Undercommon',
]

export const STANDARD_TOOL_OPTIONS = [
  "Alchemist's Supplies",
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cartographer's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Smith's Tools",
  "Tinker's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools",
  'Disguise Kit',
  'Forgery Kit',
  'Herbalism Kit',
  "Navigator's Tools",
  "Poisoner's Kit",
  "Thieves' Tools",
  'Dice Set',
  'Dragonchess Set',
  'Playing Card Set',
  'Bagpipes',
  'Drum',
  'Dulcimer',
  'Flute',
  'Horn',
  'Lute',
  'Lyre',
  'Pan Flute',
  'Shawm',
  'Viol',
]

const ARTISANS_TOOL_OPTIONS = STANDARD_TOOL_OPTIONS.filter((tool) => tool.includes("Tools") || tool.includes("Supplies") || tool.includes('Utensils'))

const DRAGONMARK_LANGUAGE_CHOICE_RULES: SpeciesChoiceRule[] = [
  {
    names: ['Half-Elf (Mark of Detection)', 'Mark of Detection Half-Elf'],
    sources: ['ERftLW', 'EE'],
    count: 1,
    sourceFeatureKey: 'species_languages:mark_of_detection_half_elf',
  },
  {
    names: ['Half-Elf (Mark of Storm)', 'Mark of Storm Half-Elf'],
    count: 1,
    sourceFeatureKey: 'species_languages:mark_of_storm_half_elf',
  },
  {
    names: ['Human (Mark of Finding)', 'Mark of Finding Human'],
    count: 1,
    sourceFeatureKey: 'species_languages:mark_of_finding_human',
  },
  {
    names: ['Human (Mark of Handling)', 'Mark of Handling Human'],
    count: 1,
    sourceFeatureKey: 'species_languages:mark_of_handling_human',
  },
  {
    names: ['Human (Mark of Making)', 'Mark of Making Human'],
    count: 1,
    sourceFeatureKey: 'species_languages:mark_of_making_human',
  },
  {
    names: ['Human (Mark of Passage)', 'Mark of Passage Human'],
    count: 1,
    sourceFeatureKey: 'species_languages:mark_of_passage_human',
  },
  {
    names: ['Human (Mark of Sentinel)', 'Mark of Sentinel Human'],
    count: 1,
    sourceFeatureKey: 'species_languages:mark_of_sentinel_human',
  },
]

const DRAGONMARK_TOOL_CHOICE_RULES: SpeciesToolChoiceRule[] = [
  {
    names: ['Human (Mark of Making)', 'Mark of Making Human'],
    count: 1,
    options: ARTISANS_TOOL_OPTIONS,
    sourceFeatureKey: 'species_trait:artisans_gift',
  },
]

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function normalizeChoicePlaceholder(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseBackgroundLanguages(background: Background | null): ParsedBackgroundLanguages {
  if (!background) {
    return { fixed: [], choiceCount: 0 }
  }

  let choiceCount = 0
  const fixed: string[] = []

  for (const rawLanguage of background.languages ?? []) {
    const normalized = normalizeChoicePlaceholder(rawLanguage)
    if (normalized === 'any two languages') {
      choiceCount += 2
      continue
    }
    if (normalized === 'any one language' || normalized === 'any language') {
      choiceCount += 1
      continue
    }
    fixed.push(rawLanguage)
  }

  return {
    fixed: dedupe(fixed),
    choiceCount,
  }
}

function getSpeciesLanguageChoiceConfig(species: Species | null, availableLanguages = STANDARD_LANGUAGE_OPTIONS): LanguageChoiceConfig | null {
  if (!species) return null

  if (species.name === 'Changeling' && species.source === 'ERftLW') {
    return {
      count: 2,
      options: availableLanguages.filter((language) => !species.languages.includes(language)),
      sourceCategory: 'species_choice',
      sourceEntityId: species.id,
      sourceFeatureKey: 'species_languages:changeling',
    }
  }

  if (species.name === 'Warforged' && species.source === 'ERftLW') {
    return {
      count: 1,
      options: availableLanguages.filter((language) => !species.languages.includes(language)),
      sourceCategory: 'species_choice',
      sourceEntityId: species.id,
      sourceFeatureKey: 'species_languages:warforged',
    }
  }

  const dragonmarkRule = DRAGONMARK_LANGUAGE_CHOICE_RULES.find((rule) => (
    rule.names.includes(species.name) &&
    (!rule.sources || rule.sources.includes(species.source))
  ))
  if (dragonmarkRule) {
    return {
      count: dragonmarkRule.count,
      options: availableLanguages.filter((language) => !species.languages.includes(language)),
      sourceCategory: 'species_choice',
      sourceEntityId: species.id,
      sourceFeatureKey: dragonmarkRule.sourceFeatureKey,
    }
  }

  return null
}

function getBackgroundLanguageChoiceConfig(background: Background | null, availableLanguages = STANDARD_LANGUAGE_OPTIONS): LanguageChoiceConfig | null {
  if (!background) return null

  const parsed = parseBackgroundLanguages(background)
  if (parsed.choiceCount === 0) return null

  return {
    count: parsed.choiceCount,
    options: availableLanguages.filter((language) => !parsed.fixed.includes(language)),
    sourceCategory: 'background_choice',
    sourceEntityId: background.id,
    sourceFeatureKey: 'background_languages',
  }
}

function getSpeciesToolChoiceConfig(species: Species | null, availableTools = STANDARD_TOOL_OPTIONS): ToolChoiceConfig | null {
  if (!species) return null

  if (species.name === 'Warforged' && species.source === 'ERftLW') {
    return {
      count: 1,
      options: availableTools,
      sourceCategory: 'species_choice',
      sourceEntityId: species.id,
      sourceFeatureKey: 'species_trait:specialized_design',
    }
  }

  if (species.source === 'ERftLW') {
    const dragonmarkRule = DRAGONMARK_TOOL_CHOICE_RULES.find((rule) => rule.names.includes(species.name))
    if (dragonmarkRule) {
      return {
        count: dragonmarkRule.count,
        options: dragonmarkRule.options,
        sourceCategory: 'species_choice',
        sourceEntityId: species.id,
        sourceFeatureKey: dragonmarkRule.sourceFeatureKey,
      }
    }
  }

  return null
}

export function getFixedBackgroundLanguages(background: Background | null) {
  return parseBackgroundLanguages(background).fixed
}

export function getAvailableLanguageChoices(
  background: Background | null,
  species: Species | null,
  availableLanguages = STANDARD_LANGUAGE_OPTIONS
) {
  return dedupe([
    ...(getSpeciesLanguageChoiceConfig(species, availableLanguages)?.options ?? []),
    ...(getBackgroundLanguageChoiceConfig(background, availableLanguages)?.options ?? []),
  ])
}

export function getAvailableToolChoices(species: Species | null) {
  return dedupe(getSpeciesToolChoiceConfig(species)?.options ?? [])
}

export function getAvailableToolChoicesFromCatalog(
  species: Species | null,
  availableTools = STANDARD_TOOL_OPTIONS
) {
  return dedupe(getSpeciesToolChoiceConfig(species, availableTools)?.options ?? [])
}

export function getLanguageChoiceLimit(background: Background | null, species: Species | null) {
  return (getSpeciesLanguageChoiceConfig(species)?.count ?? 0) + (getBackgroundLanguageChoiceConfig(background)?.count ?? 0)
}

export function getToolChoiceLimit(species: Species | null) {
  return getSpeciesToolChoiceConfig(species)?.count ?? 0
}

export function buildTypedLanguageChoices({
  languageChoices,
  background,
  species,
}: Pick<LanguageToolArgs, 'languageChoices' | 'background' | 'species'>): LanguageChoiceInput[] {
  const speciesConfig = getSpeciesLanguageChoiceConfig(species)
  const backgroundConfig = getBackgroundLanguageChoiceConfig(background)
  const remainingSpecies = speciesConfig?.count ?? 0
  const remainingBackground = backgroundConfig?.count ?? 0
  let speciesLeft = remainingSpecies
  let backgroundLeft = remainingBackground

  return dedupe(languageChoices).map((language) => {
    if (speciesConfig && speciesLeft > 0 && speciesConfig.options.includes(language)) {
      speciesLeft -= 1
      return {
        language,
        character_level_id: null,
        source_category: speciesConfig.sourceCategory,
        source_entity_id: speciesConfig.sourceEntityId,
        source_feature_key: speciesConfig.sourceFeatureKey,
      }
    }

    if (backgroundConfig && backgroundLeft > 0 && backgroundConfig.options.includes(language)) {
      backgroundLeft -= 1
      return {
        language,
        character_level_id: null,
        source_category: backgroundConfig.sourceCategory,
        source_entity_id: backgroundConfig.sourceEntityId,
        source_feature_key: backgroundConfig.sourceFeatureKey,
      }
    }

    return {
      language,
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    }
  })
}

export function buildTypedToolChoices({
  toolChoices,
  selectedClass,
  species,
}: Pick<LanguageToolArgs, 'toolChoices' | 'selectedClass' | 'species'>): ToolChoiceInput[] {
  const speciesConfig = getSpeciesToolChoiceConfig(species)
  let speciesLeft = speciesConfig?.count ?? 0

  return dedupe(toolChoices).map((tool) => {
    if (speciesConfig && speciesLeft > 0 && speciesConfig.options.includes(tool)) {
      speciesLeft -= 1
      return {
        tool,
        character_level_id: null,
        source_category: speciesConfig.sourceCategory,
        source_entity_id: speciesConfig.sourceEntityId,
        source_feature_key: speciesConfig.sourceFeatureKey,
      }
    }

    return {
      tool,
      character_level_id: null,
      source_category: selectedClass ? 'class_choice' : 'manual',
      source_entity_id: selectedClass?.id ?? null,
      source_feature_key: null,
    }
  })
}
