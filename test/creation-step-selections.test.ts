import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCreationLanguageChoices,
  buildCreationSkillProficiencies,
  buildCreationToolChoices,
} from '@/lib/characters/creation-step-selections'

test('buildCreationSkillProficiencies preserves explicit species and background provenance', () => {
  const rows = buildCreationSkillProficiencies({
    species: {
      id: 'species-1',
      name: 'Half-Elf',
      source: 'PHB',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common', 'Elvish'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      amended: false,
      amendment_note: null,
    },
    background: {
      id: 'background-1',
      name: 'Scholar',
      skill_proficiencies: [],
      skill_choice_count: 1,
      skill_choice_from: ['history', 'nature'],
      tool_proficiencies: [],
      languages: [],
      starting_equipment: [],
      feature: '',
      background_feat_id: null,
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    selectedClass: null,
    speciesSkillChoices: ['persuasion', 'insight'],
    backgroundSkillChoices: ['history'],
  })

  assert.deepEqual(rows, [
    {
      skill: 'persuasion',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'species-1',
      source_feature_key: 'species_trait:skill_versatility',
    },
    {
      skill: 'insight',
      expertise: false,
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'species-1',
      source_feature_key: 'species_trait:skill_versatility',
    },
    {
      skill: 'history',
      expertise: false,
      character_level_id: null,
      source_category: 'background_choice',
      source_entity_id: 'background-1',
      source_feature_key: null,
    },
  ])
})

test('buildCreationLanguageChoices preserves species and background language provenance separately', () => {
  const rows = buildCreationLanguageChoices({
    species: {
      id: 'species-1',
      name: 'Human',
      source: 'PHB',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      amended: false,
      amendment_note: null,
    },
    background: {
      id: 'background-1',
      name: 'Acolyte',
      skill_proficiencies: [],
      skill_choice_count: 0,
      skill_choice_from: [],
      tool_proficiencies: [],
      languages: ['Any two languages'],
      starting_equipment: [],
      feature: '',
      background_feat_id: null,
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    speciesLanguageChoices: ['Elvish'],
    backgroundLanguageChoices: ['Dwarvish', 'Celestial'],
    availableLanguageNames: ['Common', 'Elvish', 'Dwarvish', 'Celestial'],
  })

  assert.deepEqual(rows, [
    {
      language: 'Elvish',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'species-1',
      source_feature_key: 'species_languages:human',
    },
    {
      language: 'Dwarvish',
      character_level_id: null,
      source_category: 'background_choice',
      source_entity_id: 'background-1',
      source_feature_key: 'background_languages',
    },
    {
      language: 'Celestial',
      character_level_id: null,
      source_category: 'background_choice',
      source_entity_id: 'background-1',
      source_feature_key: 'background_languages',
    },
  ])
})

test('buildCreationToolChoices preserves species tool provenance', () => {
  const rows = buildCreationToolChoices({
    species: {
      id: 'species-1',
      name: 'Warforged',
      source: 'ERftLW',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      amended: false,
      amendment_note: null,
    },
    selectedClass: null,
    speciesToolChoices: ["Smith's Tools"],
    availableToolNames: ["Smith's Tools", "Thieves' Tools"],
  })

  assert.deepEqual(rows, [
    {
      tool: "Smith's Tools",
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'species-1',
      source_feature_key: 'species_trait:specialized_design',
    },
  ])
})

test('buildCreationToolChoices preserves class tool provenance for bard instruments', () => {
  const rows = buildCreationToolChoices({
    species: null,
    selectedClass: {
      id: 'bard-1',
      name: 'Bard',
      hit_die: 8,
      primary_ability: ['CHA'],
      saving_throw_proficiencies: ['dex', 'cha'],
      armor_proficiencies: ['Light'],
      weapon_proficiencies: ['Simple'],
      tool_proficiencies: {},
      skill_choices: { count: 3, from: ['Acrobatics'] },
      multiclass_prereqs: [],
      multiclass_proficiencies: {},
      starting_equipment_package_id: null,
      spellcasting_type: 'full',
      spellcasting_progression: null,
      subclass_choice_level: 3,
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    speciesToolChoices: [],
    classToolChoices: ['Lute', 'Flute', 'Drum'],
    availableToolNames: ['Lute', 'Flute', 'Drum', "Thieves' Tools"],
  })

  assert.deepEqual(rows, [
    {
      tool: 'Lute',
      character_level_id: null,
      source_category: 'class_choice',
      source_entity_id: 'bard-1',
      source_feature_key: 'class_tools:bard',
    },
    {
      tool: 'Flute',
      character_level_id: null,
      source_category: 'class_choice',
      source_entity_id: 'bard-1',
      source_feature_key: 'class_tools:bard',
    },
    {
      tool: 'Drum',
      character_level_id: null,
      source_category: 'class_choice',
      source_entity_id: 'bard-1',
      source_feature_key: 'class_tools:bard',
    },
  ])
})

test('buildCreationSkillProficiencies preserves subclass expertise provenance', () => {
  const rows = buildCreationSkillProficiencies({
    species: null,
    background: null,
    selectedClass: {
      id: 'cleric-1',
      name: 'Cleric',
      hit_die: 8,
      primary_ability: ['WIS'],
      saving_throw_proficiencies: ['wis', 'cha'],
      armor_proficiencies: ['Light'],
      weapon_proficiencies: ['Simple'],
      tool_proficiencies: {},
      skill_choices: { count: 2, from: ['History', 'Religion'] },
      multiclass_prereqs: [],
      multiclass_proficiencies: {},
      starting_equipment_package_id: null,
      spellcasting_type: 'full',
      spellcasting_progression: null,
      subclass_choice_level: 1,
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    selectedSubclass: {
      id: 'knowledge-domain',
      name: 'Knowledge Domain',
      class_id: 'cleric-1',
      choice_level: 1,
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    speciesSkillChoices: [],
    backgroundSkillChoices: [],
    classSkillChoices: ['history'],
    subclassSkillChoices: ['arcana', 'religion'],
  })

  assert.deepEqual(rows, [
    {
      skill: 'history',
      expertise: false,
      character_level_id: null,
      source_category: 'class_choice',
      source_entity_id: 'cleric-1',
      source_feature_key: null,
    },
    {
      skill: 'arcana',
      expertise: true,
      character_level_id: null,
      source_category: 'subclass_choice',
      source_entity_id: 'knowledge-domain',
      source_feature_key: 'subclass_feature:knowledge_domain:blessings_of_knowledge',
    },
    {
      skill: 'religion',
      expertise: true,
      character_level_id: null,
      source_category: 'subclass_choice',
      source_entity_id: 'knowledge-domain',
      source_feature_key: 'subclass_feature:knowledge_domain:blessings_of_knowledge',
    },
  ])
})

test('buildCreationLanguageChoices preserves subclass language provenance', () => {
  const rows = buildCreationLanguageChoices({
    species: {
      id: 'human-1',
      name: 'Human',
      source: 'PHB',
      size: 'medium',
      speed: 30,
      ability_score_bonuses: [],
      languages: ['Common'],
      traits: [],
      senses: [],
      damage_resistances: [],
      condition_immunities: [],
      amended: false,
      amendment_note: null,
    },
    background: null,
    selectedSubclass: {
      id: 'knowledge-domain',
      name: 'Knowledge Domain',
      class_id: 'cleric-1',
      choice_level: 1,
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    speciesLanguageChoices: ['Elvish'],
    backgroundLanguageChoices: [],
    subclassLanguageChoices: ['Draconic', 'Celestial'],
    availableLanguageNames: ['Common', 'Elvish', 'Draconic', 'Celestial'],
  })

  assert.deepEqual(rows, [
    {
      language: 'Elvish',
      character_level_id: null,
      source_category: 'species_choice',
      source_entity_id: 'human-1',
      source_feature_key: 'species_languages:human',
    },
    {
      language: 'Draconic',
      character_level_id: null,
      source_category: 'subclass_choice',
      source_entity_id: 'knowledge-domain',
      source_feature_key: 'subclass_feature:knowledge_domain:blessings_of_knowledge',
    },
    {
      language: 'Celestial',
      character_level_id: null,
      source_category: 'subclass_choice',
      source_entity_id: 'knowledge-domain',
      source_feature_key: 'subclass_feature:knowledge_domain:blessings_of_knowledge',
    },
  ])
})
