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
} from '@/lib/types/database'
import {
  abilityModifier,
  deriveAbilityScores,
  deriveCharacterCore,
  type CharacterAggregate,
  type DerivedCharacterCore,
} from '@/lib/characters/derived'
import { getFixedBackgroundLanguages } from '@/lib/characters/language-tool-provenance'
import { normalizeSkillKey, SAVING_THROW_NAMES, SKILLS, type SkillKey } from '@/lib/skills'

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

export interface BuildSpellSummary {
  id: string
  name: string
  level: number
  classes: string[]
  source: string
  grantedBySubclassIds: string[]
  owningClassId?: string | null
  acquisitionMode?: string
  sourceFeatureKey?: string | null
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
  persistedHpMax: number
  baseStats: Record<AbilityKey, number>
  statRolls: Array<{
    assigned_to: string
    roll_set: number[]
  }>
  skillProficiencies: string[]
  selectedAbilityBonuses: Partial<Record<AbilityKey, number>>
  speciesName: string | null
  selectedLanguages: string[]
  selectedTools: string[]
  speciesSource: string | null
  speciesAbilityBonuses: Partial<Record<AbilityKey, number>>
  speciesSpeed: number | null
  speciesSize: SizeCategory | null
  speciesLanguages: string[]
  speciesSenses: Sense[]
  speciesDamageResistances: string[]
  speciesConditionImmunities: string[]
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
  speciesExpandedSpellIds: string[]
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

export interface DerivedSavingThrowSummary {
  ability: AbilityKey
  name: string
  proficient: boolean
  modifier: number
}

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
}

export interface DerivedSpellcastingSourceSummary {
  classId: string
  className: string
  classLevel: number
  spellcastingType: SpellcastingType | null
  mode: CharacterProgressionSummary['spellSelectionMode']
  cantripSelectionCap: number | null
  leveledSpellSelectionCap: number
  selectionSummary: string | null
  selectedSpellCountsByLevel: Record<number, number>
  selectedSpells: Array<{
    id: string
    name: string
    level: number
    source: string
    granted: boolean
    countsAgainstSelectionLimit: boolean
  }>
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
  selectedSpells: Array<{
    id: string
    name: string
    level: number
    source: string
    granted: boolean
    countsAgainstSelectionLimit: boolean
  }>
  selectedSpellCountsByLevel: Record<number, number>
  freePreparedSpellIds: string[]
  grantedSpellIds: string[]
  sources: DerivedSpellcastingSourceSummary[]
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
  senses: Sense[]
  damageResistances: string[]
  conditionImmunities: string[]
  armorClass: DerivedAcSummary
  subclassStates: DerivedSubclassState[]
  features: DerivedFeatureSummary[]
  spellcasting: DerivedSpellcastingSummary
  blockingIssues: DerivedIssueSummary[]
  warnings: DerivedIssueSummary[]
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
      // 2014 multiclass slot progression rounds half-caster levels down when combining caster levels.
      return Math.floor(level / 2)
    case 'third':
      // 2014 multiclass slot progression also rounds third-caster levels down.
      return Math.floor(level / 3)
    default:
      return 0
  }
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

function buildSpellSelectionSummary(
  className: string,
  classLevel: number,
  mode: CharacterProgressionSummary['spellSelectionMode'],
  leveledCap: number
): string | null {
  if (mode === 'known') {
    return `${className} knows ${leveledCap} leveled spells at level ${classLevel}.`
  }
  if (mode === 'spellbook') {
    return `${className} can prepare ${leveledCap} spells from its spellbook.`
  }
  if (mode === 'prepared') {
    return `${className} can prepare ${leveledCap} spells.`
  }
  return null
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
  const cantripSelectionCap = spellcastingProfile?.cantrips_known_by_level?.[Math.max((primarySpellcastingClass?.level ?? 1) - 1, 0)] ?? null

  let leveledCapFromProgression = 0
  let spellSelectionMode: CharacterProgressionSummary['spellSelectionMode'] = 'none'
  let spellSelectionSummary: string | null = null

  if (primarySpellcastingClass && spellcastingProfile) {
    spellSelectionMode = spellcastingProfile.mode
    if (spellcastingProfile.mode === 'known') {
      leveledCapFromProgression = spellcastingProfile.spells_known_by_level?.[primarySpellcastingClass.level - 1] ?? 0
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
    }
    spellSelectionSummary = buildSpellSelectionSummary(
      primarySpellcastingClass.name,
      primarySpellcastingClass.level,
      spellcastingProfile.mode,
      leveledCapFromProgression
    )
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
  const abilities = deriveAbilityScores(context.baseStats, combineAbilityBonuses(context))

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
  return {
    baseStats: context.baseStats,
    speciesAbilityBonuses: combineAbilityBonuses(context),
    persistedHpMax: context.persistedHpMax,
    classes: context.classes.map((cls) => ({
      classId: cls.classId,
      className: cls.name,
      level: cls.level,
      hitDie: cls.hitDie,
      hpRoll: cls.hpRoll,
    })),
  }
}

export function deriveCharacter(context: CharacterBuildContext): DerivedCharacter {
  const core = deriveCharacterCore(toCharacterAggregate(context))
  const progression = deriveCharacterProgression(context)
  const adjustedScores = getAdjustedAbilityScores(context)
  const proficiencyBonus = core.proficiencyBonus

  const selectedSkillProficiencies = new Set<string>(context.skillProficiencies.map(normalizeSkillKey))
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

  const skills = SKILLS.map((skill) => {
    const proficient = backgroundSkillProficiencies.has(skill.key) || selectedSkillProficiencies.has(skill.key)

    return {
      key: skill.key,
      name: skill.name,
      ability: skill.ability,
      proficient,
      modifier: abilityModifier(adjustedScores[skill.ability]) + (proficient ? proficiencyBonus : 0),
    }
  })

  const savingThrows: DerivedSavingThrowSummary[] = (['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).map((ability) => ({
    ability,
    name: SAVING_THROW_NAMES[ability],
    proficient: savingThrowProficiencies.has(ability),
    modifier: abilityModifier(adjustedScores[ability]) + (savingThrowProficiencies.has(ability) ? proficiencyBonus : 0),
  }))

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

  const passivePerception = 10 + (skills.find((skill) => skill.key === 'perception')?.modifier ?? abilityModifier(adjustedScores.wis))
  const dexModifier = abilityModifier(adjustedScores.dex)
  const conModifier = abilityModifier(adjustedScores.con)
  const wisModifier = abilityModifier(adjustedScores.wis)
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
      row.featureNames.map((name) => ({
        classId: cls.classId,
        className: cls.name,
        level: row.level,
        name,
        subclassName: cls.subclass?.name ?? null,
      }))
    )
  )

  const armorClass = (() => {
    const warforgedIntegratedBonus = context.speciesName === 'Warforged' && context.speciesSource === 'ERftLW' ? 1 : 0
    if (classNames.includes('Barbarian')) {
      return {
        value: 10 + dexModifier + conModifier + warforgedIntegratedBonus,
        formula: warforgedIntegratedBonus > 0
          ? '10 + DEX + CON + 1 (Unarmored Defense, Integrated Protection)'
          : '10 + DEX + CON (Unarmored Defense)',
      }
    }
    if (classNames.includes('Monk')) {
      return {
        value: 10 + dexModifier + wisModifier + warforgedIntegratedBonus,
        formula: warforgedIntegratedBonus > 0
          ? '10 + DEX + WIS + 1 (Unarmored Defense, Integrated Protection)'
          : '10 + DEX + WIS (Unarmored Defense)',
      }
    }
    return {
      value: 10 + dexModifier + warforgedIntegratedBonus,
      formula: warforgedIntegratedBonus > 0
        ? '10 + DEX + 1 (Unarmored, Integrated Protection)'
        : '10 + DEX (Unarmored)',
    }
  })()

  const selectedSpellEntries = context.selectedSpells
    .filter((spell) => spell.level === 0 || spell.level <= progression.maxSpellLevel)
    .map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      source: spell.source,
      granted:
        spell.acquisitionMode === 'granted' ||
        context.grantedSpellIds.includes(spell.id) ||
        context.freePreparedSpellIds.includes(spell.id),
      countsAgainstSelectionLimit: spell.countsAgainstSelectionLimit,
    }))

  const selectedSpellCountsByLevel = Object.fromEntries(
    Array.from({ length: 10 }, (_, level) => [
      level,
      selectedSpellEntries.filter((spell) => spell.level === level).length,
    ])
      .filter(([, count]) => count > 0)
  )

  const spellcastingSources: DerivedSpellcastingSourceSummary[] = context.classes.flatMap((cls) => {
    const profile = cls.spellcastingProgression
    if (!cls.spellcastingType || cls.spellcastingType === 'none' || !profile || !profile.mode || profile.mode === 'none') {
      return []
    }

    const cantripCap = profile.cantrips_known_by_level?.[Math.max(cls.level - 1, 0)] ?? null
    let leveledCap = 0

    if (profile.mode === 'known') {
      leveledCap = profile.spells_known_by_level?.[cls.level - 1] ?? 0
    } else if (profile.mode === 'prepared' || profile.mode === 'spellbook') {
      const ability = profile.spellcasting_ability
      const abilityMod = ability ? abilityModifier(adjustedScores[ability]) : 0
      const preparedBase = resolvePreparedBase(
        profile.prepared_formula,
        cls.level,
        profile.prepared_fixed ?? 0
      )
      const totalPrepared = preparedBase + (profile.prepared_add_ability_mod ? abilityMod : 0)
      leveledCap = Math.max(profile.prepared_min ?? 0, totalPrepared)
    }

    const sourceSelectedSpells = selectedSpellEntries.filter((spell) =>
      context.selectedSpells.some((selected) =>
        selected.id === spell.id && (
          selected.owningClassId === cls.classId ||
          (
            selected.owningClassId == null &&
            !selected.sourceFeatureKey?.startsWith('feat_spell:') &&
            selected.classes.includes(cls.classId)
          ) ||
          selected.grantedBySubclassIds.includes(cls.subclass?.id ?? '')
        )
      )
    )

    const sourceSelectedSpellCountsByLevel = Object.fromEntries(
      Array.from({ length: 10 }, (_, level) => [
        level,
        sourceSelectedSpells.filter((spell) => spell.level === level).length,
      ]).filter(([, count]) => count > 0)
    )

    return [{
      classId: cls.classId,
      className: cls.name,
      classLevel: cls.level,
      spellcastingType: cls.spellcastingType,
      mode: profile.mode,
      cantripSelectionCap: cantripCap,
      leveledSpellSelectionCap: leveledCap,
      selectionSummary: buildSpellSelectionSummary(cls.name, cls.level, profile.mode, leveledCap),
      selectedSpellCountsByLevel: sourceSelectedSpellCountsByLevel,
      selectedSpells: sourceSelectedSpells,
    }]
  })

  return {
    ...core,
    ...progression,
    savingThrows,
    skills,
    proficiencies,
    initiative: abilityModifier(adjustedScores.dex),
    passivePerception,
    speed: context.speciesSpeed,
    size: context.speciesSize,
    languages: Array.from(new Set([
      ...context.speciesLanguages,
      ...(context.background?.fixedLanguages ?? []),
      ...context.selectedLanguages,
    ])),
    senses: context.speciesSenses,
    damageResistances: context.speciesDamageResistances,
    conditionImmunities: context.speciesConditionImmunities,
    armorClass,
    subclassStates,
    features,
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

function combineAbilityBonuses(context: Pick<CharacterBuildContext, 'speciesAbilityBonuses' | 'selectedAbilityBonuses'>) {
  const combined: Partial<Record<AbilityKey, number>> = { ...context.speciesAbilityBonuses }

  for (const ability of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]) {
    if ((context.selectedAbilityBonuses[ability] ?? 0) > 0) {
      combined[ability] = (combined[ability] ?? 0) + (context.selectedAbilityBonuses[ability] ?? 0)
    }
  }

  return combined
}

export { normalizeToolProficiencies }
