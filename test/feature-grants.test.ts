import test from 'node:test'
import assert from 'node:assert/strict'
import type { Class, Campaign, FeatureOption, Species } from '@/lib/types/database'
import { deriveLocalCharacter, buildLocalCharacterContext, type ClassDetail } from '@/lib/characters/wizard-helpers'
import {
  getMaverickArcaneBreakthroughOptionDefinitions,
  getMaverickFeatureSpellChoiceDefinitions,
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
