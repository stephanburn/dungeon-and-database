import type {
  CharacterFeatureOptionChoice,
  CharacterSpellSelection,
  Class,
  FeatureOption,
  Species,
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
  valueKey?: string
  choiceOrder: number
  choices: Array<{
    value: string
    label: string
    description?: string
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
export const FEATURE_OPTION_VALUE_KEY = 'feature_option_key'
export const FIGHTING_STYLE_VALUE_KEY = FEATURE_OPTION_VALUE_KEY
export const DRAGONBORN_ANCESTRY_GROUP_KEY = 'species:dragonborn:ancestry'
export const DRAGONBORN_ANCESTRY_SOURCE_KEY = 'species_trait:dragonborn_ancestry'
export const HIGH_ELF_CANTRIP_SOURCE_KEY = 'feature_spell:species:high_elf:cantrip'
export const BATTLE_MASTER_MANEUVER_GROUP_KEY = 'maneuver:battle_master:2014'
export const HUNTER_PREY_GROUP_KEY = 'hunter:hunters_prey:2014'
export const HUNTER_DEFENSIVE_TACTICS_GROUP_KEY = 'hunter:defensive_tactics:2014'
export const HUNTER_MULTIATTACK_GROUP_KEY = 'hunter:multiattack:2014'
export const HUNTER_SUPERIOR_DEFENSE_GROUP_KEY = 'hunter:superior_defense:2014'
export const CIRCLE_OF_LAND_TERRAIN_GROUP_KEY = 'circle_of_land:terrain:2014'
export const FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY = 'elemental_discipline:four_elements:2014'

const FIGHTING_STYLE_GROUP_KEYS: Record<string, string> = {
  Fighter: 'fighting_style:fighter:2014',
  Paladin: 'fighting_style:paladin:2014',
  Ranger: 'fighting_style:ranger:2014',
}

const FIGHTING_STYLE_UNLOCK_LEVELS: Record<string, number> = {
  Fighter: 1,
  Paladin: 2,
  Ranger: 2,
}

const INTERACTIVE_FEATURE_SPELL_PREFIXES = ['feat_spell:', 'feature_spell:'] as const
const MAVERICK_BREAKTHROUGH_LEVELS = [3, 5, 9, 13, 17] as const
type StaticGrantedSpellRule = {
  spellName: string
  spellSource?: string
  spellSources?: string[]
  minLevel?: number
  sourceFeatureKey: string
}

type DragonbornAncestryDefinition = {
  key: string
  label: string
  damageType: string
  description: string
}

type StaticFeatureGrantedSpellRule = StaticGrantedSpellRule & {
  owningClassId: string | null
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
const DROW_MAGIC_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Dancing Lights', spellSources: ['PHB', 'SRD', 'ERftLW'], sourceFeatureKey: 'species_trait:drow_magic:dancing_lights' },
  { spellName: 'Faerie Fire', spellSources: ['PHB', 'SRD', 'ERftLW'], minLevel: 3, sourceFeatureKey: 'species_trait:drow_magic:faerie_fire' },
  { spellName: 'Darkness', spellSources: ['PHB', 'SRD', 'ERftLW'], minLevel: 5, sourceFeatureKey: 'species_trait:drow_magic:darkness' },
]
const INFERNAL_LEGACY_RULES: StaticGrantedSpellRule[] = [
  { spellName: 'Thaumaturgy', spellSources: ['PHB', 'SRD'], sourceFeatureKey: 'species_trait:infernal_legacy:thaumaturgy' },
  { spellName: 'Hellish Rebuke', spellSources: ['PHB', 'SRD'], minLevel: 3, sourceFeatureKey: 'species_trait:infernal_legacy:hellish_rebuke' },
  { spellName: 'Darkness', spellSources: ['PHB', 'SRD', 'ERftLW'], minLevel: 5, sourceFeatureKey: 'species_trait:infernal_legacy:darkness' },
]

const DRAGONBORN_ANCESTRIES: DragonbornAncestryDefinition[] = [
  { key: 'black', label: 'Black', damageType: 'acid', description: 'Acid breath weapon in a line, with acid resistance.' },
  { key: 'blue', label: 'Blue', damageType: 'lightning', description: 'Lightning breath weapon in a line, with lightning resistance.' },
  { key: 'brass', label: 'Brass', damageType: 'fire', description: 'Fire breath weapon in a line, with fire resistance.' },
  { key: 'bronze', label: 'Bronze', damageType: 'lightning', description: 'Lightning breath weapon in a line, with lightning resistance.' },
  { key: 'copper', label: 'Copper', damageType: 'acid', description: 'Acid breath weapon in a line, with acid resistance.' },
  { key: 'gold', label: 'Gold', damageType: 'fire', description: 'Fire breath weapon in a cone, with fire resistance.' },
  { key: 'green', label: 'Green', damageType: 'poison', description: 'Poison breath weapon in a cone, with poison resistance.' },
  { key: 'red', label: 'Red', damageType: 'fire', description: 'Fire breath weapon in a cone, with fire resistance.' },
  { key: 'silver', label: 'Silver', damageType: 'cold', description: 'Cold breath weapon in a cone, with cold resistance.' },
  { key: 'white', label: 'White', damageType: 'cold', description: 'Cold breath weapon in a cone, with cold resistance.' },
]

const STATIC_SPECIES_GRANTED_SPELL_RULES: Record<string, StaticGrantedSpellRule[]> = {
  'ERftLW:Half-Elf (Mark of Detection)': MARK_OF_DETECTION_RULES,
  'ERftLW:Half-Elf (Mark of Storm)': MARK_OF_STORM_RULES,
  'ERftLW:Half-Orc (Mark of Finding)': MARK_OF_FINDING_RULES,
  'ERftLW:Human (Mark of Finding)': MARK_OF_FINDING_RULES,
  'ERftLW:Human (Mark of Handling)': MARK_OF_HANDLING_RULES,
  'ERftLW:Human (Mark of Making)': MARK_OF_MAKING_RULES,
  'ERftLW:Human (Mark of Passage)': MARK_OF_PASSAGE_RULES,
  'ERftLW:Human (Mark of Sentinel)': MARK_OF_SENTINEL_RULES,
  'ERftLW:Dwarf (Mark of Warding)': MARK_OF_WARDING_RULES,
  'ERftLW:Halfling (Mark of Hospitality)': MARK_OF_HOSPITALITY_RULES,
  'ERftLW:Halfling (Mark of Healing)': MARK_OF_HEALING_RULES,
  'ERftLW:Elf (Mark of Shadow)': MARK_OF_SHADOW_RULES,
  'ERftLW:Gnome (Mark of Scribing)': MARK_OF_SCRIBING_RULES,
  'PHB:Dark Elf (Drow)': DROW_MAGIC_RULES,
  'PHB:Tiefling': INFERNAL_LEGACY_RULES,
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
  rows: Array<{
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
  const row = getActiveFeatureOptionChoices(rows).find((entry) => {
    const groupKey = 'option_group_key' in entry ? entry.option_group_key : entry.optionGroupKey
    const key = 'option_key' in entry ? entry.option_key : entry.optionKey
    return groupKey === optionGroupKey && key === optionKey
  })
  if (!row) return null

  const selectedValue = 'selected_value' in row ? row.selected_value : row.selectedValue
  const value = selectedValue?.[valueKey]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function getActiveFeatureOptionChoices<T extends {
  option_group_key?: string
  optionGroupKey?: string
  option_key?: string
  optionKey?: string
}>(rows: T[]) {
  const latestBySlot = new Map<string, T>()

  for (const row of rows) {
    const groupKey = 'option_group_key' in row ? row.option_group_key : row.optionGroupKey
    const optionKey = 'option_key' in row ? row.option_key : row.optionKey
    if (!groupKey || !optionKey) continue
    latestBySlot.set(`${groupKey}:${optionKey}`, row)
  }

  return Array.from(latestBySlot.values())
}

export function buildFeatureOptionChoiceMap(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
) {
  return Object.fromEntries(
    getActiveFeatureOptionChoices(rows).map((row) => [row.option_key, row.selected_value ?? {}])
  )
}

export function buildMaverickFeatureOptionChoices(args: {
  selectedClassIds: string[]
  definitions: FeatureOptionChoiceDefinition[]
}): FeatureOptionChoiceInput[] {
  return args.definitions.flatMap((definition, index) => {
    const classId = args.selectedClassIds[index] ?? ''
    if (!classId) return []

    const valueKey = definition.valueKey ?? 'class_id'
    return [{
      option_group_key: definition.optionGroupKey,
      option_key: definition.optionKey,
      selected_value: { [valueKey]: classId },
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
  optionRows: FeatureOption[]
}): FeatureOptionChoiceDefinition[] {
  if (!args.subclassId || args.classLevel < 3) return []

  const allowedClasses = args.optionRows
    .filter((option) => option.group_key === MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY)
    .sort((left, right) => {
      if (left.option_order !== right.option_order) return left.option_order - right.option_order
      return left.name.localeCompare(right.name)
    })
    .flatMap((option) => {
      const classId = typeof option.effects?.class_id === 'string' ? option.effects.class_id : null
      if (!classId) return []

      return [{
        value: classId,
        label: option.name,
        description: option.description,
      }]
    })

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
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>> | FeatureOptionChoiceInput[]
) {
  const canonicalRows = getActiveFeatureOptionChoices(rows)
    .filter((row) => row.option_group_key === MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY)
    .map((row) => row.selected_value?.class_id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)

  if (canonicalRows.length > 0) return canonicalRows

  return rows
    .filter((row) => row.option_group_key.startsWith('maverick:breakthrough:'))
    .sort((left, right) => {
      const leftLevel = Number.parseInt(left.option_group_key.split(':').at(-1) ?? '0', 10)
      const rightLevel = Number.parseInt(right.option_group_key.split(':').at(-1) ?? '0', 10)
      return leftLevel - rightLevel
    })
    .map((row) => ('option_key' in row ? row.option_key : undefined))
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
}

export function buildFeatureOptionChoicesFromDefinitionMap(args: {
  definitions: FeatureOptionChoiceDefinition[]
  selectedValues: Record<string, string>
}): FeatureOptionChoiceInput[] {
  return args.definitions.flatMap((definition) => {
    const selectedValue = args.selectedValues[definition.optionKey] ?? ''
    if (!selectedValue) return []

    const valueKey = definition.valueKey ?? 'class_id'
    return [{
      option_group_key: definition.optionGroupKey,
      option_key: definition.optionKey,
      selected_value: { [valueKey]: selectedValue },
      choice_order: definition.choiceOrder,
      character_level_id: null,
      source_category: definition.sourceCategory,
      source_entity_id: definition.sourceEntityId,
      source_feature_key: definition.sourceFeatureKey,
    }]
  })
}

export function mergeFeatureOptionChoiceInputs(args: {
  preservedChoices: FeatureOptionChoiceInput[]
  replacementDefinitions: FeatureOptionChoiceDefinition[]
  replacements: FeatureOptionChoiceInput[]
}) {
  const replacementKeys = new Set(
    args.replacementDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
  )

  return [
    ...args.preservedChoices.filter(
      (choice) => !replacementKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    ),
    ...args.replacements,
  ]
}

export function getFightingStyleGroupKey(className: string | null | undefined) {
  if (!className) return null
  return FIGHTING_STYLE_GROUP_KEYS[className] ?? null
}

export function getFightingStyleUnlockLevel(className: string | null | undefined) {
  if (!className) return null
  return FIGHTING_STYLE_UNLOCK_LEVELS[className] ?? null
}

export function getFightingStyleFeatureOptionDefinition(args: {
  classId: string | null
  className: string | null
  classLevel: number
  optionRows: FeatureOption[]
}): FeatureOptionChoiceDefinition[] {
  const groupKey = getFightingStyleGroupKey(args.className)
  const unlockLevel = getFightingStyleUnlockLevel(args.className)
  const className = args.className
  if (!groupKey || !unlockLevel || !className || args.classLevel < unlockLevel) return []

  const choices = args.optionRows
    .filter((option) => option.group_key === groupKey)
    .sort((left, right) => {
      if (left.option_order !== right.option_order) return left.option_order - right.option_order
      return left.name.localeCompare(right.name)
    })
    .map((option) => ({
      value: option.key,
      label: option.name,
      description: option.description,
    }))

  if (choices.length === 0) return []

  return [{
    optionGroupKey: groupKey,
    optionKey: 'style',
    label: 'Fighting Style',
    description: `Choose the fighting style granted by ${className}.`,
    valueKey: FIGHTING_STYLE_VALUE_KEY,
    choiceOrder: 0,
    choices,
    sourceCategory: 'class_feature',
    sourceEntityId: args.classId,
    sourceFeatureKey: `class_feature:fighting_style:${className.toLowerCase()}`,
  }]
}

function isPhbHighElf(species: Pick<Species, 'name' | 'source'> | null) {
  return species?.name === 'High Elf' && species.source === 'PHB'
}

function isPhbDragonborn(species: Pick<Species, 'name' | 'source'> | null) {
  return species?.name === 'Dragonborn' && species.source === 'PHB'
}

function getMinimumClassLevel(option: Pick<FeatureOption, 'prerequisites'>) {
  const raw = option.prerequisites?.minimum_class_level
  return typeof raw === 'number' ? raw : 1
}

function getFeatureOptionChoicesForGroup(args: {
  optionRows: FeatureOption[]
  groupKey: string
  classLevel: number
}) {
  return args.optionRows
    .filter((option) => (
      option.group_key === args.groupKey
      && getMinimumClassLevel(option) <= args.classLevel
    ))
    .sort((left, right) => {
      if (left.option_order !== right.option_order) return left.option_order - right.option_order
      return left.name.localeCompare(right.name)
    })
    .map((option) => ({
      value: option.key,
      label: option.name,
      description: option.description,
    }))
}

function buildRepeatedFeatureOptionDefinitions(args: {
  count: number
  optionGroupKey: string
  optionKeyPrefix: string
  labelPrefix: string
  description: string
  choices: FeatureOptionChoiceDefinition['choices']
  sourceEntityId: string | null
  sourceFeatureKey: string
}) {
  if (args.count <= 0 || args.choices.length === 0) return []

  return Array.from({ length: args.count }, (_, index) => ({
    optionGroupKey: args.optionGroupKey,
    optionKey: `${args.optionKeyPrefix}_${index + 1}`,
    label: `${args.labelPrefix} ${index + 1}`,
    description: args.description,
    valueKey: FEATURE_OPTION_VALUE_KEY,
    choiceOrder: index,
    choices: args.choices,
    sourceCategory: 'subclass_feature',
    sourceEntityId: args.sourceEntityId,
    sourceFeatureKey: args.sourceFeatureKey,
  }))
}

export function getSubclassFeatureOptionDefinitions(args: {
  classId: string | null
  classLevel: number
  subclassId: string | null
  subclassName: string | null
  subclassSource: string | null
  optionRows: FeatureOption[]
}): FeatureOptionChoiceDefinition[] {
  if (!args.classId || !args.subclassId || !args.subclassName || args.subclassSource !== 'PHB') return []

  if (args.subclassName === 'Battle Master') {
    const maneuverChoices = getFeatureOptionChoicesForGroup({
      optionRows: args.optionRows,
      groupKey: BATTLE_MASTER_MANEUVER_GROUP_KEY,
      classLevel: args.classLevel,
    })
    const maneuverCount = args.classLevel >= 15 ? 9 : args.classLevel >= 10 ? 7 : args.classLevel >= 7 ? 5 : args.classLevel >= 3 ? 3 : 0
    return buildRepeatedFeatureOptionDefinitions({
      count: maneuverCount,
      optionGroupKey: BATTLE_MASTER_MANEUVER_GROUP_KEY,
      optionKeyPrefix: `${args.classId}:maneuver`,
      labelPrefix: 'Combat Superiority Maneuver',
      description: 'Choose a Battle Master maneuver for this fighter.',
      choices: maneuverChoices,
      sourceEntityId: args.subclassId,
      sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
    })
  }

  if (args.subclassName === 'Hunter') {
    const definitions: FeatureOptionChoiceDefinition[] = []
    const optionConfigs = [
      {
        minimumClassLevel: 3,
        optionGroupKey: HUNTER_PREY_GROUP_KEY,
        optionKey: `${args.classId}:hunters_prey`,
        label: "Hunter's Prey",
        description: 'Choose your preferred offensive hunting tactic.',
        sourceFeatureKey: 'subclass_feature:hunter:hunters_prey',
      },
      {
        minimumClassLevel: 7,
        optionGroupKey: HUNTER_DEFENSIVE_TACTICS_GROUP_KEY,
        optionKey: `${args.classId}:defensive_tactics`,
        label: 'Defensive Tactics',
        description: 'Choose a practiced defense for your Hunter.',
        sourceFeatureKey: 'subclass_feature:hunter:defensive_tactics',
      },
      {
        minimumClassLevel: 11,
        optionGroupKey: HUNTER_MULTIATTACK_GROUP_KEY,
        optionKey: `${args.classId}:multiattack`,
        label: 'Multiattack',
        description: 'Choose your Hunter multiattack option.',
        sourceFeatureKey: 'subclass_feature:hunter:multiattack',
      },
      {
        minimumClassLevel: 15,
        optionGroupKey: HUNTER_SUPERIOR_DEFENSE_GROUP_KEY,
        optionKey: `${args.classId}:superior_defense`,
        label: "Superior Hunter's Defense",
        description: 'Choose your advanced Hunter defense.',
        sourceFeatureKey: 'subclass_feature:hunter:superior_defense',
      },
    ] as const

    for (const config of optionConfigs) {
      if (args.classLevel < config.minimumClassLevel) continue
      const choices = getFeatureOptionChoicesForGroup({
        optionRows: args.optionRows,
        groupKey: config.optionGroupKey,
        classLevel: args.classLevel,
      })
      if (choices.length === 0) continue

      definitions.push({
        optionGroupKey: config.optionGroupKey,
        optionKey: config.optionKey,
        label: config.label,
        description: config.description,
        valueKey: FEATURE_OPTION_VALUE_KEY,
        choiceOrder: definitions.length,
        choices,
        sourceCategory: 'subclass_feature',
        sourceEntityId: args.subclassId,
        sourceFeatureKey: config.sourceFeatureKey,
      })
    }

    return definitions
  }

  if (args.subclassName === 'Circle of the Land' && args.classLevel >= 2) {
    const choices = getFeatureOptionChoicesForGroup({
      optionRows: args.optionRows,
      groupKey: CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
      classLevel: args.classLevel,
    })
    if (choices.length === 0) return []

    return [{
      optionGroupKey: CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
      optionKey: `${args.classId}:terrain`,
      label: 'Circle of the Land Terrain',
      description: 'Choose the natural terrain that shapes your circle spells.',
      valueKey: FEATURE_OPTION_VALUE_KEY,
      choiceOrder: 0,
      choices,
      sourceCategory: 'subclass_feature',
      sourceEntityId: args.subclassId,
      sourceFeatureKey: 'subclass_feature:circle_of_the_land:terrain',
    }]
  }

  if (args.subclassName === 'Way of the Four Elements') {
    const disciplineChoices = getFeatureOptionChoicesForGroup({
      optionRows: args.optionRows,
      groupKey: FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
      classLevel: args.classLevel,
    })
    const disciplineCount = args.classLevel >= 17 ? 4 : args.classLevel >= 11 ? 3 : args.classLevel >= 6 ? 2 : args.classLevel >= 3 ? 1 : 0
    return buildRepeatedFeatureOptionDefinitions({
      count: disciplineCount,
      optionGroupKey: FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
      optionKeyPrefix: `${args.classId}:discipline`,
      labelPrefix: 'Elemental Discipline',
      description: 'Choose an elemental discipline available to your monk.',
      choices: disciplineChoices,
      sourceEntityId: args.subclassId,
      sourceFeatureKey: 'subclass_feature:four_elements:discipline',
    })
  }

  return []
}

export function getSpeciesFeatureSpellChoiceDefinitions(args: {
  species: Pick<Species, 'id' | 'name' | 'source'> | null
}): FeatureSpellChoiceDefinition[] {
  if (!isPhbHighElf(args.species)) return []

  return [{
    ownerLabel: 'High Elf',
    label: 'High Elf cantrip',
    spellLevel: 0,
    spellListClassNames: ['Wizard'],
    acquisitionMode: 'granted',
    countsAgainstSelectionLimit: false,
    sourceFeatureKey: HIGH_ELF_CANTRIP_SOURCE_KEY,
    owningClassId: null,
  }]
}

export function getSpeciesFeatureOptionDefinitions(args: {
  species: Pick<Species, 'id' | 'name' | 'source'> | null
}): FeatureOptionChoiceDefinition[] {
  if (!isPhbDragonborn(args.species)) return []

  return [{
    optionGroupKey: DRAGONBORN_ANCESTRY_GROUP_KEY,
    optionKey: 'ancestry',
    label: 'Draconic Ancestry',
    description: 'Choose the dragon ancestry that sets your breath weapon and damage resistance.',
    valueKey: FEATURE_OPTION_VALUE_KEY,
    choiceOrder: 0,
    choices: DRAGONBORN_ANCESTRIES.map((ancestry) => ({
      value: ancestry.key,
      label: ancestry.label,
      description: ancestry.description,
    })),
    sourceCategory: 'species_choice',
    sourceEntityId: args.species?.id ?? null,
    sourceFeatureKey: DRAGONBORN_ANCESTRY_SOURCE_KEY,
  }]
}

export function getSelectedDragonbornAncestry(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
) {
  const selectedKey = getFeatureOptionChoiceValue(
    rows,
    DRAGONBORN_ANCESTRY_GROUP_KEY,
    'ancestry',
    FEATURE_OPTION_VALUE_KEY
  )
  if (!selectedKey) return null

  return DRAGONBORN_ANCESTRIES.find((ancestry) => ancestry.key === selectedKey) ?? null
}

export function getSpeciesDerivedDamageResistances(args: {
  speciesName: string | null
  speciesSource: string | null
  selectedOptions: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
}) {
  if (!args.speciesName || !args.speciesSource) return []
  if (!(args.speciesName === 'Dragonborn' && args.speciesSource === 'PHB')) return []

  const ancestry = getSelectedDragonbornAncestry(args.selectedOptions)
  return ancestry ? [ancestry.damageType] : []
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
  spells: Array<Pick<Spell, 'id' | 'name' | 'level' | 'school' | 'classes' | 'source'>>
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

export function getStaticSubclassFeatureGrantedSpells(args: {
  classes: Array<{
    classId: string
    level: number
    subclass: { id: string | null; name: string | null; source: string | null } | null
  }>
  selectedFeatureOptions: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
  optionRows: Array<Pick<FeatureOption, 'group_key' | 'key' | 'effects'>>
  spells: Array<Pick<Spell, 'id' | 'name' | 'level' | 'school' | 'classes' | 'source'>>
}) {
  const rules: StaticFeatureGrantedSpellRule[] = []

  for (const cls of args.classes) {
    if (cls.subclass?.name !== 'Circle of the Land' || cls.subclass.source !== 'PHB') continue

    const terrainKey = getFeatureOptionChoiceValue(
      args.selectedFeatureOptions,
      CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
      `${cls.classId}:terrain`,
      FEATURE_OPTION_VALUE_KEY
    )
    if (!terrainKey) continue

    const terrainOption = args.optionRows.find((option) => (
      option.group_key === CIRCLE_OF_LAND_TERRAIN_GROUP_KEY
      && option.key === terrainKey
    ))
    const spellGrants = Array.isArray(terrainOption?.effects?.spell_grants)
      ? terrainOption.effects.spell_grants
      : []

    for (const grant of spellGrants) {
      if (!grant || typeof grant !== 'object') continue

      const spellName = typeof (grant as { spell_name?: unknown }).spell_name === 'string'
        ? (grant as { spell_name: string }).spell_name
        : null
      const minLevel = typeof (grant as { min_class_level?: unknown }).min_class_level === 'number'
        ? (grant as { min_class_level: number }).min_class_level
        : 1
      const sourceFeatureKey = typeof (grant as { source_feature_key?: unknown }).source_feature_key === 'string'
        ? (grant as { source_feature_key: string }).source_feature_key
        : null
      const spellSources = Array.isArray((grant as { spell_sources?: unknown }).spell_sources)
        ? (grant as { spell_sources: unknown[] }).spell_sources.filter((value): value is string => typeof value === 'string')
        : ['PHB', 'SRD', 'srd']

      if (!spellName || !sourceFeatureKey || cls.level < minLevel) continue

      rules.push({
        spellName,
        spellSources,
        minLevel,
        sourceFeatureKey,
        owningClassId: cls.classId,
      })
    }
  }

  return rules.flatMap((rule) => {
    const matchingSpells = args.spells.filter((entry) => entry.name === rule.spellName)
    const spell = rule.spellSources && rule.spellSources.length > 0
      ? rule.spellSources
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
      owningClassId: rule.owningClassId,
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
