export const FEATURE_OPTION_VALUE_KEY = 'feature_option_key'
export const FIGHTING_STYLE_VALUE_KEY = FEATURE_OPTION_VALUE_KEY

export const BATTLE_MASTER_MANEUVER_GROUP_KEY = 'maneuver:battle_master:2014'
export const HUNTER_PREY_GROUP_KEY = 'hunter:hunters_prey:2014'
export const HUNTER_DEFENSIVE_TACTICS_GROUP_KEY = 'hunter:defensive_tactics:2014'
export const HUNTER_MULTIATTACK_GROUP_KEY = 'hunter:multiattack:2014'
export const HUNTER_SUPERIOR_DEFENSE_GROUP_KEY = 'hunter:superior_defense:2014'
export const CIRCLE_OF_LAND_TERRAIN_GROUP_KEY = 'circle_of_land:terrain:2014'
export const FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY = 'elemental_discipline:four_elements:2014'
export const ARTIFICER_INFUSION_GROUP_KEY = 'artificer:infusion:2014'
export const DRAGONBORN_ANCESTRY_GROUP_KEY = 'species:dragonborn:ancestry'
export const DRAGONBORN_ANCESTRY_SOURCE_KEY = 'species_trait:dragonborn_ancestry'
export const HIGH_ELF_CANTRIP_SOURCE_KEY = 'feature_spell:species:high_elf:cantrip'
export const MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY = 'maverick:arcane_breakthrough_classes'
export const MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY = 'subclass_feature:maverick:arcane_breakthroughs'
export const MAVERICK_CANTRIP_SPECIALIST_SOURCE_KEY = 'feature_spell:maverick:cantrip_specialist'

export const FIGHTING_STYLE_GROUP_KEYS: Record<string, string> = {
  Fighter: 'fighting_style:fighter:2014',
  Paladin: 'fighting_style:paladin:2014',
  Ranger: 'fighting_style:ranger:2014',
}

export const FIGHTING_STYLE_UNLOCK_LEVELS: Record<string, number> = {
  Fighter: 1,
  Paladin: 2,
  Ranger: 2,
}

export const MAVERICK_ARCANE_BREAKTHROUGH_SPELL_SOURCE_PREFIX = 'feature_spell:maverick:arcane_breakthrough'

const HUNTER_OPTION_GROUP_KEYS = [
  HUNTER_PREY_GROUP_KEY,
  HUNTER_DEFENSIVE_TACTICS_GROUP_KEY,
  HUNTER_MULTIATTACK_GROUP_KEY,
  HUNTER_SUPERIOR_DEFENSE_GROUP_KEY,
] as const

const HUNTER_GROUP_KEYS = new Set<string>(HUNTER_OPTION_GROUP_KEYS)

const SUBCLASS_FEATURE_OPTION_GROUP_KEY_LIST = [
  BATTLE_MASTER_MANEUVER_GROUP_KEY,
  CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
  FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
  ...HUNTER_OPTION_GROUP_KEYS,
] as const

const SUBCLASS_FEATURE_OPTION_GROUP_KEYS = new Set<string>(SUBCLASS_FEATURE_OPTION_GROUP_KEY_LIST)

const EXACT_CUSTOM_OPTION_GROUP_KEYS = new Set([
  ARTIFICER_INFUSION_GROUP_KEY,
  DRAGONBORN_ANCESTRY_GROUP_KEY,
  MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY,
  ...SUBCLASS_FEATURE_OPTION_GROUP_KEY_LIST,
])

const LEGACY_MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEYS = new Set([
  'subclass_feature:maverick_arcane_breakthroughs',
  MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY,
])

export function getMaverickArcaneBreakthroughSourceKey(spellLevel: number) {
  return `${MAVERICK_ARCANE_BREAKTHROUGH_SPELL_SOURCE_PREFIX}:${spellLevel}`
}

export function isFightingStyleOptionGroup(optionGroupKey: string | null | undefined) {
  return optionGroupKey?.startsWith('fighting_style:') ?? false
}

export function isHunterFeatureOptionGroup(optionGroupKey: string | null | undefined) {
  return optionGroupKey ? HUNTER_GROUP_KEYS.has(optionGroupKey) : false
}

export function isSubclassFeatureOptionGroup(optionGroupKey: string | null | undefined) {
  return optionGroupKey ? SUBCLASS_FEATURE_OPTION_GROUP_KEYS.has(optionGroupKey) : false
}

export function isSpeciesFeatureOptionGroup(optionGroupKey: string | null | undefined) {
  return optionGroupKey?.startsWith('species:') ?? false
}

export function isLegacyMaverickBreakthroughOptionGroup(optionGroupKey: string | null | undefined) {
  return optionGroupKey?.startsWith('maverick:breakthrough:') ?? false
}

export function isMaverickBreakthroughOptionGroup(optionGroupKey: string | null | undefined) {
  return optionGroupKey === MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY
    || isLegacyMaverickBreakthroughOptionGroup(optionGroupKey)
}

export function isCustomOptionGroup(optionGroupKey: string | null | undefined) {
  if (!optionGroupKey) return false
  return isFightingStyleOptionGroup(optionGroupKey)
    || EXACT_CUSTOM_OPTION_GROUP_KEYS.has(optionGroupKey)
    || isLegacyMaverickBreakthroughOptionGroup(optionGroupKey)
}

export function isMaverickArcaneBreakthroughSourceKey(sourceFeatureKey: string | null | undefined) {
  if (!sourceFeatureKey) return false
  return sourceFeatureKey.startsWith(`${MAVERICK_ARCANE_BREAKTHROUGH_SPELL_SOURCE_PREFIX}:`)
    || LEGACY_MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEYS.has(sourceFeatureKey)
}

export function isCustomFeatureSpellSource(sourceFeatureKey: string | null | undefined) {
  if (!sourceFeatureKey) return false
  return sourceFeatureKey.startsWith('feat_spell:')
    || sourceFeatureKey.startsWith('feature_spell:')
    || isMaverickArcaneBreakthroughSourceKey(sourceFeatureKey)
}

export function getActiveOptionGroupsForBuild(
  definitions: ReadonlyArray<{ optionGroupKey: string }>
) {
  return new Set(
    definitions
      .map((definition) => definition.optionGroupKey)
      .filter(isCustomOptionGroup)
  )
}

type FeatureOptionMetadata = Record<string, unknown> | null | undefined

export function hasFeatureOptionMinimumClassLevel(
  prerequisites: FeatureOptionMetadata
): prerequisites is { minimum_class_level: number } {
  return typeof prerequisites?.minimum_class_level === 'number'
}

export function getFeatureOptionMinimumClassLevel(prerequisites: FeatureOptionMetadata) {
  return hasFeatureOptionMinimumClassLevel(prerequisites) ? prerequisites.minimum_class_level : 1
}

export function hasFeatureOptionClassIdEffect(
  effects: FeatureOptionMetadata
): effects is { class_id: string } {
  return typeof effects?.class_id === 'string' && effects.class_id.length > 0
}

export function getFeatureOptionClassIdEffect(effects: FeatureOptionMetadata) {
  return hasFeatureOptionClassIdEffect(effects) ? effects.class_id : null
}
