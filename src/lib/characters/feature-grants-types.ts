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

export interface DragonbornAncestryDefinition {
  key: string
  label: string
  damageType: string
  description: string
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

export const INTERACTIVE_FEATURE_SPELL_PREFIXES = ['feat_spell:', 'feature_spell:'] as const
export const MAVERICK_BREAKTHROUGH_LEVELS = [3, 5, 9, 13, 17] as const

export const DRAGONBORN_ANCESTRIES: DragonbornAncestryDefinition[] = [
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

export function ordinalSuffix(value: number) {
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
