import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Background,
  Class,
  ClassFeature,
  ClassFeatureProgression,
  Database,
  CharacterAbilityBonusChoice,
  CharacterFeatChoice,
  CharacterLanguageChoice,
  CharacterSpellSelection,
  CharacterToolChoice,
  Feat,
  MulticlassSpellSlotTable,
  Species,
  Spell,
  SpellSlotTable,
  SpeciesBonusSpell,
  Subclass,
  SubclassBonusSpell,
  SubclassFeature,
} from '@/lib/types/database'
import {
  createBuildBackgroundSummary,
  normalizeToolProficiencies,
  progressionRowToSummary,
  type AbilityKey,
  type BuildClassSummary,
  type BuildFeatSummary,
  type BuildSpellSummary,
  type CharacterBuildContext,
} from '@/lib/characters/build-context'

function toAbilityBonusMap(species: Species | null): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {}
  for (const entry of species?.ability_score_bonuses ?? []) {
    const ability = entry.ability as AbilityKey
    bonuses[ability] = (bonuses[ability] ?? 0) + entry.bonus
  }
  return bonuses
}

function toSelectedAbilityBonusMap(
  rows: CharacterAbilityBonusChoice[]
): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {}
  for (const entry of rows) {
    bonuses[entry.ability] = (bonuses[entry.ability] ?? 0) + entry.bonus
  }
  return bonuses
}

export async function buildCharacterBuildContext(
  supabase: SupabaseClient<Database>,
  characterId: string
): Promise<CharacterBuildContext | null> {
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (!character) return null

  const [
    campaignResult,
    allowlistResult,
    levelsResult,
    statRollsResult,
    skillsResult,
    abilityBonusChoicesResult,
    languageChoicesResult,
    toolChoicesResult,
    speciesResult,
    backgroundResult,
    spellSelectionsResult,
    featSelectionsResult,
    allSourcesResult,
  ] = await Promise.all([
    supabase.from('campaigns').select('settings, rule_set').eq('id', character.campaign_id).single(),
    supabase.from('campaign_source_allowlist').select('source_key').eq('campaign_id', character.campaign_id),
    supabase.from('character_levels').select('*').eq('character_id', characterId).order('taken_at'),
    supabase.from('character_stat_rolls').select('assigned_to, roll_set').eq('character_id', characterId),
    supabase.from('character_skill_proficiencies').select('*').eq('character_id', characterId),
    supabase.from('character_ability_bonus_choices').select('*').eq('character_id', characterId),
    supabase.from('character_language_choices').select('*').eq('character_id', characterId),
    supabase.from('character_tool_choices').select('*').eq('character_id', characterId),
    character.species_id
      ? supabase.from('species').select('*').eq('id', character.species_id).single()
      : Promise.resolve({ data: null }),
    character.background_id
      ? supabase.from('backgrounds').select('*').eq('id', character.background_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('character_spell_selections').select('*').eq('character_id', characterId),
    supabase.from('character_feat_choices').select('*').eq('character_id', characterId),
    supabase.from('sources').select('key, rule_set'),
  ])

  const levels = levelsResult.data ?? []
  const background = (backgroundResult.data as Background | null) ?? null
  const species = (speciesResult.data as Species | null) ?? null
  const classIds = Array.from(new Set(levels.map((level) => level.class_id)))
  const subclassIds = levels
    .map((level) => level.subclass_id)
    .filter((id): id is string => Boolean(id))

  const spellIds: string[] = []
  const featIds: string[] = []
  const typedSpellSelections = (spellSelectionsResult.data ?? []) as CharacterSpellSelection[]
  const typedFeatSelections = (featSelectionsResult.data ?? []) as CharacterFeatChoice[]
  spellIds.push(...typedSpellSelections.map((row) => row.spell_id))
  featIds.push(...typedFeatSelections.map((row) => row.feat_id))

  if (background?.background_feat_id) {
    featIds.push(background.background_feat_id)
  }

  const [
    classesResult,
    subclassesResult,
    progressionResult,
    classFeatureResult,
    subclassFeatureResult,
    spellSlotsResult,
    multiclassSlotsResult,
    subclassBonusSpellsResult,
    speciesBonusSpellsResult,
    spellsResult,
    featsResult,
  ] = await Promise.all([
    classIds.length > 0
      ? supabase.from('classes').select('*').in('id', classIds)
      : Promise.resolve({ data: [] }),
    subclassIds.length > 0
      ? supabase.from('subclasses').select('*').in('id', subclassIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('class_feature_progression').select('*').in('class_id', classIds).order('level')
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('class_features').select('*')
      : Promise.resolve({ data: [] }),
    subclassIds.length > 0
      ? supabase.from('subclass_features').select('*').in('subclass_id', subclassIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('spell_slot_tables').select('*').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    supabase.from('multiclass_spell_slot_table').select('*'),
    subclassIds.length > 0
      ? supabase.from('subclass_bonus_spells').select('*').in('subclass_id', subclassIds)
      : Promise.resolve({ data: [] }),
    species?.id
      ? supabase.from('species_bonus_spells').select('*').eq('species_id', species.id)
      : Promise.resolve({ data: [] }),
    spellIds.length > 0
      ? supabase.from('spells').select('*').in('id', Array.from(new Set(spellIds)))
      : Promise.resolve({ data: [] }),
    featIds.length > 0
      ? supabase.from('feats').select('*').in('id', Array.from(new Set(featIds)))
      : Promise.resolve({ data: [] }),
  ])

  const classesById = new Map<string, Class>((classesResult.data ?? []).map((row) => [row.id, row as Class]))
  const subclassesById = new Map<string, Subclass>((subclassesResult.data ?? []).map((row) => [row.id, row as Subclass]))
  const spellById = new Map<string, Spell>((spellsResult.data ?? []).map((row) => [row.id, row as Spell]))
  const featById = new Map<string, Feat>((featsResult.data ?? []).map((row) => [row.id, row as Feat]))
  const featuresById = new Map<string, ClassFeature>((classFeatureResult.data ?? []).map((row) => [row.id, row as ClassFeature]))
  const subclassFeaturesBySubclassId = new Map<string, SubclassFeature[]>()
  for (const row of (subclassFeatureResult.data ?? []) as SubclassFeature[]) {
    const existing = subclassFeaturesBySubclassId.get(row.subclass_id) ?? []
    existing.push(row)
    subclassFeaturesBySubclassId.set(row.subclass_id, existing)
  }

  const progressionByClassId = new Map<string, ClassFeatureProgression[]>()
  for (const row of (progressionResult.data ?? []) as ClassFeatureProgression[]) {
    const existing = progressionByClassId.get(row.class_id) ?? []
    existing.push(row)
    progressionByClassId.set(row.class_id, existing)
  }

  const spellSlotsByClassId = new Map<string, SpellSlotTable[]>()
  for (const row of (spellSlotsResult.data ?? []) as SpellSlotTable[]) {
    const existing = spellSlotsByClassId.get(row.class_id) ?? []
    existing.push(row)
    spellSlotsByClassId.set(row.class_id, existing)
  }

  const activeSubclassBonusSpells = ((subclassBonusSpellsResult.data ?? []) as SubclassBonusSpell[]).filter((row) => {
    const matchingClass = buildClassesForLevelLookup(levels, row.subclass_id)
    return matchingClass !== null && matchingClass.level >= row.required_class_level
  })
  const activeSpeciesBonusSpells = (speciesBonusSpellsResult.data ?? []) as SpeciesBonusSpell[]
  const bonusSpellRowsBySpellId = new Map<string, SubclassBonusSpell[]>()
  for (const row of activeSubclassBonusSpells) {
    const existing = bonusSpellRowsBySpellId.get(row.spell_id) ?? []
    existing.push(row)
    bonusSpellRowsBySpellId.set(row.spell_id, existing)
  }

  const buildClasses: BuildClassSummary[] = levels.flatMap((level) => {
    const cls = classesById.get(level.class_id)
    if (!cls) return []

    const subclass = level.subclass_id ? subclassesById.get(level.subclass_id) ?? null : null
    const subclassFeaturesByLevel = new Map<number, string[]>()
    if (subclass) {
      for (const feature of (subclassFeaturesBySubclassId.get(subclass.id) ?? []).filter((row) => row.level <= level.level)) {
        const existing = subclassFeaturesByLevel.get(feature.level) ?? []
        existing.push(feature.name)
        subclassFeaturesByLevel.set(feature.level, existing)
      }
    }
    const availableProgression = (progressionByClassId.get(cls.id) ?? [])
      .filter((row) => row.level <= level.level)
      .sort((left, right) => left.level - right.level)
      .map((row) =>
        progressionRowToSummary(
          row,
          [
            ...row.features
              .map((featureId) => featuresById.get(featureId)?.name)
              .filter((name): name is string => Boolean(name)),
            ...(subclassFeaturesByLevel.get(row.level) ?? []),
          ]
        )
      )

    const spellSlotRow = (spellSlotsByClassId.get(cls.id) ?? []).find((row) => row.level === level.level)

    return [{
      classId: cls.id,
      name: cls.name,
      level: level.level,
      hitDie: cls.hit_die,
      hpRoll: level.hp_roll ?? null,
      source: cls.source,
      spellcastingType: cls.spellcasting_type,
      spellcastingProgression: cls.spellcasting_progression,
      subclassChoiceLevel: cls.subclass_choice_level,
      multiclassPrereqs: cls.multiclass_prereqs,
      skillChoices: cls.skill_choices,
      savingThrowProficiencies: cls.saving_throw_proficiencies,
      armorProficiencies: cls.armor_proficiencies,
      weaponProficiencies: cls.weapon_proficiencies,
      toolProficiencies: normalizeToolProficiencies(cls.tool_proficiencies),
      subclass: subclass
        ? {
            id: subclass.id,
            name: subclass.name,
            source: subclass.source,
            choiceLevel: subclass.choice_level,
          }
        : null,
      progression: availableProgression,
      spellSlots: spellSlotRow?.slots_by_spell_level ?? [],
    }]
  })

  const typedSpellSelectionsBySpellId = new Map<string, CharacterSpellSelection[]>()
  for (const row of typedSpellSelections) {
    const existing = typedSpellSelectionsBySpellId.get(row.spell_id) ?? []
    existing.push(row)
    typedSpellSelectionsBySpellId.set(row.spell_id, existing)
  }

  const selectedSpells: BuildSpellSummary[] = spellIds
    .map((spellId) => spellById.get(spellId))
    .filter((spell): spell is Spell => Boolean(spell))
    .map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      classes: spell.classes,
      source: spell.source,
      grantedBySubclassIds: typedSpellSelections.length > 0
        ? (typedSpellSelectionsBySpellId.get(spell.id) ?? [])
            .map((row) => row.granting_subclass_id)
            .filter((value): value is string => Boolean(value))
        : (bonusSpellRowsBySpellId.get(spell.id) ?? []).map((row) => row.subclass_id),
      owningClassId: typedSpellSelections.length > 0
        ? (typedSpellSelectionsBySpellId.get(spell.id) ?? []).find((row) => row.owning_class_id !== null)?.owning_class_id ?? null
        : null,
      acquisitionMode: typedSpellSelections.length > 0
        ? (typedSpellSelectionsBySpellId.get(spell.id) ?? []).find((row) => Boolean(row.acquisition_mode))?.acquisition_mode ?? 'known'
        : 'known',
      sourceFeatureKey: typedSpellSelections.length > 0
        ? (typedSpellSelectionsBySpellId.get(spell.id) ?? []).find((row) => Boolean(row.source_feature_key))?.source_feature_key ?? null
        : null,
      countsAgainstSelectionLimit: typedSpellSelections.length > 0
        ? !((typedSpellSelectionsBySpellId.get(spell.id) ?? []).some((row) => !row.counts_against_selection_limit))
        : !(bonusSpellRowsBySpellId.get(spell.id) ?? []).some(
            (row) => !row.counts_against_selection_limit
          ),
    }))

  const selectedFeatIds = new Set(
    typedFeatSelections.map((row) => row.feat_id)
  )
  const selectedFeats: BuildFeatSummary[] = Array.from(selectedFeatIds)
    .map((featId) => featById.get(featId))
    .filter((feat): feat is Feat => Boolean(feat))
    .map((feat) => ({
      id: feat.id,
      name: feat.name,
      source: feat.source,
      prerequisites: feat.prerequisites,
    }))

  const backgroundFeat = background?.background_feat_id
    ? featById.get(background.background_feat_id) ?? null
    : null

  const allSourceRuleSets = Object.fromEntries(
    (allSourcesResult.data ?? []).map((source) => [source.key, source.rule_set as '2014' | '2024'])
  )

  const sourceCollections = {
    classSources: buildClasses.map((cls) => cls.source),
    subclassSources: buildClasses
      .map((cls) => cls.subclass?.source)
      .filter((value): value is string => Boolean(value)),
    spellSources: selectedSpells.map((spell) => spell.source),
    featSources: [
      ...selectedFeats.map((feat) => feat.source),
      ...(backgroundFeat ? [backgroundFeat.source] : []),
    ],
  }

  const campaignSettings = campaignResult.data?.settings ?? {
    stat_method: 'point_buy',
    max_level: 20,
    milestone_levelling: false,
  }

  const multiclassSpellSlotsByCasterLevel = Object.fromEntries(
    ((multiclassSlotsResult.data ?? []) as MulticlassSpellSlotTable[]).map((row) => [row.caster_level, row.slots_by_spell_level])
  )

  return {
    allowedSources: (allowlistResult.data ?? []).map((row) => row.source_key),
    campaignSettings,
    campaignRuleSet: (campaignResult.data?.rule_set ?? '2014') as '2014' | '2024',
    allSourceRuleSets,
    statMethod: character.stat_method,
    persistedHpMax: character.hp_max,
    baseStats: {
      str: character.base_str,
      dex: character.base_dex,
      con: character.base_con,
      int: character.base_int,
      wis: character.base_wis,
      cha: character.base_cha,
    },
    statRolls: (statRollsResult.data ?? []).map((row) => ({
      assigned_to: row.assigned_to,
      roll_set: row.roll_set,
    })),
    skillProficiencies: (skillsResult.data ?? []).map((row) => row.skill),
    selectedAbilityBonuses: toSelectedAbilityBonusMap((abilityBonusChoicesResult.data ?? []) as CharacterAbilityBonusChoice[]),
    speciesName: species?.name ?? null,
    selectedLanguages: ((languageChoicesResult.data ?? []) as CharacterLanguageChoice[]).map((row) => row.language),
    selectedTools: ((toolChoicesResult.data ?? []) as CharacterToolChoice[]).map((row) => row.tool),
    speciesSource: species?.source ?? null,
    speciesAbilityBonuses: toAbilityBonusMap(species),
    speciesSpeed: species?.speed ?? null,
    speciesSize: species?.size ?? null,
    speciesLanguages: species?.languages ?? [],
    speciesSenses: species?.senses ?? [],
    speciesDamageResistances: species?.damage_resistances ?? [],
    speciesConditionImmunities: species?.condition_immunities ?? [],
    background: createBuildBackgroundSummary(background),
    backgroundFeat: backgroundFeat
      ? {
          id: backgroundFeat.id,
          name: backgroundFeat.name,
          source: backgroundFeat.source,
          prerequisites: backgroundFeat.prerequisites,
        }
      : null,
    classes: buildClasses,
    selectedSpells,
    selectedFeats,
    sourceCollections,
    grantedSpellIds: Array.from(new Set([
      ...activeSubclassBonusSpells.map((row) => row.spell_id),
      ...typedSpellSelections
        .filter((row) => row.acquisition_mode === 'granted' || Boolean(row.source_feature_key))
        .map((row) => row.spell_id),
    ])),
    freePreparedSpellIds: Array.from(new Set(
      [
        ...activeSubclassBonusSpells
          .filter((row) => !row.counts_against_selection_limit)
          .map((row) => row.spell_id),
        ...typedSpellSelections
          .filter((row) => !row.counts_against_selection_limit)
          .map((row) => row.spell_id),
      ]
    )),
    speciesExpandedSpellIds: activeSpeciesBonusSpells.map((row) => row.spell_id),
    multiclassSpellSlotsByCasterLevel,
  }
}

function buildClassesForLevelLookup(
  levels: Array<{ class_id: string; level: number; subclass_id: string | null }>,
  subclassId: string
) {
  return levels.find((level) => level.subclass_id === subclassId) ?? null
}

export async function buildLegalityInput(
  supabase: SupabaseClient<Database>,
  characterId: string
): Promise<CharacterBuildContext | null> {
  return buildCharacterBuildContext(supabase, characterId)
}
