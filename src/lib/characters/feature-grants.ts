import type {
  CharacterFeatureOptionChoice,
  CharacterSpellSelection,
  Class,
  Spell,
} from '@/lib/types/database'
import type {
  FeatureOptionChoiceInput,
  SpellChoiceInput,
} from '@/lib/characters/choice-persistence'

export interface FeatureSpellChoiceDefinition {
  ownerLabel: string
  label: string
  spellLevel: number | null
  spellListClassNames: string[]
  acquisitionMode: string
  countsAgainstSelectionLimit: boolean
  sourceFeatureKey: string
  owningClassId?: string | null
}

export interface FeatureOptionChoiceDefinition {
  optionGroupKey: string
  optionKey: string
  label: string
  description?: string
  choiceOrder: number
  choices: Array<{
    value: string
    label: string
  }>
  sourceCategory: string
  sourceEntityId: string | null
  sourceFeatureKey: string
}

export const MAVERICK_SUBCLASS_NAME = 'Maverick'
export const MAVERICK_SUBCLASS_SOURCE = 'EE'
export const MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY = 'maverick:arcane_breakthrough_classes'
export const MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY = 'subclass_feature:maverick:arcane_breakthroughs'
export const MAVERICK_CANTRIP_SPECIALIST_SOURCE_KEY = 'feature_spell:maverick:cantrip_specialist'

const INTERACTIVE_FEATURE_SPELL_PREFIXES = ['feat_spell:', 'feature_spell:'] as const
const MAVERICK_BREAKTHROUGH_LEVELS = [3, 5, 9, 13, 17] as const
const MAVERICK_BREAKTHROUGH_CLASS_NAMES = [
  'Bard',
  'Cleric',
  'Druid',
  'Paladin',
  'Ranger',
  'Sorcerer',
  'Warlock',
  'Wizard',
] as const

type StaticGrantedSpellRule = {
  spellName: string
  spellSource?: string
  spellSources?: string[]
  minLevel?: number
  sourceFeatureKey: string
}

const MARK_OF_DETECTION_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Detect Magic', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:magical_detection:detect_magic' },
  { spellName: 'Detect Poison and Disease', spellSource: 'EE', sourceFeatureKey: 'species_trait:magical_detection:detect_poison_and_disease' },
  { spellName: 'See Invisibility', spellSource: 'ERftLW', minLevel: 3, sourceFeatureKey: 'species_trait:magical_detection:see_invisibility' },
]
const MARK_OF_STORM_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Gust', spellSources: ['EE', 'PHB', 'SRD'], sourceFeatureKey: 'species_trait:storms_boon:gust' },
  { spellName: 'Gust of Wind', spellSource: 'ERftLW', minLevel: 3, sourceFeatureKey: 'species_trait:storms_boon:gust_of_wind' },
]
const MARK_OF_FINDING_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Hunter\'s Mark', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:finders_magic:hunters_mark' },
  { spellName: 'Locate Object', spellSource: 'ERftLW', minLevel: 3, sourceFeatureKey: 'species_trait:finders_magic:locate_object' },
]
const MARK_OF_HANDLING_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Animal Friendship', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:primal_connection:animal_friendship' },
  { spellName: 'Speak With Animals', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:primal_connection:speak_with_animals' },
]
const MARK_OF_MAKING_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Mending', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:spellsmith:mending' },
  { spellName: 'Magic Weapon', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:spellsmith:magic_weapon' },
]
const MARK_OF_PASSAGE_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Misty Step', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:magical_passage:misty_step' },
]
const MARK_OF_SENTINEL_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Shield', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:guardians_shield:shield' },
]
const MARK_OF_WARDING_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Alarm', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:wards_and_seals:alarm' },
  { spellName: 'Mage Armor', spellSources: ['EE', 'PHB', 'SRD', 'ERftLW'], sourceFeatureKey: 'species_trait:wards_and_seals:mage_armor' },
  { spellName: 'Arcane Lock', spellSource: 'ERftLW', minLevel: 3, sourceFeatureKey: 'species_trait:wards_and_seals:arcane_lock' },
]
const MARK_OF_HOSPITALITY_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Prestidigitation', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:innkeepers_magic:prestidigitation' },
  { spellName: 'Purify Food and Drink', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:innkeepers_magic:purify_food_and_drink' },
  { spellName: 'Unseen Servant', spellSources: ['EE', 'PHB', 'SRD', 'ERftLW'], sourceFeatureKey: 'species_trait:innkeepers_magic:unseen_servant' },
]
const MARK_OF_HEALING_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Cure Wounds', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:healing_touch:cure_wounds' },
  { spellName: 'Lesser Restoration', spellSource: 'ERftLW', minLevel: 3, sourceFeatureKey: 'species_trait:healing_touch:lesser_restoration' },
]
const MARK_OF_SHADOW_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Minor Illusion', spellSources: ['EE', 'PHB', 'SRD', 'ERftLW'], sourceFeatureKey: 'species_trait:shape_shadows:minor_illusion' },
  { spellName: 'Invisibility', spellSource: 'ERftLW', minLevel: 3, sourceFeatureKey: 'species_trait:shape_shadows:invisibility' },
]
const MARK_OF_SCRIBING_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Message', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:scribes_insight:message' },
  { spellName: 'Comprehend Languages', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:scribes_insight:comprehend_languages' },
  { spellName: 'Magic Mouth', spellSource: 'ERftLW', sourceFeatureKey: 'species_trait:scribes_insight:magic_mouth' },
]

const STATIC_SPECIES_GRANTED_SPELL_RULES: Record<string, StaticGrantedSpellRule[]> = {
  'ERftLW:Half-Elf (Mark of Detection)': MARK_OF_DETECTION_RULES,
  'ERftLW:Mark of Detection Half-Elf': MARK_OF_DETECTION_RULES,
  'ERftLW:Half-Elf (Mark of Storm)': MARK_OF_STORM_RULES,
  'ERftLW:Mark of Storm Half-Elf': MARK_OF_STORM_RULES,
  'ERftLW:Half-Orc (Mark of Finding)': MARK_OF_FINDING_RULES,
  'ERftLW:Mark of Finding Half-Orc': MARK_OF_FINDING_RULES,
  'ERftLW:Human (Mark of Finding)': MARK_OF_FINDING_RULES,
  'ERftLW:Mark of Finding Human': MARK_OF_FINDING_RULES,
  'ERftLW:Human (Mark of Handling)': MARK_OF_HANDLING_RULES,
  'ERftLW:Mark of Handling Human': MARK_OF_HANDLING_RULES,
  'ERftLW:Human (Mark of Making)': MARK_OF_MAKING_RULES,
  'ERftLW:Mark of Making Human': MARK_OF_MAKING_RULES,
  'ERftLW:Human (Mark of Passage)': MARK_OF_PASSAGE_RULES,
  'ERftLW:Mark of Passage Human': MARK_OF_PASSAGE_RULES,
  'ERftLW:Human (Mark of Sentinel)': MARK_OF_SENTINEL_RULES,
  'ERftLW:Mark of Sentinel Human': MARK_OF_SENTINEL_RULES,
  'ERftLW:Dwarf (Mark of Warding)': MARK_OF_WARDING_RULES,
  'ERftLW:Mark of Warding Dwarf': MARK_OF_WARDING_RULES,
  'ERftLW:Halfling (Mark of Hospitality)': MARK_OF_HOSPITALITY_RULES,
  'ERftLW:Mark of Hospitality Halfling': MARK_OF_HOSPITALITY_RULES,
  'ERftLW:Halfling (Mark of Healing)': MARK_OF_HEALING_RULES,
  'ERftLW:Mark of Healing Halfling': MARK_OF_HEALING_RULES,
  'ERftLW:Elf (Mark of Shadow)': MARK_OF_SHADOW_RULES,
  'ERftLW:Mark of Shadow Elf': MARK_OF_SHADOW_RULES,
  'ERftLW:Gnome (Mark of Scribing)': MARK_OF_SCRIBING_RULES,
  'ERftLW:Mark of Scribing Gnome': MARK_OF_SCRIBING_RULES,
}

export function isInteractiveFeatureSpellSourceFeatureKey(sourceFeatureKey: string | null | undefined) {
  return INTERACTIVE_FEATURE_SPELL_PREFIXES.some((prefix) => sourceFeatureKey?.startsWith(prefix))
}

export function extractInteractiveFeatureSpellChoiceMap(
  rows: CharacterSpellSelection[]
): Record<string, string> {
  const entries = rows.flatMap((row) => {
    if (!isInteractiveFeatureSpellSourceFeatureKey(row.source_feature_key)) return []
    return [[row.source_feature_key as string, row.spell_id] as const]
  })

  return Object.fromEntries(entries)
}

export function buildTypedFeatureSpellChoices(args: {
  selectedChoices: Record<string, string>
  definitions: FeatureSpellChoiceDefinition[]
}): SpellChoiceInput[] {
  const definitionsByKey = new Map(
    args.definitions.map((definition) => [definition.sourceFeatureKey, definition])
  )

  return Object.entries(args.selectedChoices).flatMap(([sourceFeatureKey, spellId]) => {
    if (!spellId) return []

    const definition = definitionsByKey.get(sourceFeatureKey)
    if (!definition) return []

    return [{
      spell_id: spellId,
      character_level_id: null,
      owning_class_id: definition.owningClassId ?? null,
      granting_subclass_id: null,
      acquisition_mode: definition.acquisitionMode,
      counts_against_selection_limit: definition.countsAgainstSelectionLimit,
      source_feature_key: sourceFeatureKey,
    }]
  })
}

export function getFeatureOptionChoiceValue(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>> | Array<{
    option_group_key?: string
    optionGroupKey?: string
    option_key?: string
    optionKey?: string
    selected_value?: Record<string, unknown>
    selectedValue?: Record<string, unknown>
  }>,
  optionGroupKey: string,
  optionKey: string,
  valueKey: string
) {
  const row = rows.find((entry) => {
    const groupKey = 'option_group_key' in entry ? entry.option_group_key : entry.optionGroupKey
    const key = 'option_key' in entry ? entry.option_key : entry.optionKey
    return groupKey === optionGroupKey && key === optionKey
  })
  if (!row) return null

  const selectedValue = 'selected_value' in row ? row.selected_value : row.selectedValue
  const value = selectedValue?.[valueKey]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function buildFeatureOptionChoiceMap(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
) {
  return Object.fromEntries(
    rows.map((row) => [row.option_key, row.selected_value ?? {}])
  )
}

export function buildMaverickFeatureOptionChoices(args: {
  selectedClassIds: string[]
  definitions: FeatureOptionChoiceDefinition[]
}): FeatureOptionChoiceInput[] {
  return args.definitions.flatMap((definition, index) => {
    const classId = args.selectedClassIds[index] ?? ''
    if (!classId) return []

    return [{
      option_group_key: definition.optionGroupKey,
      option_key: definition.optionKey,
      selected_value: { class_id: classId },
      choice_order: definition.choiceOrder,
      character_level_id: null,
      source_category: definition.sourceCategory,
      source_entity_id: definition.sourceEntityId,
      source_feature_key: definition.sourceFeatureKey,
    }]
  })
}

export function getMaverickArcaneBreakthroughOptionDefinitions(args: {
  classLevel: number
  subclassId: string | null
  classList: Class[]
}): FeatureOptionChoiceDefinition[] {
  if (!args.subclassId || args.classLevel < 3) return []

  const allowedClasses = MAVERICK_BREAKTHROUGH_CLASS_NAMES
    .map((name) => args.classList.find((entry) => entry.name === name))
    .filter((entry): entry is Class => Boolean(entry))
    .map((entry) => ({
      value: entry.id,
      label: entry.name,
    }))

  return MAVERICK_BREAKTHROUGH_LEVELS
    .filter((requiredLevel) => args.classLevel >= requiredLevel)
    .map((requiredLevel, index) => ({
      optionGroupKey: MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY,
      optionKey: `class_${requiredLevel}`,
      label: `Arcane Breakthrough class ${index + 1}`,
      description: `Choose the ${index + 1}${ordinalSuffix(index + 1)} class to add to your Breakthrough spell list.`,
      choiceOrder: index,
      choices: allowedClasses,
      sourceCategory: 'subclass_feature',
      sourceEntityId: args.subclassId,
      sourceFeatureKey: MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY,
    }))
}

export function getSelectedMaverickBreakthroughClassIds(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'selected_value'>> | FeatureOptionChoiceInput[]
) {
  return rows
    .filter((row) => row.option_group_key === MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY)
    .map((row) => row.selected_value?.class_id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
}

export function getMaverickFeatureSpellChoiceDefinitions(args: {
  classLevel: number
  artificerClassId: string | null
  selectedBreakthroughClassIds: string[]
  classList: Class[]
}): FeatureSpellChoiceDefinition[] {
  if (!args.artificerClassId || args.classLevel < 3) return []

  const breakthroughClassNames = args.selectedBreakthroughClassIds
    .map((classId) => args.classList.find((entry) => entry.id === classId)?.name)
    .filter((value): value is string => Boolean(value))

  const artificerClassName = args.classList.find((entry) => entry.id === args.artificerClassId)?.name ?? 'Artificer'

  const definitions: FeatureSpellChoiceDefinition[] = [{
    ownerLabel: MAVERICK_SUBCLASS_NAME,
    label: 'Maverick bonus cantrip',
    spellLevel: 0,
    spellListClassNames: Array.from(new Set([artificerClassName, ...breakthroughClassNames])),
    acquisitionMode: 'known',
    countsAgainstSelectionLimit: false,
    sourceFeatureKey: MAVERICK_CANTRIP_SPECIALIST_SOURCE_KEY,
    owningClassId: args.artificerClassId,
  }]

  const unlockedSpellLevels = [
    { requiredClassLevel: 3, spellLevel: 1 },
    { requiredClassLevel: 5, spellLevel: 2 },
    { requiredClassLevel: 9, spellLevel: 3 },
    { requiredClassLevel: 13, spellLevel: 4 },
    { requiredClassLevel: 17, spellLevel: 5 },
  ].filter((entry) => args.classLevel >= entry.requiredClassLevel)

  for (const entry of unlockedSpellLevels) {
    definitions.push({
      ownerLabel: MAVERICK_SUBCLASS_NAME,
      label: `Arcane Breakthrough ${entry.spellLevel}${ordinalSuffix(entry.spellLevel)}-level spell`,
      spellLevel: entry.spellLevel,
      spellListClassNames: breakthroughClassNames,
      acquisitionMode: 'prepared',
      countsAgainstSelectionLimit: false,
      sourceFeatureKey: `feature_spell:maverick:arcane_breakthrough:${entry.spellLevel}`,
      owningClassId: args.artificerClassId,
    })
  }

  return definitions
}

export function getStaticSpeciesGrantedSpells(args: {
  speciesName: string | null
  speciesSource: string | null
  totalLevel: number
  spells: Array<Pick<Spell, 'id' | 'name' | 'level' | 'classes' | 'source'>>
}) {
  const key = args.speciesName && args.speciesSource
    ? `${args.speciesSource}:${args.speciesName}`
    : null
  if (!key) return []

  const rules = STATIC_SPECIES_GRANTED_SPELL_RULES[key] ?? []
  return rules.flatMap((rule) => {
    if ((rule.minLevel ?? 1) > args.totalLevel) return []

    const preferredSources = rule.spellSources ?? (rule.spellSource ? [rule.spellSource] : [])
    const matchingSpells = args.spells.filter((entry) => entry.name === rule.spellName)
    const spell = preferredSources.length > 0
      ? preferredSources
          .map((source) => matchingSpells.find((entry) => entry.source === source))
          .find((entry): entry is typeof matchingSpells[number] => Boolean(entry))
        ?? matchingSpells[0]
      : matchingSpells[0]
    if (!spell) return []

    return [{
      ...spell,
      acquisitionMode: 'granted',
      countsAgainstSelectionLimit: false,
      sourceFeatureKey: rule.sourceFeatureKey,
      owningClassId: null,
      grantedBySubclassIds: [] as string[],
    }]
  })
}

function ordinalSuffix(value: number) {
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'

  switch (value % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}
