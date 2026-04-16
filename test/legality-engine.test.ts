import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveCharacter, deriveCharacterProgression, type CharacterBuildContext } from '@/lib/characters/build-context'
import { buildTypedAsiChoices } from '@/lib/characters/asi-provenance'
import { buildTypedLanguageChoices, buildTypedToolChoices } from '@/lib/characters/language-tool-provenance'
import { buildTypedAbilityBonusChoices } from '@/lib/characters/species-ability-bonus-provenance'
import { buildTypedSkillProficiencies } from '@/lib/characters/skill-provenance'
import { runLegalityChecks, shouldBlockCharacterSubmit } from '@/lib/legality/engine'

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
    selectedLanguages: [],
    selectedTools: [],
    selectedAbilityBonuses: {},
    selectedAsiBonuses: {},
    selectedFeatureOptions: [],
    asiChoiceSlots: [],
    speciesName: 'Human',
    speciesSource: 'SRD',
    speciesAbilityBonuses: { int: 1 },
    speciesSpeed: 30,
    speciesSize: 'medium',
    speciesLanguages: [],
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
          { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Spellcasting'] },
          { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Arcane Tradition'] },
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
  assert.deepEqual(derived.featSlotLabels, ['Wizard 4'])
  assert.deepEqual(derived.spellSlots, [4, 3])
  assert.equal(derived.maxSpellLevel, 2)
  assert.equal(derived.cantripSelectionCap, 4)
  assert.equal(derived.leveledSpellSelectionCap, 5)
})

test('deriveCharacter exposes milestone 1A core sheet values', () => {
  const derived = deriveCharacter(createContext())

  assert.equal(derived.totalLevel, 4)
  assert.equal(derived.proficiencyBonus, 2)
  assert.deepEqual(derived.abilities.int, {
    base: 12,
    adjusted: 13,
    modifier: 1,
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
  assert.equal(derived.spellcasting.className, 'Wizard')
  assert.equal(derived.spellcasting.mode, 'spellbook')
  assert.equal(derived.spellcasting.selectionSummary, 'Wizard can prepare 5 spells from its spellbook.')
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

test('buildTypedAsiChoices persists +2 and split +1/+1 allocations by slot', () => {
  const choices = buildTypedAsiChoices(
    [['str', 'str'], ['dex', 'wis']],
    ['Wizard 4', 'Wizard 8'],
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
    ['multiclass_prerequisites', 'stat_method', 'subclass_timing']
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

test('legality blocks spell selections above class spell-preparation caps', () => {
  const result = runLegalityChecks(createContext({
    selectedSpells: [
      { id: 'magic-missile', name: 'Magic Missile', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'shield', name: 'Shield', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'sleep', name: 'Sleep', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'detect-magic', name: 'Detect Magic', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'identify', name: 'Identify', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
      { id: 'feather-fall', name: 'Feather Fall', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true, sourceFeatureKey: null },
    ],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: ['SRD'],
      spellSources: ['SRD', 'SRD', 'SRD', 'SRD', 'SRD', 'SRD'],
      featSources: [],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
  }))

  assert.equal(result.derived?.spellLevelCaps[1], 4)
  assert.equal(result.derived?.leveledSpellSelectionCap, 5)
  assert.equal(result.checks.find((check) => check.key === 'spell_selection_count')?.passed, false)
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
    ],
    sourceCollections: {
      classSources: ['SRD', 'SRD'],
      subclassSources: ['SRD', 'SRD'],
      spellSources: ['SRD', 'SRD', 'SRD'],
      featSources: [],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
  }))

  assert.equal(derived.spellcasting.sources.length, 2)
  assert.equal(derived.spellcasting.sources[0]?.className, 'Wizard')
  assert.equal(derived.spellcasting.sources[0]?.selectionSummary, 'Wizard can prepare 6 spells from its spellbook.')
  assert.deepEqual(derived.spellcasting.sources[0]?.selectedSpellCountsByLevel, { 0: 1, 1: 1 })
  assert.equal(derived.spellcasting.sources[1]?.className, 'Cleric')
  assert.equal(derived.spellcasting.sources[1]?.selectionSummary, 'Cleric can prepare 3 spells.')
  assert.deepEqual(derived.spellcasting.sources[1]?.selectedSpellCountsByLevel, { 1: 1 })
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
