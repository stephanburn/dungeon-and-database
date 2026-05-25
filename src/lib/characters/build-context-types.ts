import type {
  CampaignSettings,
  FeatureOption,
  FeatPrerequisite,
  RuleSet,
  Sense,
  SkillChoices,
  SizeCategory,
  SpellcastingProgression,
  SpellcastingType,
  StatMethod,
} from '@/lib/types/database'
import type { CharacterFeatureOptionChoice } from '@/lib/types/database'
import type {
  CharacterArmorCatalogEntry,
  CharacterArmorItem,
  CharacterShieldCatalogEntry,
  DerivedSpellSelectionMode,
} from '@/lib/characters/derived'
import type { FeatSlotDefinition } from '@/lib/characters/feat-slots'

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface BuildProgressionRow {
  level: number
  asiAvailable: boolean
  proficiencyBonus: number
  featureNames: string[]
  features?: BuildFeatureUnlockSummary[]
}

export interface BuildSubclassSummary {
  id: string
  name: string
  source: string
  choiceLevel: number
}

export interface BuildClassSummary {
  classId: string
  name: string
  level: number
  hitDie: number
  hpRoll: number | null
  source: string
  spellcastingType: SpellcastingType | null
  spellcastingProgression: SpellcastingProgression | null
  subclassChoiceLevel: number
  multiclassPrereqs: Array<{ ability: string; min: number }>
  skillChoices: SkillChoices
  savingThrowProficiencies: string[]
  armorProficiencies: string[]
  weaponProficiencies: string[]
  toolProficiencies: string[]
  subclass: BuildSubclassSummary | null
  progression: BuildProgressionRow[]
  spellSlots: number[]
}

export interface BuildBackgroundSummary {
  id: string
  name: string
  source: string
  skillProficiencies: string[]
  skillChoiceCount: number
  skillChoiceFrom: string[]
  toolProficiencies: string[]
  fixedLanguages: string[]
  backgroundFeatId: string | null
}

export interface BuildSpeciesTraitSummary {
  id: string
  name: string
  description: string
  source: string
}

export interface BuildSpellSummary {
  id: string
  name: string
  level: number
  school?: string | null
  classes: string[]
  source: string
  grantedBySubclassIds: string[]
  countsAgainstSelectionLimit: boolean
  sourceFeatureKey: string | null
}

export interface BuildFeatSummary {
  id: string
  name: string
  source: string
  prerequisites: FeatPrerequisite[]
}

export interface CharacterBuildContext {
  allowedSources: string[]
  campaignSettings: CampaignSettings
  campaignRuleSet: RuleSet
  allSourceRuleSets: Record<string, RuleSet>
  statMethod: StatMethod
  persistedHpMax: number
  baseStats: Record<AbilityKey, number>
  statRolls: Array<{
    assigned_to: string
    roll_set: number[]
  }>
  skillProficiencies: string[]
  skillExpertise: string[]
  selectedAbilityBonuses: Partial<Record<AbilityKey, number>>
  selectedAsiBonuses: Partial<Record<AbilityKey, number>>
  selectedAsiChoices: Array<{
    id: string
    slotIndex: number
    ability: AbilityKey
    bonus: number
    characterLevelId: string | null
    sourceFeatureKey: string | null
  }>
  selectedFeatureOptions: CharacterFeatureOptionChoice[]
  featureOptions: Array<Pick<FeatureOption, 'group_key' | 'key' | 'name' | 'description' | 'prerequisites' | 'effects'>>
  equipmentItems: CharacterArmorItem[]
  armorCatalog: CharacterArmorCatalogEntry[]
  shieldCatalog: CharacterShieldCatalogEntry[]
  asiChoiceSlots: Array<{
    slotIndex: number
    bonuses: Partial<Record<AbilityKey, number>>
  }>
  speciesName: string | null
  speciesLineage: string | null
  selectedLanguages: string[]
  selectedTools: string[]
  speciesSource: string | null
  speciesAbilityBonuses: Partial<Record<AbilityKey, number>>
  speciesSpeed: number | null
  speciesSize: SizeCategory | null
  speciesLanguages: string[]
  speciesTraits: BuildSpeciesTraitSummary[]
  speciesSenses: Sense[]
  speciesDamageResistances: string[]
  speciesConditionImmunities: string[]
  background: BuildBackgroundSummary | null
  backgroundFeat: BuildFeatSummary | null
  classes: BuildClassSummary[]
  selectedSpells: BuildSpellSummary[]
  selectedFeats: BuildFeatSummary[]
  selectedFeatChoices: Array<{
    id: string
    featId: string
    featName: string
    choiceKind: string
    characterLevelId: string | null
    sourceFeatureKey: string | null
  }>
  classLevelAnchors: Array<{
    id: string
    classId: string
    className: string
    levelNumber: number
    hpRoll?: number | null
    takenAt: string | null
  }>
  sourceCollections: {
    classSources: string[]
    subclassSources: string[]
    spellSources: string[]
    featSources: string[]
  }
  grantedSpellIds: string[]
  expandedSpellIds: string[]
  freePreparedSpellIds: string[]
  multiclassSpellSlotsByCasterLevel: Record<number, number[]>
}

export interface CharacterProgressionSummary {
  totalLevel: number
  classCount: number
  totalAsiSlots: number
  featSlots: FeatSlotDefinition[]
  featSlotLabels: string[]
  multiclassCasterLevel: number
  spellSlots: number[]
  spellLevelCaps: Record<number, number>
  leveledSpellSelectionCap: number
  cantripSelectionCap: number | null
  spellSelectionMode: DerivedSpellSelectionMode
  spellSelectionClassName: string | null
  spellSelectionSummary: string | null
  pactSpellSlots: Array<{ classId: string; className: string; slots: number[] }>
  maxSpellLevel: number
  unlockedFeatures: string[]
  subclassRequirements: Array<{
    classId: string
    className: string
    currentLevel: number
    requiredAt: number
    subclassId: string | null
    subclassName: string | null
    subclassRequired: boolean
    missingRequiredSubclass: boolean
    selectedTooEarly: boolean
  }>
  choiceCaps: {
    featSlots: number
    backgroundSkillChoices: number
    classSkillChoices: number
  }
}

export interface BuildFeatureUnlockSummary {
  name: string
  description: string | null
  sourceType: 'class' | 'subclass'
  sourceLabel: string
  source: string | null
  amended: boolean
  amendmentNote: string | null
}
