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

export {
  BATTLE_MASTER_MANEUVER_GROUP_KEY,
  CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
  DRAGONBORN_ANCESTRY_GROUP_KEY,
  DRAGONBORN_ANCESTRY_SOURCE_KEY,
  FEATURE_OPTION_VALUE_KEY,
  FIGHTING_STYLE_GROUP_KEYS,
  FIGHTING_STYLE_UNLOCK_LEVELS,
  FIGHTING_STYLE_VALUE_KEY,
  FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
  HIGH_ELF_CANTRIP_SOURCE_KEY,
  HUNTER_DEFENSIVE_TACTICS_GROUP_KEY,
  HUNTER_MULTIATTACK_GROUP_KEY,
  HUNTER_PREY_GROUP_KEY,
  HUNTER_SUPERIOR_DEFENSE_GROUP_KEY,
  MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY,
  MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY,
  MAVERICK_CANTRIP_SPECIALIST_SOURCE_KEY,
} from './rule-handlers'

export const MAVERICK_SUBCLASS_NAME = 'Maverick'
export const MAVERICK_SUBCLASS_SOURCE = 'EE'

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
