import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveCharacter, deriveCharacterProgression, type CharacterBuildContext } from '@/lib/characters/build-context'
import { buildTypedAsiChoices } from '@/lib/characters/asi-provenance'
import { createAsiFeatSlotDefinition } from '@/lib/characters/feat-slots'
import { buildTypedLanguageChoices, buildTypedToolChoices } from '@/lib/characters/language-tool-provenance'
import { buildTypedAbilityBonusChoices } from '@/lib/characters/species-ability-bonus-provenance'
import { buildTypedSkillProficiencies } from '@/lib/characters/skill-provenance'
import { runLegalityChecks, shouldBlockCharacterSubmit } from '@/lib/legality/engine'
import { ARTIFICER_INFUSION_GROUP_KEY } from '@/lib/characters/infusions'
import { FEATURE_OPTION_VALUE_KEY } from '@/lib/characters/feature-grants'

function createContext(overrides: Partial<CharacterBuildContext> = {}): CharacterBuildContext {
  return {
    allowedSources: ['SRD'],
    campaignSettings: {
      stat_method: 'point_buy',
      max_level: 20,
      milestone_levelling: false,
    },
    campaignRuleSet: '2014',
    allSourceRuleSets: { SRD: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 26,
    baseStats: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    statRolls: [],
    skillProficiencies: ['arcana', 'history', 'stealth'],
    skillExpertise: [],
    selectedLanguages: [],
    selectedTools: [],
    selectedAbilityBonuses: {},
    selectedAsiBonuses: {},
    selectedAsiChoices: [],
    selectedFeatureOptions: [],
    featureOptions: [],
    equipmentItems: [],
    armorCatalog: [],
    shieldCatalog: [],
    asiChoiceSlots: [],
    speciesName: 'Human',
    speciesLineage: 'human',
    speciesSource: 'SRD',
    speciesAbilityBonuses: { int: 1 },
    speciesSpeed: 30,
    speciesSize: 'medium',
    speciesLanguages: [],
    speciesTraits: [],
    speciesSenses: [],
    speciesDamageResistances: [],
    speciesConditionImmunities: [],
    background: {
      id: 'bg',
      name: 'Scholar',
      source: 'SRD',
      skillProficiencies: ['arcana'],
      skillChoiceCount: 1,
      skillChoiceFrom: ['history', 'nature'],
      toolProficiencies: [],
      fixedLanguages: [],
      backgroundFeatId: null,
    },
    backgroundFeat: null,
    classes: [
      {
        classId: 'wizard',
        name: 'Wizard',
        level: 4,
        hitDie: 6,
        hpRoll: 4,
        source: 'SRD',
        spellcastingType: 'full',
        spellcastingProgression: {
          mode: 'spellbook',
          spellcasting_ability: 'int',
          cantrips_known_by_level: [3, 3, 3, 4],
          spellbook_spells_by_level: [6, 8, 10, 12],
          prepared_formula: 'class_level',
          prepared_add_ability_mod: true,
          prepared_min: 1,
        },
        subclassChoiceLevel: 2,
        multiclassPrereqs: [{ ability: 'int', min: 13 }],
        skillChoices: { count: 2, from: ['arcana', 'history', 'insight', 'investigation'] },
        savingThrowProficiencies: ['int', 'wis'],
        armorProficiencies: [],
        weaponProficiencies: ['dagger'],
        toolProficiencies: [],
        subclass: { id: 'evoker', name: 'Evoker', source: 'SRD', choiceLevel: 2 },
        progression: [
          {
            level: 1,
            asiAvailable: false,
            proficiencyBonus: 2,
            featureNames: ['Spellcasting'],
            features: [{
              name: 'Spellcasting',
              description: 'Cast wizard spells from a spellbook.',
              sourceType: 'class',
              sourceLabel: 'Wizard',
              source: 'SRD',
              amended: false,
              amendmentNote: null,
            }],
          },
          {
            level: 2,
            asiAvailable: false,
            proficiencyBonus: 2,
            featureNames: ['Arcane Tradition'],
            features: [{
              name: 'Arcane Tradition',
              description: 'Choose a wizard school.',
              sourceType: 'class',
              sourceLabel: 'Wizard',
              source: 'SRD',
              amended: false,
              amendmentNote: null,
            }],
          },
          { level: 3, asiAvailable: false, proficiencyBonus: 2, featureNames: [] },
          { level: 4, asiAvailable: true, proficiencyBonus: 2, featureNames: [] },
        ],
        spellSlots: [4, 3],
      },
    ],
    selectedSpells: [
      {
        id: 'magic-missile',
        name: 'Magic Missile',
        level: 1,
        classes: ['wizard'],
        source: 'SRD',
        grantedBySubclassIds: [],
        countsAgainstSelectionLimit: true,
        sourceFeatureKey: null,
      },
    ],
    selectedFeats: [],
    selectedFeatChoices: [],
    classLevelAnchors: [],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: ['SRD'],
      spellSources: ['SRD'],
      featSources: [],
    },
    grantedSpellIds: [],
    expandedSpellIds: [],
    freePreparedSpellIds: [],
    multiclassSpellSlotsByCasterLevel: {
      1: [2],
      2: [3],
      3: [4, 2],
      4: [4, 3],
      5: [4, 3, 2],
    },
    ...overrides,
  }
}

test('deriveCharacterProgression computes ASI slots and spell slots from class progression', () => {
  const derived = deriveCharacterProgression(createContext())

  assert.equal(derived.totalLevel, 4)
  assert.equal(derived.totalAsiSlots, 1)
  assert.equal(derived.featSlots[0]?.choiceKind, 'asi_or_feat')
  assert.deepEqual(derived.featSlotLabels, ['Wizard 4'])
  assert.deepEqual(derived.spellSlots, [4, 3])
  assert.equal(derived.maxSpellLevel, 2)
  assert.equal(derived.cantripSelectionCap, 4)
  assert.equal(derived.leveledSpellSelectionCap, 12)
})

test('deriveCharacterProgression prepends feat-only slot for Variant Human', () => {
  const derived = deriveCharacterProgression(createContext({
    speciesName: 'Variant Human',
    speciesSource: 'PHB',
  }))

  assert.equal(derived.totalAsiSlots, 2)
  assert.deepEqual(derived.featSlotLabels, ['Variant Human', 'Wizard 4'])
  assert.equal(derived.featSlots[0]?.choiceKind, 'feat_only')
  assert.equal(derived.featSlots[0]?.sourceFeatureKey, 'species_feat:variant_human')
})

test('deriveCharacter exposes milestone 1A core sheet values', () => {
  const derived = deriveCharacter(createContext())

  assert.equal(derived.totalLevel, 4)
  assert.equal(derived.proficiencyBonus, 2)
  assert.deepEqual(derived.abilities.int, {
    base: 12,
    bonus: 1,
    adjusted: 13,
    modifier: 1,
    contributors: [{
      ability: 'int',
      bonus: 1,
      label: 'Human ability bonus',
      sourceFeatureKey: null,
      sourceType: 'species',
    }],
  })
  assert.equal(derived.hitPoints.max, 26)
  assert.equal(derived.hitPoints.constitutionModifier, 1)
  assert.equal(derived.hitPoints.estimatedFromLevels, 22)
  assert.equal(derived.hitPoints.minimumPossible, 16)
  assert.equal(derived.hitPoints.maximumPossible, 26)
  assert.equal(derived.hitPoints.inferredLevelCount, 2)
  assert.equal(derived.hitPoints.usesInferredLevels, true)
  assert.deepEqual(
    derived.savingThrows.filter((save) => save.proficient).map((save) => save.ability),
    ['int', 'wis']
  )
  assert.equal(
    derived.skills.find((skill) => skill.key === 'arcana')?.modifier,
    3
  )
  assert.equal(
    derived.skills.find((skill) => skill.key === 'perception')?.modifier,
    0
  )
  assert.equal(derived.initiative, 2)
  assert.equal(derived.passivePerception, 10)
  assert.equal(derived.armorClass.value, 12)
  assert.equal(derived.armorClass.formula, '10 + DEX (Unarmored)')
  assert.deepEqual(derived.languages, [])
  assert.deepEqual(derived.senses, [])
  assert.equal(derived.subclassStates[0]?.status, 'selected')
  assert.equal(derived.subclassStates[0]?.subclassName, 'Evoker')
  assert.deepEqual(
    derived.features.map((feature) => `${feature.className} ${feature.level}: ${feature.name}`),
    ['Wizard 1: Spellcasting', 'Wizard 2: Arcane Tradition']
  )
  assert.deepEqual(
    derived.features.map((feature) => [feature.name, feature.sourceLabel, feature.description]),
    [
      ['Spellcasting', 'Wizard', 'Cast wizard spells from a spellbook.'],
      ['Arcane Tradition', 'Wizard', 'Choose a wizard school.'],
    ]
  )
  assert.equal(derived.spellcasting.className, 'Wizard')
  assert.equal(derived.spellcasting.mode, 'spellbook')
  assert.equal(derived.spellcasting.selectionSummary, 'Wizard has 12 leveled spells in its spellbook and can prepare 5 of them.')
  assert.deepEqual(derived.spellcasting.selectedSpellCountsByLevel, { 1: 1 })
  assert.deepEqual(
    derived.spellcasting.selectedSpells.map((spell) => ({
      name: spell.name,
      level: spell.level,
      granted: spell.granted,
      countsAgainstSelectionLimit: spell.countsAgainstSelectionLimit,
    })),
    [{
      name: 'Magic Missile',
      level: 1,
      granted: false,
      countsAgainstSelectionLimit: true,
    }]
  )
  assert.deepEqual(derived.proficiencies.skills.sort(), ['arcana', 'history', 'stealth'])
  assert.deepEqual(derived.blockingIssues, [])
  assert.deepEqual(derived.warnings, [])
  assert.deepEqual(derived.hitPoints.hitDice, [
    {
      classId: 'wizard',
      className: 'Wizard',
      dieSize: 6,
      level: 4,
    },
  ])
})

test('deriveCharacter doubles proficiency for expertise-backed skills', () => {
  const derived = deriveCharacter(createContext({
    skillProficiencies: ['arcana'],
    skillExpertise: ['arcana'],
  }))

  assert.equal(derived.skills.find((skill) => skill.key === 'arcana')?.modifier, 5)
})

test('runLegalityChecks treats an empty source allowlist as unrestricted', () => {
  const result = runLegalityChecks(createContext({
    allowedSources: [],
    allSourceRuleSets: { SRD: '2014' },
  }))

  const sourceCheck = result.checks.find((check) => check.key === 'source_allowlist')
  assert.ok(sourceCheck)
  assert.equal(sourceCheck.passed, true)
  assert.equal(sourceCheck.message, 'Campaign has no explicit source allowlist.')
})

test('buildTypedSkillProficiencies tags orc primal intuition picks as species choices', () => {
  const skillChoices = buildTypedSkillProficiencies({
    skillProficiencies: ['perception', 'survival'],
    background: null,
    selectedClass: null,
    species: {
      id: 'orc',
      name: 'Orc',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common', 'Orc'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'ERftLW',
      amended: false,
      amendment_note: null,
    },
  })

  assert.deepEqual(skillChoices, [
    {
      skill: 'perception',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'orc',
      source_feature_key: 'species_trait:primal_intuition',
    },
    {
      skill: 'survival',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'orc',
      source_feature_key: 'species_trait:primal_intuition',
    },
  ])
})

test('buildTypedSkillProficiencies tags changeling and warforged species skill picks', () => {
  const changelingChoices = buildTypedSkillProficiencies({
    skillProficiencies: ['deception', 'persuasion'],
    background: null,
    selectedClass: null,
    species: {
      id: 'changeling',
      name: 'Changeling',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'ERftLW',
      amended: true,
      amendment_note: null,
    },
  })

  const warforgedChoices = buildTypedSkillProficiencies({
    skillProficiencies: ['arcana'],
    background: null,
    selectedClass: null,
    species: {
      id: 'warforged',
      name: 'Warforged',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: ['poison'],
      condition_immunities: [],
      source: 'ERftLW',
      amended: true,
      amendment_note: null,
    },
  })

  assert.deepEqual(changelingChoices, [
    {
      skill: 'deception',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'changeling',
      source_feature_key: 'species_trait:changeling_instincts',
    },
    {
      skill: 'persuasion',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'changeling',
      source_feature_key: 'species_trait:changeling_instincts',
    },
  ])

  assert.deepEqual(warforgedChoices, [
    {
      skill: 'arcana',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'warforged',
      source_feature_key: 'species_trait:specialized_design',
    },
  ])
})

test('buildTypedSkillProficiencies tags half-elf and variant human PHB picks as species choices', () => {
  const halfElfChoices = buildTypedSkillProficiencies({
    skillProficiencies: ['insight', 'perception'],
    background: null,
    selectedClass: null,
    species: {
      id: 'half-elf',
      name: 'Half-Elf',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [{ ability: 'cha', bonus: 2 }],
      languages: ['Common', 'Elvish'],
      traits: [],
      senses: [{ type: 'darkvision', range_ft: 60 }],
      damage_resistances: [],
      condition_immunities: [],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
  })

  const variantHumanChoices = buildTypedSkillProficiencies({
    skillProficiencies: ['perception'],
    background: null,
    selectedClass: null,
    species: {
      id: 'variant-human',
      name: 'Variant Human',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
  })

  assert.deepEqual(halfElfChoices, [
    {
      skill: 'insight',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'half-elf',
      source_feature_key: 'species_trait:skill_versatility',
    },
    {
      skill: 'perception',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'half-elf',
      source_feature_key: 'species_trait:skill_versatility',
    },
  ])

  assert.deepEqual(variantHumanChoices, [
    {
      skill: 'perception',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'variant-human',
      source_feature_key: 'species_trait:variant_human_skill',
    },
  ])
})

test('runLegalityChecks allows overlapping class and half-elf skill selections when slot counts still fit', () => {
  const result = runLegalityChecks(createContext({
    allowedSources: ['SRD', 'PHB'],
    allSourceRuleSets: { SRD: '2014', PHB: '2014' },
    skillProficiencies: ['arcana', 'history', 'insight', 'perception'],
    speciesName: 'Half-Elf',
    speciesSource: 'PHB',
    speciesAbilityBonuses: { cha: 2 },
  }))

  assert.equal(result.checks.find((check) => check.key === 'skill_proficiencies')?.passed, true)
})

test('buildTypedLanguageChoices tags changeling and background language picks with provenance', () => {
  const choices = buildTypedLanguageChoices({
    languageChoices: ['Elvish', 'Draconic', 'Dwarvish', 'Infernal'],
    background: {
      id: 'acolyte',
      name: 'Acolyte',
      skill_proficiencies: [],
      skill_choice_count: 0,
      skill_choice_from: [],
      tool_proficiencies: [],
      languages: ['Any two languages'],
      starting_equipment: [],
      feature: '',
      background_feat_id: null,
      source: 'SRD',
      amended: false,
      amendment_note: null,
    },
    species: {
      id: 'changeling',
      name: 'Changeling',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'ERftLW',
      amended: true,
      amendment_note: null,
    },
  })

  assert.deepEqual(choices, [
    {
      language: 'Elvish',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'changeling',
      source_feature_key: 'species_languages:changeling',
    },
    {
      language: 'Draconic',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'changeling',
      source_feature_key: 'species_languages:changeling',
    },
    {
      language: 'Dwarvish',
      character_level_id: null,
      source_category: 'background_choice',
      source_entity_id: 'acolyte',
      source_feature_key: 'background_languages',
    },
    {
      language: 'Infernal',
      character_level_id: null,
      source_category: 'background_choice',
      source_entity_id: 'acolyte',
      source_feature_key: 'background_languages',
    },
  ])
})

test('buildTypedLanguageChoices tags dragonmarked inherited language picks with provenance', () => {
  const stormChoices = buildTypedLanguageChoices({
    languageChoices: ['Draconic', 'Infernal'],
    background: null,
    species: {
      id: 'storm-half-elf',
      name: 'Half-Elf (Mark of Storm)',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common', 'Elvish'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'ERftLW',
      amended: true,
      amendment_note: null,
    },
  })

  const findingChoices = buildTypedLanguageChoices({
    languageChoices: ['Sylvan', 'Infernal'],
    background: null,
    species: {
      id: 'finding-human',
      name: 'Human (Mark of Finding)',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common', 'Goblin'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'ERftLW',
      amended: true,
      amendment_note: null,
    },
  })

  const detectionEeChoices = buildTypedLanguageChoices({
    languageChoices: ['Celestial', 'Infernal'],
    background: null,
    species: {
      id: 'detection-half-elf-ee',
      name: 'Half-Elf (Mark of Detection)',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common', 'Elvish'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'EE',
      amended: true,
      amendment_note: null,
    },
  })

  assert.deepEqual(stormChoices, [
    {
      language: 'Draconic',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'storm-half-elf',
      source_feature_key: 'species_languages:mark_of_storm_half_elf',
    },
    {
      language: 'Infernal',
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    },
  ])

  assert.deepEqual(findingChoices, [
    {
      language: 'Sylvan',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'finding-human',
      source_feature_key: 'species_languages:mark_of_finding_human',
    },
    {
      language: 'Infernal',
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    },
  ])

  assert.deepEqual(detectionEeChoices, [
    {
      language: 'Celestial',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'detection-half-elf-ee',
      source_feature_key: 'species_languages:mark_of_detection_half_elf',
    },
    {
      language: 'Infernal',
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    },
  ])
})

test('buildTypedLanguageChoices tags PHB human lineage language picks with provenance', () => {
  const halfElfChoices = buildTypedLanguageChoices({
    languageChoices: ['Draconic'],
    background: null,
    species: {
      id: 'half-elf',
      name: 'Half-Elf',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [{ ability: 'cha', bonus: 2 }],
      languages: ['Common', 'Elvish'],
      traits: [],
      senses: [{ type: 'darkvision', range_ft: 60 }],
      damage_resistances: [],
      condition_immunities: [],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
  })

  const variantHumanChoices = buildTypedLanguageChoices({
    languageChoices: ['Draconic'],
    background: null,
    species: {
      id: 'variant-human',
      name: 'Variant Human',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
  })

  assert.deepEqual(halfElfChoices, [
    {
      language: 'Draconic',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'half-elf',
      source_feature_key: 'species_languages:half_elf',
    },
  ])

  assert.deepEqual(variantHumanChoices, [
    {
      language: 'Draconic',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'variant-human',
      source_feature_key: 'species_languages:variant_human',
    },
  ])
})

test('buildTypedToolChoices tags warforged specialized design picks', () => {
  const choices = buildTypedToolChoices({
    toolChoices: ["Thieves' Tools"],
    selectedClass: null,
    species: {
      id: 'warforged',
      name: 'Warforged',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: ['poison'],
      condition_immunities: [],
      source: 'ERftLW',
      amended: true,
      amendment_note: null,
    },
  })

  assert.deepEqual(choices, [
    {
      tool: "Thieves' Tools",
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'warforged',
      source_feature_key: 'species_trait:specialized_design',
    },
  ])
})

test('buildTypedToolChoices tags mark of making artisan tool picks', () => {
  const choices = buildTypedToolChoices({
    toolChoices: ["Smith's Tools", "Thieves' Tools"],
    selectedClass: null,
    species: {
      id: 'making-human',
      name: 'Human (Mark of Making)',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      source: 'ERftLW',
      amended: true,
      amendment_note: null,
    },
  })

  assert.deepEqual(choices, [
    {
      tool: "Smith's Tools",
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'making-human',
      source_feature_key: 'species_trait:artisans_gift',
    },
    {
      tool: "Thieves' Tools",
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    },
  ])
})

test('buildTypedAbilityBonusChoices tags changeling and warforged flexible species bonuses', () => {
  const changelingChoices = buildTypedAbilityBonusChoices({
    id: 'changeling',
    name: 'Changeling',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [{ ability: 'cha', bonus: 2 }],
    languages: ['Common'],
    traits: [],
    senses: [],
    damage_resistances: [],
    condition_immunities: [],
    source: 'ERftLW',
    amended: true,
    amendment_note: null,
  }, ['dex'])

  const warforgedChoices = buildTypedAbilityBonusChoices({
    id: 'warforged',
    name: 'Warforged',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [{ ability: 'con', bonus: 2 }],
    languages: ['Common'],
    traits: [],
    senses: [],
    damage_resistances: ['poison'],
    condition_immunities: [],
    source: 'ERftLW',
    amended: true,
    amendment_note: null,
  }, ['wis'])

  assert.deepEqual(changelingChoices, [{
    ability: 'dex',
    bonus: 1,
    character_level_id: null,
    source_category: 'species_choice',
    source_entity_id: 'changeling',
    source_feature_key: 'species_asi:changeling_flexible_bonus',
  }])

  assert.deepEqual(warforgedChoices, [{
    ability: 'wis',
    bonus: 1,
    character_level_id: null,
    source_category: 'species_choice',
    source_entity_id: 'warforged',
    source_feature_key: 'species_asi:warforged_flexible_bonus',
  }])
})

test('buildTypedAbilityBonusChoices tags dragonmarked flexible species bonuses', () => {
  const detectionChoices = buildTypedAbilityBonusChoices({
    id: 'detection-half-elf',
    name: 'Half-Elf (Mark of Detection)',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [{ ability: 'wis', bonus: 2 }],
    languages: ['Common', 'Elvish'],
    traits: [],
    senses: [],
    damage_resistances: [],
    condition_immunities: [],
    source: 'ERftLW',
    amended: true,
    amendment_note: null,
  }, ['int'])

  const makingChoices = buildTypedAbilityBonusChoices({
    id: 'making-human',
    name: 'Human (Mark of Making)',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [{ ability: 'int', bonus: 2 }],
    languages: ['Common'],
    traits: [],
    senses: [],
    damage_resistances: [],
    condition_immunities: [],
    source: 'ERftLW',
    amended: true,
    amendment_note: null,
  }, ['dex'])

  assert.deepEqual(detectionChoices, [{
    ability: 'int',
    bonus: 1,
    character_level_id: null,
    source_category: 'species_choice',
    source_entity_id: 'detection-half-elf',
    source_feature_key: 'species_asi:mark_of_detection_half_elf',
  }])

  assert.deepEqual(makingChoices, [{
    ability: 'dex',
    bonus: 1,
    character_level_id: null,
    source_category: 'species_choice',
    source_entity_id: 'making-human',
    source_feature_key: 'species_asi:mark_of_making_human',
  }])
})

test('buildTypedAbilityBonusChoices tags PHB half-elf and variant human flexible bonuses', () => {
  const halfElfChoices = buildTypedAbilityBonusChoices({
    id: 'half-elf',
    name: 'Half-Elf',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [{ ability: 'cha', bonus: 2 }],
    languages: ['Common', 'Elvish'],
    traits: [],
    senses: [{ type: 'darkvision', range_ft: 60 }],
    damage_resistances: [],
    condition_immunities: [],
    source: 'PHB',
    amended: false,
    amendment_note: null,
  }, ['dex', 'wis'])

  const variantHumanChoices = buildTypedAbilityBonusChoices({
    id: 'variant-human',
    name: 'Variant Human',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [],
    languages: ['Common'],
    traits: [],
    senses: [],
    damage_resistances: [],
    condition_immunities: [],
    source: 'PHB',
    amended: false,
    amendment_note: null,
  }, ['str', 'con'])

  assert.deepEqual(halfElfChoices, [
    {
      ability: 'dex',
      bonus: 1,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'half-elf',
      source_feature_key: 'species_asi:half_elf',
    },
    {
      ability: 'wis',
      bonus: 1,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'half-elf',
      source_feature_key: 'species_asi:half_elf',
    },
  ])

  assert.deepEqual(variantHumanChoices, [
    {
      ability: 'str',
      bonus: 1,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'variant-human',
      source_feature_key: 'species_asi:variant_human',
    },
    {
      ability: 'con',
      bonus: 1,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'variant-human',
      source_feature_key: 'species_asi:variant_human',
    },
  ])
})

test('buildTypedAsiChoices persists +2 and split +1/+1 allocations by slot', () => {
  const choices = buildTypedAsiChoices(
    [['str', 'str'], ['dex', 'wis']],
    [createAsiFeatSlotDefinition('Wizard 4'), createAsiFeatSlotDefinition('Wizard 8')],
    ['', '']
  )

  assert.deepEqual(choices, [
    {
      slot_index: 0,
      ability: 'str',
      bonus: 2,
      character_level_id: null,
      source_feature_key: 'asi_slot:Wizard 4',
    },
    {
      slot_index: 1,
      ability: 'dex',
      bonus: 1,
      character_level_id: null,
      source_feature_key: 'asi_slot:Wizard 8',
    },
    {
      slot_index: 1,
      ability: 'wis',
      bonus: 1,
      character_level_id: null,
      source_feature_key: 'asi_slot:Wizard 8',
    },
  ])
})

test('buildTypedAsiChoices ignores feat-only slots', () => {
  const choices = buildTypedAsiChoices(
    [['str', 'dex'], ['wis', 'wis']],
    [
      { label: 'Variant Human', choiceKind: 'feat_only', sourceFeatureKey: 'species_feat:variant_human' },
      createAsiFeatSlotDefinition('Wizard 4'),
    ],
    ['', '']
  )

  assert.deepEqual(choices, [
    {
      slot_index: 1,
      ability: 'wis',
      bonus: 2,
      character_level_id: null,
      source_feature_key: 'asi_slot:Wizard 4',
    },
  ])
})

test('deriveCharacter includes background fixed languages and typed selected languages and tools', () => {
  const derived = deriveCharacter(createContext({
    speciesLanguages: ['Common'],
    selectedLanguages: ['Elvish', 'Infernal'],
    selectedTools: ["Thieves' Tools"],
    background: {
      id: 'acolyte',
      name: 'Acolyte',
      source: 'SRD',
      skillProficiencies: ['arcana'],
      skillChoiceCount: 0,
      skillChoiceFrom: [],
      toolProficiencies: ['Herbalism Kit'],
      fixedLanguages: ['Celestial'],
      backgroundFeatId: null,
    },
  }))

  assert.deepEqual(derived.languages.sort(), ['Celestial', 'Common', 'Elvish', 'Infernal'])
  assert.deepEqual(derived.proficiencies.tools.sort(), ['herbalism kit', "thieves' tools"])
})

test('deriveCharacter applies selected species ability bonuses and warforged integrated protection', () => {
  const derived = deriveCharacter(createContext({
    baseStats: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    speciesName: 'Warforged',
    speciesSource: 'ERftLW',
    speciesAbilityBonuses: { con: 2 },
    selectedAbilityBonuses: { wis: 1 },
  }))

  assert.equal(derived.abilities.con.adjusted, 15)
  assert.equal(derived.abilities.wis.adjusted, 11)
  assert.equal(derived.armorClass.value, 13)
  assert.equal(derived.armorClass.formula, '10 + DEX + 1 (Unarmored, Integrated Protection)')
})

test('deriveCharacter computes armor class from equipped armor, shield, and defense style', () => {
  const derived = deriveCharacter(createContext({
    classes: [{
      classId: 'fighter',
      name: 'Fighter',
      level: 1,
      hitDie: 10,
      hpRoll: 10,
      source: 'PHB',
      spellcastingType: null,
      spellcastingProgression: null,
      subclassChoiceLevel: 3,
      multiclassPrereqs: [{ ability: 'str', min: 13 }],
      skillChoices: { count: 2, from: ['athletics', 'history'] },
      savingThrowProficiencies: ['str', 'con'],
      armorProficiencies: ['All armor', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
      toolProficiencies: [],
      subclass: null,
      progression: [{ level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Fighting Style'] }],
      spellSlots: [],
    }],
    selectedFeatureOptions: [{
      id: 'fighter-style',
      character_id: 'character',
      character_level_id: null,
      option_group_key: 'fighting_style:fighter:2014',
      option_key: 'fighter:style',
      selected_value: { feature_option_key: 'defense' },
      choice_order: 0,
      source_category: 'class_feature',
      source_entity_id: 'fighter',
      source_feature_key: 'class_feature:fighting_style:fighter',
      created_at: '',
    }],
    featureOptions: [{
      group_key: 'fighting_style:fighter:2014',
      key: 'defense',
      name: 'Defense',
      description: 'Gain +1 AC while wearing armor.',
      prerequisites: {},
      effects: {},
    }],
    equipmentItems: [
      { itemId: 'plate', equipped: true },
      { itemId: 'shield', equipped: true },
    ],
    armorCatalog: [{
      itemId: 'plate',
      name: 'Plate',
      armorCategory: 'heavy',
      baseAc: 18,
      dexBonusCap: 0,
    }],
    shieldCatalog: [{
      itemId: 'shield',
      name: 'Shield',
      armorClassBonus: 2,
    }],
  }))

  assert.equal(derived.armorClass.value, 21)
  assert.equal(derived.armorClass.formula, '18 (Plate) +2 (Shield) +1 (Defense)')
})

test('deriveCharacter groups feature details and class resources for sheet presentation', () => {
  const derived = deriveCharacter(createContext({
    classes: [{
      classId: 'fighter',
      name: 'Fighter',
      level: 5,
      hitDie: 10,
      hpRoll: 8,
      source: 'PHB',
      spellcastingType: null,
      spellcastingProgression: null,
      subclassChoiceLevel: 3,
      multiclassPrereqs: [{ ability: 'str', min: 13 }],
      skillChoices: { count: 2, from: ['athletics', 'history'] },
      savingThrowProficiencies: ['str', 'con'],
      armorProficiencies: ['All armor', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
      toolProficiencies: [],
      subclass: { id: 'battle-master', name: 'Battle Master', source: 'PHB', choiceLevel: 3 },
      progression: [
        {
          level: 1,
          asiAvailable: false,
          proficiencyBonus: 2,
          featureNames: ['Second Wind'],
          features: [{
            name: 'Second Wind',
            description: 'Regain a burst of stamina in combat.',
            sourceType: 'class',
            sourceLabel: 'Fighter',
            source: 'PHB',
            amended: false,
            amendmentNote: null,
          }],
        },
        {
          level: 2,
          asiAvailable: false,
          proficiencyBonus: 2,
          featureNames: ['Action Surge'],
          features: [{
            name: 'Action Surge',
            description: 'Push beyond normal limits for one additional action.',
            sourceType: 'class',
            sourceLabel: 'Fighter',
            source: 'PHB',
            amended: false,
            amendmentNote: null,
          }],
        },
        {
          level: 3,
          asiAvailable: false,
          proficiencyBonus: 2,
          featureNames: ['Martial Archetype', 'Combat Superiority'],
          features: [
            {
              name: 'Martial Archetype',
              description: 'Choose a fighter archetype.',
              sourceType: 'class',
              sourceLabel: 'Fighter',
              source: 'PHB',
              amended: false,
              amendmentNote: null,
            },
            {
              name: 'Combat Superiority',
              description: 'Learn maneuvers fueled by superiority dice.',
              sourceType: 'subclass',
              sourceLabel: 'Battle Master',
              source: 'PHB',
              amended: false,
              amendmentNote: null,
            },
          ],
        },
        { level: 4, asiAvailable: true, proficiencyBonus: 2, featureNames: ['Ability Score Improvement'] },
        { level: 5, asiAvailable: false, proficiencyBonus: 3, featureNames: ['Extra Attack'] },
      ],
      spellSlots: [],
    }],
    selectedFeatureOptions: [
      {
        id: 'maneuver-1',
        character_id: 'character',
        character_level_id: null,
        option_group_key: 'maneuver:battle_master:2014',
        option_key: 'fighter:maneuver_1',
        selected_value: { feature_option_key: 'trip_attack' },
        choice_order: 0,
        source_category: 'subclass_feature',
        source_entity_id: 'battle-master',
        source_feature_key: 'subclass_feature:battle_master:combat_superiority',
        created_at: '',
      },
      {
        id: 'maneuver-2',
        character_id: 'character',
        character_level_id: null,
        option_group_key: 'maneuver:battle_master:2014',
        option_key: 'fighter:maneuver_2',
        selected_value: { feature_option_key: 'riposte' },
        choice_order: 1,
        source_category: 'subclass_feature',
        source_entity_id: 'battle-master',
        source_feature_key: 'subclass_feature:battle_master:combat_superiority',
        created_at: '',
      },
    ],
    featureOptions: [
      {
        group_key: 'maneuver:battle_master:2014',
        key: 'trip_attack',
        name: 'Trip Attack',
        description: 'Knock a target prone with a superiority-enhanced strike.',
        prerequisites: {},
        effects: {},
      },
      {
        group_key: 'maneuver:battle_master:2014',
        key: 'riposte',
        name: 'Riposte',
        description: 'Punish a missed melee attack with a reaction strike and superiority damage.',
        prerequisites: {},
        effects: {},
      },
    ],
  }))

  assert.deepEqual(
    derived.features.map((feature) => [feature.className, feature.level, feature.name, feature.sourceLabel, feature.description]),
    [
      ['Fighter', 1, 'Second Wind', 'Fighter', 'Regain a burst of stamina in combat.'],
      ['Fighter', 2, 'Action Surge', 'Fighter', 'Push beyond normal limits for one additional action.'],
      ['Fighter', 3, 'Martial Archetype', 'Fighter', 'Choose a fighter archetype.'],
      ['Fighter', 3, 'Combat Superiority', 'Battle Master', 'Learn maneuvers fueled by superiority dice.'],
      ['Fighter', 4, 'Ability Score Improvement', 'Fighter', null],
      ['Fighter', 5, 'Extra Attack', 'Fighter', null],
    ]
  )
  assert.deepEqual(
    derived.classResources.map((resource) => [resource.label, resource.value, resource.recharge]),
    [
      ['Second Wind', '1 use', 'Short or long rest'],
      ['Action Surge', '1 use', 'Short or long rest'],
      ['Superiority Dice', '4d8', 'Short or long rest'],
    ]
  )
  assert.deepEqual(
    derived.combatActions.map((action) => [action.name, action.cost, action.trigger, action.saveDc, action.effect]),
    [
      ['Trip Attack', '1 superiority die', 'When you hit with a weapon attack', 13, 'Knock a target prone with a superiority-enhanced strike.'],
      ['Riposte', '1 superiority die', 'Reaction', 13, 'Punish a missed melee attack with a reaction strike and superiority damage.'],
    ]
  )
})

test('deriveCharacter exposes chronological ASI and feat history with class-level anchors', () => {
  const derived = deriveCharacter(createContext({
    classLevelAnchors: [
      { id: 'wizard-4-level', classId: 'wizard', className: 'Wizard', levelNumber: 4, takenAt: '2026-01-01T00:00:00.000Z' },
      { id: 'wizard-8-level', classId: 'wizard', className: 'Wizard', levelNumber: 8, takenAt: '2026-02-01T00:00:00.000Z' },
      { id: 'fighter-4-level', classId: 'fighter', className: 'Fighter', levelNumber: 4, takenAt: '2026-03-01T00:00:00.000Z' },
    ],
    selectedAsiChoices: [
      {
        id: 'asi-1',
        slotIndex: 0,
        ability: 'int',
        bonus: 2,
        characterLevelId: 'wizard-4-level',
        sourceFeatureKey: 'asi_slot:Wizard 4',
      },
      {
        id: 'asi-2',
        slotIndex: 2,
        ability: 'dex',
        bonus: 1,
        characterLevelId: 'fighter-4-level',
        sourceFeatureKey: 'asi_slot:Fighter 4',
      },
      {
        id: 'asi-3',
        slotIndex: 2,
        ability: 'con',
        bonus: 1,
        characterLevelId: 'fighter-4-level',
        sourceFeatureKey: 'asi_slot:Fighter 4',
      },
    ],
    selectedFeatChoices: [{
      id: 'feat-choice-1',
      featId: 'war-caster',
      featName: 'War Caster',
      choiceKind: 'asi_or_feat',
      characterLevelId: 'wizard-8-level',
      sourceFeatureKey: 'asi_slot:Wizard 8',
    }],
  }))

  assert.deepEqual(
    derived.asiFeatHistory.map((entry) => [
      entry.type,
      entry.label,
      entry.detail,
      entry.className,
      entry.levelNumber,
    ]),
    [
      ['asi', 'Ability Score Improvement', '+2 Intelligence', 'Wizard', 4],
      ['feat', 'War Caster', 'Feat selected instead of ASI', 'Wizard', 8],
      ['asi', 'Ability Score Improvement', '+1 Constitution / +1 Dexterity', 'Fighter', 4],
    ]
  )
})

test('deriveCharacter surfaces reactive species traits as combat options', () => {
  const derived = deriveCharacter(createContext({
    speciesTraits: [{
      id: 'fury',
      name: 'Fury of the Small',
      description: 'When you damage a larger creature, add extra damage.',
      source: 'VGtM',
    }],
  }))

  assert.deepEqual(
    derived.combatActions.map((action) => [action.name, action.sourceLabel, action.trigger, action.cost, action.effect]),
    [[
      'Fury of the Small',
      'Species Trait',
      'When you damage a larger creature',
      'Once per short or long rest',
      'When you damage a larger creature, add extra damage.',
    ]]
  )
})

test('deriveCharacter surfaces species traits like Vigilant Guardian', () => {
  const derived = deriveCharacter(createContext({
    speciesName: 'Human (Mark of Sentinel)',
    speciesSource: 'ERftLW',
    speciesTraits: [{
      id: 'vigilant-guardian',
      name: 'Vigilant Guardian',
      description: 'You can swap places with a nearby ally who is hit by an attack, taking the hit yourself.',
      source: 'ERftLW',
    }],
  }))

  assert.deepEqual(derived.speciesTraits, [{
    id: 'vigilant-guardian',
    name: 'Vigilant Guardian',
    description: 'You can swap places with a nearby ally who is hit by an attack, taking the hit yourself.',
    source: 'ERftLW',
  }])
})

test('legality blocks invalid flexible species ability bonus selections', () => {
  const result = runLegalityChecks(createContext({
    speciesName: 'Changeling',
    speciesSource: 'ERftLW',
    selectedAbilityBonuses: { cha: 1 },
  }))

  assert.equal(result.checks.find((check) => check.key === 'species_ability_bonus_choices')?.passed, false)
})

test('legality blocks ASI allocations that exceed one slot total', () => {
  const result = runLegalityChecks(createContext({
    selectedAsiBonuses: { str: 3 },
    asiChoiceSlots: [{
      slotIndex: 0,
      bonuses: { str: 3 },
    }],
  }))

  assert.equal(result.checks.find((check) => check.key === 'asi_choices')?.passed, false)
})

test('legality blocks missing multiclass prerequisites and missing subclass', () => {
  const result = runLegalityChecks(createContext({
    baseStats: { str: 10, dex: 14, con: 13, int: 11, wis: 10, cha: 8 },
    classes: [
      {
        classId: 'fighter',
        name: 'Fighter',
        level: 1,
        hitDie: 10,
        hpRoll: 10,
        source: 'SRD',
        spellcastingType: 'none',
        spellcastingProgression: { mode: 'none' },
        subclassChoiceLevel: 3,
        multiclassPrereqs: [{ ability: 'str', min: 13 }],
        skillChoices: { count: 2, from: ['athletics', 'history'] },
        savingThrowProficiencies: ['str', 'con'],
        armorProficiencies: ['light armor'],
        weaponProficiencies: ['simple weapons'],
        toolProficiencies: [],
        subclass: null,
        progression: [{ level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: [] }],
        spellSlots: [],
      },
      {
        classId: 'wizard',
        name: 'Wizard',
        level: 2,
        hitDie: 6,
        hpRoll: 4,
        source: 'SRD',
        spellcastingType: 'full',
        spellcastingProgression: {
          mode: 'spellbook',
          spellcasting_ability: 'int',
          cantrips_known_by_level: [3, 3],
          spellbook_spells_by_level: [6, 8],
          prepared_formula: 'class_level',
          prepared_add_ability_mod: true,
          prepared_min: 1,
        },
        subclassChoiceLevel: 2,
        multiclassPrereqs: [{ ability: 'int', min: 13 }],
        skillChoices: { count: 2, from: ['arcana', 'history'] },
        savingThrowProficiencies: ['int', 'wis'],
        armorProficiencies: [],
        weaponProficiencies: ['dagger'],
        toolProficiencies: [],
        subclass: null,
        progression: [
          { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Spellcasting'] },
          { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Arcane Tradition'] },
        ],
        spellSlots: [3],
      },
    ],
    selectedSpells: [],
    skillProficiencies: ['athletics', 'history'],
    sourceCollections: {
      classSources: ['SRD', 'SRD'],
      subclassSources: [],
      spellSources: [],
      featSources: [],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
  }))

  assert.equal(result.passed, false)
  assert.equal(result.checks.find((check) => check.key === 'multiclass_prerequisites')?.passed, false)
  assert.equal(result.checks.find((check) => check.key === 'subclass_timing')?.passed, false)
  assert.deepEqual(
    result.derived?.blockingIssues.map((issue) => issue.key).sort(),
    ['fighting_style_selections', 'multiclass_prerequisites', 'stat_method', 'subclass_timing']
  )
  assert.equal(shouldBlockCharacterSubmit(result), true)
})

test('legality blocks feat prerequisites and extra feat slots', () => {
  const result = runLegalityChecks(createContext({
    selectedFeats: [
      {
        id: 'feat-a',
        name: 'Feat A',
        source: 'SRD',
        prerequisites: [{ type: 'ability', ability: 'cha', min: 13 }],
      },
      {
        id: 'feat-b',
        name: 'Feat B',
        source: 'SRD',
        prerequisites: [],
      },
    ],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: ['SRD'],
      spellSources: ['SRD'],
      featSources: ['SRD', 'SRD'],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
  }))

  assert.equal(result.checks.find((check) => check.key === 'feat_prerequisites')?.passed, false)
  assert.equal(result.checks.find((check) => check.key === 'feat_slots')?.passed, false)
})

test('legality enforces feat species lineage prerequisites', () => {
  const elf = runLegalityChecks(createContext({
    allowedSources: ['SRD', 'ERftLW'],
    speciesName: 'High Elf',
    speciesLineage: 'elf',
    selectedFeats: [{
      id: 'revenant-blade',
      name: 'Revenant Blade',
      source: 'ERftLW',
      prerequisites: [{ type: 'species', lineage: 'elf' }],
    }],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: ['SRD'],
      spellSources: ['SRD'],
      featSources: ['ERftLW'],
    },
  }))
  const halfElf = runLegalityChecks(createContext({
    allowedSources: ['SRD', 'ERftLW'],
    speciesName: 'Half-Elf',
    speciesLineage: 'half_elf',
    selectedFeats: [{
      id: 'revenant-blade',
      name: 'Revenant Blade',
      source: 'ERftLW',
      prerequisites: [{ type: 'species', lineage: 'elf' }],
    }],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: ['SRD'],
      spellSources: ['SRD'],
      featSources: ['ERftLW'],
    },
  }))

  assert.equal(elf.checks.find((check) => check.key === 'feat_prerequisites')?.passed, true)
  assert.equal(halfElf.checks.find((check) => check.key === 'feat_prerequisites')?.passed, false)
})

test('legality blocks invalid spell selections above available spell level', () => {
  const result = runLegalityChecks(createContext({
    selectedSpells: [
      {
        id: 'wish',
        name: 'Wish',
        level: 9,
        classes: ['wizard'],
        source: 'SRD',
        grantedBySubclassIds: [],
        countsAgainstSelectionLimit: true,
        sourceFeatureKey: null,
      },
    ],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: ['SRD'],
      spellSources: ['SRD'],
      featSources: [],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
  }))

  assert.equal(result.checks.find((check) => check.key === 'spell_legality')?.passed, false)
  assert.equal(result.passed, false)
})

test('legality requires fighting style selections when a class unlocks one', () => {
  const result = runLegalityChecks(createContext({
    skillProficiencies: ['athletics', 'survival'],
    classes: [{
      classId: 'fighter',
      name: 'Fighter',
      level: 1,
      hitDie: 10,
      hpRoll: 10,
      source: 'SRD',
      spellcastingType: null,
      spellcastingProgression: null,
      subclassChoiceLevel: 3,
      multiclassPrereqs: [{ ability: 'str', min: 13 }],
      skillChoices: { count: 2, from: ['athletics', 'history'] },
      savingThrowProficiencies: ['str', 'con'],
      armorProficiencies: ['All armor', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
      toolProficiencies: [],
      subclass: null,
      progression: [
        { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Fighting Style', 'Second Wind'] },
      ],
      spellSlots: [],
    }],
    selectedSpells: [],
    selectedFeatureOptions: [],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: [],
      spellSources: [],
      featSources: [],
    },
  }))

  const missingCheck = result.checks.find((check) => check.key === 'fighting_style_selections')
  assert.equal(missingCheck?.passed, false)

  const withStyle = runLegalityChecks(createContext({
    skillProficiencies: ['athletics', 'survival'],
    classes: [{
      classId: 'fighter',
      name: 'Fighter',
      level: 1,
      hitDie: 10,
      hpRoll: 10,
      source: 'SRD',
      spellcastingType: null,
      spellcastingProgression: null,
      subclassChoiceLevel: 3,
      multiclassPrereqs: [{ ability: 'str', min: 13 }],
      skillChoices: { count: 2, from: ['athletics', 'history'] },
      savingThrowProficiencies: ['str', 'con'],
      armorProficiencies: ['All armor', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
      toolProficiencies: [],
      subclass: null,
      progression: [
        { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Fighting Style', 'Second Wind'] },
      ],
      spellSlots: [],
    }],
    selectedSpells: [],
    selectedFeatureOptions: [{
      id: 'fighter-style',
      character_id: 'character',
      character_level_id: null,
      option_group_key: 'fighting_style:fighter:2014',
      option_key: 'fighter:style',
      selected_value: { feature_option_key: 'defense' },
      choice_order: 0,
      source_category: 'class_feature',
      source_entity_id: 'fighter',
      source_feature_key: 'class_feature:fighting_style:fighter',
      created_at: '',
    }],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: [],
      spellSources: [],
      featSources: [],
    },
  }))

  assert.equal(withStyle.checks.find((check) => check.key === 'fighting_style_selections')?.passed, true)
})

test('legality requires PHB subclass feature option selections when a subclass unlocks them', () => {
  const missing = runLegalityChecks(createContext({
    skillProficiencies: ['athletics', 'survival'],
    classes: [{
      classId: 'fighter',
      name: 'Fighter',
      level: 3,
      hitDie: 10,
      hpRoll: 10,
      source: 'PHB',
      spellcastingType: null,
      spellcastingProgression: null,
      subclassChoiceLevel: 3,
      multiclassPrereqs: [{ ability: 'str', min: 13 }],
      skillChoices: { count: 2, from: ['athletics', 'history'] },
      savingThrowProficiencies: ['str', 'con'],
      armorProficiencies: ['All armor', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
      toolProficiencies: [],
      subclass: { id: 'battle-master', name: 'Battle Master', source: 'PHB', choiceLevel: 3 },
      progression: [
        { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Fighting Style'] },
        { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Action Surge'] },
        { level: 3, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Combat Superiority'] },
      ],
      spellSlots: [],
    }],
    selectedSpells: [],
    selectedFeatureOptions: [{
      id: 'fighter-style',
      character_id: 'character',
      character_level_id: null,
      option_group_key: 'fighting_style:fighter:2014',
      option_key: 'fighter:style',
      selected_value: { feature_option_key: 'defense' },
      choice_order: 0,
      source_category: 'class_feature',
      source_entity_id: 'fighter',
      source_feature_key: 'class_feature:fighting_style:fighter',
      created_at: '',
    }],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: ['PHB'],
      spellSources: [],
      featSources: [],
    },
  }))

  assert.equal(missing.checks.find((check) => check.key === 'subclass_feature_option_selections')?.passed, false)

  const withSelections = runLegalityChecks(createContext({
    skillProficiencies: ['athletics', 'survival'],
    classes: [{
      classId: 'fighter',
      name: 'Fighter',
      level: 3,
      hitDie: 10,
      hpRoll: 10,
      source: 'PHB',
      spellcastingType: null,
      spellcastingProgression: null,
      subclassChoiceLevel: 3,
      multiclassPrereqs: [{ ability: 'str', min: 13 }],
      skillChoices: { count: 2, from: ['athletics', 'history'] },
      savingThrowProficiencies: ['str', 'con'],
      armorProficiencies: ['All armor', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
      toolProficiencies: [],
      subclass: { id: 'battle-master', name: 'Battle Master', source: 'PHB', choiceLevel: 3 },
      progression: [
        { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Fighting Style'] },
        { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Action Surge'] },
        { level: 3, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Combat Superiority'] },
      ],
      spellSlots: [],
    }],
    selectedSpells: [],
    selectedFeatureOptions: [
      {
        id: 'fighter-style',
        character_id: 'character',
        character_level_id: null,
        option_group_key: 'fighting_style:fighter:2014',
        option_key: 'fighter:style',
        selected_value: { feature_option_key: 'defense' },
        choice_order: 0,
        source_category: 'class_feature',
        source_entity_id: 'fighter',
        source_feature_key: 'class_feature:fighting_style:fighter',
        created_at: '',
      },
      {
        id: 'maneuver-1',
        character_id: 'character',
        character_level_id: null,
        option_group_key: 'maneuver:battle_master:2014',
        option_key: 'fighter:maneuver_1',
        selected_value: { feature_option_key: 'trip_attack' },
        choice_order: 0,
        source_category: 'subclass_feature',
        source_entity_id: 'battle-master',
        source_feature_key: 'subclass_feature:battle_master:combat_superiority',
        created_at: '',
      },
      {
        id: 'maneuver-2',
        character_id: 'character',
        character_level_id: null,
        option_group_key: 'maneuver:battle_master:2014',
        option_key: 'fighter:maneuver_2',
        selected_value: { feature_option_key: 'riposte' },
        choice_order: 1,
        source_category: 'subclass_feature',
        source_entity_id: 'battle-master',
        source_feature_key: 'subclass_feature:battle_master:combat_superiority',
        created_at: '',
      },
      {
        id: 'maneuver-3',
        character_id: 'character',
        character_level_id: null,
        option_group_key: 'maneuver:battle_master:2014',
        option_key: 'fighter:maneuver_3',
        selected_value: { feature_option_key: 'parry' },
        choice_order: 2,
        source_category: 'subclass_feature',
        source_entity_id: 'battle-master',
        source_feature_key: 'subclass_feature:battle_master:combat_superiority',
        created_at: '',
      },
    ],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: ['PHB'],
      spellSources: [],
      featSources: [],
    },
  }))

  assert.equal(withSelections.checks.find((check) => check.key === 'subclass_feature_option_selections')?.passed, true)
})

test('legality blocks spell selections above class spell-preparation caps', () => {
  const result = runLegalityChecks(createContext({
    selectedSpells: [
      { id: 'magic-missile', name: 'Magic Missile', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'shield', name: 'Shield', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'sleep', name: 'Sleep', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'detect-magic', name: 'Detect Magic', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'identify', name: 'Identify', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'feather-fall', name: 'Feather Fall', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'burning-hands', name: 'Burning Hands', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'charm-person', name: 'Charm Person', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'chromatic-orb', name: 'Chromatic Orb', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'comprehend-languages', name: 'Comprehend Languages', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'disguise-self', name: 'Disguise Self', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'expeditious-retreat', name: 'Expeditious Retreat', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'false-life', name: 'False Life', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
    ],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: ['SRD'],
      spellSources: ['SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD'],
      featSources: [],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
  }))

  assert.equal(result.derived?.spellLevelCaps[1], 4)
  assert.equal(result.derived?.leveledSpellSelectionCap, 12)
  assert.equal(result.checks.find((check) => check.key === 'spell_selection_count')?.passed, false)
})

test('legality blocks too many off-school spells for Eldritch Knight and Arcane Trickster', () => {
  const ek = runLegalityChecks(createContext({
    classes: [{
      classId: 'fighter',
      name: 'Fighter',
      level: 7,
      hitDie: 10,
      hpRoll: 10,
      source: 'PHB',
      spellcastingType: 'third',
      spellcastingProgression: null,
      subclassChoiceLevel: 3,
      multiclassPrereqs: [],
      skillChoices: { count: 2, from: ['athletics', 'history'] },
      savingThrowProficiencies: ['str', 'con'],
      armorProficiencies: ['All armor', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
      toolProficiencies: [],
      subclass: { id: 'eldritch-knight', name: 'Eldritch Knight', source: 'PHB', choiceLevel: 3 },
      progression: [],
      spellSlots: [4, 2],
    }],
    selectedSpells: [
      { id: 'shield', name: 'Shield', level: 1, classes: ['fighter'], source: 'PHB', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'find-familiar', name: 'Find Familiar', level: 1, classes: ['fighter'], source: 'PHB', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null, school: 'Conjuration' } as never,
      { id: 'grease', name: 'Grease', level: 1, classes: ['fighter'], source: 'PHB', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null, school: 'Conjuration' } as never,
    ],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: ['PHB'],
      spellSources: ['PHB'],
      featSources: [],
    },
  }))
  assert.equal(ek.checks.find((check) => check.key === 'spell_legality')?.passed, false)

  const at = runLegalityChecks(createContext({
    classes: [{
      classId: 'rogue',
      name: 'Rogue',
      level: 8,
      hitDie: 8,
      hpRoll: 8,
      source: 'PHB',
      spellcastingType: 'third',
      spellcastingProgression: null,
      subclassChoiceLevel: 3,
      multiclassPrereqs: [],
      skillChoices: { count: 4, from: ['acrobatics', 'stealth'] },
      savingThrowProficiencies: ['dex', 'int'],
      armorProficiencies: ['Light armor'],
      weaponProficiencies: ['Simple', 'Hand crossbows'],
      toolProficiencies: ["Thieves' tools"],
      subclass: { id: 'arcane-trickster', name: 'Arcane Trickster', source: 'PHB', choiceLevel: 3 },
      progression: [],
      spellSlots: [4, 2],
    }],
    selectedSpells: [
      { id: 'disguise-self', name: 'Disguise Self', level: 1, classes: ['rogue'], source: 'PHB', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null, school: 'Illusion' } as never,
      { id: 'silent-image', name: 'Silent Image', level: 1, classes: ['rogue'], source: 'PHB', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null, school: 'Illusion' } as never,
      { id: 'find-familiar', name: 'Find Familiar', level: 1, classes: ['rogue'], source: 'PHB', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null, school: 'Conjuration' } as never,
      { id: 'feather-fall', name: 'Feather Fall', level: 1, classes: ['rogue'], source: 'PHB', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null, school: 'Transmutation' } as never,
      { id: 'sleep', name: 'Sleep', level: 1, classes: ['rogue'], source: 'PHB', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null, school: 'Enchantment' } as never,
    ],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: ['PHB'],
      spellSources: ['PHB'],
      featSources: [],
    },
  }))
  assert.equal(at.checks.find((check) => check.key === 'spell_legality')?.passed, true)
})

test('deriveCharacterProgression supports artificer-style prepared casting rules', () => {
  const derived = deriveCharacterProgression(createContext({
    baseStats: { str: 10, dex: 14, con: 13, int: 18, wis: 10, cha: 8 },
    classes: [
      {
        classId: 'artificer',
        name: 'Artificer',
        level: 3,
        hitDie: 8,
        hpRoll: 5,
        source: 'ERftLW',
        spellcastingType: 'half',
        spellcastingProgression: {
          mode: 'prepared',
          spellcasting_ability: 'int',
          cantrips_known_by_level: [2, 2, 2, 2],
          prepared_formula: 'half_level_down',
          prepared_add_ability_mod: true,
          prepared_min: 1,
        },
        subclassChoiceLevel: 3,
        multiclassPrereqs: [{ ability: 'int', min: 13 }],
        skillChoices: { count: 2, from: ['arcana', 'history'] },
        savingThrowProficiencies: ['con', 'int'],
        armorProficiencies: ['light armor', 'medium armor', 'shields'],
        weaponProficiencies: ['simple weapons'],
        toolProficiencies: ["thieves' tools", "tinker's tools"],
        subclass: { id: 'armorer', name: 'Armorer', source: 'ERftLW', choiceLevel: 3 },
        progression: [
          { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Magical Tinkering'] },
          { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Infuse Item'] },
          { level: 3, asiAvailable: false, proficiencyBonus: 2, featureNames: ['The Right Tool for the Job'] },
        ],
        spellSlots: [3],
      },
    ],
    selectedSpells: [],
    sourceCollections: {
      classSources: ['ERftLW'],
      subclassSources: ['ERftLW'],
      spellSources: [],
      featSources: [],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
    allSourceRuleSets: { SRD: '2014', ERftLW: '2014' },
  }))

  assert.equal(derived.spellSelectionMode, 'prepared')
  assert.equal(derived.spellSelectionClassName, 'Artificer')
  assert.equal(derived.cantripSelectionCap, 2)
  assert.equal(derived.leveledSpellSelectionCap, 5)
})

test('subclass bonus spells stay legal and do not consume artificer preparation capacity', () => {
  const result = runLegalityChecks(createContext({
    baseStats: { str: 10, dex: 14, con: 13, int: 18, wis: 10, cha: 8 },
    allowedSources: ['ERftLW'],
    classes: [
      {
        classId: 'artificer',
        name: 'Artificer',
        level: 3,
        hitDie: 8,
        hpRoll: 5,
        source: 'ERftLW',
        spellcastingType: 'half',
        spellcastingProgression: {
          mode: 'prepared',
          spellcasting_ability: 'int',
          cantrips_known_by_level: [2, 2, 2, 2],
          prepared_formula: 'half_level_down',
          prepared_add_ability_mod: true,
          prepared_min: 1,
        },
        subclassChoiceLevel: 3,
        multiclassPrereqs: [{ ability: 'int', min: 13 }],
        skillChoices: { count: 2, from: ['arcana', 'history'] },
        savingThrowProficiencies: ['con', 'int'],
        armorProficiencies: ['light armor', 'medium armor', 'shields'],
        weaponProficiencies: ['simple weapons'],
        toolProficiencies: ["thieves' tools", "tinker's tools"],
        subclass: { id: 'battle-smith', name: 'Battle Smith', source: 'ERftLW', choiceLevel: 3 },
        progression: [
          { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Magical Tinkering'] },
          { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Infuse Item'] },
          { level: 3, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Battle Smith Spells'] },
        ],
        spellSlots: [3],
      },
    ],
    selectedSpells: [
      { id: 'cure-wounds', name: 'Cure Wounds', level: 1, classes: ['artificer'], source: 'ERftLW', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'faerie-fire', name: 'Faerie Fire', level: 1, classes: ['artificer'], source: 'ERftLW', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'heroism', name: 'Heroism', level: 1, classes: [], source: 'ERftLW', grantedBySubclassIds: ['battle-smith'], countsAgainstSelectionLimit: false, sourceFeatureKey: null },
      { id: 'shield', name: 'Shield', level: 1, classes: [], source: 'ERftLW', grantedBySubclassIds: ['battle-smith'], countsAgainstSelectionLimit: false, sourceFeatureKey: null },
    ],
    sourceCollections: {
      classSources: ['ERftLW'],
      subclassSources: ['ERftLW'],
      spellSources: ['ERftLW', 'ERftLW', 'ERftLW', 'ERftLW'],
      featSources: [],
    },
    grantedSpellIds: ['heroism', 'shield'],
    freePreparedSpellIds: ['heroism', 'shield'],
    allSourceRuleSets: { SRD: '2014', ERftLW: '2014' },
  }))

  assert.equal(result.checks.find((check) => check.key === 'spell_legality')?.passed, true)
  assert.equal(result.checks.find((check) => check.key === 'spell_selection_count')?.passed, true)
})

test('legality blocks unknown artificer infusion selected keys', () => {
  const infusionChoice = (optionKey: string, selectedKey: string, order: number) => ({
    id: `choice-${optionKey}`,
    character_id: 'character',
    character_level_id: null,
    option_group_key: ARTIFICER_INFUSION_GROUP_KEY,
    option_key: optionKey,
    selected_value: { [FEATURE_OPTION_VALUE_KEY]: selectedKey },
    choice_order: order,
    source_category: 'class_feature',
    source_entity_id: 'artificer',
    source_feature_key: 'class_feature:artificer:infuse_item',
    created_at: '',
  })
  const context = createContext({
    baseStats: { str: 10, dex: 14, con: 13, int: 18, wis: 10, cha: 8 },
    allowedSources: ['ERftLW'],
    allSourceRuleSets: { SRD: '2014', ERftLW: '2014' },
    speciesSource: 'ERftLW',
    classes: [{
      classId: 'artificer',
      name: 'Artificer',
      level: 2,
      hitDie: 8,
      hpRoll: null,
      source: 'ERftLW',
      spellcastingType: 'half',
      spellcastingProgression: {
        mode: 'prepared',
        spellcasting_ability: 'int',
        cantrips_known_by_level: [2, 2],
        prepared_formula: 'half_level_down',
        prepared_add_ability_mod: true,
        prepared_min: 1,
      },
      subclassChoiceLevel: 3,
      multiclassPrereqs: [{ ability: 'int', min: 13 }],
      skillChoices: { count: 2, from: ['arcana', 'history'] },
      savingThrowProficiencies: ['con', 'int'],
      armorProficiencies: [],
      weaponProficiencies: [],
      toolProficiencies: [],
      subclass: null,
      progression: [
        { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Magical Tinkering'] },
        { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Infuse Item'] },
      ],
      spellSlots: [2],
    }],
    sourceCollections: { classSources: ['ERftLW'], subclassSources: [], spellSources: [], featSources: [] },
    selectedFeatureOptions: [
      infusionChoice('artificer:infusion_1', 'enhanced_defense', 0),
      infusionChoice('artificer:infusion_2', 'enhanced_weapon', 1),
      infusionChoice('artificer:infusion_3', 'homunculus_servant', 2),
      infusionChoice('artificer:infusion_4', 'not_a_real_infusion', 3),
    ],
    featureOptions: [
      { group_key: ARTIFICER_INFUSION_GROUP_KEY, key: 'enhanced_defense', name: 'Enhanced Defense', description: '', prerequisites: { minimum_class_level: 2 }, effects: {} },
      { group_key: ARTIFICER_INFUSION_GROUP_KEY, key: 'enhanced_weapon', name: 'Enhanced Weapon', description: '', prerequisites: { minimum_class_level: 2 }, effects: {} },
      { group_key: ARTIFICER_INFUSION_GROUP_KEY, key: 'homunculus_servant', name: 'Homunculus Servant', description: '', prerequisites: { minimum_class_level: 2 }, effects: {} },
    ],
  })

  const check = runLegalityChecks(context).checks.find((entry) => entry.key === 'artificer_infusion_selections')

  assert.equal(check?.passed, false)
  assert.match(check?.message ?? '', /not_a_real_infusion/)
})

test('deriveCharacter exposes per-source spellcasting summaries for multiclass casters', () => {
  const derived = deriveCharacter(createContext({
    baseStats: { str: 10, dex: 14, con: 13, int: 16, wis: 14, cha: 8 },
    classes: [
      {
        classId: 'wizard',
        name: 'Wizard',
        level: 3,
        hitDie: 6,
        hpRoll: 4,
        source: 'SRD',
        spellcastingType: 'full',
        spellcastingProgression: {
          mode: 'spellbook',
          spellcasting_ability: 'int',
          cantrips_known_by_level: [3, 3, 3],
          spellbook_spells_by_level: [6, 8, 10],
          prepared_formula: 'class_level',
          prepared_add_ability_mod: true,
          prepared_min: 1,
        },
        subclassChoiceLevel: 2,
        multiclassPrereqs: [{ ability: 'int', min: 13 }],
        skillChoices: { count: 2, from: ['arcana', 'history'] },
        savingThrowProficiencies: ['int', 'wis'],
        armorProficiencies: [],
        weaponProficiencies: ['dagger'],
        toolProficiencies: [],
        subclass: { id: 'evoker', name: 'Evoker', source: 'SRD', choiceLevel: 2 },
        progression: [
          { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Spellcasting'] },
          { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Arcane Tradition'] },
          { level: 3, asiAvailable: false, proficiencyBonus: 2, featureNames: [] },
        ],
        spellSlots: [4, 2],
      },
      {
        classId: 'cleric',
        name: 'Cleric',
        level: 1,
        hitDie: 8,
        hpRoll: 5,
        source: 'SRD',
        spellcastingType: 'full',
        spellcastingProgression: {
          mode: 'prepared',
          spellcasting_ability: 'wis',
          cantrips_known_by_level: [3],
          prepared_formula: 'class_level',
          prepared_add_ability_mod: true,
          prepared_min: 1,
        },
        subclassChoiceLevel: 1,
        multiclassPrereqs: [{ ability: 'wis', min: 13 }],
        skillChoices: { count: 2, from: ['history', 'insight'] },
        savingThrowProficiencies: ['wis', 'cha'],
        armorProficiencies: ['light armor', 'medium armor', 'shields'],
        weaponProficiencies: ['simple weapons'],
        toolProficiencies: [],
        subclass: { id: 'life', name: 'Life', source: 'SRD', choiceLevel: 1 },
        progression: [
          { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Spellcasting'] },
        ],
        spellSlots: [2],
      },
    ],
    selectedSpells: [
      { id: 'magic-missile', name: 'Magic Missile', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'mage-hand', name: 'Mage Hand', level: 0, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'bless', name: 'Bless', level: 1, classes: ['cleric'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'cure-wounds', name: 'Cure Wounds', level: 1, classes: [], source: 'SRD', grantedBySubclassIds: ['life'], countsAgainstSelectionLimit: false, sourceFeatureKey: 'subclass_feature:life_domain:domain_spells' },
    ],
    sourceCollections: {
      classSources: ['SRD', 'SRD'],
      subclassSources: ['SRD', 'SRD'],
      spellSources: ['SRD', 'SRD', 'SRD', 'SRD'],
      featSources: [],
    },
    grantedSpellIds: ['cure-wounds'],
    freePreparedSpellIds: [],
  }))

  assert.equal(derived.spellcasting.sources.length, 2)
  assert.equal(derived.spellcasting.sources[0]?.className, 'Wizard')
  assert.equal(derived.spellcasting.sources[0]?.selectionSummary, 'Wizard has 10 leveled spells in its spellbook and can prepare 6 of them.')
  assert.deepEqual(derived.spellcasting.sources[0]?.selectedSpellCountsByLevel, { 0: 1, 1: 1 })
  assert.equal(derived.spellcasting.sources[0]?.spellSaveDc, 13)
  assert.equal(derived.spellcasting.sources[0]?.spellAttackModifier, 5)
  assert.deepEqual(derived.spellcasting.sources[0]?.knownSpells.map((spell) => spell.name), ['Mage Hand'])
  assert.deepEqual(derived.spellcasting.sources[0]?.spellbookSpells.map((spell) => spell.name), ['Magic Missile'])
  assert.equal(derived.spellcasting.sources[1]?.className, 'Cleric')
  assert.equal(derived.spellcasting.sources[1]?.selectionSummary, 'Cleric can prepare 3 spells.')
  assert.deepEqual(derived.spellcasting.sources[1]?.selectedSpellCountsByLevel, { 1: 1 })
  assert.equal(derived.spellcasting.sources[1]?.spellSaveDc, 12)
  assert.equal(derived.spellcasting.sources[1]?.spellAttackModifier, 4)
  assert.deepEqual(derived.spellcasting.sources[1]?.preparedSpells.map((spell) => spell.name), ['Bless'])
  assert.deepEqual(derived.spellcasting.sources[1]?.grantedSpells.map((spell) => [spell.name, spell.grantLabel]), [
    ['Cure Wounds', 'Subclass feature: Domain Spells'],
  ])
  assert.deepEqual(derived.spellcasting.grantedSpells.map((spell) => [spell.name, spell.grantLabel]), [
    ['Cure Wounds', 'Subclass feature: Domain Spells'],
  ])
})

test('legality enforces spell selection caps per spellcasting source', () => {
  const result = runLegalityChecks(createContext({
    baseStats: { str: 10, dex: 14, con: 13, int: 16, wis: 14, cha: 8 },
    classes: [
      {
        classId: 'wizard',
        name: 'Wizard',
        level: 1,
        hitDie: 6,
        hpRoll: 6,
        source: 'SRD',
        spellcastingType: 'full',
        spellcastingProgression: {
          mode: 'spellbook',
          spellcasting_ability: 'int',
          cantrips_known_by_level: [3],
          spellbook_spells_by_level: [6],
          prepared_formula: 'class_level',
          prepared_add_ability_mod: true,
          prepared_min: 1,
        },
        subclassChoiceLevel: 2,
        multiclassPrereqs: [{ ability: 'int', min: 13 }],
        skillChoices: { count: 2, from: ['arcana', 'history'] },
        savingThrowProficiencies: ['int', 'wis'],
        armorProficiencies: [],
        weaponProficiencies: ['dagger'],
        toolProficiencies: [],
        subclass: null,
        progression: [{ level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Spellcasting'] }],
        spellSlots: [2],
      },
      {
        classId: 'cleric',
        name: 'Cleric',
        level: 1,
        hitDie: 8,
        hpRoll: 8,
        source: 'SRD',
        spellcastingType: 'full',
        spellcastingProgression: {
          mode: 'prepared',
          spellcasting_ability: 'wis',
          cantrips_known_by_level: [3],
          prepared_formula: 'class_level',
          prepared_add_ability_mod: true,
          prepared_min: 1,
        },
        subclassChoiceLevel: 1,
        multiclassPrereqs: [{ ability: 'wis', min: 13 }],
        skillChoices: { count: 2, from: ['history', 'insight'] },
        savingThrowProficiencies: ['wis', 'cha'],
        armorProficiencies: ['light armor', 'medium armor', 'shields'],
        weaponProficiencies: ['simple weapons'],
        toolProficiencies: [],
        subclass: { id: 'life', name: 'Life', source: 'SRD', choiceLevel: 1 },
        progression: [{ level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Spellcasting'] }],
        spellSlots: [2],
      },
    ],
    selectedSpells: [
      { id: 'mage-hand', name: 'Mage Hand', level: 0, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'light', name: 'Light', level: 0, classes: ['wizard', 'cleric'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'sacred-flame', name: 'Sacred Flame', level: 0, classes: ['cleric'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'guidance', name: 'Guidance', level: 0, classes: ['cleric'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'resistance', name: 'Resistance', level: 0, classes: ['cleric'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
    ],
    sourceCollections: {
      classSources: ['SRD', 'SRD'],
      subclassSources: ['SRD'],
      spellSources: ['SRD', 'SRD', 'SRD', 'SRD', 'SRD'],
      featSources: [],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
  }))

  assert.equal(result.checks.find((check) => check.key === 'spell_selection_count')?.passed, false)
  assert.match(
    result.checks.find((check) => check.key === 'spell_selection_count')?.message ?? '',
    /Cleric selected 4 cantrips but the cap is 3\./
  )
})
