import type { AbilityKey } from '@/lib/characters/build-context'
import { SAVING_THROW_NAMES, SKILLS, normalizeSkillKey, type SkillKey } from '@/lib/skills'
import type { Sense, SizeCategory } from '@/lib/types/database'

export interface CharacterAggregateClass {
  classId: string
  className: string
  subclassName?: string | null
  level: number
  hitDie: number | null
  hpRoll: number | null
  savingThrowProficiencies?: string[]
}

export interface CharacterAggregate {
  baseStats: Record<AbilityKey, number>
  speciesAbilityBonuses: Partial<Record<AbilityKey, number>>
  abilityContributors?: DerivedAbilityScoreContributor[]
  classes: CharacterAggregateClass[]
  persistedHpMax: number
  savingThrowProficiencies?: string[]
  skillProficiencies?: string[]
  skillExpertise?: string[]
  selectedFeatureOptions?: Array<{
    option_group_key: string
    selected_value: Record<string, unknown>
  }>
  selectedSpellNames?: string[]
  equippedItems?: CharacterArmorItem[]
  armorCatalog?: CharacterArmorCatalogEntry[]
  shieldCatalog?: CharacterShieldCatalogEntry[]
  species?: {
    name: string | null
    source: string | null
    speed: number | null
    size: SizeCategory | null
    languages: string[]
    senses: Sense[]
    damageResistances: string[]
    conditionImmunities: string[]
  } | null
}

export interface DerivedAbilityScore {
  base: number
  bonus: number
  adjusted: number
  modifier: number
  contributors: DerivedAbilityScoreContributor[]
}

export interface DerivedCharacterCore {
  totalLevel: number
  proficiencyBonus: number
  abilities: Record<AbilityKey, DerivedAbilityScore>
  savingThrows: DerivedSheetSavingThrow[]
  skills: DerivedSheetSkill[]
  initiative: number
  passivePerception: number
  armorClass: DerivedSheetArmorClass
  speed: number | null
  size: SizeCategory | null
  languages: string[]
  senses: Sense[]
  damageResistances: string[]
  conditionImmunities: string[]
  hitPoints: {
    max: number
    constitutionModifier: number
    estimatedFromLevels: number | null
    minimumPossible: number | null
    maximumPossible: number | null
    inferredLevelCount: number
    usesInferredLevels: boolean
    hitDice: Array<{
      classId: string
      className: string
      dieSize: number | null
      level: number
    }>
    recordedRolls: Array<{
      classId: string
      className: string
      value: number | null
    }>
  }
}

export interface DerivedSheetSavingThrow {
  ability: AbilityKey
  name: string
  proficient: boolean
  abilityModifier: number
  proficiencyBonus: number
  proficiencySources: string[]
  modifier: number
}

export interface DerivedSheetSkill {
  key: SkillKey
  name: string
  ability: AbilityKey
  proficient: boolean
  expertise: boolean
  abilityModifier: number
  proficiencyBonus: number
  modifier: number
}

export interface DerivedSheetArmorClass {
  value: number
  formula: string
  alternatives?: DerivedArmorClassAlternative[]
}

export interface DerivedArmorClassAlternative {
  label: string
  value: number
  formula: string
}

export interface DerivedGrantedProficiencySource {
  label: string
  category: 'class' | 'subclass' | 'background' | 'species' | 'feat' | 'manual'
}

export interface DerivedGrantedProficiencyEntry {
  key: string
  label: string
  sources: DerivedGrantedProficiencySource[]
}

export interface DerivedGrantedNonSkillProficiencies {
  armor: DerivedGrantedProficiencyEntry[]
  weapons: DerivedGrantedProficiencyEntry[]
  tools: DerivedGrantedProficiencyEntry[]
  languages: DerivedGrantedProficiencyEntry[]
}

export interface DerivedAbilityScoreContributor {
  ability: AbilityKey
  bonus: number
  label: string
  sourceType: 'species' | 'species_choice' | 'asi' | 'feat' | 'other'
  sourceFeatureKey?: string | null
}

export interface LanguageChoiceSourceRowLike {
  language: string
  source_category: string
  source_entity_id: string | null
}

export interface ToolChoiceSourceRowLike {
  tool: string
  source_category: string
  source_entity_id: string | null
}

export interface CharacterArmorItem {
  itemId: string
  equipped: boolean
}

export interface CharacterArmorCatalogEntry {
  itemId: string
  name: string
  armorCategory: string
  baseAc: number
  dexBonusCap: number | null
}

export interface CharacterShieldCatalogEntry {
  itemId: string
  name: string
  armorClassBonus: number
}

type StaticProficiencyRule = {
  names: string[]
  source?: string
  armor?: string[]
  weapons?: string[]
}

const STATIC_SPECIES_PROFICIENCY_RULES: StaticProficiencyRule[] = [
  {
    names: ['Mountain Dwarf'],
    source: 'PHB',
    armor: ['Light Armor', 'Medium Armor'],
  },
]

const STATIC_SUBCLASS_PROFICIENCY_RULES: StaticProficiencyRule[] = [
  {
    names: ['Life Domain', 'Nature Domain'],
    source: 'PHB',
    armor: ['Heavy Armor'],
  },
  {
    names: ['Tempest Domain', 'War Domain'],
    source: 'PHB',
    armor: ['Heavy Armor'],
    weapons: ['Martial Weapons'],
  },
  {
    names: ['Battle Smith'],
    source: 'ERftLW',
    weapons: ['Martial Weapons'],
  },
]

const STATIC_FEAT_PROFICIENCY_RULES: StaticProficiencyRule[] = [
  {
    names: ['Lightly Armored'],
    source: 'PHB',
    armor: ['Light Armor'],
  },
  {
    names: ['Moderately Armored'],
    source: 'PHB',
    armor: ['Medium Armor', 'Shields'],
  },
  {
    names: ['Heavily Armored'],
    source: 'PHB',
    armor: ['Heavy Armor'],
  },
]

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export function hitPointGainFromRoll(hitDie: number, constitutionModifier: number, roll: number): number {
  return Math.max(1, roll + constitutionModifier)
}

export function getFixedHpGainValue(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1
}

export function proficiencyBonusFromLevel(totalLevel: number): number {
  return Math.floor((Math.max(totalLevel, 1) - 1) / 4) + 2
}

export function deriveAbilityScores(
  baseStats: Record<AbilityKey, number>,
  bonuses: Partial<Record<AbilityKey, number>>,
  contributors: DerivedAbilityScoreContributor[] = abilityBonusMapToContributors(bonuses, 'Ability bonus')
): Record<AbilityKey, DerivedAbilityScore> {
  return {
    str: buildDerivedAbilityScore('str', baseStats.str, bonuses.str ?? 0, contributors),
    dex: buildDerivedAbilityScore('dex', baseStats.dex, bonuses.dex ?? 0, contributors),
    con: buildDerivedAbilityScore('con', baseStats.con, bonuses.con ?? 0, contributors),
    int: buildDerivedAbilityScore('int', baseStats.int, bonuses.int ?? 0, contributors),
    wis: buildDerivedAbilityScore('wis', baseStats.wis, bonuses.wis ?? 0, contributors),
    cha: buildDerivedAbilityScore('cha', baseStats.cha, bonuses.cha ?? 0, contributors),
  }
}

export function deriveCharacterCore(aggregate: CharacterAggregate): DerivedCharacterCore {
  const totalLevel = aggregate.classes.reduce((sum, cls) => sum + cls.level, 0)
  const contributors = aggregate.abilityContributors ?? abilityBonusMapToContributors(
    aggregate.speciesAbilityBonuses,
    'Ability bonus'
  )
  const abilities = deriveAbilityScores(
    aggregate.baseStats,
    sumAbilityContributors(contributors),
    contributors
  )
  const hitPointEstimate = deriveHitPointEstimate(aggregate.classes, abilities.con.modifier)
  const proficiencyBonus = proficiencyBonusFromLevel(totalLevel)
  const skills = deriveSheetSkills({
    abilities,
    proficiencyBonus,
    proficientSkills: aggregate.skillProficiencies ?? [],
    expertiseSkills: aggregate.skillExpertise ?? [],
  })

  return {
    totalLevel,
    proficiencyBonus,
    abilities,
    savingThrows: deriveSheetSavingThrows({
      abilities,
      proficiencyBonus,
      proficientAbilities: aggregate.savingThrowProficiencies ?? [],
      proficiencySources: buildSavingThrowSourceMap(
        aggregate.classes.map((cls) => ({
          className: cls.className,
          savingThrowProficiencies: cls.savingThrowProficiencies ?? [],
        })),
        aggregate.savingThrowProficiencies ?? []
      ),
    }),
    skills,
    initiative: deriveSheetInitiative(abilities),
    passivePerception: deriveSheetPassivePerception({
      skills,
      wisdomModifier: abilities.wis.modifier,
    }),
    armorClass: deriveArmorClass({
      abilities,
      classNames: aggregate.classes.map((cls) => cls.className),
      subclassNames: aggregate.classes
        .map((cls) => cls.subclassName ?? null)
        .filter((name): name is string => Boolean(name)),
      speciesName: aggregate.species?.name ?? null,
      speciesSource: aggregate.species?.source ?? null,
      selectedFeatureOptions: aggregate.selectedFeatureOptions ?? [],
      selectedSpellNames: aggregate.selectedSpellNames ?? [],
      equippedItems: aggregate.equippedItems ?? [],
      armorCatalog: aggregate.armorCatalog ?? [],
      shieldCatalog: aggregate.shieldCatalog ?? [],
    }),
    speed: aggregate.species?.speed ?? null,
    size: aggregate.species?.size ?? null,
    languages: aggregate.species?.languages ?? [],
    senses: aggregate.species?.senses ?? [],
    damageResistances: aggregate.species?.damageResistances ?? [],
    conditionImmunities: aggregate.species?.conditionImmunities ?? [],
    hitPoints: {
      max: aggregate.persistedHpMax,
      constitutionModifier: abilities.con.modifier,
      estimatedFromLevels: hitPointEstimate?.estimated ?? null,
      minimumPossible: hitPointEstimate?.minimum ?? null,
      maximumPossible: hitPointEstimate?.maximum ?? null,
      inferredLevelCount: hitPointEstimate?.inferredLevelCount ?? 0,
      usesInferredLevels: (hitPointEstimate?.inferredLevelCount ?? 0) > 0,
      hitDice: aggregate.classes.map((cls) => ({
        classId: cls.classId,
        className: cls.className,
        dieSize: cls.hitDie,
        level: cls.level,
      })),
      recordedRolls: aggregate.classes.map((cls) => ({
        classId: cls.classId,
        className: cls.className,
        value: cls.hpRoll,
      })),
    },
  }
}

export function deriveSheetInitiative(abilities: Record<AbilityKey, DerivedAbilityScore>): number {
  return abilities.dex.modifier
}

export function deriveSheetPassivePerception(args: {
  skills: DerivedSheetSkill[]
  wisdomModifier: number
}): number {
  return 10 + (args.skills.find((skill) => skill.key === 'perception')?.modifier ?? args.wisdomModifier)
}

export function deriveSheetSavingThrows(args: {
  abilities: Record<AbilityKey, DerivedAbilityScore>
  proficiencyBonus: number
  proficientAbilities: string[]
  proficiencySources?: Partial<Record<AbilityKey, string[]>>
}): DerivedSheetSavingThrow[] {
  const proficient = new Set(args.proficientAbilities.map((ability) => ability.toLowerCase()))

  return (['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).map((ability) => ({
    ability,
    name: SAVING_THROW_NAMES[ability],
    proficient: proficient.has(ability),
    abilityModifier: args.abilities[ability].modifier,
    proficiencyBonus: proficient.has(ability) ? args.proficiencyBonus : 0,
    proficiencySources: args.proficiencySources?.[ability] ?? [],
    modifier: args.abilities[ability].modifier + (proficient.has(ability) ? args.proficiencyBonus : 0),
  }))
}

export function deriveSheetSkills(args: {
  abilities: Record<AbilityKey, DerivedAbilityScore>
  proficiencyBonus: number
  proficientSkills: string[]
  expertiseSkills?: string[]
}): DerivedSheetSkill[] {
  const proficient = new Set(args.proficientSkills.map(normalizeSkillKey))
  const expertise = new Set((args.expertiseSkills ?? []).map(normalizeSkillKey))

  return SKILLS.map((skill) => {
    const hasProficiency = proficient.has(skill.key)
    const hasExpertise = hasProficiency && expertise.has(skill.key)
    const abilityMod = args.abilities[skill.ability].modifier
    const proficiencyValue = hasProficiency ? args.proficiencyBonus * (hasExpertise ? 2 : 1) : 0

    return {
      key: skill.key,
      name: skill.name,
      ability: skill.ability,
      proficient: hasProficiency,
      expertise: hasExpertise,
      abilityModifier: abilityMod,
      proficiencyBonus: proficiencyValue,
      modifier: abilityMod + proficiencyValue,
    }
  })
}

export function deriveUnarmoredArmorClass(args: {
  abilities: Record<AbilityKey, DerivedAbilityScore>
  classNames: string[]
  speciesName: string | null
  speciesSource: string | null
}): DerivedSheetArmorClass {
  const warforgedIntegratedBonus = args.speciesName === 'Warforged' && args.speciesSource === 'ERftLW' ? 1 : 0
  if (args.classNames.includes('Barbarian')) {
    return {
      value: 10 + args.abilities.dex.modifier + args.abilities.con.modifier + warforgedIntegratedBonus,
      formula: warforgedIntegratedBonus > 0
        ? '10 + DEX + CON + 1 (Unarmored Defense, Integrated Protection)'
        : '10 + DEX + CON (Unarmored Defense)',
    }
  }
  if (args.classNames.includes('Monk')) {
    return {
      value: 10 + args.abilities.dex.modifier + args.abilities.wis.modifier + warforgedIntegratedBonus,
      formula: warforgedIntegratedBonus > 0
        ? '10 + DEX + WIS + 1 (Unarmored Defense, Integrated Protection)'
        : '10 + DEX + WIS (Unarmored Defense)',
    }
  }
  return {
    value: 10 + args.abilities.dex.modifier + warforgedIntegratedBonus,
    formula: warforgedIntegratedBonus > 0
      ? '10 + DEX + 1 (Unarmored, Integrated Protection)'
      : '10 + DEX (Unarmored)',
  }
}

export function deriveArmorClass(args: {
  abilities: Record<AbilityKey, DerivedAbilityScore>
  classNames: string[]
  subclassNames?: string[]
  speciesName: string | null
  speciesSource: string | null
  selectedFeatureOptions?: Array<{
    option_group_key: string
    selected_value: Record<string, unknown>
  }>
  selectedSpellNames?: string[]
  equippedItems?: CharacterArmorItem[]
  armorCatalog?: CharacterArmorCatalogEntry[]
  shieldCatalog?: CharacterShieldCatalogEntry[]
}): DerivedSheetArmorClass {
  const equippedItems = args.equippedItems ?? []
  const armorCatalogById = new Map((args.armorCatalog ?? []).map((entry) => [entry.itemId, entry]))
  const shieldCatalogById = new Map((args.shieldCatalog ?? []).map((entry) => [entry.itemId, entry]))
  const equippedArmor = equippedItems
    .filter((item) => item.equipped)
    .map((item) => armorCatalogById.get(item.itemId))
    .filter((item): item is CharacterArmorCatalogEntry => Boolean(item))
    .sort((left, right) => right.baseAc - left.baseAc)[0] ?? null
  const equippedShield = equippedItems
    .filter((item) => item.equipped)
    .map((item) => shieldCatalogById.get(item.itemId))
    .filter((item): item is CharacterShieldCatalogEntry => Boolean(item))
    .sort((left, right) => right.armorClassBonus - left.armorClassBonus)[0] ?? null
  const integratedProtectionBonus = args.speciesName === 'Warforged' && args.speciesSource === 'ERftLW' ? 1 : 0
  const shieldBonus = equippedShield?.armorClassBonus ?? 0
  const hasDefenseStyle = args.selectedFeatureOptions?.some((choice) => (
    choice.option_group_key.startsWith('fighting_style:')
    && choice.selected_value?.feature_option_key === 'defense'
  )) ?? false

  if (equippedArmor) {
    const dexModifier = args.abilities.dex.modifier
    const dexContribution = equippedArmor.armorCategory === 'heavy'
      ? 0
      : equippedArmor.dexBonusCap === null
        ? dexModifier
        : Math.min(dexModifier, equippedArmor.dexBonusCap)
    const defenseBonus = hasDefenseStyle ? 1 : 0
    return {
      value: equippedArmor.baseAc + dexContribution + shieldBonus + defenseBonus + integratedProtectionBonus,
      formula: joinArmorFormula([
        `${equippedArmor.baseAc} (${equippedArmor.name})`,
        dexContribution !== 0 ? `${formatModifier(dexContribution)} DEX` : null,
        shieldBonus > 0 ? `+${shieldBonus} (${equippedShield?.name ?? 'Shield'})` : null,
        defenseBonus > 0 ? '+1 (Defense)' : null,
        integratedProtectionBonus > 0 ? '+1 (Integrated Protection)' : null,
      ]),
    }
  }

  const alternatives: DerivedArmorClassAlternative[] = []
  const baseUnarmored = shieldBonus > 0
    ? {
        value: 10 + args.abilities.dex.modifier + shieldBonus + integratedProtectionBonus,
        formula: joinArmorFormula([
          '10',
          `${formatModifier(args.abilities.dex.modifier)} DEX`,
          `+${shieldBonus} (${equippedShield?.name ?? 'Shield'})`,
          integratedProtectionBonus > 0 ? '+1 (Integrated Protection)' : null,
        ]),
      }
    : deriveUnarmoredArmorClass(args)
  let best = baseUnarmored

  const barbarianArmor = args.classNames.includes('Barbarian')
    ? buildArmorClassAlternative(
        'Barbarian Unarmored Defense',
        10 + args.abilities.dex.modifier + args.abilities.con.modifier + shieldBonus + integratedProtectionBonus,
        joinArmorFormula([
          '10',
          `${formatModifier(args.abilities.dex.modifier)} DEX`,
          `${formatModifier(args.abilities.con.modifier)} CON`,
          shieldBonus > 0 ? `+${shieldBonus} (${equippedShield?.name ?? 'Shield'})` : null,
          integratedProtectionBonus > 0 ? '+1 (Integrated Protection)' : null,
        ])
      )
    : null
  if (barbarianArmor) {
    best = pickBetterArmorClass(best, barbarianArmor)
  }

  const monkArmor = args.classNames.includes('Monk') && shieldBonus === 0
    ? buildArmorClassAlternative(
        'Monk Unarmored Defense',
        10 + args.abilities.dex.modifier + args.abilities.wis.modifier + integratedProtectionBonus,
        joinArmorFormula([
          '10',
          `${formatModifier(args.abilities.dex.modifier)} DEX`,
          `${formatModifier(args.abilities.wis.modifier)} WIS`,
          integratedProtectionBonus > 0 ? '+1 (Integrated Protection)' : null,
        ])
      )
    : null
  if (monkArmor) {
    best = pickBetterArmorClass(best, monkArmor)
  }

  const draconicArmor = (args.subclassNames ?? []).includes('Draconic Bloodline')
    ? buildArmorClassAlternative(
        'Draconic Resilience',
        13 + args.abilities.dex.modifier + shieldBonus + integratedProtectionBonus,
        joinArmorFormula([
          '13',
          `${formatModifier(args.abilities.dex.modifier)} DEX`,
          shieldBonus > 0 ? `+${shieldBonus} (${equippedShield?.name ?? 'Shield'})` : null,
          integratedProtectionBonus > 0 ? '+1 (Integrated Protection)' : null,
        ])
      )
    : null
  if (draconicArmor) {
    best = pickBetterArmorClass(best, draconicArmor)
  }

  const hasMageArmor = (args.selectedSpellNames ?? []).some((name) => normalizeArmorSpellName(name) === 'mage armor')
  if (hasMageArmor) {
    alternatives.push(buildArmorClassAlternative(
      'Mage Armor',
      13 + args.abilities.dex.modifier + shieldBonus + integratedProtectionBonus,
      joinArmorFormula([
        '13',
        `${formatModifier(args.abilities.dex.modifier)} DEX`,
        shieldBonus > 0 ? `+${shieldBonus} (${equippedShield?.name ?? 'Shield'})` : null,
        integratedProtectionBonus > 0 ? '+1 (Integrated Protection)' : null,
      ])
    ))
  }

  const extraAlternatives = [barbarianArmor, monkArmor, draconicArmor]
    .filter((entry): entry is DerivedArmorClassAlternative => Boolean(entry))
    .filter((entry) => entry.formula !== best.formula)

  return {
    ...best,
    alternatives: dedupeArmorClassAlternatives([...extraAlternatives, ...alternatives]),
  }
}

function buildArmorClassAlternative(
  label: string,
  value: number,
  formula: string
): DerivedArmorClassAlternative {
  return { label, value, formula }
}

function pickBetterArmorClass(
  current: DerivedSheetArmorClass,
  alternative: DerivedArmorClassAlternative
): DerivedSheetArmorClass {
  if (alternative.value > current.value) {
    return {
      value: alternative.value,
      formula: alternative.formula,
    }
  }
  return current
}

function joinArmorFormula(parts: Array<string | null>) {
  return parts.filter((part): part is string => Boolean(part)).join(' ')
}

function normalizeArmorSpellName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function dedupeArmorClassAlternatives(
  alternatives: DerivedArmorClassAlternative[]
) {
  const deduped = new Map<string, DerivedArmorClassAlternative>()
  for (const entry of alternatives) {
    deduped.set(`${entry.label}:${entry.formula}:${entry.value}`, entry)
  }
  return Array.from(deduped.values())
}

export function abilityBonusMapToContributors(
  bonuses: Partial<Record<AbilityKey, number>>,
  label: string,
  sourceType: DerivedAbilityScoreContributor['sourceType'] = 'other'
): DerivedAbilityScoreContributor[] {
  return (Object.entries(bonuses) as Array<[AbilityKey, number]>)
    .filter(([, bonus]) => bonus !== 0)
    .map(([ability, bonus]) => ({
      ability,
      bonus,
      label,
      sourceType,
      sourceFeatureKey: null,
    }))
}

export function sumAbilityContributors(
  contributors: DerivedAbilityScoreContributor[]
): Partial<Record<AbilityKey, number>> {
  return contributors.reduce<Partial<Record<AbilityKey, number>>>((acc, contributor) => {
    acc[contributor.ability] = (acc[contributor.ability] ?? 0) + contributor.bonus
    return acc
  }, {})
}

export function buildSavingThrowSourceMap(
  classes: Array<{
    className: string
    savingThrowProficiencies: string[]
  }>,
  fallbackProficiencies: string[] = []
): Partial<Record<AbilityKey, string[]>> {
  const entries: Partial<Record<AbilityKey, string[]>> = {}
  for (const cls of classes) {
    for (const save of cls.savingThrowProficiencies) {
      const ability = save.toLowerCase() as AbilityKey
      entries[ability] = [...(entries[ability] ?? []), cls.className]
    }
  }
  if (Object.keys(entries).length > 0) return entries

  for (const save of fallbackProficiencies) {
    const ability = save.toLowerCase() as AbilityKey
    entries[ability] = ['Class']
  }
  return entries
}

export function deriveGrantedNonSkillProficiencies(args: {
  classes?: Array<{
    classId: string
    className: string
    armorProficiencies?: string[]
    weaponProficiencies?: string[]
  }>
  background?: {
    name: string
    toolProficiencies?: string[]
    fixedLanguages?: string[]
  } | null
  species?: {
    name: string
    source?: string | null
    languages?: string[]
  } | null
  subclasses?: Array<{
    id: string
    name: string
    source?: string | null
  }>
  feats?: Array<{
    id: string
    name: string
    source?: string | null
    benefits?: Record<string, unknown>
  }>
  languageChoiceRows?: LanguageChoiceSourceRowLike[]
  toolChoiceRows?: ToolChoiceSourceRowLike[]
}): DerivedGrantedNonSkillProficiencies {
  const armor = new Map<string, DerivedGrantedProficiencyEntry>()
  const weapons = new Map<string, DerivedGrantedProficiencyEntry>()
  const tools = new Map<string, DerivedGrantedProficiencyEntry>()
  const languages = new Map<string, DerivedGrantedProficiencyEntry>()

  const classNameById = new Map((args.classes ?? []).map((entry) => [entry.classId, entry.className]))
  const subclassNameById = new Map((args.subclasses ?? []).map((entry) => [entry.id, entry.name]))
  const featNameById = new Map((args.feats ?? []).map((entry) => [entry.id, entry.name]))

  for (const cls of args.classes ?? []) {
    for (const value of cls.armorProficiencies ?? []) {
      addGrantedProficiency(armor, value, {
        label: cls.className,
        category: 'class',
      })
    }
    for (const value of cls.weaponProficiencies ?? []) {
      addGrantedProficiency(weapons, value, {
        label: cls.className,
        category: 'class',
      })
    }
  }

  for (const value of args.background?.toolProficiencies ?? []) {
    addGrantedProficiency(tools, value, {
      label: args.background?.name ?? 'Background',
      category: 'background',
    })
  }
  for (const value of args.background?.fixedLanguages ?? []) {
    addGrantedProficiency(languages, value, {
      label: args.background?.name ?? 'Background',
      category: 'background',
    })
  }

  for (const value of args.species?.languages ?? []) {
    addGrantedProficiency(languages, value, {
      label: args.species?.name ?? 'Species',
      category: 'species',
    })
  }

  for (const rule of getMatchingStaticRules(STATIC_SPECIES_PROFICIENCY_RULES, args.species?.name ?? null, args.species?.source ?? null)) {
    for (const value of rule.armor ?? []) {
      addGrantedProficiency(armor, value, {
        label: args.species?.name ?? 'Species',
        category: 'species',
      })
    }
    for (const value of rule.weapons ?? []) {
      addGrantedProficiency(weapons, value, {
        label: args.species?.name ?? 'Species',
        category: 'species',
      })
    }
  }

  for (const subclass of args.subclasses ?? []) {
    for (const rule of getMatchingStaticRules(STATIC_SUBCLASS_PROFICIENCY_RULES, subclass.name, subclass.source ?? null)) {
      for (const value of rule.armor ?? []) {
        addGrantedProficiency(armor, value, {
          label: subclass.name,
          category: 'subclass',
        })
      }
      for (const value of rule.weapons ?? []) {
        addGrantedProficiency(weapons, value, {
          label: subclass.name,
          category: 'subclass',
        })
      }
    }
  }

  for (const feat of args.feats ?? []) {
    const staticRules = getMatchingStaticRules(STATIC_FEAT_PROFICIENCY_RULES, feat.name, feat.source ?? null)
    const benefitRules = extractFeatGrantedProficiencies(feat.benefits)
    for (const value of [...staticRules.flatMap((rule) => rule.armor ?? []), ...benefitRules.armor]) {
      addGrantedProficiency(armor, value, {
        label: feat.name,
        category: 'feat',
      })
    }
    for (const value of [...staticRules.flatMap((rule) => rule.weapons ?? []), ...benefitRules.weapons]) {
      addGrantedProficiency(weapons, value, {
        label: feat.name,
        category: 'feat',
      })
    }
    for (const value of benefitRules.tools) {
      addGrantedProficiency(tools, value, {
        label: feat.name,
        category: 'feat',
      })
    }
    for (const value of benefitRules.languages) {
      addGrantedProficiency(languages, value, {
        label: feat.name,
        category: 'feat',
      })
    }
  }

  for (const row of args.languageChoiceRows ?? []) {
    addGrantedProficiency(languages, row.language, {
      label: resolveGrantedSourceLabel({
        sourceCategory: row.source_category,
        sourceEntityId: row.source_entity_id,
        backgroundName: args.background?.name ?? null,
        speciesName: args.species?.name ?? null,
        classNameById,
        subclassNameById,
        featNameById,
      }),
      category: resolveGrantedSourceCategory(row.source_category),
    })
  }

  for (const row of args.toolChoiceRows ?? []) {
    addGrantedProficiency(tools, row.tool, {
      label: resolveGrantedSourceLabel({
        sourceCategory: row.source_category,
        sourceEntityId: row.source_entity_id,
        backgroundName: args.background?.name ?? null,
        speciesName: args.species?.name ?? null,
        classNameById,
        subclassNameById,
        featNameById,
      }),
      category: resolveGrantedSourceCategory(row.source_category),
    })
  }

  return {
    armor: sortGrantedProficiencies(armor),
    weapons: sortGrantedProficiencies(weapons),
    tools: sortGrantedProficiencies(tools),
    languages: sortGrantedProficiencies(languages),
  }
}

function buildDerivedAbilityScore(
  ability: AbilityKey,
  base: number,
  bonus: number,
  allContributors: DerivedAbilityScoreContributor[]
): DerivedAbilityScore {
  const adjusted = base + bonus

  return {
    base,
    bonus,
    adjusted,
    modifier: abilityModifier(adjusted),
    contributors: allContributors.filter((contributor) => contributor.ability === ability),
  }
}

function deriveHitPointEstimate(
  classes: CharacterAggregateClass[],
  constitutionModifier: number
): { estimated: number; minimum: number; maximum: number; inferredLevelCount: number } | null {
  if (classes.length === 0) return { estimated: 0, minimum: 0, maximum: 0, inferredLevelCount: 0 }
  if (classes.some((cls) => cls.hitDie === null)) return null

  let estimated = 0
  let minimum = 0
  let maximum = 0
  let inferredLevelCount = 0

  classes.forEach((cls, index) => {
    const hitDie = cls.hitDie
    if (!hitDie || cls.level <= 0) return

    let trackedLevels = 0

    // Assume the first recorded class was the character's starting class,
    // so its first level used maximum hit points.
    if (index === 0) {
      const startingGain = hitPointGainFromRoll(hitDie, constitutionModifier, hitDie)
      estimated += startingGain
      minimum += startingGain
      maximum += startingGain
      trackedLevels += 1
    }

    // The current schema stores at most one per-class HP roll, so we treat it
    // as the most recent gain for that class when there is room for one.
    const recordedRoll = cls.hpRoll
    const canUseRecordedRoll = recordedRoll !== null && trackedLevels < cls.level
    if (canUseRecordedRoll) {
      const recordedGain = hitPointGainFromRoll(hitDie, constitutionModifier, recordedRoll)
      estimated += recordedGain
      minimum += recordedGain
      maximum += recordedGain
      trackedLevels += 1
    }

    const remainingLevels = Math.max(0, cls.level - trackedLevels)
    if (remainingLevels === 0) return

    inferredLevelCount += remainingLevels
    estimated += hitPointGainFromRoll(hitDie, constitutionModifier, getFixedHpGainValue(hitDie)) * remainingLevels
    minimum += hitPointGainFromRoll(hitDie, constitutionModifier, 1) * remainingLevels
    maximum += hitPointGainFromRoll(hitDie, constitutionModifier, hitDie) * remainingLevels
  })

  return { estimated, minimum, maximum, inferredLevelCount }
}

function normalizeGrantedProficiencyKey(value: string) {
  return value.trim().toLowerCase()
}

function addGrantedProficiency(
  collection: Map<string, DerivedGrantedProficiencyEntry>,
  value: string,
  source: DerivedGrantedProficiencySource
) {
  const label = value.trim()
  if (!label) return

  const key = normalizeGrantedProficiencyKey(label)
  const existing = collection.get(key) ?? { key, label, sources: [] }
  if (!existing.sources.some((entry) => entry.label === source.label && entry.category === source.category)) {
    existing.sources.push(source)
  }
  collection.set(key, existing)
}

function sortGrantedProficiencies(
  collection: Map<string, DerivedGrantedProficiencyEntry>
): DerivedGrantedProficiencyEntry[] {
  return Array.from(collection.values())
    .map((entry) => ({
      ...entry,
      sources: [...entry.sources].sort((left, right) => left.label.localeCompare(right.label)),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

function getMatchingStaticRules(
  rules: StaticProficiencyRule[],
  name: string | null,
  source: string | null
) {
  if (!name) return []
  return rules.filter((rule) => (
    rule.names.includes(name) && (!rule.source || rule.source === source)
  ))
}

function resolveGrantedSourceCategory(sourceCategory: string): DerivedGrantedProficiencySource['category'] {
  if (sourceCategory.startsWith('class')) return 'class'
  if (sourceCategory.startsWith('background')) return 'background'
  if (sourceCategory.startsWith('species')) return 'species'
  if (sourceCategory.startsWith('subclass')) return 'subclass'
  if (sourceCategory.startsWith('feat')) return 'feat'
  return 'manual'
}

function resolveGrantedSourceLabel(args: {
  sourceCategory: string
  sourceEntityId: string | null
  backgroundName: string | null
  speciesName: string | null
  classNameById: Map<string, string>
  subclassNameById: Map<string, string>
  featNameById: Map<string, string>
}) {
  const sourceEntityId = args.sourceEntityId ?? ''

  switch (resolveGrantedSourceCategory(args.sourceCategory)) {
    case 'class':
      return args.classNameById.get(sourceEntityId) ?? 'Class'
    case 'background':
      return args.backgroundName ?? 'Background'
    case 'species':
      return args.speciesName ?? 'Species'
    case 'subclass':
      return args.subclassNameById.get(sourceEntityId) ?? 'Subclass'
    case 'feat':
      return args.featNameById.get(sourceEntityId) ?? 'Feat'
    default:
      return 'Manual'
  }
}

function extractFeatGrantedProficiencies(benefits: Record<string, unknown> | undefined) {
  const summary = {
    armor: [] as string[],
    weapons: [] as string[],
    tools: [] as string[],
    languages: [] as string[],
  }
  if (!benefits) return summary

  const mappings: Array<[keyof typeof summary, string[]]> = [
    ['armor', ['armor_proficiencies', 'armor']],
    ['weapons', ['weapon_proficiencies', 'weapons']],
    ['tools', ['tool_proficiencies', 'tools']],
    ['languages', ['languages', 'language_proficiencies']],
  ]

  for (const [target, keys] of mappings) {
    for (const key of keys) {
      const value = benefits[key]
      if (!value) continue

      if (Array.isArray(value)) {
        summary[target].push(...value.filter((entry): entry is string => typeof entry === 'string'))
      } else if (typeof value === 'string') {
        summary[target].push(value)
      }
    }
    summary[target] = Array.from(new Set(summary[target].map((value) => value.trim()).filter(Boolean)))
  }

  return summary
}
