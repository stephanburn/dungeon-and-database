import type { ArmorCatalogEntry, ShieldCatalogEntry } from '@/lib/content/equipment-content'
import type {
  Background,
  Campaign,
  CharacterSkillProficiency,
  CharacterFeatureOptionChoice,
  Class,
  ClassFeatureProgression,
  Feat,
  FeatureOption,
  RuleSet,
  Species,
  Spell,
  SpellSlotTable,
  StatMethod,
  Subclass,
} from '@/lib/types/database'
import type { LegalityResult } from '@/lib/legality/engine'
import type {
  EquipmentItemChoiceInput,
  FeatChoiceInput,
  SpellChoiceInput,
} from '@/lib/characters/choice-persistence'
import {
  buildAsiBonusMap,
  buildTypedAsiChoices,
  type AsiSelection,
} from '@/lib/characters/asi-provenance'
import {
  buildTypedLanguageChoices,
  buildTypedToolChoices,
} from '@/lib/characters/language-tool-provenance'
import {
  buildSpeciesAbilityBonusMap,
  buildTypedAbilityBonusChoices,
  type AbilityKey as SpeciesChoiceAbilityKey,
} from '@/lib/characters/species-ability-bonus-provenance'
import { buildTypedSkillProficiencies } from '@/lib/characters/skill-provenance'
import {
  buildTypedFeatSpellChoices,
  getFeatSpellChoiceDefinitions,
} from '@/lib/characters/feat-spell-options'
import {
  createBuildBackgroundSummary,
  deriveCharacter,
  normalizeToolProficiencies,
  progressionRowToSummary,
  type BuildClassSummary,
  type CharacterBuildContext,
  type DerivedCharacter,
} from '@/lib/characters/build-context'
import {
  getStaticSpeciesGrantedSpells,
  getStaticSubclassFeatureGrantedSpells,
} from '@/lib/characters/feature-grants'
import type { FeatSlotDefinition } from '@/lib/characters/feat-slots'
import { hitPointGainFromRoll } from '@/lib/characters/derived'

export interface ClassDetail extends Class {
  progression: ClassFeatureProgression[]
  spell_slots: SpellSlotTable[]
}

export type SpellOption = Spell & {
  granted_by_subclasses?: string[]
  counts_against_selection_limit?: boolean
  available_via_class_ids?: string[]
  source_feature_key?: string | null
}

export type WizardLevel = {
  class_id: string
  level: number
  subclass_id: string | null
  hp_roll?: number | null
}

export type WizardStatRoll = {
  assigned_to: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  roll_set: number[]
}

export type WizardLegalitySummary = {
  blockers: string[]
  warnings: string[]
  successes: string[]
}

type LocalBuildContextArgs = {
  campaign: Campaign | null
  allowedSources: string[]
  allSourceRuleSets: Record<string, RuleSet>
  statMethod: StatMethod
  persistedHpMax?: number
  stats: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>
  statRolls?: WizardStatRoll[]
  selectedSpecies: Species | null
  selectedBackground: Background | null
  levels: WizardLevel[]
  classDetailMap: Record<string, ClassDetail>
  subclassMap: Record<string, Subclass[]>
  spellOptions: SpellOption[]
  spellChoices: string[]
  spellSelections?: SpellChoiceInput[]
  featList: Feat[]
  featChoices: string[]
  asiChoices?: AsiSelection[]
  skillProficiencies?: string[]
  typedSkillProficiencies?: CharacterSkillProficiency[]
  equipmentItems?: EquipmentItemChoiceInput[]
  armorCatalog?: ArmorCatalogEntry[]
  shieldCatalog?: ShieldCatalogEntry[]
  abilityBonusChoices?: SpeciesChoiceAbilityKey[]
  languageChoices?: string[]
  toolChoices?: string[]
  featureOptionChoices?: CharacterFeatureOptionChoice[]
  featureOptionRows?: FeatureOption[]
}

export function buildLocalCharacterContext({
  campaign,
  allowedSources,
  allSourceRuleSets,
  statMethod,
  persistedHpMax = 0,
  stats,
  statRolls = [],
  selectedSpecies,
  selectedBackground,
  levels,
  classDetailMap,
  subclassMap,
  spellOptions,
  spellChoices,
  spellSelections,
  featList,
  featChoices,
  asiChoices = [],
  skillProficiencies = [],
  typedSkillProficiencies = [],
  equipmentItems = [],
  armorCatalog = [],
  shieldCatalog = [],
  abilityBonusChoices = [],
  languageChoices = [],
  toolChoices = [],
  featureOptionChoices = [],
  featureOptionRows = [],
}: LocalBuildContextArgs): CharacterBuildContext | null {
  if (!campaign) return null

  const classes: BuildClassSummary[] = levels.flatMap((level) => {
    const detail = classDetailMap[level.class_id]
    if (!detail) return []

    const subclass = level.subclass_id
      ? (subclassMap[level.class_id] ?? []).find((entry) => entry.id === level.subclass_id) ?? null
      : null

    return [{
      classId: detail.id,
      name: detail.name,
      level: level.level,
      hitDie: detail.hit_die,
      hpRoll: level.hp_roll ?? null,
      source: detail.source,
      spellcastingType: detail.spellcasting_type,
      spellcastingProgression: detail.spellcasting_progression,
      subclassChoiceLevel: detail.subclass_choice_level,
      multiclassPrereqs: detail.multiclass_prereqs,
      skillChoices: detail.skill_choices,
      savingThrowProficiencies: detail.saving_throw_proficiencies,
      armorProficiencies: detail.armor_proficiencies,
      weaponProficiencies: detail.weapon_proficiencies,
      toolProficiencies: normalizeToolProficiencies(detail.tool_proficiencies),
      subclass: subclass
        ? {
            id: subclass.id,
            name: subclass.name,
            source: subclass.source,
            choiceLevel: subclass.choice_level,
          }
        : null,
      progression: detail.progression
        .filter((row) => row.level <= level.level)
        .map((row) => progressionRowToSummary(row, [])),
      spellSlots: detail.spell_slots.find((row) => row.level === level.level)?.slots_by_spell_level ?? [],
    }]
  })

  const spellById = new Map(spellOptions.map((spell) => [spell.id, spell]))
  const featById = new Map(featList.map((feat) => [feat.id, feat]))
  const background = createBuildBackgroundSummary(selectedBackground)
  const backgroundFeat = selectedBackground?.background_feat_id
    ? featById.get(selectedBackground.background_feat_id) ?? null
    : null
  const typedSpellSelections = spellSelections ?? spellChoices.map((spellId) => ({
    spell_id: spellId,
    character_level_id: null,
    owning_class_id: null,
    granting_subclass_id: null,
    acquisition_mode: 'known',
    counts_against_selection_limit: true,
    source_feature_key: null,
  }))
  const totalLevel = levels.reduce((sum, level) => sum + level.level, 0)
  const staticGrantedSpells = getStaticSpeciesGrantedSpells({
    speciesName: selectedSpecies?.name ?? null,
    speciesSource: selectedSpecies?.source ?? null,
    totalLevel,
    spells: spellOptions,
  })
  const staticSubclassGrantedSpells = getStaticSubclassFeatureGrantedSpells({
    classes: classes.map((cls) => ({
      classId: cls.classId,
      level: cls.level,
      subclass: cls.subclass
        ? {
            id: cls.subclass.id,
            name: cls.subclass.name,
            source: cls.subclass.source,
          }
        : null,
    })),
    selectedFeatureOptions: featureOptionChoices,
    optionRows: featureOptionRows,
    spells: spellOptions,
  })
  const selectedSpellSummaries = [
    ...typedSpellSelections
      .map((selection) => {
        const spellId = typeof selection === 'string' ? selection : selection.spell_id
        const spell = spellById.get(spellId)
        if (!spell) return null

        return {
          spell,
          selection: typeof selection === 'string' ? null : selection,
        }
      })
      .filter((entry): entry is { spell: SpellOption; selection: Exclude<SpellChoiceInput, string> | null } => Boolean(entry))
      .map(({ spell, selection }) => ({
        id: spell.id,
        name: spell.name,
        level: spell.level,
        school: spell.school,
        classes: selection?.owning_class_id
          ? Array.from(new Set([
              selection.owning_class_id,
              ...(spell.available_via_class_ids && spell.available_via_class_ids.length > 0 ? spell.available_via_class_ids : spell.classes),
            ]))
          : spell.available_via_class_ids && spell.available_via_class_ids.length > 0
            ? spell.available_via_class_ids
            : spell.classes,
        source: spell.source,
        grantedBySubclassIds: selection?.granting_subclass_id
          ? [selection.granting_subclass_id]
          : spell.granted_by_subclasses ?? [],
        countsAgainstSelectionLimit: selection?.counts_against_selection_limit ?? spell.counts_against_selection_limit !== false,
        sourceFeatureKey: selection?.source_feature_key ?? spell.source_feature_key ?? null,
      })),
    ...staticGrantedSpells.map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      classes: spell.classes,
      source: spell.source,
      grantedBySubclassIds: spell.grantedBySubclassIds,
      countsAgainstSelectionLimit: spell.countsAgainstSelectionLimit,
      sourceFeatureKey: spell.sourceFeatureKey,
    })),
    ...staticSubclassGrantedSpells.map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      classes: spell.classes,
      source: spell.source,
      grantedBySubclassIds: spell.grantedBySubclassIds,
      countsAgainstSelectionLimit: spell.countsAgainstSelectionLimit,
      sourceFeatureKey: spell.sourceFeatureKey,
    })),
  ]
  const dedupedSelectedSpells = Array.from(
    new Map(selectedSpellSummaries.map((spell) => [spell.id, spell])).values()
  )
  const grantedSpellIds = Array.from(new Set([
    ...typedSpellSelections
      .map((selection) => typeof selection === 'string' ? selection : selection.spell_id)
      .filter((spellId) => (spellById.get(spellId)?.granted_by_subclasses?.length ?? 0) > 0),
    ...typedSpellSelections
      .filter((selection): selection is Exclude<SpellChoiceInput, string> => typeof selection !== 'string')
      .filter((selection) => selection.acquisition_mode === 'granted' || Boolean(selection.source_feature_key))
      .map((selection) => selection.spell_id),
    ...staticGrantedSpells.map((spell) => spell.id),
    ...staticSubclassGrantedSpells.map((spell) => spell.id),
  ]))
  const freePreparedSpellIds = Array.from(new Set([
    ...typedSpellSelections
      .map((selection) => typeof selection === 'string' ? selection : selection.spell_id)
      .filter((spellId) => spellById.get(spellId)?.counts_against_selection_limit === false),
    ...typedSpellSelections
      .filter((selection): selection is Exclude<SpellChoiceInput, string> => typeof selection !== 'string')
      .filter((selection) => selection.counts_against_selection_limit === false)
      .map((selection) => selection.spell_id),
    ...staticGrantedSpells.map((spell) => spell.id),
    ...staticSubclassGrantedSpells.map((spell) => spell.id),
  ]))

  return {
    allowedSources,
    campaignSettings: campaign.settings,
    campaignRuleSet: campaign.rule_set as RuleSet,
    allSourceRuleSets,
    statMethod,
    persistedHpMax,
    baseStats: stats,
    statRolls,
    skillProficiencies,
    skillExpertise: typedSkillProficiencies
      .filter((row) => row.expertise)
      .map((row) => row.skill),
    selectedAbilityBonuses: buildSpeciesAbilityBonusMap(selectedSpecies, abilityBonusChoices),
    selectedAsiBonuses: buildAsiBonusMap(asiChoices),
    selectedAsiChoices: asiChoices.flatMap((selection, slotIndex) => {
      const bonusByAbility = selection.reduce<Partial<Record<SpeciesChoiceAbilityKey, number>>>((acc, ability) => {
        acc[ability] = (acc[ability] ?? 0) + 1
        return acc
      }, {})
      return Object.entries(bonusByAbility).map(([ability, bonus]) => ({
        id: `draft-asi-${slotIndex}-${ability}`,
        slotIndex,
        ability: ability as SpeciesChoiceAbilityKey,
        bonus: bonus ?? 0,
        characterLevelId: null,
        sourceFeatureKey: null,
      }))
    }),
    equipmentItems: equipmentItems.map((item) => ({
      itemId: item.item_id,
      equipped: item.equipped ?? false,
    })),
    armorCatalog: armorCatalog.map((entry) => ({
      itemId: entry.item_id,
      name: entry.name,
      armorCategory: entry.armor_category,
      baseAc: entry.base_ac,
      dexBonusCap: entry.dex_bonus_cap,
    })),
    shieldCatalog: shieldCatalog.map((entry) => ({
      itemId: entry.item_id,
      name: entry.name,
      armorClassBonus: entry.armor_class_bonus,
    })),
    asiChoiceSlots: asiChoices
      .map((selection, slotIndex) => ({
        slotIndex,
        bonuses: selection.reduce<Partial<Record<SpeciesChoiceAbilityKey, number>>>((acc, ability) => {
          acc[ability] = (acc[ability] ?? 0) + 1
          return acc
        }, {}),
      }))
    .filter((slot) => Object.keys(slot.bonuses).length > 0),
  speciesName: selectedSpecies?.name ?? null,
    selectedLanguages: languageChoices,
    selectedTools: toolChoices,
    speciesSource: selectedSpecies?.source ?? null,
    speciesAbilityBonuses: selectedSpecies?.ability_score_bonuses.reduce<Record<string, number>>((acc, bonus) => {
      acc[bonus.ability] = (acc[bonus.ability] ?? 0) + bonus.bonus
      return acc
    }, {}) ?? {},
  speciesSpeed: selectedSpecies?.speed ?? null,
  speciesSize: selectedSpecies?.size ?? null,
  speciesLanguages: selectedSpecies?.languages ?? [],
  speciesTraits: [],
  speciesSenses: selectedSpecies?.senses ?? [],
  speciesDamageResistances: selectedSpecies?.damage_resistances ?? [],
  speciesConditionImmunities: selectedSpecies?.condition_immunities ?? [],
    background,
    backgroundFeat: backgroundFeat
      ? {
          id: backgroundFeat.id,
          name: backgroundFeat.name,
          source: backgroundFeat.source,
          prerequisites: backgroundFeat.prerequisites,
        }
      : null,
    classes,
    selectedSpells: dedupedSelectedSpells,
    selectedFeats: featChoices
      .map((featId) => featById.get(featId))
      .filter((feat): feat is Feat => Boolean(feat))
      .map((feat) => ({
        id: feat.id,
        name: feat.name,
        source: feat.source,
        prerequisites: feat.prerequisites,
      })),
    selectedFeatChoices: featChoices.flatMap((featId, index) => {
      const feat = featById.get(featId)
      if (!feat) return []
      return [{
        id: `draft-feat-${index}-${feat.id}`,
        featId: feat.id,
        featName: feat.name,
        choiceKind: 'asi_or_feat',
        characterLevelId: null,
        sourceFeatureKey: null,
      }]
    }),
    classLevelAnchors: [],
    selectedFeatureOptions: featureOptionChoices,
    featureOptions: featureOptionRows.map((option) => ({
      group_key: option.group_key,
      key: option.key,
      name: option.name,
      description: option.description,
      effects: option.effects,
    })),
    sourceCollections: {
      classSources: classes.map((cls) => cls.source),
      subclassSources: classes
        .map((cls) => cls.subclass?.source)
        .filter((value): value is string => Boolean(value)),
      spellSources: typedSpellSelections
        .map((selection) => spellById.get(typeof selection === 'string' ? selection : selection.spell_id)?.source)
        .filter((value): value is string => Boolean(value)),
      featSources: [
        ...featChoices
          .map((featId) => featById.get(featId)?.source)
          .filter((value): value is string => Boolean(value)),
        ...(backgroundFeat ? [backgroundFeat.source] : []),
      ],
    },
    grantedSpellIds,
    expandedSpellIds: typedSpellSelections
      .map((selection) => typeof selection === 'string' ? selection : selection.spell_id)
      .filter((spellId) => (spellById.get(spellId)?.available_via_class_ids?.length ?? 0) > 0),
    freePreparedSpellIds,
    multiclassSpellSlotsByCasterLevel: {},
  }
}

export function buildWizardHitDieRows(
  levels: WizardLevel[],
  classDetailMap: Record<string, ClassDetail>
): Array<WizardLevel & { hitDie: number }> {
  return levels.flatMap((entry) => {
    const detail = classDetailMap[entry.class_id]
    if (!detail) return []

    return Array.from({ length: Math.max(0, entry.level) }, (_, index) => ({
      class_id: entry.class_id,
      subclass_id: index === entry.level - 1 ? entry.subclass_id : null,
      level: index + 1,
      hitDie: detail.hit_die,
    }))
  })
}

export function calculateCreationHpMax(
  levels: Array<WizardLevel & { hitDie: number }>,
  constitution: number
): number {
  const conMod = Math.floor((constitution - 10) / 2)
  return levels.reduce((total, level) => total + Math.max(1, level.hitDie + conMod), 0)
}

export function calculateLevelUpHpGain(
  hitDie: number,
  constitution: number,
  hpGainRoll: number
): number {
  return hitPointGainFromRoll(hitDie, Math.floor((constitution - 10) / 2), hpGainRoll)
}

export function getMulticlassSkillChoiceConfig(cls: Class | ClassDetail | null): { count: number; from: string[] } | null {
  if (!cls) return null
  const raw = cls.multiclass_proficiencies as Record<string, unknown>
  const skillConfig = raw.skills
  if (!skillConfig || typeof skillConfig !== 'object') return null

  const count = typeof (skillConfig as { count?: unknown }).count === 'number'
    ? (skillConfig as { count: number }).count
    : 0
  const from = Array.isArray((skillConfig as { from?: unknown }).from)
    ? (skillConfig as { from: unknown[] }).from.filter((value): value is string => typeof value === 'string')
    : []

  return count > 0 && from.length > 0 ? { count, from } : null
}

export function deriveLocalCharacter(
  context: CharacterBuildContext | null
): DerivedCharacter | null {
  return context ? deriveCharacter(context) : null
}

export function buildTypedSpellChoices(args: {
  spellChoices: string[]
  spellOptions: SpellOption[]
  owningClassId: string | null
  activeSubclassIds?: string[]
  derived: DerivedCharacter | null
}): SpellChoiceInput[] {
  const { spellChoices, spellOptions, owningClassId, activeSubclassIds = [], derived } = args
  const byId = new Map(spellOptions.map((spell) => [spell.id, spell]))
  const sourceSummary = owningClassId
    ? derived?.spellcasting.sources.find((source) => source.classId === owningClassId) ?? null
    : null

  return spellChoices.map((spellId) => {
    const spell = byId.get(spellId)
    const grantingSubclassId = spell?.granted_by_subclasses?.find((subclassId) => activeSubclassIds.includes(subclassId)) ?? null
    return {
      spell_id: spellId,
      character_level_id: null,
      owning_class_id: owningClassId,
      granting_subclass_id: grantingSubclassId,
      acquisition_mode: grantingSubclassId ? 'granted' : (sourceSummary?.mode ?? derived?.spellcasting.mode ?? 'known'),
      counts_against_selection_limit: spell?.counts_against_selection_limit !== false,
      source_feature_key: grantingSubclassId
        ? `subclass_bonus_spell:${grantingSubclassId}`
        : spell?.source_feature_key ?? null,
    }
  })
}

export function buildCombinedSpellSelections(args: {
  classSpellChoices: string[]
  spellOptions: SpellOption[]
  owningClassId: string | null
  activeSubclassIds?: string[]
  derived: DerivedCharacter | null
  featSpellChoices: Record<string, string>
  featList: Feat[]
}): SpellChoiceInput[] {
  const featSpellDefinitions = getFeatSpellChoiceDefinitions(args.featList)

  return [
    ...buildTypedSpellChoices({
      spellChoices: args.classSpellChoices,
      spellOptions: args.spellOptions,
      owningClassId: args.owningClassId,
      activeSubclassIds: args.activeSubclassIds,
      derived: args.derived,
    }),
    ...buildTypedFeatSpellChoices({
      featSpellChoices: args.featSpellChoices,
      definitions: featSpellDefinitions,
    }),
  ]
}

export function buildTypedFeatChoices(
  featChoices: string[],
  featSlots: FeatSlotDefinition[] | undefined
): FeatChoiceInput[] {
  return featChoices.map((featId, index) => {
    if (!featId) return ''

    return {
      feat_id: featId,
      character_level_id: null,
      choice_kind: 'feat',
      source_feature_key: featSlots?.[index]?.sourceFeatureKey ?? null,
    }
  })
}

export { buildTypedSkillProficiencies }
export { buildTypedAsiChoices, type AsiSelection }
export { buildTypedLanguageChoices, buildTypedToolChoices }
export { buildTypedAbilityBonusChoices }

export function summarizeWizardLegality(result: LegalityResult | null): WizardLegalitySummary {
  if (!result) {
    return {
      blockers: [],
      warnings: [],
      successes: [],
    }
  }

  const blockers: string[] = []
  const warnings: string[] = []
  const successes: string[] = []

  for (const check of result.checks) {
    if (!check.passed) {
      const target = check.severity === 'error' ? blockers : warnings
      target.push(humanizeLegalityCheck(check))
      continue
    }

    const success = summarizePassedCheck(check)
    if (success) successes.push(success)
  }

  return {
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    successes: Array.from(new Set(successes)).slice(0, 4),
  }
}

function humanizeLegalityCheck(check: LegalityResult['checks'][number]): string {
  switch (check.key) {
    case 'source_allowlist':
      return 'One or more choices use sources that are not allowed in this campaign.'
    case 'rule_set_consistency':
      return 'Some selected content comes from a different ruleset than the campaign.'
    case 'stat_method_consistency':
      return 'Your ability score method does not match the campaign setting.'
    case 'stat_method':
      return 'Your ability scores do not match the chosen generation method yet.'
    case 'level_cap':
      return 'This build goes past the campaign level cap.'
    case 'skill_proficiencies':
      return 'One or more selected skills are not available to this build.'
    case 'species_ability_bonus_choices':
      return 'A flexible species ability bonus is missing or assigned to an invalid ability.'
    case 'asi_choices':
      return 'An ASI allocation is invalid or exceeds the available progression slots.'
    case 'multiclass_prerequisites':
      return 'A multiclass choice is missing the required ability scores.'
    case 'subclass_timing':
      return 'A subclass is missing or selected too early for at least one class.'
    case 'feat_prerequisites':
      return 'At least one feat is missing its prerequisite.'
    case 'feat_slots':
      return 'You have picked more feats than this build currently unlocks.'
    case 'spell_legality':
      return 'At least one selected spell is not available to this build yet.'
    case 'subclass_feature_option_selections':
      return 'A subclass with required option picks is still missing one or more selections.'
    case 'spell_selection_count':
      return 'You have chosen more spells or cantrips than this build allows.'
    default:
      return check.message
  }
}

function summarizePassedCheck(check: LegalityResult['checks'][number]): string | null {
  switch (check.key) {
    case 'source_allowlist':
      return 'Allowed campaign sources'
    case 'stat_method':
      return 'Valid ability scores'
    case 'level_cap':
      return 'Level cap respected'
    case 'subclass_timing':
      return 'Subclass timing looks good'
    case 'spell_selection_count':
      return 'Spell counts fit the build'
    case 'feat_slots':
      return 'Feat slots fit the build'
    default:
      return null
  }
}
