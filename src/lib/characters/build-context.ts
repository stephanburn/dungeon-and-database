import type {
  Background,
  CampaignSettings,
  ClassFeatureProgression,
  FeatPrerequisite,
  RuleSet,
  SkillChoices,
  SpellcastingProgression,
  SpellcastingType,
  StatMethod,
} from '@/lib/types/database'
import { normalizeSkillKey } from '@/lib/skills'

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface BuildProgressionRow {
  level: number
  asiAvailable: boolean
  proficiencyBonus: number
  featureNames: string[]
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
  backgroundFeatId: string | null
}

export interface BuildSpellSummary {
  id: string
  name: string
  level: number
  classes: string[]
  source: string
  grantedBySubclassIds: string[]
  countsAgainstSelectionLimit: boolean
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
  baseStats: Record<AbilityKey, number>
  statRolls: Array<{
    assigned_to: string
    roll_set: number[]
  }>
  skillProficiencies: string[]
  speciesSource: string | null
  speciesAbilityBonuses: Partial<Record<AbilityKey, number>>
  background: BuildBackgroundSummary | null
  backgroundFeat: BuildFeatSummary | null
  classes: BuildClassSummary[]
  selectedSpells: BuildSpellSummary[]
  selectedFeats: BuildFeatSummary[]
  sourceCollections: {
    classSources: string[]
    subclassSources: string[]
    spellSources: string[]
    featSources: string[]
  }
  grantedSpellIds: string[]
  freePreparedSpellIds: string[]
  multiclassSpellSlotsByCasterLevel: Record<number, number[]>
}

export interface CharacterProgressionSummary {
  totalLevel: number
  classCount: number
  totalAsiSlots: number
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

export function progressionRowToSummary(
  row: ClassFeatureProgression,
  featureNames: string[]
): BuildProgressionRow {
  return {
    level: row.level,
    asiAvailable: row.asi_available,
    proficiencyBonus: row.proficiency_bonus,
    featureNames,
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
      return Math.floor(level / 2)
    case 'third':
      return Math.floor(level / 3)
    default:
      return 0
  }
}

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

function resolvePreparedBase(formula: SpellcastingProgression['prepared_formula'], classLevel: number, fixed = 0): number {
  switch (formula) {
    case 'class_level':
      return classLevel
    case 'half_level_down':
      return Math.floor(classLevel / 2)
    case 'half_level_up':
      return Math.ceil(classLevel / 2)
    case 'third_level_down':
      return Math.floor(classLevel / 3)
    case 'third_level_up':
      return Math.ceil(classLevel / 3)
    case 'fixed':
      return fixed
    default:
      return classLevel
  }
}

function maxUnlockedSpellLevel(slots: number[]): number {
  for (let index = slots.length - 1; index >= 0; index -= 1) {
    if ((slots[index] ?? 0) > 0) return index + 1
  }
  return 0
}

export function deriveCharacterProgression(context: CharacterBuildContext): CharacterProgressionSummary {
  const totalLevel = context.classes.reduce((sum, cls) => sum + cls.level, 0)
  const totalAsiSlots = context.classes.reduce(
    (sum, cls) => sum + cls.progression.filter((row) => row.asiAvailable).length,
    0
  )
  const featSlotLabels = context.classes.flatMap((cls) =>
    cls.progression
      .filter((row) => row.asiAvailable)
      .map((row) => `${cls.name} ${row.level}`)
  )
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
  const spellcastingProfile = primarySpellcastingClass?.spellcastingProgression ?? null
  const cantripSelectionCap = spellcastingProfile?.cantrips_known_by_level?.[Math.max((primarySpellcastingClass?.level ?? 1) - 1, 0)] ?? null

  let leveledCapFromProgression = 0
  let spellSelectionMode: CharacterProgressionSummary['spellSelectionMode'] = 'none'
  let spellSelectionSummary: string | null = null

  if (primarySpellcastingClass && spellcastingProfile) {
    spellSelectionMode = spellcastingProfile.mode
    if (spellcastingProfile.mode === 'known') {
      leveledCapFromProgression = spellcastingProfile.spells_known_by_level?.[primarySpellcastingClass.level - 1] ?? 0
      spellSelectionSummary = `${primarySpellcastingClass.name} knows ${leveledCapFromProgression} leveled spells at level ${primarySpellcastingClass.level}.`
    } else if (spellcastingProfile.mode === 'prepared' || spellcastingProfile.mode === 'spellbook') {
      const ability = spellcastingProfile.spellcasting_ability
      const abilityMod = ability ? abilityModifier(adjustedScores[ability]) : 0
      const preparedBase = resolvePreparedBase(
        spellcastingProfile.prepared_formula,
        primarySpellcastingClass.level,
        spellcastingProfile.prepared_fixed ?? 0
      )
      const totalPrepared = preparedBase + (spellcastingProfile.prepared_add_ability_mod ? abilityMod : 0)
      leveledCapFromProgression = Math.max(spellcastingProfile.prepared_min ?? 0, totalPrepared)
      spellSelectionSummary =
        spellcastingProfile.mode === 'spellbook'
          ? `${primarySpellcastingClass.name} can prepare ${leveledCapFromProgression} spells from its spellbook.`
          : `${primarySpellcastingClass.name} can prepare ${leveledCapFromProgression} spells.`
    }
  }

  return {
    totalLevel,
    classCount: context.classes.length,
    totalAsiSlots,
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
      featSlots: totalAsiSlots,
      backgroundSkillChoices: context.background?.skillChoiceCount ?? 0,
      classSkillChoices: context.classes[0]?.skillChoices.count ?? 0,
    },
  }
}

export function getAdjustedAbilityScores(
  context: CharacterBuildContext
): Record<AbilityKey, number> {
  return {
    str: context.baseStats.str + (context.speciesAbilityBonuses.str ?? 0),
    dex: context.baseStats.dex + (context.speciesAbilityBonuses.dex ?? 0),
    con: context.baseStats.con + (context.speciesAbilityBonuses.con ?? 0),
    int: context.baseStats.int + (context.speciesAbilityBonuses.int ?? 0),
    wis: context.baseStats.wis + (context.speciesAbilityBonuses.wis ?? 0),
    cha: context.baseStats.cha + (context.speciesAbilityBonuses.cha ?? 0),
  }
}

export function collectKnownProficiencies(context: CharacterBuildContext): Set<string> {
  const proficiencies = new Set<string>()
  const background = context.background

  for (const skill of context.skillProficiencies) {
    proficiencies.add(normalizeSkillKey(skill))
  }
  for (const cls of context.classes) {
    for (const save of cls.savingThrowProficiencies) proficiencies.add(save.toLowerCase())
    for (const item of cls.armorProficiencies) proficiencies.add(item.toLowerCase())
    for (const item of cls.weaponProficiencies) proficiencies.add(item.toLowerCase())
    for (const item of cls.toolProficiencies) proficiencies.add(item.toLowerCase())
  }
  if (background) {
    for (const skill of background.skillProficiencies) {
      proficiencies.add(normalizeSkillKey(skill))
    }
    for (const skill of background.skillChoiceFrom) {
      if (context.skillProficiencies.includes(normalizeSkillKey(skill))) {
        proficiencies.add(normalizeSkillKey(skill))
      }
    }
    for (const item of background.toolProficiencies) proficiencies.add(item.toLowerCase())
  }
  return proficiencies
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
    backgroundFeatId: background.background_feat_id,
  }
}

export { normalizeToolProficiencies }
