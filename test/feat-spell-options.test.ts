import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveCharacter, type CharacterBuildContext } from '@/lib/characters/build-context'
import { getFeatSpellChoiceDefinitions } from '@/lib/characters/feat-spell-options'
import { runLegalityChecks } from '@/lib/legality/engine'

function createContext(overrides: Partial<CharacterBuildContext> = {}): CharacterBuildContext {
  return {
    allowedSources: ['SRD', 'EE'],
    campaignSettings: {
      stat_method: 'point_buy',
      max_level: 20,
      milestone_levelling: false,
    },
    campaignRuleSet: '2014',
    allSourceRuleSets: { SRD: '2014', EE: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 20,
    baseStats: { str: 10, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    statRolls: [],
    skillProficiencies: ['arcana', 'history'],
    skillExpertise: [],
    selectedLanguages: [],
    selectedTools: [],
    selectedAbilityBonuses: {},
    selectedAsiBonuses: {},
    selectedAsiChoices: [],
    asiChoiceSlots: [],
    speciesName: 'Human',
    speciesLineage: 'human',
    speciesSource: 'SRD',
    speciesAbilityBonuses: {},
    speciesSpeed: 30,
    speciesSize: 'medium',
    speciesLanguages: [],
    speciesTraits: [],
    speciesSenses: [],
    speciesDamageResistances: [],
    speciesConditionImmunities: [],
    background: null,
    backgroundFeat: null,
    classes: [{
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
      subclass: null,
      progression: [
        { level: 1, asiAvailable: false, proficiencyBonus: 2, featureNames: ['Spellcasting'] },
        { level: 2, asiAvailable: false, proficiencyBonus: 2, featureNames: [] },
        { level: 3, asiAvailable: false, proficiencyBonus: 2, featureNames: [] },
      ],
      spellSlots: [4, 2],
    }],
    selectedSpells: [],
    selectedFeats: [],
    selectedFeatChoices: [],
    classLevelAnchors: [],
    selectedFeatureOptions: [],
    featureOptions: [],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: [],
      spellSources: [],
      featSources: ['EE'],
    },
    grantedSpellIds: [],
    freePreparedSpellIds: [],
    expandedSpellIds: [],
    multiclassSpellSlotsByCasterLevel: {
      1: [2],
      2: [3],
      3: [4, 2],
    },
    ...overrides,
  }
}

test('getFeatSpellChoiceDefinitions exposes Aberrant Dragonmark choices from benefits metadata', () => {
  const definitions = getFeatSpellChoiceDefinitions([{
    id: 'feat-aberrant-dragonmark',
    name: 'Aberrant Dragonmark',
    prerequisites: [],
    description: '',
    benefits: {
      spell_choices: [
        {
          key: 'cantrip',
          label: 'Aberrant Dragonmark cantrip',
          spell_level: 0,
          spell_list_class_name: 'Sorcerer',
          acquisition_mode: 'granted',
          counts_against_selection_limit: false,
        },
      ],
    },
    source: 'EE',
    amended: false,
    amendment_note: null,
  }])

  assert.deepEqual(definitions.map((definition) => ({
    label: definition.label,
    spellLevel: definition.spellLevel,
    spellListClassName: definition.spellListClassNames[0],
    sourceFeatureKey: definition.sourceFeatureKey,
  })), [{
    label: 'Aberrant Dragonmark cantrip',
    spellLevel: 0,
    spellListClassName: 'Sorcerer',
    sourceFeatureKey: 'feat_spell:feat-aberrant-dragonmark:cantrip',
  }])
})

test('getFeatSpellChoiceDefinitions falls back for Aberrant Dragonmark on current seeded source', () => {
  const definitions = getFeatSpellChoiceDefinitions([{
    id: 'feat-aberrant-dragonmark-erftlw',
    name: 'Aberrant Dragonmark',
    prerequisites: [],
    description: '',
    benefits: {},
    source: 'ERftLW',
    amended: true,
    amendment_note: null,
  }])

  assert.deepEqual(definitions.map((definition) => ({
    label: definition.label,
    spellLevel: definition.spellLevel,
    spellListClassName: definition.spellListClassNames[0],
    sourceFeatureKey: definition.sourceFeatureKey,
  })), [
    {
      label: 'Aberrant Dragonmark cantrip',
      spellLevel: 0,
      spellListClassName: 'Sorcerer',
      sourceFeatureKey: 'feat_spell:feat-aberrant-dragonmark-erftlw:cantrip',
    },
    {
      label: 'Aberrant Dragonmark 1st-level spell',
      spellLevel: 1,
      spellListClassName: 'Sorcerer',
      sourceFeatureKey: 'feat_spell:feat-aberrant-dragonmark-erftlw:level_1_spell',
    },
  ])
})

test('feat-granted off-list spells stay legal and out of class selection caps', () => {
  const context = createContext({
    selectedSpells: [{
      id: 'chaos-bolt',
      name: 'Chaos Bolt',
      level: 1,
      classes: ['sorcerer'],
      source: 'EE',
      grantedBySubclassIds: [],
      sourceFeatureKey: 'feat_spell:feat-aberrant-dragonmark:level_1_spell',
      countsAgainstSelectionLimit: false,
    }],
    grantedSpellIds: ['chaos-bolt'],
    freePreparedSpellIds: ['chaos-bolt'],
    expandedSpellIds: ['chaos-bolt'],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: [],
      spellSources: ['EE'],
      featSources: ['EE'],
    },
  })

  const legality = runLegalityChecks(context)
  const derived = deriveCharacter(context)

  assert.equal(legality.checks.find((check) => check.key === 'spell_legality')?.passed, true)
  assert.equal(legality.checks.find((check) => check.key === 'spell_selection_count')?.passed, true)
  assert.deepEqual(
    derived.spellcasting.sources[0]?.selectedSpells.map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      source: spell.source,
      granted: spell.granted,
      countsAgainstSelectionLimit: spell.countsAgainstSelectionLimit,
      category: spell.category,
      grantLabel: spell.grantLabel,
    })),
    [{
      id: 'chaos-bolt',
      name: 'Chaos Bolt',
      level: 1,
      source: 'EE',
      granted: true,
      countsAgainstSelectionLimit: false,
      category: 'granted',
      grantLabel: 'Feat spell: Level 1 Spell',
    }]
  )
  assert.equal(derived.spellcasting.selectedSpells[0]?.granted, true)
})
