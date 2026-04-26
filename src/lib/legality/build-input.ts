import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Armor,
  Background,
  Class,
  ClassFeature,
  ClassFeatureProgression,
  Database,
  CharacterAbilityBonusChoice,
  CharacterAsiChoice,
  CharacterClassLevel,
  CharacterEquipmentItem,
  CharacterFeatChoice,
  CharacterFeatureOptionChoice,
  CharacterLanguageChoice,
  CharacterSpellSelection,
  CharacterToolChoice,
  EquipmentItem,
  Feat,
  FeatureOption,
  MulticlassSpellSlotTable,
  Shield,
  Species,
  SpeciesTrait,
  Spell,
  SpellSlotTable,
  SpeciesBonusSpell,
  Subclass,
  SubclassBonusSpell,
  SubclassFeature,
} from '@/lib/types/database'
import { aggregateCharacterLevels, sortCharacterClassLevels } from '@/lib/characters/class-levels'
import {
  createBuildBackgroundSummary,
  normalizeToolProficiencies,
  progressionRowToSummary,
  createBuildSpeciesTraitSummaries,
  type AbilityKey,
  type BuildClassSummary,
  type BuildFeatSummary,
  type BuildFeatureUnlockSummary,
  type BuildSpellSummary,
  type CharacterBuildContext,
} from '@/lib/characters/build-context'
import {
  buildAllSourceRuleSets,
  resolveAllowedSources,
} from '@/lib/characters/wizard-context'

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

function toSelectedAsiBonusMap(
  rows: CharacterAsiChoice[]
): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {}
  for (const entry of rows) {
    bonuses[entry.ability] = (bonuses[entry.ability] ?? 0) + entry.bonus
  }
  return bonuses
}

function toAsiChoiceSlots(rows: CharacterAsiChoice[]) {
  const grouped = new Map<number, Partial<Record<AbilityKey, number>>>()

  for (const entry of rows) {
    const existing = grouped.get(entry.slot_index) ?? {}
    existing[entry.ability] = (existing[entry.ability] ?? 0) + entry.bonus
    grouped.set(entry.slot_index, existing)
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([slotIndex, bonuses]) => ({ slotIndex, bonuses }))
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
    asiChoicesResult,
    languageChoicesResult,
    toolChoicesResult,
    featureOptionChoicesResult,
    featureOptionsResult,
    equipmentItemsResult,
    speciesResult,
    backgroundResult,
    spellSelectionsResult,
    featSelectionsResult,
    allSourcesResult,
  ] = await Promise.all([
    supabase.from('campaigns').select('settings, rule_set').eq('id', character.campaign_id).single(),
    supabase.from('campaign_source_allowlist').select('source_key').eq('campaign_id', character.campaign_id),
    supabase.from('character_class_levels').select('*').eq('character_id', characterId),
    supabase.from('character_stat_rolls').select('assigned_to, roll_set').eq('character_id', characterId),
    supabase.from('character_skill_proficiencies').select('*').eq('character_id', characterId),
    supabase.from('character_ability_bonus_choices').select('*').eq('character_id', characterId),
    supabase.from('character_asi_choices').select('*').eq('character_id', characterId),
    supabase.from('character_language_choices').select('*').eq('character_id', characterId),
    supabase.from('character_tool_choices').select('*').eq('character_id', characterId),
    supabase.from('character_feature_option_choices').select('*').eq('character_id', characterId),
    supabase.from('feature_options').select('*'),
    supabase.from('character_equipment_items').select('*').eq('character_id', characterId),
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

  const classLevels = sortCharacterClassLevels((levelsResult.data ?? []) as CharacterClassLevel[])
  const levels = aggregateCharacterLevels(classLevels)
  const background = (backgroundResult.data as Background | null) ?? null
  const species = (speciesResult.data as Species | null) ?? null
  const speciesTraitIds = species?.traits ?? []
  const classIds = Array.from(new Set(levels.map((level) => level.class_id)))
  const subclassIds = levels
    .map((level) => level.subclass_id)
    .filter((id): id is string => Boolean(id))

  const spellIds: string[] = []
  const featIds: string[] = []
  const typedSpellSelections = (spellSelectionsResult.data ?? []) as CharacterSpellSelection[]
  const typedFeatSelections = (featSelectionsResult.data ?? []) as CharacterFeatChoice[]
  const typedFeatureOptionChoices = (featureOptionChoicesResult.data ?? []) as CharacterFeatureOptionChoice[]
  const featureOptions = (featureOptionsResult.data ?? []) as FeatureOption[]
  const typedEquipmentItems = (equipmentItemsResult.data ?? []) as CharacterEquipmentItem[]
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
    speciesTraitsResult,
    spellsResult,
    featsResult,
    equipmentCatalogResult,
    armorResult,
    shieldsResult,
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
    speciesTraitIds.length > 0
      ? supabase.from('species_traits').select('*').in('id', speciesTraitIds)
      : Promise.resolve({ data: [] }),
    spellIds.length > 0
      ? supabase.from('spells').select('*').in('id', Array.from(new Set(spellIds)))
      : Promise.resolve({ data: [] }),
    featIds.length > 0
      ? supabase.from('feats').select('*').in('id', Array.from(new Set(featIds)))
      : Promise.resolve({ data: [] }),
    typedEquipmentItems.length > 0
      ? supabase.from('equipment_items').select('*').in('id', Array.from(new Set(typedEquipmentItems.map((row) => row.item_id))))
      : Promise.resolve({ data: [] }),
    typedEquipmentItems.length > 0
      ? supabase.from('armor').select('*').in('item_id', Array.from(new Set(typedEquipmentItems.map((row) => row.item_id))))
      : Promise.resolve({ data: [] }),
    typedEquipmentItems.length > 0
      ? supabase.from('shields').select('*').in('item_id', Array.from(new Set(typedEquipmentItems.map((row) => row.item_id))))
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
  const bonusSpellRowsBySpellId = new Map<string, SubclassBonusSpell[]>()
  for (const row of activeSubclassBonusSpells) {
    const existing = bonusSpellRowsBySpellId.get(row.spell_id) ?? []
    existing.push(row)
    bonusSpellRowsBySpellId.set(row.spell_id, existing)
  }
  const activeSpeciesBonusSpells = ((speciesBonusSpellsResult.data ?? []) as SpeciesBonusSpell[]).filter((row) => {
    const totalLevel = levels.reduce((sum, level) => sum + level.level, 0)
    return totalLevel >= row.minimum_character_level
  })
  const speciesBonusSpellIds = new Set(activeSpeciesBonusSpells.map((row) => row.spell_id))
  const missingSpeciesSpellIds = Array.from(speciesBonusSpellIds).filter((spellId) => !spellById.has(spellId))
  if (missingSpeciesSpellIds.length > 0) {
    const missingSpeciesSpellsResult = await supabase
      .from('spells')
      .select('*')
      .in('id', missingSpeciesSpellIds)

    for (const row of (missingSpeciesSpellsResult.data ?? []) as Spell[]) {
      spellById.set(row.id, row)
    }
  }
  const speciesTraitsById = new Map<string, SpeciesTrait>(
    ((speciesTraitsResult.data ?? []) as SpeciesTrait[]).map((row) => [row.id, row])
  )
  const buildSpeciesTraits = createBuildSpeciesTraitSummaries(
    speciesTraitIds
      .map((traitId) => speciesTraitsById.get(traitId))
      .filter((trait): trait is SpeciesTrait => Boolean(trait))
  )
  const equipmentById = new Map<string, EquipmentItem>(
    ((equipmentCatalogResult.data ?? []) as EquipmentItem[]).map((row) => [row.id, row])
  )
  const armorCatalog = ((armorResult.data ?? []) as Armor[]).flatMap((row) => {
    const item = equipmentById.get(row.item_id)
    if (!item) return []
    return [{
      itemId: row.item_id,
      name: item.name,
      armorCategory: row.armor_category,
      baseAc: row.base_ac,
      dexBonusCap: row.dex_bonus_cap,
    }]
  })
  const shieldCatalog = ((shieldsResult.data ?? []) as Shield[]).flatMap((row) => {
    const item = equipmentById.get(row.item_id)
    if (!item) return []
    return [{
      itemId: row.item_id,
      name: item.name,
      armorClassBonus: row.armor_class_bonus,
    }]
  })

  const buildClasses: BuildClassSummary[] = levels.flatMap((level) => {
    const cls = classesById.get(level.class_id)
    if (!cls) return []

    const subclass = level.subclass_id ? subclassesById.get(level.subclass_id) ?? null : null
    const subclassFeaturesByLevel = new Map<number, BuildFeatureUnlockSummary[]>()
    if (subclass) {
      for (const feature of (subclassFeaturesBySubclassId.get(subclass.id) ?? []).filter((row) => row.level <= level.level)) {
        const existing = subclassFeaturesByLevel.get(feature.level) ?? []
        existing.push({
          name: feature.name,
          description: feature.description,
          sourceType: 'subclass',
          sourceLabel: subclass.name,
          source: feature.source,
          amended: feature.amended,
          amendmentNote: feature.amendment_note,
        })
        subclassFeaturesByLevel.set(feature.level, existing)
      }
    }
    const availableProgression = (progressionByClassId.get(cls.id) ?? [])
      .filter((row) => row.level <= level.level)
      .sort((left, right) => left.level - right.level)
      .map((row) => {
        const featureDetails: BuildFeatureUnlockSummary[] = [
          ...row.features
            .map((featureId) => featuresById.get(featureId))
            .filter((feature): feature is ClassFeature => Boolean(feature))
            .map((feature) => ({
              name: feature.name,
              description: feature.description,
              sourceType: 'class' as const,
              sourceLabel: cls.name,
              source: feature.source,
              amended: feature.amended,
              amendmentNote: feature.amendment_note,
            })),
          ...(subclassFeaturesByLevel.get(row.level) ?? []),
        ]

        return progressionRowToSummary(
          row,
          featureDetails.map((feature) => feature.name),
          featureDetails
        )
      })

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
      school: spell.school,
      classes: typedSpellSelections.length > 0
        ? Array.from(new Set([
            ...spell.classes,
            ...(typedSpellSelectionsBySpellId.get(spell.id) ?? [])
              .map((row) => row.owning_class_id)
              .filter((value): value is string => Boolean(value)),
          ]))
        : spell.classes,
      source: spell.source,
      grantedBySubclassIds: typedSpellSelections.length > 0
        ? (typedSpellSelectionsBySpellId.get(spell.id) ?? [])
            .map((row) => row.granting_subclass_id)
            .filter((value): value is string => Boolean(value))
        : (bonusSpellRowsBySpellId.get(spell.id) ?? []).map((row) => row.subclass_id),
      sourceFeatureKey: typedSpellSelections.length > 0
        ? (typedSpellSelectionsBySpellId.get(spell.id) ?? [])[0]?.source_feature_key ?? null
        : null,
      countsAgainstSelectionLimit: typedSpellSelections.length > 0
        ? !((typedSpellSelectionsBySpellId.get(spell.id) ?? []).some((row) => !row.counts_against_selection_limit))
        : speciesBonusSpellIds.has(spell.id)
          ? false
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

  const allSourceRows = (allSourcesResult.data ?? []).map((source) => ({
    key: source.key,
    rule_set: source.rule_set as '2014' | '2024',
  }))
  const allSourceRuleSets = buildAllSourceRuleSets(allSourceRows)

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
  const classLabelById = new Map(
    levels.map((level) => [level.class_id, classesById.get(level.class_id)?.name ?? 'Unknown Class'])
  )
  const selectedFeatChoiceRows = typedFeatSelections.flatMap((row) => {
    const feat = featById.get(row.feat_id)
    if (!feat) return []
    return [{
      id: row.id,
      featId: row.feat_id,
      featName: feat.name,
      choiceKind: row.choice_kind,
      characterLevelId: row.character_level_id,
      sourceFeatureKey: row.source_feature_key,
    }]
  })

  return {
    allowedSources: resolveAllowedSources(allowlistResult.data ?? [], allSourceRows),
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
    skillExpertise: (skillsResult.data ?? []).filter((row) => row.expertise).map((row) => row.skill),
    selectedAbilityBonuses: toSelectedAbilityBonusMap((abilityBonusChoicesResult.data ?? []) as CharacterAbilityBonusChoice[]),
    selectedAsiBonuses: toSelectedAsiBonusMap((asiChoicesResult.data ?? []) as CharacterAsiChoice[]),
    selectedAsiChoices: ((asiChoicesResult.data ?? []) as CharacterAsiChoice[]).map((row) => ({
      id: row.id,
      slotIndex: row.slot_index,
      ability: row.ability,
      bonus: row.bonus,
      characterLevelId: row.character_level_id,
      sourceFeatureKey: row.source_feature_key,
    })),
    selectedFeatureOptions: typedFeatureOptionChoices,
    featureOptions: featureOptions.map((option) => ({
      group_key: option.group_key,
      key: option.key,
      name: option.name,
      description: option.description,
      prerequisites: option.prerequisites,
      effects: option.effects,
    })),
    equipmentItems: typedEquipmentItems.map((row) => ({
      itemId: row.item_id,
      equipped: row.equipped,
    })),
    armorCatalog,
    shieldCatalog,
    asiChoiceSlots: toAsiChoiceSlots((asiChoicesResult.data ?? []) as CharacterAsiChoice[]),
    speciesName: species?.name ?? null,
    speciesLineage: species?.lineage_key ?? null,
    selectedLanguages: ((languageChoicesResult.data ?? []) as CharacterLanguageChoice[]).map((row) => row.language),
    selectedTools: ((toolChoicesResult.data ?? []) as CharacterToolChoice[]).map((row) => row.tool),
    speciesSource: species?.source ?? null,
    speciesAbilityBonuses: toAbilityBonusMap(species),
    speciesSpeed: species?.speed ?? null,
    speciesSize: species?.size ?? null,
    speciesLanguages: species?.languages ?? [],
    speciesTraits: buildSpeciesTraits,
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
    selectedFeatChoices: selectedFeatChoiceRows,
    classLevelAnchors: classLevels.map((row) => ({
      id: row.id,
      classId: row.class_id,
      className: classLabelById.get(row.class_id) ?? 'Unknown Class',
      levelNumber: row.level_number,
      takenAt: row.taken_at,
    })),
    sourceCollections,
    grantedSpellIds: Array.from(new Set([
      ...activeSubclassBonusSpells.map((row) => row.spell_id),
      ...typedSpellSelections
        .filter((row) => row.acquisition_mode === 'granted' || Boolean(row.source_feature_key))
        .map((row) => row.spell_id),
    ])),
    expandedSpellIds: Array.from(speciesBonusSpellIds),
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
