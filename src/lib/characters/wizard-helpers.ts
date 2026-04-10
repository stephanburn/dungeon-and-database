import type {
  Background,
  Campaign,
  Class,
  ClassFeatureProgression,
  Feat,
  RuleSet,
  Species,
  Spell,
  SpellSlotTable,
  StatMethod,
  Subclass,
} from '@/lib/types/database'
import type { LegalityResult } from '@/lib/legality/engine'
import {
  createBuildBackgroundSummary,
  normalizeToolProficiencies,
  progressionRowToSummary,
  type BuildClassSummary,
  type CharacterBuildContext,
} from '@/lib/characters/build-context'

export interface ClassDetail extends Class {
  progression: ClassFeatureProgression[]
  spell_slots: SpellSlotTable[]
}

export type SpellOption = Spell & {
  granted_by_subclasses?: string[]
  counts_against_selection_limit?: boolean
}

export type WizardLevel = {
  class_id: string
  level: number
  subclass_id: string | null
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
  stats: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>
  selectedSpecies: Species | null
  selectedBackground: Background | null
  levels: WizardLevel[]
  classDetailMap: Record<string, ClassDetail>
  subclassMap: Record<string, Subclass[]>
  spellOptions: SpellOption[]
  spellChoices: string[]
  featList: Feat[]
  featChoices: string[]
  skillProficiencies: string[]
}

export function buildLocalCharacterContext({
  campaign,
  allowedSources,
  allSourceRuleSets,
  statMethod,
  stats,
  selectedSpecies,
  selectedBackground,
  levels,
  classDetailMap,
  subclassMap,
  spellOptions,
  spellChoices,
  featList,
  featChoices,
  skillProficiencies,
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

  return {
    allowedSources,
    campaignSettings: campaign.settings,
    campaignRuleSet: campaign.rule_set as RuleSet,
    allSourceRuleSets,
    statMethod,
    baseStats: stats,
    statRolls: [],
    skillProficiencies,
    speciesSource: selectedSpecies?.source ?? null,
    speciesAbilityBonuses: selectedSpecies?.ability_score_bonuses.reduce<Record<string, number>>((acc, bonus) => {
      acc[bonus.ability] = (acc[bonus.ability] ?? 0) + bonus.bonus
      return acc
    }, {}) ?? {},
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
    selectedSpells: spellChoices
      .map((spellId) => spellById.get(spellId))
      .filter((spell): spell is SpellOption => Boolean(spell))
      .map((spell) => ({
        id: spell.id,
        name: spell.name,
        level: spell.level,
        classes: spell.classes,
        source: spell.source,
        grantedBySubclassIds: spell.granted_by_subclasses ?? [],
        countsAgainstSelectionLimit: spell.counts_against_selection_limit !== false,
      })),
    selectedFeats: featChoices
      .map((featId) => featById.get(featId))
      .filter((feat): feat is Feat => Boolean(feat))
      .map((feat) => ({
        id: feat.id,
        name: feat.name,
        source: feat.source,
        prerequisites: feat.prerequisites,
      })),
    sourceCollections: {
      classSources: classes.map((cls) => cls.source),
      subclassSources: classes
        .map((cls) => cls.subclass?.source)
        .filter((value): value is string => Boolean(value)),
      spellSources: spellChoices
        .map((spellId) => spellById.get(spellId)?.source)
        .filter((value): value is string => Boolean(value)),
      featSources: [
        ...featChoices
          .map((featId) => featById.get(featId)?.source)
          .filter((value): value is string => Boolean(value)),
        ...(backgroundFeat ? [backgroundFeat.source] : []),
      ],
    },
    grantedSpellIds: spellChoices
      .filter((spellId) => (spellById.get(spellId)?.granted_by_subclasses?.length ?? 0) > 0),
    freePreparedSpellIds: spellChoices
      .filter((spellId) => spellById.get(spellId)?.counts_against_selection_limit === false),
    multiclassSpellSlotsByCasterLevel: {},
  }
}

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
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
  const conMod = abilityModifier(constitution)
  return levels.reduce((total, level) => total + Math.max(1, level.hitDie + conMod), 0)
}

export function calculateLevelUpHpGain(
  hitDie: number,
  constitution: number,
  hpGainRoll: number
): number {
  return Math.max(1, hpGainRoll + abilityModifier(constitution))
}

export function getFixedHpGainValue(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1
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
