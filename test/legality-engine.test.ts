import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveCharacterProgression, type CharacterBuildContext } from '@/lib/characters/build-context'
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
    baseStats: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    statRolls: [],
    skillProficiencies: ['arcana', 'history', 'stealth'],
    speciesSource: 'SRD',
    speciesAbilityBonuses: { int: 1 },
    background: {
      id: 'bg',
      name: 'Scholar',
      source: 'SRD',
      skillProficiencies: ['arcana'],
      skillChoiceCount: 1,
      skillChoiceFrom: ['history', 'nature'],
      toolProficiencies: [],
      backgroundFeatId: null,
    },
    backgroundFeat: null,
    classes: [
      {
        classId: 'wizard',
        name: 'Wizard',
        level: 4,
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

test('legality blocks missing multiclass prerequisites and missing subclass', () => {
  const result = runLegalityChecks(createContext({
    baseStats: { str: 10, dex: 14, con: 13, int: 11, wis: 10, cha: 8 },
    classes: [
      {
        classId: 'fighter',
        name: 'Fighter',
        level: 1,
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
      { id: 'magic-missile', name: 'Magic Missile', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true },
      { id: 'shield', name: 'Shield', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true },
      { id: 'sleep', name: 'Sleep', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true },
      { id: 'detect-magic', name: 'Detect Magic', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true },
      { id: 'identify', name: 'Identify', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true },
      { id: 'feather-fall', name: 'Feather Fall', level: 1, classes: ['wizard'], source: 'SRD', grantedBySubclassIds: [], countsAgainstSelectionLimit: true },
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
      { id: 'cure-wounds', name: 'Cure Wounds', level: 1, classes: ['artificer'], source: 'ERftLW', grantedBySubclassIds: [], countsAgainstSelectionLimit: true },
      { id: 'faerie-fire', name: 'Faerie Fire', level: 1, classes: ['artificer'], source: 'ERftLW', grantedBySubclassIds: [], countsAgainstSelectionLimit: true },
      { id: 'heroism', name: 'Heroism', level: 1, classes: [], source: 'ERftLW', grantedBySubclassIds: ['battle-smith'], countsAgainstSelectionLimit: false },
      { id: 'shield', name: 'Shield', level: 1, classes: [], source: 'ERftLW', grantedBySubclassIds: ['battle-smith'], countsAgainstSelectionLimit: false },
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
