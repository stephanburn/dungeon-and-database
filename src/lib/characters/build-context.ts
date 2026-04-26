import type {
  Background,
  CampaignSettings,
  ClassFeatureProgression,
  FeatPrerequisite,
  RuleSet,
  Sense,
  SkillChoices,
  SizeCategory,
  SpellcastingProgression,
  SpellcastingType,
  StatMethod,
  SpeciesTrait,
  FeatureOption,
} from '@/lib/types/database'
import {
  abilityModifier,
  abilityBonusMapToContributors,
  deriveArmorClass,
  deriveAbilityScores,
  deriveCharacterCore,
  deriveSheetPassivePerception,
  deriveSheetSavingThrows,
  deriveSheetSkills,
  sumAbilityContributors,
  buildSavingThrowSourceMap,
  type CharacterAggregate,
  type CharacterArmorCatalogEntry,
  type CharacterArmorItem,
  type CharacterShieldCatalogEntry,
  type DerivedCharacterCore,
  type DerivedAbilityScoreContributor,
  type DerivedSheetSavingThrow,
} from '@/lib/characters/derived'
import { getFixedBackgroundLanguages } from '@/lib/characters/language-tool-provenance'
import {
  getMaverickCantripBonus,
  getMaverickPreparedBreakthroughLevels,
  isMaverickSubclass,
} from '@/lib/characters/maverick'
import {
  getSelectedDragonbornAncestry,
  getSpeciesDerivedDamageResistances,
  HIGH_ELF_CANTRIP_SOURCE_KEY,
} from '@/lib/characters/feature-grants'
import {
  createAsiFeatSlotDefinition,
  getSpeciesFeatSlotDefinitions,
  type FeatSlotDefinition,
} from '@/lib/characters/feat-slots'
import {
  buildSpellSelectionSummary,
  resolveLeveledSpellSelectionCap,
  resolvePreparedSpellCap,
} from '@/lib/characters/spell-selection'
import { normalizeSkillKey, type SkillKey } from '@/lib/skills'
import type { CharacterFeatureOptionChoice } from '@/lib/types/database'

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

export type DerivedSpellDisplayCategory = 'known' | 'prepared' | 'spellbook' | 'granted'

export interface DerivedSelectedSpellSummary {
  id: string
  name: string
  level: number
  source: string
  granted: boolean
  countsAgainstSelectionLimit: boolean
  sourceFeatureKey: string | null
  category: DerivedSpellDisplayCategory
  grantLabel: string | null
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
  spellSelectionMode: 'prepared' | 'known' | 'spellbook' | 'none'
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

export type DerivedSavingThrowSummary = DerivedSheetSavingThrow

export interface DerivedSkillSummary {
  key: SkillKey
  name: string
  ability: AbilityKey
  proficient: boolean
  modifier: number
}

export interface DerivedProficiencySummary {
  skills: string[]
  savingThrows: string[]
  armor: string[]
  weapons: string[]
  tools: string[]
  all: string[]
}

export interface DerivedAcSummary {
  value: number
  formula: string
  alternatives?: Array<{
    label: string
    value: number
    formula: string
  }>
}

export interface DerivedSubclassState {
  classId: string
  className: string
  currentLevel: number
  requiredAt: number
  subclassId: string | null
  subclassName: string | null
  status: 'not_yet_available' | 'available_unselected' | 'selected' | 'selected_too_early'
}

export interface DerivedFeatureSummary {
  classId: string
  className: string
  level: number
  name: string
  subclassName: string | null
  sourceType: 'class' | 'subclass'
  sourceLabel: string
  description: string | null
  source: string | null
  amended: boolean
  amendmentNote: string | null
}

export type DerivedSpeciesTraitSummary = BuildSpeciesTraitSummary

export interface BuildFeatureUnlockSummary {
  name: string
  description: string | null
  sourceType: 'class' | 'subclass'
  sourceLabel: string
  source: string | null
  amended: boolean
  amendmentNote: string | null
}

export interface DerivedClassResourceSummary {
  id: string
  label: string
  value: string
  detail: string
  recharge: string | null
  sourceLabel: string
}

export interface DerivedAsiFeatHistoryEntry {
  id: string
  type: 'asi' | 'feat'
  label: string
  detail: string
  classId: string | null
  className: string | null
  levelNumber: number | null
  takenAt: string | null
  sourceFeatureKey: string | null
}

export interface DerivedCombatActionSummary {
  id: string
  name: string
  category: 'maneuver' | 'hunter' | 'discipline' | 'trait'
  sourceLabel: string
  trigger: string | null
  effect: string
  cost: string | null
  saveDc: number | null
}

export interface DerivedSpellcastingSourceSummary {
  classId: string
  className: string
  classLevel: number
  spellcastingType: SpellcastingType | null
  mode: CharacterProgressionSummary['spellSelectionMode']
  spellcastingAbility: AbilityKey | null
  spellcastingAbilityModifier: number | null
  spellSaveDc: number | null
  spellAttackModifier: number | null
  cantripSelectionCap: number | null
  leveledSpellSelectionCap: number
  selectionSummary: string | null
  selectedSpellCountsByLevel: Record<number, number>
  selectedSpells: DerivedSelectedSpellSummary[]
  knownSpells: DerivedSelectedSpellSummary[]
  preparedSpells: DerivedSelectedSpellSummary[]
  spellbookSpells: DerivedSelectedSpellSummary[]
  grantedSpells: DerivedSelectedSpellSummary[]
}

export interface DerivedSpellcastingSummary {
  className: string | null
  mode: CharacterProgressionSummary['spellSelectionMode']
  maxSpellLevel: number
  spellSlots: number[]
  pactSpellSlots: Array<{ classId: string; className: string; slots: number[] }>
  cantripSelectionCap: number | null
  leveledSpellSelectionCap: number
  selectionSummary: string | null
  selectedSpells: DerivedSelectedSpellSummary[]
  selectedSpellCountsByLevel: Record<number, number>
  freePreparedSpellIds: string[]
  grantedSpellIds: string[]
  sources: DerivedSpellcastingSourceSummary[]
  grantedSpells: DerivedSelectedSpellSummary[]
}

export interface DerivedIssueSummary {
  key: string
  message: string
  severity: 'error' | 'warning'
}

export type DerivedCharacter = DerivedCharacterCore & CharacterProgressionSummary & {
  savingThrows: DerivedSavingThrowSummary[]
  skills: DerivedSkillSummary[]
  proficiencies: DerivedProficiencySummary
  initiative: number
  passivePerception: number
  speed: number | null
  size: SizeCategory | null
  languages: string[]
  speciesTraits: DerivedSpeciesTraitSummary[]
  senses: Sense[]
  damageResistances: string[]
  conditionImmunities: string[]
  armorClass: DerivedAcSummary
  subclassStates: DerivedSubclassState[]
  features: DerivedFeatureSummary[]
  classResources: DerivedClassResourceSummary[]
  asiFeatHistory: DerivedAsiFeatHistoryEntry[]
  combatActions: DerivedCombatActionSummary[]
  spellcasting: DerivedSpellcastingSummary
  blockingIssues: DerivedIssueSummary[]
  warnings: DerivedIssueSummary[]
}

export function progressionRowToSummary(
  row: ClassFeatureProgression,
  featureNames: string[],
  features?: BuildFeatureUnlockSummary[]
): BuildProgressionRow {
  return {
    level: row.level,
    asiAvailable: row.asi_available,
    proficiencyBonus: row.proficiency_bonus,
    featureNames,
    features,
  }
}

function normalizeToolProficiencies(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((value): value is string => typeof value === 'string')
  }
  if (input && typeof input === 'object') {
    return Object.keys(input as Record<string, unknown>)
  }
  return []
}

function spellcastingContribution(type: SpellcastingType | null, level: number): number {
  switch (type) {
    case 'full':
      return level
    case 'half':
      // 2014 multiclass slot progression rounds half-caster levels down when combining caster levels.
      return Math.floor(level / 2)
    case 'third':
      // 2014 multiclass slot progression also rounds third-caster levels down.
      return Math.floor(level / 3)
    default:
      return 0
  }
}

function maxUnlockedSpellLevel(slots: number[]): number {
  for (let index = slots.length - 1; index >= 0; index -= 1) {
    if ((slots[index] ?? 0) > 0) return index + 1
  }
  return 0
}

function titleCaseFeaturePart(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function spellGrantLabel(sourceFeatureKey: string | null) {
  if (!sourceFeatureKey) return null

  if (sourceFeatureKey.startsWith('feat_spell:')) {
    const [, , ...choiceParts] = sourceFeatureKey.split(':')
    const choiceLabel = titleCaseFeaturePart(choiceParts.join(' '))
    return choiceLabel ? `Feat spell: ${choiceLabel}` : 'Feat spell'
  }

  if (sourceFeatureKey.startsWith('feature_spell:')) {
    const [, category, ...featureParts] = sourceFeatureKey.split(':')
    const featureLabel = titleCaseFeaturePart(featureParts.join(' '))
    const categoryLabel = titleCaseFeaturePart(category)
    return featureLabel ? `${categoryLabel} feature: ${featureLabel}` : `${categoryLabel} feature`
  }

  if (sourceFeatureKey.startsWith('species_trait:')) {
    return `Species trait: ${titleCaseFeaturePart(sourceFeatureKey.replace(/^species_trait:/, ''))}`
  }

  if (sourceFeatureKey.startsWith('subclass_feature:')) {
    const [, , ...featureParts] = sourceFeatureKey.split(':')
    return `Subclass feature: ${titleCaseFeaturePart(featureParts.join(' '))}`
  }

  if (sourceFeatureKey.startsWith('class_feature:')) {
    const [, ...featureParts] = sourceFeatureKey.split(':')
    return `Class feature: ${titleCaseFeaturePart(featureParts.join(' '))}`
  }

  return titleCaseFeaturePart(sourceFeatureKey)
}

function spellDisplayCategory(
  spell: Pick<BuildSpellSummary, 'level'>,
  mode: CharacterProgressionSummary['spellSelectionMode'],
  granted: boolean
): DerivedSpellDisplayCategory {
  if (granted) return 'granted'
  if (spell.level === 0) return 'known'
  if (mode === 'spellbook') return 'spellbook'
  if (mode === 'prepared') return 'prepared'
  return 'known'
}

function rageUses(level: number) {
  if (level >= 20) return 'Unlimited'
  if (level >= 17) return '6'
  if (level >= 12) return '5'
  if (level >= 6) return '4'
  if (level >= 3) return '3'
  return '2'
}

function bardicInspirationDie(level: number) {
  if (level >= 15) return 'd12'
  if (level >= 10) return 'd10'
  if (level >= 5) return 'd8'
  return 'd6'
}

function superiorityDice(level: number) {
  const count = level >= 15 ? 6 : level >= 7 ? 5 : 4
  const die = level >= 18 ? 'd12' : level >= 10 ? 'd10' : 'd8'
  return `${count}${die}`
}

function channelDivinityUses(className: string, level: number) {
  if (className === 'Cleric') {
    if (level >= 18) return '3 uses'
    if (level >= 6) return '2 uses'
    return '1 use'
  }
  return '1 use'
}

function deriveClassResources(
  context: CharacterBuildContext,
  progression: CharacterProgressionSummary,
  charismaModifier: number
): DerivedClassResourceSummary[] {
  const resources: DerivedClassResourceSummary[] = []

  for (const cls of context.classes) {
    const featureNames = new Set(cls.progression.flatMap((row) => row.featureNames))
    const sourceLabel = cls.subclass?.name ? `${cls.name} (${cls.subclass.name})` : cls.name

    if (cls.name === 'Barbarian' && featureNames.has('Rage')) {
      resources.push({
        id: `${cls.classId}:rage`,
        label: 'Rage',
        value: rageUses(cls.level),
        detail: 'Bonus damage, resistance, and advantage while raging.',
        recharge: cls.level >= 20 ? null : 'Long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Bard' && featureNames.has('Bardic Inspiration')) {
      resources.push({
        id: `${cls.classId}:bardic_inspiration`,
        label: 'Bardic Inspiration',
        value: `${Math.max(1, charismaModifier)} ${bardicInspirationDie(cls.level)}`,
        detail: 'Uses equal Charisma modifier, minimum 1.',
        recharge: cls.level >= 5 ? 'Short or long rest' : 'Long rest',
        sourceLabel,
      })
    }

    if ((cls.name === 'Cleric' && cls.level >= 2) || (cls.name === 'Paladin' && cls.level >= 3)) {
      resources.push({
        id: `${cls.classId}:channel_divinity`,
        label: 'Channel Divinity',
        value: channelDivinityUses(cls.name, cls.level),
        detail: cls.name === 'Cleric'
          ? 'Fuel cleric domain and Turn Undead options.'
          : 'Fuel sacred oath Channel Divinity options.',
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Monk' && cls.level >= 2) {
      resources.push({
        id: `${cls.classId}:ki`,
        label: 'Ki',
        value: `${cls.level} point${cls.level === 1 ? '' : 's'}`,
        detail: 'Spend on monk techniques such as Flurry of Blows, Patient Defense, and Step of the Wind.',
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Sorcerer' && cls.level >= 2) {
      resources.push({
        id: `${cls.classId}:sorcery_points`,
        label: 'Sorcery Points',
        value: `${cls.level} point${cls.level === 1 ? '' : 's'}`,
        detail: 'Fuel Flexible Casting and Metamagic once unlocked.',
        recharge: 'Long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Fighter' && featureNames.has('Second Wind')) {
      resources.push({
        id: `${cls.classId}:second_wind`,
        label: 'Second Wind',
        value: '1 use',
        detail: `Regain 1d10 + ${cls.level} hit points.`,
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Fighter' && featureNames.has('Action Surge')) {
      resources.push({
        id: `${cls.classId}:action_surge`,
        label: 'Action Surge',
        value: cls.level >= 17 ? '2 uses' : '1 use',
        detail: 'Take one additional action on your turn.',
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }

    if (cls.subclass?.name === 'Battle Master' && featureNames.has('Combat Superiority')) {
      resources.push({
        id: `${cls.classId}:superiority_dice`,
        label: 'Superiority Dice',
        value: superiorityDice(cls.level),
        detail: 'Spend one die to fuel a Battle Master maneuver.',
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }
  }

  if (progression.spellSlots.length > 0) {
    resources.push({
      id: 'spell_slots:standard',
      label: 'Spell Slots',
      value: progression.spellSlots.join(' / '),
      detail: 'Standard multiclass spell slots by spell level.',
      recharge: 'Long rest',
      sourceLabel: 'Spellcasting',
    })
  }

  for (const pact of progression.pactSpellSlots) {
    resources.push({
      id: `spell_slots:pact:${pact.classId}`,
      label: 'Pact Magic Slots',
      value: pact.slots.join(' / ') || 'none',
      detail: 'Warlock pact slots by spell level.',
      recharge: 'Short or long rest',
      sourceLabel: pact.className,
    })
  }

  return resources
}

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

function formatAsiDetail(rows: CharacterBuildContext['selectedAsiChoices']) {
  const parts = rows
    .slice()
    .sort((left, right) => left.ability.localeCompare(right.ability))
    .map((row) => `+${row.bonus} ${ABILITY_LABELS[row.ability]}`)

  return parts.join(' / ')
}

function deriveAsiFeatHistory(context: CharacterBuildContext): DerivedAsiFeatHistoryEntry[] {
  const levelById = new Map(context.classLevelAnchors.map((level) => [level.id, level]))
  const asiGroups = new Map<string, CharacterBuildContext['selectedAsiChoices']>()

  for (const row of context.selectedAsiChoices) {
    const key = `${row.slotIndex}:${row.characterLevelId ?? 'unanchored'}`
    asiGroups.set(key, [...(asiGroups.get(key) ?? []), row])
  }

  const asiEntries: DerivedAsiFeatHistoryEntry[] = Array.from(asiGroups.entries()).map(([key, rows]) => {
    const first = rows[0]
    const level = first?.characterLevelId ? levelById.get(first.characterLevelId) ?? null : null
    return {
      id: `asi:${key}`,
      type: 'asi',
      label: 'Ability Score Improvement',
      detail: formatAsiDetail(rows),
      classId: level?.classId ?? null,
      className: level?.className ?? null,
      levelNumber: level?.levelNumber ?? null,
      takenAt: level?.takenAt ?? null,
      sourceFeatureKey: first?.sourceFeatureKey ?? null,
    }
  })

  const featEntries: DerivedAsiFeatHistoryEntry[] = context.selectedFeatChoices.map((row) => {
    const level = row.characterLevelId ? levelById.get(row.characterLevelId) ?? null : null
    return {
      id: `feat:${row.id}`,
      type: 'feat',
      label: row.featName,
      detail: row.choiceKind === 'feat_only' ? 'Feat-only slot' : 'Feat selected instead of ASI',
      classId: level?.classId ?? null,
      className: level?.className ?? null,
      levelNumber: level?.levelNumber ?? null,
      takenAt: level?.takenAt ?? null,
      sourceFeatureKey: row.sourceFeatureKey,
    }
  })

  return [...asiEntries, ...featEntries].sort((left, right) => {
    const leftTime = left.takenAt ?? ''
    const rightTime = right.takenAt ?? ''
    if (leftTime !== rightTime) return leftTime.localeCompare(rightTime)
    return (left.levelNumber ?? 0) - (right.levelNumber ?? 0)
  })
}

const FEATURE_OPTION_VALUE_KEY = 'feature_option_key'
const COMBAT_OPTION_GROUPS = new Set([
  'maneuver:battle_master:2014',
  'hunter:hunters_prey:2014',
  'hunter:defensive_tactics:2014',
  'hunter:multiattack:2014',
  'hunter:superior_defense:2014',
  'elemental_discipline:four_elements:2014',
])

const FOUR_ELEMENTS_KI_COSTS: Record<string, string> = {
  fangs_of_the_fire_snake: '1 ki, plus 1 ki for extra fire damage',
  fist_of_four_thunders: '2 ki',
  fist_of_unbroken_air: '2 ki',
  rush_of_the_gale_spirits: '2 ki',
  shape_the_flowing_river: '1 ki',
  shaping_of_the_ice: '1 ki',
  sweeping_cinder_strike: '2 ki',
  water_whip: '2 ki',
  clench_of_the_north_wind: '3 ki',
  gong_of_the_summit: '3 ki',
  flames_of_the_phoenix: '4 ki',
  mist_stance: '4 ki',
  ride_the_wind: '4 ki',
  breath_of_winter: '6 ki',
  eternal_mountain_defense: '5 ki',
  river_of_hungry_flame: '5 ki',
  wave_of_rolling_earth: '6 ki',
}

function combatTriggerForOption(groupKey: string, optionKey: string) {
  if (groupKey === 'maneuver:battle_master:2014') {
    if (['parry', 'riposte'].includes(optionKey)) return 'Reaction'
    if (optionKey === 'evasive_footwork') return 'When you move'
    if (optionKey === 'precision_attack') return 'When you make a weapon attack'
    return 'When you hit with a weapon attack'
  }
  if (groupKey.startsWith('hunter:')) {
    if (['giant_killer', 'uncanny_dodge', 'stand_against_the_tide'].includes(optionKey)) return 'Reaction'
    if (optionKey === 'escape_the_horde') return 'Opportunity attacks against you'
    return 'During combat'
  }
  if (groupKey === 'elemental_discipline:four_elements:2014') return 'Action'
  return null
}

function deriveCombatActions(
  context: CharacterBuildContext,
  proficiencyBonus: number,
  abilities: DerivedCharacterCore['abilities'],
  speciesTraits: DerivedSpeciesTraitSummary[]
): DerivedCombatActionSummary[] {
  const optionByGroupAndKey = new Map(
    context.featureOptions.map((option) => [`${option.group_key}:${option.key}`, option])
  )
  const fighter = context.classes.find((cls) => cls.subclass?.name === 'Battle Master')
  const monk = context.classes.find((cls) => cls.subclass?.name === 'Way of the Four Elements')
  const maneuverSaveDc = fighter
    ? 8 + proficiencyBonus + Math.max(abilities.str.modifier, abilities.dex.modifier)
    : null
  const disciplineSaveDc = monk
    ? 8 + proficiencyBonus + abilities.wis.modifier
    : null

  const optionActions = context.selectedFeatureOptions.flatMap((choice): DerivedCombatActionSummary[] => {
    if (!COMBAT_OPTION_GROUPS.has(choice.option_group_key)) return []
    const selectedKey = typeof choice.selected_value?.[FEATURE_OPTION_VALUE_KEY] === 'string'
      ? choice.selected_value[FEATURE_OPTION_VALUE_KEY]
      : null
    if (!selectedKey) return []

    const option = optionByGroupAndKey.get(`${choice.option_group_key}:${selectedKey}`)
    if (!option) return []

    if (choice.option_group_key === 'maneuver:battle_master:2014') {
      return [{
        id: `maneuver:${choice.option_key}:${selectedKey}`,
        name: option.name,
        category: 'maneuver',
        sourceLabel: 'Battle Master Maneuver',
        trigger: combatTriggerForOption(choice.option_group_key, selectedKey),
        effect: option.description,
        cost: '1 superiority die',
        saveDc: maneuverSaveDc,
      }]
    }

    if (choice.option_group_key === 'elemental_discipline:four_elements:2014') {
      return [{
        id: `discipline:${choice.option_key}:${selectedKey}`,
        name: option.name,
        category: 'discipline',
        sourceLabel: 'Elemental Discipline',
        trigger: combatTriggerForOption(choice.option_group_key, selectedKey),
        effect: option.description,
        cost: FOUR_ELEMENTS_KI_COSTS[selectedKey] ?? 'Ki cost varies',
        saveDc: disciplineSaveDc,
      }]
    }

    return [{
      id: `hunter:${choice.option_key}:${selectedKey}`,
      name: option.name,
      category: 'hunter',
      sourceLabel: 'Hunter Option',
      trigger: combatTriggerForOption(choice.option_group_key, selectedKey),
      effect: option.description,
      cost: null,
      saveDc: null,
    }]
  })

  const traitActions = speciesTraits.flatMap((trait): DerivedCombatActionSummary[] => {
    const normalized = trait.name.toLowerCase()
    if (normalized === 'fury of the small') {
      return [{
        id: `trait:${trait.id}`,
        name: trait.name,
        category: 'trait',
        sourceLabel: 'Species Trait',
        trigger: 'When you damage a larger creature',
        effect: trait.description,
        cost: 'Once per short or long rest',
        saveDc: null,
      }]
    }
    if (normalized === 'silver lining') {
      return [{
        id: `trait:${trait.id}`,
        name: trait.name,
        category: 'trait',
        sourceLabel: 'Species Trait',
        trigger: 'When luck or timing turns against you',
        effect: trait.description,
        cost: null,
        saveDc: null,
      }]
    }
    if (normalized === 'vigilant guardian') {
      return [{
        id: `trait:${trait.id}`,
        name: trait.name,
        category: 'trait',
        sourceLabel: 'Species Trait',
        trigger: 'When a nearby ally is hit',
        effect: trait.description,
        cost: 'Reaction',
        saveDc: null,
      }]
    }
    return []
  })

  return [...optionActions, ...traitActions]
}

function getDragonbornBreathWeaponDice(totalLevel: number) {
  if (totalLevel >= 16) return '5d6'
  if (totalLevel >= 11) return '4d6'
  if (totalLevel >= 6) return '3d6'
  return '2d6'
}

function getDynamicSpeciesTraits(args: {
  context: CharacterBuildContext
  totalLevel: number
  proficiencyBonus: number
  constitutionModifier: number
}): DerivedSpeciesTraitSummary[] {
  const { context, totalLevel, proficiencyBonus, constitutionModifier } = args

  if (context.speciesSource === 'PHB' && context.speciesName === 'Dragonborn') {
    const ancestry = getSelectedDragonbornAncestry(context.selectedFeatureOptions)
    if (!ancestry) return []

    const lineBreathKeys = new Set(['black', 'blue', 'brass', 'bronze', 'copper'])
    const isLineBreath = lineBreathKeys.has(ancestry.key)
    const breathShape = isLineBreath ? '5 by 30 ft. line' : '15 ft. cone'
    const saveAbility = isLineBreath ? 'DEX' : 'CON'
    const saveDc = 8 + proficiencyBonus + constitutionModifier
    const damageDice = getDragonbornBreathWeaponDice(totalLevel)

    return [
      {
        id: 'species:dragonborn:ancestry',
        name: 'Draconic Ancestry',
        description: `${ancestry.label} dragonborn. Your breath weapon deals ${ancestry.damageType} damage, and you have resistance to ${ancestry.damageType}.`,
        source: 'PHB',
      },
      {
        id: 'species:dragonborn:breath_weapon',
        name: 'Breath Weapon',
        description: `As an action, exhale destructive energy in a ${breathShape}. Creatures in the area make a ${saveAbility} save (DC ${saveDc}), taking ${damageDice} ${ancestry.damageType} damage on a failed save, or half as much on a success. You can use this trait once per short or long rest.`,
        source: 'PHB',
      },
      {
        id: 'species:dragonborn:damage_resistance',
        name: 'Damage Resistance',
        description: `You have resistance to ${ancestry.damageType} damage from your ${ancestry.label.toLowerCase()} draconic ancestry.`,
        source: 'PHB',
      },
    ]
  }

  if (context.speciesSource === 'PHB' && context.speciesName === 'High Elf') {
    const selectedCantrip = context.selectedSpells.find(
      (spell) => spell.sourceFeatureKey === HIGH_ELF_CANTRIP_SOURCE_KEY
    )

    return [{
      id: 'species:high_elf:cantrip',
      name: 'Cantrip',
      description: selectedCantrip
        ? `You know the wizard cantrip ${selectedCantrip.name}. Intelligence is your spellcasting ability for it.`
        : 'Choose one wizard cantrip. Intelligence is your spellcasting ability for it.',
      source: 'PHB',
    }]
  }

  if (context.speciesSource === 'PHB' && context.speciesName === 'Dark Elf (Drow)') {
    const unlockedSpells = ['Dancing Lights cantrip']
    if (totalLevel >= 3) unlockedSpells.push('Faerie Fire once per long rest')
    if (totalLevel >= 5) unlockedSpells.push('Darkness once per long rest')

    return [{
      id: 'species:drow:magic',
      name: 'Drow Magic',
      description: `You know ${unlockedSpells.join(', ')}. Charisma is your spellcasting ability for these spells.`,
      source: 'PHB',
    }]
  }

  if (context.speciesSource === 'PHB' && context.speciesName === 'Tiefling') {
    const unlockedSpells = ['Thaumaturgy cantrip']
    if (totalLevel >= 3) unlockedSpells.push('Hellish Rebuke once per long rest')
    if (totalLevel >= 5) unlockedSpells.push('Darkness once per long rest')

    return [{
      id: 'species:tiefling:infernal_legacy',
      name: 'Infernal Legacy',
      description: `You know ${unlockedSpells.join(', ')}. Charisma is your spellcasting ability for these spells.`,
      source: 'PHB',
    }]
  }

  return []
}

export function deriveCharacterProgression(context: CharacterBuildContext): CharacterProgressionSummary {
  const totalLevel = context.classes.reduce((sum, cls) => sum + cls.level, 0)
  const classFeatSlots = context.classes.flatMap((cls) =>
    cls.progression
      .filter((row) => row.asiAvailable)
      .map((row) => createAsiFeatSlotDefinition(`${cls.name} ${row.level}`))
  )
  const speciesFeatSlots = getSpeciesFeatSlotDefinitions(
    context.speciesName && context.speciesSource
      ? { name: context.speciesName, source: context.speciesSource }
      : null
  )
  const featSlots = [...speciesFeatSlots, ...classFeatSlots]
  const totalAsiSlots = featSlots.length
  const featSlotLabels = featSlots.map((slot) => slot.label)
  const multiclassCasterLevel = context.classes.reduce(
    (sum, cls) => sum + spellcastingContribution(cls.spellcastingType, cls.level),
    0
  )

  const nonPactClasses = context.classes.filter(
    (cls) => cls.spellcastingType && cls.spellcastingType !== 'none' && cls.spellcastingType !== 'pact'
  )
  const pactClasses = context.classes.filter((cls) => cls.spellcastingType === 'pact')

  let spellSlots: number[] = []
  if (nonPactClasses.length === 1 && context.classes.length === 1) {
    spellSlots = nonPactClasses[0].spellSlots
  } else if (multiclassCasterLevel > 0) {
    // Pact Magic stays on its own track in 2014, so only non-pact casters feed the shared multiclass slot table.
    spellSlots = context.multiclassSpellSlotsByCasterLevel[multiclassCasterLevel] ?? []
  }

  const pactSpellSlots = pactClasses.map((cls) => ({
    classId: cls.classId,
    className: cls.name,
    slots: cls.spellSlots,
  }))

  const spellLevelCaps = Object.fromEntries(
    spellSlots
      .map((slots, index) => [index + 1, slots] as const)
      .filter(([, slots]) => slots > 0)
  )
  const leveledSpellSelectionCap = spellSlots.reduce((sum, slots) => sum + slots, 0)

  const unlockedFeatures = Array.from(
    new Set(
      context.classes.flatMap((cls) =>
        cls.progression.flatMap((row) => row.featureNames)
      )
    )
  )

  const subclassRequirements = context.classes.map((cls) => {
    const subclassRequired = cls.level >= cls.subclassChoiceLevel
    return {
      classId: cls.classId,
      className: cls.name,
      currentLevel: cls.level,
      requiredAt: cls.subclassChoiceLevel,
      subclassId: cls.subclass?.id ?? null,
      subclassName: cls.subclass?.name ?? null,
      subclassRequired,
      missingRequiredSubclass: subclassRequired && !cls.subclass,
      selectedTooEarly: !!cls.subclass && cls.level < cls.subclassChoiceLevel,
    }
  })

  const maxSpellLevel = Math.max(
    maxUnlockedSpellLevel(spellSlots),
    ...pactSpellSlots.map((entry) => maxUnlockedSpellLevel(entry.slots)),
    0
  )

  const adjustedScores = getAdjustedAbilityScores(context)
  const primarySpellcastingClass = context.classes.find(
    (cls) => cls.spellcastingType && cls.spellcastingType !== 'none' && cls.spellcastingProgression?.mode && cls.spellcastingProgression.mode !== 'none'
  ) ?? null
  // Batch 1 intentionally exposes a single primary selection model here.
  // Multiclass builds with multiple distinct preparation/known systems will need a richer per-source summary later.
  const spellcastingProfile = primarySpellcastingClass?.spellcastingProgression ?? null
  const maverickCantripBonus = primarySpellcastingClass?.subclass && isMaverickSubclass(primarySpellcastingClass.subclass)
    ? getMaverickCantripBonus(primarySpellcastingClass.level)
    : 0
  const cantripSelectionCapBase = spellcastingProfile?.cantrips_known_by_level?.[Math.max((primarySpellcastingClass?.level ?? 1) - 1, 0)] ?? null
  const cantripSelectionCap = cantripSelectionCapBase === null ? null : cantripSelectionCapBase + maverickCantripBonus

  let leveledCapFromProgression = 0
  let spellSelectionMode: CharacterProgressionSummary['spellSelectionMode'] = 'none'
  let spellSelectionSummary: string | null = null

  if (primarySpellcastingClass && spellcastingProfile) {
    spellSelectionMode = spellcastingProfile.mode
    const ability = spellcastingProfile.spellcasting_ability
    const abilityMod = ability ? abilityModifier(adjustedScores[ability]) : 0
    const preparedSpellCap = spellcastingProfile.mode === 'prepared' || spellcastingProfile.mode === 'spellbook'
      ? resolvePreparedSpellCap({
          profile: spellcastingProfile,
          classLevel: primarySpellcastingClass.level,
          abilityModifier: abilityMod,
        })
      : null
    leveledCapFromProgression = resolveLeveledSpellSelectionCap({
      profile: spellcastingProfile,
      classLevel: primarySpellcastingClass.level,
      abilityModifier: abilityMod,
    })
    spellSelectionSummary = buildSpellSelectionSummary({
      className: primarySpellcastingClass.name,
      classLevel: primarySpellcastingClass.level,
      mode: spellcastingProfile.mode,
      leveledSelectionCap: leveledCapFromProgression,
      preparedSpellCap,
    })
    if (primarySpellcastingClass.subclass && isMaverickSubclass(primarySpellcastingClass.subclass)) {
      const extraLevels = getMaverickPreparedBreakthroughLevels(primarySpellcastingClass.level)
      if (extraLevels.length > 0) {
        spellSelectionSummary = `${spellSelectionSummary} Maverick also prepares one Breakthrough spell each of levels ${extraLevels.join(', ')} without counting against the normal prepared total.`
      }
    }
  }

  return {
    totalLevel,
    classCount: context.classes.length,
    totalAsiSlots,
    featSlots,
    featSlotLabels,
    multiclassCasterLevel,
    spellSlots,
    spellLevelCaps,
    leveledSpellSelectionCap: leveledCapFromProgression > 0 ? leveledCapFromProgression : leveledSpellSelectionCap,
    cantripSelectionCap,
    spellSelectionMode,
    spellSelectionClassName: primarySpellcastingClass?.name ?? null,
    spellSelectionSummary,
    pactSpellSlots,
    maxSpellLevel,
    unlockedFeatures,
    subclassRequirements,
    choiceCaps: {
      featSlots: featSlots.length,
      backgroundSkillChoices: context.background?.skillChoiceCount ?? 0,
      classSkillChoices: context.classes[0]?.skillChoices.count ?? 0,
    },
  }
}

export function getAdjustedAbilityScores(
  context: CharacterBuildContext
): Record<AbilityKey, number> {
  const contributors = buildAbilityScoreContributors(context)
  const abilities = deriveAbilityScores(context.baseStats, sumAbilityContributors(contributors), contributors)

  return {
    str: abilities.str.adjusted,
    dex: abilities.dex.adjusted,
    con: abilities.con.adjusted,
    int: abilities.int.adjusted,
    wis: abilities.wis.adjusted,
    cha: abilities.cha.adjusted,
  }
}

export function toCharacterAggregate(context: CharacterBuildContext): CharacterAggregate {
  const abilityContributors = buildAbilityScoreContributors(context)

  return {
    baseStats: context.baseStats,
    speciesAbilityBonuses: sumAbilityContributors(abilityContributors),
    abilityContributors,
    persistedHpMax: context.persistedHpMax,
    savingThrowProficiencies: context.classes.flatMap((cls) => cls.savingThrowProficiencies),
    selectedFeatureOptions: context.selectedFeatureOptions.map((choice) => ({
      option_group_key: choice.option_group_key,
      selected_value: choice.selected_value,
    })),
    selectedSpellNames: context.selectedSpells.map((spell) => spell.name),
    equippedItems: context.equipmentItems,
    armorCatalog: context.armorCatalog,
    shieldCatalog: context.shieldCatalog,
    species: {
      name: context.speciesName,
      source: context.speciesSource,
      speed: context.speciesSpeed,
      size: context.speciesSize,
      languages: context.speciesLanguages,
      senses: context.speciesSenses,
      damageResistances: context.speciesDamageResistances,
      conditionImmunities: context.speciesConditionImmunities,
    },
    classes: context.classes.map((cls) => ({
      classId: cls.classId,
      className: cls.name,
      subclassName: cls.subclass?.name ?? null,
      level: cls.level,
      hitDie: cls.hitDie,
      hpRoll: cls.hpRoll,
      savingThrowProficiencies: cls.savingThrowProficiencies,
    })),
  }
}

export function deriveCharacter(context: CharacterBuildContext): DerivedCharacter {
  const core = deriveCharacterCore(toCharacterAggregate(context))
  const progression = deriveCharacterProgression(context)
  const adjustedScores = getAdjustedAbilityScores(context)
  const proficiencyBonus = core.proficiencyBonus

  const selectedSkillProficiencies = new Set<string>(context.skillProficiencies.map(normalizeSkillKey))
  const selectedSkillExpertise = new Set<string>(context.skillExpertise.map(normalizeSkillKey))
  const backgroundSkillProficiencies = new Set<string>((context.background?.skillProficiencies ?? []).map(normalizeSkillKey))
  const savingThrowProficiencies = new Set<string>(
    context.classes.flatMap((cls) => cls.savingThrowProficiencies.map((save) => save.toLowerCase()))
  )
  const armorProficiencies = new Set<string>(
    context.classes.flatMap((cls) => cls.armorProficiencies.map((item) => item.toLowerCase()))
  )
  const weaponProficiencies = new Set<string>(
    context.classes.flatMap((cls) => cls.weaponProficiencies.map((item) => item.toLowerCase()))
  )
  const toolProficiencies = new Set<string>(
    context.classes.flatMap((cls) => cls.toolProficiencies.map((item) => item.toLowerCase()))
  )

  for (const item of context.background?.toolProficiencies ?? []) {
    toolProficiencies.add(item.toLowerCase())
  }
  for (const item of context.selectedTools) {
    toolProficiencies.add(item.toLowerCase())
  }

  const skills = deriveSheetSkills({
    abilities: core.abilities,
    proficiencyBonus,
    proficientSkills: Array.from(new Set([
      ...Array.from(backgroundSkillProficiencies),
      ...Array.from(selectedSkillProficiencies),
    ])),
    expertiseSkills: Array.from(selectedSkillExpertise),
  })

  const savingThrows: DerivedSavingThrowSummary[] = deriveSheetSavingThrows({
    abilities: core.abilities,
    proficiencyBonus,
    proficientAbilities: Array.from(savingThrowProficiencies),
    proficiencySources: buildSavingThrowSourceMap(
      context.classes.map((cls) => ({
        className: cls.name,
        savingThrowProficiencies: cls.savingThrowProficiencies,
      }))
    ),
  })

  const proficiencies: DerivedProficiencySummary = {
    skills: Array.from(new Set(skills.filter((skill) => skill.proficient).map((skill) => skill.key))),
    savingThrows: Array.from(savingThrowProficiencies),
    armor: Array.from(armorProficiencies),
    weapons: Array.from(weaponProficiencies),
    tools: Array.from(toolProficiencies),
    all: Array.from(
      new Set([
        ...skills.filter((skill) => skill.proficient).map((skill) => skill.key),
        ...Array.from(savingThrowProficiencies),
        ...Array.from(armorProficiencies),
        ...Array.from(weaponProficiencies),
        ...Array.from(toolProficiencies),
      ])
    ),
  }

  const passivePerception = deriveSheetPassivePerception({
    skills,
    wisdomModifier: core.abilities.wis.modifier,
  })
  const conModifier = abilityModifier(adjustedScores.con)
  const classNames = context.classes.map((cls) => cls.name)
  const subclassStates: DerivedSubclassState[] = context.classes.map((cls) => {
    const available = cls.level >= cls.subclassChoiceLevel
    let status: DerivedSubclassState['status'] = 'not_yet_available'

    if (cls.subclass && cls.level < cls.subclassChoiceLevel) {
      status = 'selected_too_early'
    } else if (cls.subclass) {
      status = 'selected'
    } else if (available) {
      status = 'available_unselected'
    }

    return {
      classId: cls.classId,
      className: cls.name,
      currentLevel: cls.level,
      requiredAt: cls.subclassChoiceLevel,
      subclassId: cls.subclass?.id ?? null,
      subclassName: cls.subclass?.name ?? null,
      status,
    }
  })

  const features: DerivedFeatureSummary[] = context.classes.flatMap((cls) =>
    cls.progression.flatMap((row) =>
      (row.features && row.features.length > 0
        ? row.features
        : row.featureNames.map((name): BuildFeatureUnlockSummary => ({
            name,
            description: null,
            sourceType: 'class',
            sourceLabel: cls.name,
            source: cls.source,
            amended: false,
            amendmentNote: null,
          }))
      ).map((feature) => ({
        classId: cls.classId,
        className: cls.name,
        level: row.level,
        name: feature.name,
        subclassName: cls.subclass?.name ?? null,
        sourceType: feature.sourceType,
        sourceLabel: feature.sourceLabel,
        description: feature.description,
        source: feature.source,
        amended: feature.amended,
        amendmentNote: feature.amendmentNote,
      }))
    )
  )
  const classResources = deriveClassResources(context, progression, core.abilities.cha.modifier)
  const asiFeatHistory = deriveAsiFeatHistory(context)

  const armorClass = deriveArmorClass({
    abilities: core.abilities,
    classNames,
    subclassNames: context.classes
      .map((cls) => cls.subclass?.name ?? null)
      .filter((name): name is string => Boolean(name)),
    speciesName: context.speciesName,
    speciesSource: context.speciesSource,
    selectedFeatureOptions: context.selectedFeatureOptions,
    selectedSpellNames: context.selectedSpells.map((spell) => spell.name),
    equippedItems: context.equipmentItems,
    armorCatalog: context.armorCatalog,
    shieldCatalog: context.shieldCatalog,
  })

  const dynamicSpeciesTraits = getDynamicSpeciesTraits({
    context,
    totalLevel: progression.totalLevel,
    proficiencyBonus,
    constitutionModifier: conModifier,
  })
  const replacedStaticTraitNames = new Set(
    dynamicSpeciesTraits.flatMap((trait) => {
      switch (trait.name) {
        case 'Draconic Ancestry':
          return ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance']
        case 'Cantrip':
          return ['Cantrip']
        case 'Drow Magic':
          return ['Drow Magic']
        case 'Infernal Legacy':
          return ['Infernal Legacy']
        default:
          return [trait.name]
      }
    })
  )
  const speciesTraits = [
    ...context.speciesTraits.filter((trait) => !replacedStaticTraitNames.has(trait.name)),
    ...dynamicSpeciesTraits,
  ]
  const combatActions = deriveCombatActions(context, proficiencyBonus, core.abilities, speciesTraits)

  const spellSourceMode = (spell: BuildSpellSummary): CharacterProgressionSummary['spellSelectionMode'] => {
    const owningClass = context.classes.find((cls) =>
      spell.classes.includes(cls.classId) ||
      spell.grantedBySubclassIds.includes(cls.subclass?.id ?? '')
    )
    return owningClass?.spellcastingProgression?.mode ?? progression.spellSelectionMode
  }
  const firstSpellcastingClassId = context.classes.find(
    (cls) => cls.spellcastingType && cls.spellcastingType !== 'none' && cls.spellcastingProgression?.mode && cls.spellcastingProgression.mode !== 'none'
  )?.classId ?? null
  const activeClassIds = new Set(context.classes.map((cls) => cls.classId))

  const selectedSpellEntries = context.selectedSpells
    .filter((spell) =>
      spell.level === 0 ||
      spell.level <= progression.maxSpellLevel ||
      context.grantedSpellIds.includes(spell.id) ||
      context.freePreparedSpellIds.includes(spell.id)
    )
    .map((spell) => {
      const granted = context.grantedSpellIds.includes(spell.id) || context.freePreparedSpellIds.includes(spell.id)
      const category = spellDisplayCategory(spell, spellSourceMode(spell), granted)
      return {
        id: spell.id,
        name: spell.name,
        level: spell.level,
        source: spell.source,
        granted,
        countsAgainstSelectionLimit: spell.countsAgainstSelectionLimit,
        sourceFeatureKey: spell.sourceFeatureKey,
        category,
        grantLabel: granted ? spellGrantLabel(spell.sourceFeatureKey) : null,
      }
    })

  const selectedSpellCountsByLevel = Object.fromEntries(
    Array.from({ length: 10 }, (_, level) => [
      level,
      selectedSpellEntries.filter((spell) => spell.level === level && spell.countsAgainstSelectionLimit).length,
    ])
      .filter(([, count]) => count > 0)
  )

  const spellcastingSources: DerivedSpellcastingSourceSummary[] = context.classes.flatMap((cls) => {
    const profile = cls.spellcastingProgression
    if (!cls.spellcastingType || cls.spellcastingType === 'none' || !profile || !profile.mode || profile.mode === 'none') {
      return []
    }

    const cantripCapBase = profile.cantrips_known_by_level?.[Math.max(cls.level - 1, 0)] ?? null
    const cantripCap = cantripCapBase === null
      ? null
      : cantripCapBase + (cls.subclass && isMaverickSubclass(cls.subclass) ? getMaverickCantripBonus(cls.level) : 0)
    const ability = profile.spellcasting_ability
    const abilityMod = ability ? abilityModifier(adjustedScores[ability]) : 0
    const preparedSpellCap = profile.mode === 'prepared' || profile.mode === 'spellbook'
      ? resolvePreparedSpellCap({
          profile,
          classLevel: cls.level,
          abilityModifier: abilityMod,
        })
      : null
    const leveledCap = resolveLeveledSpellSelectionCap({
      profile,
      classLevel: cls.level,
      abilityModifier: abilityMod,
    })

    const sourceSelectedSpells = selectedSpellEntries
      .filter((spell) =>
        context.selectedSpells.some((selected) =>
        selected.id === spell.id && (
          selected.classes.includes(cls.classId) ||
          selected.grantedBySubclassIds.includes(cls.subclass?.id ?? '') ||
          (
            (context.grantedSpellIds.includes(selected.id) || context.freePreparedSpellIds.includes(selected.id)) &&
            !selected.classes.some((classId) => activeClassIds.has(classId)) &&
            selected.grantedBySubclassIds.length === 0 &&
            cls.classId === firstSpellcastingClassId
          )
        )
      )
      )
      .map((spell) => {
        const granted = spell.granted
        const category = spellDisplayCategory(spell, profile.mode, granted)
        return {
          ...spell,
          category,
          grantLabel: granted ? spell.grantLabel : null,
        }
      })

    const sourceSelectedSpellCountsByLevel = Object.fromEntries(
      Array.from({ length: 10 }, (_, level) => [
        level,
        sourceSelectedSpells.filter((spell) => spell.level === level && spell.countsAgainstSelectionLimit).length,
      ]).filter(([, count]) => count > 0)
    )

    let selectionSummary = buildSpellSelectionSummary({
      className: cls.name,
      classLevel: cls.level,
      mode: profile.mode,
      leveledSelectionCap: leveledCap,
      preparedSpellCap,
    })
    if (cls.subclass && isMaverickSubclass(cls.subclass)) {
      const extraLevels = getMaverickPreparedBreakthroughLevels(cls.level)
      if (extraLevels.length > 0) {
        selectionSummary = `${selectionSummary} Maverick also prepares one Breakthrough spell each of levels ${extraLevels.join(', ')} for free.`
      }
    }

    return [{
      classId: cls.classId,
      className: cls.name,
      classLevel: cls.level,
      spellcastingType: cls.spellcastingType,
      mode: profile.mode,
      spellcastingAbility: ability ?? null,
      spellcastingAbilityModifier: ability ? abilityMod : null,
      spellSaveDc: ability ? 8 + core.proficiencyBonus + abilityMod : null,
      spellAttackModifier: ability ? core.proficiencyBonus + abilityMod : null,
      cantripSelectionCap: cantripCap,
      leveledSpellSelectionCap: leveledCap,
      selectionSummary,
      selectedSpellCountsByLevel: sourceSelectedSpellCountsByLevel,
      selectedSpells: sourceSelectedSpells,
      knownSpells: sourceSelectedSpells.filter((spell) => spell.category === 'known'),
      preparedSpells: sourceSelectedSpells.filter((spell) => spell.category === 'prepared'),
      spellbookSpells: sourceSelectedSpells.filter((spell) => spell.category === 'spellbook'),
      grantedSpells: sourceSelectedSpells.filter((spell) => spell.category === 'granted'),
    }]
  })

  return {
    ...core,
    ...progression,
    savingThrows,
    skills,
    proficiencies,
    initiative: core.initiative,
    passivePerception,
    speed: context.speciesSpeed,
    size: context.speciesSize,
    languages: Array.from(new Set([
      ...context.speciesLanguages,
      ...(context.background?.fixedLanguages ?? []),
      ...context.selectedLanguages,
    ])),
    speciesTraits,
    senses: context.speciesSenses,
    damageResistances: Array.from(new Set([
      ...context.speciesDamageResistances,
      ...getSpeciesDerivedDamageResistances({
        speciesName: context.speciesName,
        speciesSource: context.speciesSource,
        selectedOptions: context.selectedFeatureOptions,
      }),
    ])),
    conditionImmunities: context.speciesConditionImmunities,
    armorClass,
    subclassStates,
    features,
    classResources,
    asiFeatHistory,
    combatActions,
    spellcasting: {
      className: context.classes.find(
        (cls) => cls.spellcastingType && cls.spellcastingType !== 'none' && cls.spellcastingProgression?.mode && cls.spellcastingProgression.mode !== 'none'
      )?.name ?? null,
      mode: progression.spellSelectionMode,
      maxSpellLevel: progression.maxSpellLevel,
      spellSlots: progression.spellSlots,
      pactSpellSlots: progression.pactSpellSlots,
      cantripSelectionCap: progression.cantripSelectionCap,
      leveledSpellSelectionCap: progression.leveledSpellSelectionCap,
      selectionSummary: progression.spellSelectionSummary,
      selectedSpells: selectedSpellEntries,
      selectedSpellCountsByLevel,
      freePreparedSpellIds: context.freePreparedSpellIds,
      grantedSpellIds: context.grantedSpellIds,
      sources: spellcastingSources,
      grantedSpells: selectedSpellEntries.filter((spell) => spell.category === 'granted'),
    },
    blockingIssues: [],
    warnings: [],
  }
}

export function collectKnownProficiencies(context: CharacterBuildContext): Set<string> {
  return new Set(deriveCharacter(context).proficiencies.all)
}

export function createBuildBackgroundSummary(background: Background | null): BuildBackgroundSummary | null {
  if (!background) return null
  return {
    id: background.id,
    name: background.name,
    source: background.source,
    skillProficiencies: background.skill_proficiencies.map(normalizeSkillKey),
    skillChoiceCount: background.skill_choice_count,
    skillChoiceFrom: background.skill_choice_from.map(normalizeSkillKey),
    toolProficiencies: background.tool_proficiencies,
    fixedLanguages: getFixedBackgroundLanguages(background),
    backgroundFeatId: background.background_feat_id,
  }
}

export function createBuildSpeciesTraitSummaries(traits: SpeciesTrait[]): BuildSpeciesTraitSummary[] {
  return traits.map((trait) => ({
    id: trait.id,
    name: trait.name,
    description: trait.description,
    source: trait.source,
  }))
}

function buildAbilityScoreContributors(
  context: Pick<CharacterBuildContext, 'speciesName' | 'speciesAbilityBonuses' | 'selectedAbilityBonuses' | 'selectedAsiBonuses' | 'asiChoiceSlots'>
): DerivedAbilityScoreContributor[] {
  const speciesLabel = context.speciesName ? `${context.speciesName} ability bonus` : 'Species ability bonus'
  const contributors = [
    ...abilityBonusMapToContributors(context.speciesAbilityBonuses, speciesLabel, 'species'),
    ...abilityBonusMapToContributors(
      context.selectedAbilityBonuses,
      context.speciesName ? `${context.speciesName} flexible bonus` : 'Species flexible bonus',
      'species_choice'
    ),
  ]

  const asiContributors = context.asiChoiceSlots.flatMap((slot) =>
    abilityBonusMapToContributors(
      slot.bonuses,
      `ASI ${slot.slotIndex + 1}`,
      'asi'
    ).map((contributor) => ({
      ...contributor,
      sourceFeatureKey: `asi_slot:${slot.slotIndex}`,
    }))
  )

  if (asiContributors.length > 0) {
    return [...contributors, ...asiContributors]
  }

  return [
    ...contributors,
    ...abilityBonusMapToContributors(context.selectedAsiBonuses, 'Ability Score Improvement', 'asi'),
  ]
}

export { normalizeToolProficiencies }
