import test from 'node:test'
import assert from 'node:assert/strict'
import type { Class, Campaign, FeatureOption, Species } from '@/lib/types/database'
import { deriveLocalCharacter, buildLocalCharacterContext, type ClassDetail } from '@/lib/characters/wizard-helpers'
import {
  getSpeciesFeatureOptionDefinitions,
  getSpeciesFeatureSpellChoiceDefinitions,
  getMaverickArcaneBreakthroughOptionDefinitions,
  getMaverickFeatureSpellChoiceDefinitions,
  getSubclassFeatureOptionDefinitions,
  getSelectedMaverickBreakthroughClassIds,
  mergeFeatureOptionChoiceInputs,
} from '@/lib/characters/feature-grants'

const campaign: Campaign = {
  id: 'camp',
  name: 'Test Campaign',
  dm_id: 'dm',
  settings: {
    stat_method: 'point_buy',
    max_level: 20,
    milestone_levelling: false,
  },
  rule_set: '2014',
  created_at: '',
}

test('Maverick Arcane Breakthrough exposes the expected option and spell definitions', () => {
  const classList: Class[] = [
    {
      id: 'artificer',
      name: 'Artificer',
      hit_die: 8,
      primary_ability: ['INT'],
      saving_throw_proficiencies: ['con', 'int'],
      armor_proficiencies: [],
      weapon_proficiencies: [],
      tool_proficiencies: {},
      skill_choices: { count: 2, from: ['arcana'] },
      multiclass_prereqs: [],
      multiclass_proficiencies: {},
      spellcasting_type: 'half',
      spellcasting_progression: null,
      subclass_choice_level: 3,
      source: 'ERftLW',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'wizard',
      name: 'Wizard',
      hit_die: 6,
      primary_ability: ['INT'],
      saving_throw_proficiencies: ['int', 'wis'],
      armor_proficiencies: [],
      weapon_proficiencies: [],
      tool_proficiencies: {},
      skill_choices: { count: 2, from: ['arcana'] },
      multiclass_prereqs: [],
      multiclass_proficiencies: {},
      spellcasting_type: 'full',
      spellcasting_progression: null,
      subclass_choice_level: 2,
      source: 'SRD',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'cleric',
      name: 'Cleric',
      hit_die: 8,
      primary_ability: ['WIS'],
      saving_throw_proficiencies: ['wis', 'cha'],
      armor_proficiencies: [],
      weapon_proficiencies: [],
      tool_proficiencies: {},
      skill_choices: { count: 2, from: ['history'] },
      multiclass_prereqs: [],
      multiclass_proficiencies: {},
      spellcasting_type: 'full',
      spellcasting_progression: null,
      subclass_choice_level: 1,
      source: 'SRD',
      amended: false,
      amendment_note: null,
    },
  ]
  const maverickOptions: FeatureOption[] = [
    {
      id: 'opt-wizard',
      group_key: 'maverick:arcane_breakthrough_classes',
      key: 'wizard',
      name: 'Wizard',
      description: '',
      option_order: 80,
      prerequisites: {},
      effects: { class_id: 'wizard' },
      source: 'EE',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'opt-cleric',
      group_key: 'maverick:arcane_breakthrough_classes',
      key: 'cleric',
      name: 'Cleric',
      description: '',
      option_order: 20,
      prerequisites: {},
      effects: { class_id: 'cleric' },
      source: 'EE',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'opt-bard',
      group_key: 'maverick:arcane_breakthrough_classes',
      key: 'bard',
      name: 'Bard',
      description: '',
      option_order: 10,
      prerequisites: {},
      effects: { class_id: 'bard' },
      source: 'EE',
      amended: false,
      amendment_note: null,
    },
  ]

  const optionDefinitions = getMaverickArcaneBreakthroughOptionDefinitions({
    classLevel: 9,
    subclassId: 'maverick-subclass',
    optionRows: maverickOptions,
  })
  assert.equal(optionDefinitions.length, 3)
  assert.deepEqual(optionDefinitions.map((definition) => definition.optionKey), ['class_3', 'class_5', 'class_9'])
  assert.deepEqual(optionDefinitions[0].choices.map((choice) => choice.label), ['Bard', 'Cleric', 'Wizard'])

  const spellDefinitions = getMaverickFeatureSpellChoiceDefinitions({
    classLevel: 9,
    artificerClassId: 'artificer',
    selectedBreakthroughClassIds: ['wizard', 'cleric'],
    classList,
  })
  assert.deepEqual(
    spellDefinitions.map((definition) => ({
      label: definition.label,
      spellLevel: definition.spellLevel,
      spellLists: definition.spellListClassNames,
      countsAgainstSelectionLimit: definition.countsAgainstSelectionLimit,
    })),
    [
      {
        label: 'Maverick bonus cantrip',
        spellLevel: 0,
        spellLists: ['Artificer', 'Wizard', 'Cleric'],
        countsAgainstSelectionLimit: false,
      },
      {
        label: 'Arcane Breakthrough 1st-level spell',
        spellLevel: 1,
        spellLists: ['Wizard', 'Cleric'],
        countsAgainstSelectionLimit: false,
      },
      {
        label: 'Arcane Breakthrough 2nd-level spell',
        spellLevel: 2,
        spellLists: ['Wizard', 'Cleric'],
        countsAgainstSelectionLimit: false,
      },
      {
        label: 'Arcane Breakthrough 3rd-level spell',
        spellLevel: 3,
        spellLists: ['Wizard', 'Cleric'],
        countsAgainstSelectionLimit: false,
      },
    ]
  )
})

test('legacy Maverick feature option rows still read back into selected class ids', () => {
  const selected = getSelectedMaverickBreakthroughClassIds([
    {
      option_group_key: 'maverick:breakthrough:5',
      option_key: 'wizard',
      selected_value: {},
    },
    {
      option_group_key: 'maverick:breakthrough:3',
      option_key: 'cleric',
      selected_value: {},
    },
  ])

  assert.deepEqual(selected, ['cleric', 'wizard'])
})

test('mergeFeatureOptionChoiceInputs preserves unrelated feature options while replacing the active definition set', () => {
  const merged = mergeFeatureOptionChoiceInputs({
    preservedChoices: [
      {
        option_group_key: 'fighting_style:paladin:2014',
        option_key: 'paladin:style',
        selected_value: { feature_option_key: 'defense' },
      },
      {
        option_group_key: 'fighting_style:fighter:2014',
        option_key: 'fighter:style',
        selected_value: { feature_option_key: 'archery' },
      },
    ],
    replacementDefinitions: [{
      optionGroupKey: 'fighting_style:fighter:2014',
      optionKey: 'fighter:style',
      label: 'Fighting Style',
      choiceOrder: 0,
      choices: [],
      sourceCategory: 'class_feature',
      sourceEntityId: 'fighter',
      sourceFeatureKey: 'class_feature:fighting_style:fighter',
      valueKey: 'feature_option_key',
    }],
    replacements: [{
      option_group_key: 'fighting_style:fighter:2014',
      option_key: 'fighter:style',
      selected_value: { feature_option_key: 'dueling' },
    }],
  })

  assert.deepEqual(merged, [
    {
      option_group_key: 'fighting_style:paladin:2014',
      option_key: 'paladin:style',
      selected_value: { feature_option_key: 'defense' },
    },
    {
      option_group_key: 'fighting_style:fighter:2014',
      option_key: 'fighter:style',
      selected_value: { feature_option_key: 'dueling' },
    },
  ])
})

test('PHB High Elf and Dragonborn expose species-driven spell and option definitions', () => {
  assert.deepEqual(
    getSpeciesFeatureSpellChoiceDefinitions({
      species: { id: 'high-elf', name: 'High Elf', source: 'PHB' },
    }).map((definition) => ({
      label: definition.label,
      spellLevel: definition.spellLevel,
      spellLists: definition.spellListClassNames,
      countsAgainstSelectionLimit: definition.countsAgainstSelectionLimit,
    })),
    [{
      label: 'High Elf cantrip',
      spellLevel: 0,
      spellLists: ['Wizard'],
      countsAgainstSelectionLimit: false,
    }]
  )

  const dragonbornDefinitions = getSpeciesFeatureOptionDefinitions({
    species: { id: 'dragonborn', name: 'Dragonborn', source: 'PHB' },
  })
  assert.equal(dragonbornDefinitions.length, 1)
  assert.equal(dragonbornDefinitions[0]?.optionKey, 'ancestry')
  assert.equal(dragonbornDefinitions[0]?.choices.length, 10)
  assert.equal(dragonbornDefinitions[0]?.choices[0]?.value, 'black')
  assert.equal(dragonbornDefinitions[0]?.choices.at(-1)?.value, 'white')
})

test('PHB Dragonborn ancestry choice contributes derived damage resistance', () => {
  const fighterDetail: ClassDetail = {
    id: 'fighter',
    name: 'Fighter',
    hit_die: 10,
    primary_ability: ['STR'],
    saving_throw_proficiencies: ['str', 'con'],
    armor_proficiencies: ['all'],
    weapon_proficiencies: ['simple', 'martial'],
    tool_proficiencies: {},
    skill_choices: { count: 2, from: ['athletics', 'history'] },
    multiclass_prereqs: [],
    multiclass_proficiencies: {},
    spellcasting_type: 'none',
    spellcasting_progression: null,
    subclass_choice_level: 3,
    source: 'PHB',
    amended: false,
    amendment_note: null,
    progression: [
      { id: 'fighter-1', class_id: 'fighter', level: 1, features: [], asi_available: false, proficiency_bonus: 2 },
    ],
    spell_slots: [],
  }

  const dragonborn: Species = {
    id: 'dragonborn',
    name: 'Dragonborn',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [{ ability: 'str', bonus: 2 }, { ability: 'cha', bonus: 1 }],
    languages: ['Common', 'Draconic'],
    traits: [],
    senses: [],
    damage_resistances: [],
    condition_immunities: [],
    source: 'PHB',
    amended: false,
    amendment_note: null,
  }

  const context = buildLocalCharacterContext({
    campaign,
    allowedSources: ['PHB'],
    allSourceRuleSets: { PHB: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 12,
    stats: { str: 15, dex: 10, con: 14, int: 8, wis: 10, cha: 12 },
    selectedSpecies: dragonborn,
    selectedBackground: null,
    levels: [{ class_id: 'fighter', level: 1, subclass_id: null }],
    classDetailMap: { fighter: fighterDetail },
    subclassMap: {},
    spellOptions: [],
    spellChoices: [],
    featList: [],
    featChoices: [],
    asiChoices: [],
    skillProficiencies: [],
    abilityBonusChoices: [],
    languageChoices: [],
    toolChoices: [],
    featureOptionChoices: [{
      id: 'dragonborn-ancestry',
      character_id: 'local',
      character_level_id: null,
      option_group_key: 'species:dragonborn:ancestry',
      option_key: 'ancestry',
      selected_value: { feature_option_key: 'blue' },
      choice_order: 0,
      source_category: 'species_choice',
      source_entity_id: 'dragonborn',
      source_feature_key: 'species_trait:dragonborn_ancestry',
      created_at: '',
    }],
  })

  assert.ok(context)
  const derived = deriveLocalCharacter(context)
  assert.ok(derived)
  assert.deepEqual(derived.damageResistances, ['lightning'])
  assert.deepEqual(
    derived.speciesTraits.map((trait) => trait.name),
    ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance']
  )
  assert.match(
    derived.speciesTraits.find((trait) => trait.name === 'Breath Weapon')?.description ?? '',
    /DC 12/
  )
  assert.match(
    derived.speciesTraits.find((trait) => trait.name === 'Breath Weapon')?.description ?? '',
    /2d6 lightning damage/
  )
})

test('PHB subclass option systems expose the expected feature option slots', () => {
  const optionRows: FeatureOption[] = [
    {
      id: 'maneuver-1',
      group_key: 'maneuver:battle_master:2014',
      key: 'trip_attack',
      name: 'Trip Attack',
      description: 'Knock a target prone.',
      option_order: 10,
      prerequisites: {},
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'maneuver-2',
      group_key: 'maneuver:battle_master:2014',
      key: 'riposte',
      name: 'Riposte',
      description: 'Punish a missed attack.',
      option_order: 20,
      prerequisites: {},
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'hunter-1',
      group_key: 'hunter:hunters_prey:2014',
      key: 'colossus_slayer',
      name: 'Colossus Slayer',
      description: 'Deal bonus damage once per turn.',
      option_order: 10,
      prerequisites: {},
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'hunter-2',
      group_key: 'hunter:defensive_tactics:2014',
      key: 'steel_will',
      name: 'Steel Will',
      description: 'Resist fear.',
      option_order: 20,
      prerequisites: {},
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'hunter-3',
      group_key: 'hunter:multiattack:2014',
      key: 'volley',
      name: 'Volley',
      description: 'Attack many foes at range.',
      option_order: 30,
      prerequisites: {},
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'hunter-4',
      group_key: 'hunter:superior_defense:2014',
      key: 'evasion',
      name: 'Evasion',
      description: 'Avoid blast damage.',
      option_order: 40,
      prerequisites: {},
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'land-1',
      group_key: 'circle_of_land:terrain:2014',
      key: 'forest',
      name: 'Forest',
      description: 'Woodland circle spells.',
      option_order: 10,
      prerequisites: {},
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'discipline-1',
      group_key: 'elemental_discipline:four_elements:2014',
      key: 'water_whip',
      name: 'Water Whip',
      description: 'Crack a lash of water.',
      option_order: 10,
      prerequisites: { minimum_class_level: 3 },
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'discipline-2',
      group_key: 'elemental_discipline:four_elements:2014',
      key: 'mist_stance',
      name: 'Mist Stance',
      description: 'Turn into mist.',
      option_order: 20,
      prerequisites: { minimum_class_level: 11 },
      effects: {},
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
  ]

  assert.equal(
    getSubclassFeatureOptionDefinitions({
      classId: 'fighter',
      classLevel: 10,
      subclassId: 'battle-master',
      subclassName: 'Battle Master',
      subclassSource: 'PHB',
      optionRows,
    }).length,
    7
  )

  assert.deepEqual(
    getSubclassFeatureOptionDefinitions({
      classId: 'ranger',
      classLevel: 15,
      subclassId: 'hunter',
      subclassName: 'Hunter',
      subclassSource: 'PHB',
      optionRows,
    }).map((definition) => definition.label),
    ["Hunter's Prey", 'Defensive Tactics', 'Multiattack', "Superior Hunter's Defense"]
  )

  assert.equal(
    getSubclassFeatureOptionDefinitions({
      classId: 'druid',
      classLevel: 3,
      subclassId: 'land',
      subclassName: 'Circle of the Land',
      subclassSource: 'PHB',
      optionRows,
    })[0]?.label,
    'Circle of the Land Terrain'
  )

  const fourElements = getSubclassFeatureOptionDefinitions({
    classId: 'monk',
    classLevel: 11,
    subclassId: 'four-elements',
    subclassName: 'Way of the Four Elements',
    subclassSource: 'PHB',
    optionRows,
  })
  assert.equal(fourElements.length, 3)
  assert.equal(fourElements[0]?.choices.some((choice) => choice.value === 'mist_stance'), true)
})

test('Circle of the Land terrain choices grant free derived spells in local context', () => {
  const druidDetail: ClassDetail = {
    id: 'druid',
    name: 'Druid',
    hit_die: 8,
    primary_ability: ['WIS'],
    saving_throw_proficiencies: ['int', 'wis'],
    armor_proficiencies: ['light', 'medium', 'shields'],
    weapon_proficiencies: ['club'],
    tool_proficiencies: {},
    skill_choices: { count: 2, from: ['animal_handling', 'nature'] },
    multiclass_prereqs: [],
    multiclass_proficiencies: {},
    spellcasting_type: 'full',
    spellcasting_progression: {
      mode: 'prepared',
      spellcasting_ability: 'wis',
      cantrips_known_by_level: [2, 2, 2, 3, 3],
      prepared_formula: 'class_level',
      prepared_add_ability_mod: true,
      prepared_min: 1,
    },
    subclass_choice_level: 2,
    source: 'PHB',
    amended: false,
    amendment_note: null,
    progression: [
      { id: 'druid-1', class_id: 'druid', level: 1, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'druid-2', class_id: 'druid', level: 2, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'druid-3', class_id: 'druid', level: 3, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'druid-4', class_id: 'druid', level: 4, features: [], asi_available: true, proficiency_bonus: 2 },
      { id: 'druid-5', class_id: 'druid', level: 5, features: [], asi_available: false, proficiency_bonus: 3 },
    ],
    spell_slots: [
      { id: 'slot-1', class_id: 'druid', level: 1, slots_by_spell_level: [2] },
      { id: 'slot-2', class_id: 'druid', level: 2, slots_by_spell_level: [3] },
      { id: 'slot-3', class_id: 'druid', level: 3, slots_by_spell_level: [4, 2] },
      { id: 'slot-4', class_id: 'druid', level: 4, slots_by_spell_level: [4, 3] },
      { id: 'slot-5', class_id: 'druid', level: 5, slots_by_spell_level: [4, 3, 2] },
    ],
  }

  const context = buildLocalCharacterContext({
    campaign,
    allowedSources: ['PHB'],
    allSourceRuleSets: { PHB: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 24,
    stats: { str: 8, dex: 12, con: 14, int: 10, wis: 16, cha: 10 },
    selectedSpecies: null,
    selectedBackground: null,
    levels: [{ class_id: 'druid', level: 5, subclass_id: 'land' }],
    classDetailMap: { druid: druidDetail },
    subclassMap: {
      druid: [{
        id: 'land',
        name: 'Circle of the Land',
        class_id: 'druid',
        choice_level: 2,
        source: 'PHB',
        amended: true,
        amendment_note: null,
      }],
    },
    spellOptions: [
      {
        id: 'barkskin',
        name: 'Barkskin',
        level: 2,
        school: 'Transmutation',
        casting_time: '1 action',
        range: 'Touch',
        components: { verbal: true, somatic: true, material: true },
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: '',
        classes: ['druid'],
        source: 'PHB',
        amended: false,
        amendment_note: null,
      },
      {
        id: 'spider-climb',
        name: 'Spider Climb',
        level: 2,
        school: 'Transmutation',
        casting_time: '1 action',
        range: 'Touch',
        components: { verbal: true, somatic: true, material: true },
        duration: 'Up to 1 hour',
        concentration: true,
        ritual: false,
        description: '',
        classes: ['druid'],
        source: 'PHB',
        amended: false,
        amendment_note: null,
      },
      {
        id: 'call-lightning',
        name: 'Call Lightning',
        level: 3,
        school: 'Conjuration',
        casting_time: '1 action',
        range: '120 feet',
        components: { verbal: true, somatic: true, material: true },
        duration: 'Up to 10 minutes',
        concentration: true,
        ritual: false,
        description: '',
        classes: ['druid'],
        source: 'PHB',
        amended: false,
        amendment_note: null,
      },
      {
        id: 'plant-growth',
        name: 'Plant Growth',
        level: 3,
        school: 'Transmutation',
        casting_time: '1 action',
        range: '150 feet',
        components: { verbal: true, somatic: true, material: false },
        duration: 'Instantaneous',
        concentration: false,
        ritual: false,
        description: '',
        classes: ['druid'],
        source: 'PHB',
        amended: false,
        amendment_note: null,
      },
    ],
    spellChoices: [],
    featList: [],
    featChoices: [],
    asiChoices: [],
    skillProficiencies: [],
    abilityBonusChoices: [],
    languageChoices: [],
    toolChoices: [],
    featureOptionRows: [{
      id: 'forest-land',
      group_key: 'circle_of_land:terrain:2014',
      key: 'forest',
      name: 'Forest',
      description: 'Forest circle spells.',
      option_order: 10,
      prerequisites: {},
      effects: {
        spell_grants: [
          { spell_name: 'Barkskin', min_class_level: 3, source_feature_key: 'forest:barkskin' },
          { spell_name: 'Spider Climb', min_class_level: 3, source_feature_key: 'forest:spider_climb' },
          { spell_name: 'Call Lightning', min_class_level: 5, source_feature_key: 'forest:call_lightning' },
          { spell_name: 'Plant Growth', min_class_level: 5, source_feature_key: 'forest:plant_growth' },
        ],
      },
      source: 'PHB',
      amended: false,
      amendment_note: null,
    }],
    featureOptionChoices: [{
      id: 'forest-choice',
      character_id: 'local',
      character_level_id: null,
      option_group_key: 'circle_of_land:terrain:2014',
      option_key: 'druid:terrain',
      selected_value: { feature_option_key: 'forest' },
      choice_order: 0,
      source_category: 'subclass_feature',
      source_entity_id: 'land',
      source_feature_key: 'subclass_feature:circle_of_the_land:terrain',
      created_at: '',
    }],
  })

  assert.ok(context)
  const derived = deriveLocalCharacter(context)
  assert.ok(derived)
  assert.deepEqual(
    derived.spellcasting.selectedSpells
      .filter((spell) => !spell.countsAgainstSelectionLimit)
      .map((spell) => spell.name)
      .sort(),
    ['Barkskin', 'Call Lightning', 'Plant Growth', 'Spider Climb']
  )
})

test('PHB High Elf, Drow, and Tiefling derive dynamic spell-trait summaries', () => {
  const wizardDetail: ClassDetail = {
    id: 'wizard',
    name: 'Wizard',
    hit_die: 6,
    primary_ability: ['INT'],
    saving_throw_proficiencies: ['int', 'wis'],
    armor_proficiencies: [],
    weapon_proficiencies: [],
    tool_proficiencies: {},
    skill_choices: { count: 2, from: ['arcana', 'history'] },
    multiclass_prereqs: [],
    multiclass_proficiencies: {},
    spellcasting_type: 'full',
    spellcasting_progression: {
      mode: 'spellbook',
      spellcasting_ability: 'int',
      cantrips_known_by_level: [3, 3, 3, 4, 4],
      prepared_formula: 'class_level',
      prepared_add_ability_mod: true,
      prepared_min: 1,
    },
    subclass_choice_level: 2,
    source: 'PHB',
    amended: false,
    amendment_note: null,
    progression: [
      { id: 'wizard-1', class_id: 'wizard', level: 1, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'wizard-2', class_id: 'wizard', level: 2, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'wizard-3', class_id: 'wizard', level: 3, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'wizard-4', class_id: 'wizard', level: 4, features: [], asi_available: true, proficiency_bonus: 2 },
      { id: 'wizard-5', class_id: 'wizard', level: 5, features: [], asi_available: false, proficiency_bonus: 3 },
    ],
    spell_slots: [
      { id: 'wizard-slots-5', class_id: 'wizard', level: 5, slots_by_spell_level: [4, 3, 2] },
    ],
  }

  const highElf: Species = {
    id: 'high-elf',
    name: 'High Elf',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [{ ability: 'dex', bonus: 2 }, { ability: 'int', bonus: 1 }],
    languages: ['Common', 'Elvish'],
    traits: [],
    senses: [{ type: 'darkvision', range_ft: 60 }],
    damage_resistances: [],
    condition_immunities: [],
    source: 'PHB',
    amended: false,
    amendment_note: null,
  }

  const highElfContext = buildLocalCharacterContext({
    campaign,
    allowedSources: ['PHB'],
    allSourceRuleSets: { PHB: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 18,
    stats: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 },
    selectedSpecies: highElf,
    selectedBackground: null,
    levels: [{ class_id: 'wizard', level: 5, subclass_id: null }],
    classDetailMap: { wizard: wizardDetail },
    subclassMap: {},
    spellOptions: [{
      id: 'ray-of-frost',
      name: 'Ray of Frost',
      level: 0,
      school: 'evocation',
      casting_time: '1 action',
      range: '60 feet',
      components: { verbal: true, somatic: true, material: false },
      duration: 'Instantaneous',
      concentration: false,
      ritual: false,
      description: '',
      classes: ['wizard'],
      source: 'PHB',
      amended: false,
      amendment_note: null,
      source_feature_key: 'feature_spell:species:high_elf:cantrip',
      counts_against_selection_limit: false,
    }],
    spellChoices: [],
    spellSelections: [{
      spell_id: 'ray-of-frost',
      character_level_id: null,
      owning_class_id: null,
      granting_subclass_id: null,
      acquisition_mode: 'granted',
      counts_against_selection_limit: false,
      source_feature_key: 'feature_spell:species:high_elf:cantrip',
    }],
    featList: [],
    featChoices: [],
    asiChoices: [],
    skillProficiencies: [],
    abilityBonusChoices: [],
    languageChoices: [],
    toolChoices: [],
    featureOptionChoices: [],
  })

  assert.ok(highElfContext)
  const highElfDerived = deriveLocalCharacter(highElfContext)
  assert.ok(highElfDerived)
  assert.match(
    highElfDerived.speciesTraits.find((trait) => trait.name === 'Cantrip')?.description ?? '',
    /Ray of Frost/
  )

  const drowContext = buildLocalCharacterContext({
    campaign,
    allowedSources: ['PHB'],
    allSourceRuleSets: { PHB: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 18,
    stats: { str: 8, dex: 14, con: 12, int: 14, wis: 10, cha: 14 },
    selectedSpecies: { ...highElf, id: 'drow', name: 'Dark Elf (Drow)' },
    selectedBackground: null,
    levels: [{ class_id: 'wizard', level: 5, subclass_id: null }],
    classDetailMap: { wizard: wizardDetail },
    subclassMap: {},
    spellOptions: [],
    spellChoices: [],
    featList: [],
    featChoices: [],
    asiChoices: [],
    skillProficiencies: [],
    abilityBonusChoices: [],
    languageChoices: [],
    toolChoices: [],
    featureOptionChoices: [],
  })
  assert.ok(drowContext)
  const drowDerived = deriveLocalCharacter(drowContext)
  assert.ok(drowDerived)
  assert.match(
    drowDerived.speciesTraits.find((trait) => trait.name === 'Drow Magic')?.description ?? '',
    /Dancing Lights cantrip, Faerie Fire once per long rest, Darkness once per long rest/
  )

  const tieflingContext = buildLocalCharacterContext({
    campaign,
    allowedSources: ['PHB'],
    allSourceRuleSets: { PHB: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 18,
    stats: { str: 8, dex: 14, con: 12, int: 13, wis: 10, cha: 16 },
    selectedSpecies: {
      id: 'tiefling',
      name: 'Tiefling',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [{ ability: 'int', bonus: 1 }, { ability: 'cha', bonus: 2 }],
      languages: ['Common', 'Infernal'],
      traits: [],
      senses: [{ type: 'darkvision', range_ft: 60 }],
      damage_resistances: ['fire'],
      condition_immunities: [],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    selectedBackground: null,
    levels: [{ class_id: 'wizard', level: 5, subclass_id: null }],
    classDetailMap: { wizard: wizardDetail },
    subclassMap: {},
    spellOptions: [],
    spellChoices: [],
    featList: [],
    featChoices: [],
    asiChoices: [],
    skillProficiencies: [],
    abilityBonusChoices: [],
    languageChoices: [],
    toolChoices: [],
    featureOptionChoices: [],
  })
  assert.ok(tieflingContext)
  const tieflingDerived = deriveLocalCharacter(tieflingContext)
  assert.ok(tieflingDerived)
  assert.match(
    tieflingDerived.speciesTraits.find((trait) => trait.name === 'Infernal Legacy')?.description ?? '',
    /Thaumaturgy cantrip, Hellish Rebuke once per long rest, Darkness once per long rest/
  )
})

test('static dragonmark trait grants become free derived spells when the spell exists locally', () => {
  const artificerDetail: ClassDetail = {
    id: 'artificer',
    name: 'Artificer',
    hit_die: 8,
    primary_ability: ['INT'],
    saving_throw_proficiencies: ['con', 'int'],
    armor_proficiencies: [],
    weapon_proficiencies: [],
    tool_proficiencies: {},
    skill_choices: { count: 2, from: ['arcana'] },
    multiclass_prereqs: [],
    multiclass_proficiencies: {},
    spellcasting_type: 'half',
    spellcasting_progression: {
      mode: 'prepared',
      spellcasting_ability: 'int',
      cantrips_known_by_level: [2, 2, 2],
      prepared_formula: 'half_level_down',
      prepared_add_ability_mod: true,
      prepared_min: 1,
    },
    subclass_choice_level: 3,
    source: 'ERftLW',
    amended: false,
    amendment_note: null,
    progression: [
      { id: 'p1', class_id: 'artificer', level: 1, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'p2', class_id: 'artificer', level: 2, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'p3', class_id: 'artificer', level: 3, features: [], asi_available: false, proficiency_bonus: 2 },
    ],
    spell_slots: [
      { id: 's1', class_id: 'artificer', level: 1, slots_by_spell_level: [2] },
      { id: 's2', class_id: 'artificer', level: 2, slots_by_spell_level: [2] },
      { id: 's3', class_id: 'artificer', level: 3, slots_by_spell_level: [3] },
    ],
  }

  const species: Species = {
    id: 'mark-of-making',
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
  }

  const context = buildLocalCharacterContext({
    campaign,
    allowedSources: ['ERftLW', 'EE'],
    allSourceRuleSets: { ERftLW: '2014', EE: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 20,
    stats: { str: 10, dex: 10, con: 14, int: 16, wis: 12, cha: 8 },
    selectedSpecies: species,
    selectedBackground: null,
    levels: [{ class_id: 'artificer', level: 3, subclass_id: null }],
    classDetailMap: { artificer: artificerDetail },
    subclassMap: {},
    spellOptions: [
      {
        id: 'mending',
        name: 'Mending',
        level: 0,
        school: 'Varies',
        casting_time: 'Varies',
        range: 'Varies',
        components: { verbal: false, somatic: false, material: false },
        duration: 'Varies',
        concentration: false,
        ritual: false,
        description: '',
        classes: ['artificer'],
        source: 'ERftLW',
        amended: false,
        amendment_note: null,
      },
      {
        id: 'magic-weapon',
        name: 'Magic Weapon',
        level: 2,
        school: 'Varies',
        casting_time: 'Varies',
        range: 'Varies',
        components: { verbal: false, somatic: false, material: false },
        duration: 'Varies',
        concentration: true,
        ritual: false,
        description: '',
        classes: [],
        source: 'ERftLW',
        amended: false,
        amendment_note: null,
      },
    ],
    spellChoices: [],
    featList: [],
    featChoices: [],
    asiChoices: [],
    skillProficiencies: [],
    abilityBonusChoices: [],
    languageChoices: [],
    toolChoices: [],
  })

  assert.ok(context)
  const derived = deriveLocalCharacter(context)
  assert.ok(derived)
  assert.deepEqual(
    derived.spellcasting.selectedSpells.map((spell) => [spell.name, spell.granted, spell.countsAgainstSelectionLimit]),
    [
      ['Mending', true, false],
      ['Magic Weapon', true, false],
    ]
  )
  assert.deepEqual(derived.spellcasting.selectedSpellCountsByLevel, {})
})

test('static dragonmark trait grants use seeded source fallbacks and include Mark of Storm gust', () => {
  const artificerDetail: ClassDetail = {
    id: 'artificer',
    name: 'Artificer',
    hit_die: 8,
    primary_ability: ['INT'],
    saving_throw_proficiencies: ['con', 'int'],
    armor_proficiencies: [],
    weapon_proficiencies: [],
    tool_proficiencies: {},
    skill_choices: { count: 2, from: ['arcana'] },
    multiclass_prereqs: [],
    multiclass_proficiencies: {},
    spellcasting_type: 'half',
    spellcasting_progression: {
      mode: 'prepared',
      spellcasting_ability: 'int',
      cantrips_known_by_level: [2, 2, 2],
      prepared_formula: 'half_level_down',
      prepared_add_ability_mod: true,
      prepared_min: 1,
    },
    subclass_choice_level: 3,
    source: 'ERftLW',
    amended: false,
    amendment_note: null,
    progression: [
      { id: 'p1', class_id: 'artificer', level: 1, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'p2', class_id: 'artificer', level: 2, features: [], asi_available: false, proficiency_bonus: 2 },
      { id: 'p3', class_id: 'artificer', level: 3, features: [], asi_available: false, proficiency_bonus: 2 },
    ],
    spell_slots: [
      { id: 's1', class_id: 'artificer', level: 1, slots_by_spell_level: [2] },
      { id: 's2', class_id: 'artificer', level: 2, slots_by_spell_level: [2] },
      { id: 's3', class_id: 'artificer', level: 3, slots_by_spell_level: [3] },
    ],
  }

  const stormSpecies: Species = {
    id: 'mark-of-storm',
    name: 'Half-Elf (Mark of Storm)',
    size: 'medium',
    speed: 30,
    ability_score_bonuses: [{ ability: 'cha', bonus: 2 }, { ability: 'dex', bonus: 1 }],
    languages: ['Common', 'Elvish'],
    traits: [],
    senses: [],
    damage_resistances: ['lightning'],
    condition_immunities: [],
    source: 'ERftLW',
    amended: true,
    amendment_note: null,
  }

  const hospitalitySpecies: Species = {
    id: 'mark-of-hospitality',
    name: 'Halfling (Mark of Hospitality)',
    size: 'small',
    speed: 25,
    ability_score_bonuses: [{ ability: 'dex', bonus: 2 }, { ability: 'cha', bonus: 1 }],
    languages: ['Common', 'Halfling'],
    traits: [],
    senses: [],
    damage_resistances: [],
    condition_immunities: [],
    source: 'ERftLW',
    amended: true,
    amendment_note: null,
  }

  const stormContext = buildLocalCharacterContext({
    campaign,
    allowedSources: ['ERftLW', 'EE', 'PHB', 'SRD'],
    allSourceRuleSets: { ERftLW: '2014', EE: '2014', PHB: '2014', SRD: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 20,
    stats: { str: 10, dex: 14, con: 14, int: 16, wis: 12, cha: 12 },
    selectedSpecies: stormSpecies,
    selectedBackground: null,
    levels: [{ class_id: 'artificer', level: 3, subclass_id: null }],
    classDetailMap: { artificer: artificerDetail },
    subclassMap: {},
    spellOptions: [
      {
        id: 'gust',
        name: 'Gust',
        level: 0,
        school: 'Varies',
        casting_time: 'Varies',
        range: 'Varies',
        components: { verbal: false, somatic: false, material: false },
        duration: 'Varies',
        concentration: false,
        ritual: false,
        description: '',
        classes: [],
        source: 'EE',
        amended: false,
        amendment_note: null,
      },
      {
        id: 'gust-of-wind',
        name: 'Gust of Wind',
        level: 2,
        school: 'Varies',
        casting_time: 'Varies',
        range: 'Varies',
        components: { verbal: false, somatic: false, material: false },
        duration: 'Varies',
        concentration: true,
        ritual: false,
        description: '',
        classes: [],
        source: 'ERftLW',
        amended: false,
        amendment_note: null,
      },
    ],
    spellChoices: [],
    featList: [],
    featChoices: [],
    asiChoices: [],
    skillProficiencies: [],
    abilityBonusChoices: [],
    languageChoices: [],
    toolChoices: [],
  })

  const hospitalityContext = buildLocalCharacterContext({
    campaign,
    allowedSources: ['ERftLW', 'EE', 'PHB', 'SRD'],
    allSourceRuleSets: { ERftLW: '2014', EE: '2014', PHB: '2014', SRD: '2014' },
    statMethod: 'point_buy',
    persistedHpMax: 20,
    stats: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 12 },
    selectedSpecies: hospitalitySpecies,
    selectedBackground: null,
    levels: [{ class_id: 'artificer', level: 3, subclass_id: null }],
    classDetailMap: { artificer: artificerDetail },
    subclassMap: {},
    spellOptions: [
      {
        id: 'prestidigitation',
        name: 'Prestidigitation',
        level: 0,
        school: 'Varies',
        casting_time: 'Varies',
        range: 'Varies',
        components: { verbal: false, somatic: false, material: false },
        duration: 'Varies',
        concentration: false,
        ritual: false,
        description: '',
        classes: ['artificer'],
        source: 'ERftLW',
        amended: false,
        amendment_note: null,
      },
      {
        id: 'purify-food-and-drink',
        name: 'Purify Food and Drink',
        level: 1,
        school: 'Varies',
        casting_time: 'Varies',
        range: 'Varies',
        components: { verbal: false, somatic: false, material: false },
        duration: 'Varies',
        concentration: false,
        ritual: true,
        description: '',
        classes: ['artificer'],
        source: 'ERftLW',
        amended: false,
        amendment_note: null,
      },
      {
        id: 'unseen-servant',
        name: 'Unseen Servant',
        level: 1,
        school: 'Varies',
        casting_time: 'Varies',
        range: 'Varies',
        components: { verbal: false, somatic: false, material: false },
        duration: 'Varies',
        concentration: false,
        ritual: true,
        description: '',
        classes: [],
        source: 'PHB',
        amended: false,
        amendment_note: null,
      },
    ],
    spellChoices: [],
    featList: [],
    featChoices: [],
    asiChoices: [],
    skillProficiencies: [],
    abilityBonusChoices: [],
    languageChoices: [],
    toolChoices: [],
  })

  assert.ok(stormContext)
  assert.ok(hospitalityContext)

  const stormDerived = deriveLocalCharacter(stormContext)
  const hospitalityDerived = deriveLocalCharacter(hospitalityContext)

  assert.ok(stormDerived)
  assert.ok(hospitalityDerived)
  assert.deepEqual(
    stormDerived.spellcasting.selectedSpells.map((spell) => spell.name),
    ['Gust', 'Gust of Wind']
  )
  assert.deepEqual(
    hospitalityDerived.spellcasting.selectedSpells.map((spell) => spell.name),
    ['Prestidigitation', 'Purify Food and Drink', 'Unseen Servant']
  )
})
