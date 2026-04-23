import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLevelUpClassOptions,
  findMissingMulticlassPrereqs,
  getEditableLevelUpSpellChoiceIds,
  getLevelUpFeatureOptionStepDefinitions,
  getLevelUpResumeStepIndex,
  getPreservedLevelUpSpellSelections,
  isSubclassSelectionRequired,
  summarizeLevelUpSpellChanges,
} from '@/lib/characters/level-up-flow'

test('findMissingMulticlassPrereqs reports unmet ability scores', () => {
  const missing = findMissingMulticlassPrereqs(
    { str: 10, dex: 14, con: 12, int: 12, wis: 8, cha: 13 },
    [
      { ability: 'int', min: 13 },
      { ability: 'wis', min: 13 },
    ]
  )

  assert.deepEqual(missing, ['INT 13', 'WIS 13'])
})

test('buildLevelUpClassOptions disables illegal new multiclass picks but keeps existing classes available', () => {
  const options = buildLevelUpClassOptions({
    adjustedStats: { str: 10, dex: 14, con: 12, int: 12, wis: 8, cha: 13 },
    baseLevels: [
      { class_id: 'rogue', level: 2, subclass_id: null },
    ],
    classList: [
      {
        id: 'rogue',
        name: 'Rogue',
        multiclass_prereqs: [{ ability: 'dex', min: 13 }],
      },
      {
        id: 'wizard',
        name: 'Wizard',
        multiclass_prereqs: [{ ability: 'int', min: 13 }],
      },
    ] as never,
  })

  assert.deepEqual(options, [
    {
      classId: 'rogue',
      existingLevel: 2,
      disabled: false,
      invalidReason: null,
      label: 'Rogue (2 → 3)',
    },
    {
      classId: 'wizard',
      existingLevel: 0,
      disabled: true,
      invalidReason: 'Requires INT 13',
      label: 'Wizard (new multiclass, Requires INT 13)',
    },
  ])
})

test('isSubclassSelectionRequired fires exactly when the per-class level reaches the subclass choice level without a subclass', () => {
  assert.equal(isSubclassSelectionRequired({
    nextClassLevel: 2,
    subclassChoiceLevel: 3,
    selectedSubclassId: null,
  }), false)

  assert.equal(isSubclassSelectionRequired({
    nextClassLevel: 3,
    subclassChoiceLevel: 3,
    selectedSubclassId: null,
  }), true)

  assert.equal(isSubclassSelectionRequired({
    nextClassLevel: 4,
    subclassChoiceLevel: 3,
    selectedSubclassId: 'arcane-trickster',
  }), false)
})

test('getLevelUpFeatureOptionStepDefinitions includes all slots from groups that changed at this level', () => {
  const definitions = getLevelUpFeatureOptionStepDefinitions({
    currentDefinitions: [
      {
        optionGroupKey: 'maneuver:battle_master:2014',
        optionKey: 'fighter:maneuver_1',
        label: 'Maneuver 1',
        choiceOrder: 0,
        choices: [],
        sourceCategory: 'subclass_feature',
        sourceEntityId: 'battle-master',
        sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
      },
      {
        optionGroupKey: 'maneuver:battle_master:2014',
        optionKey: 'fighter:maneuver_2',
        label: 'Maneuver 2',
        choiceOrder: 1,
        choices: [],
        sourceCategory: 'subclass_feature',
        sourceEntityId: 'battle-master',
        sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
      },
      {
        optionGroupKey: 'maneuver:battle_master:2014',
        optionKey: 'fighter:maneuver_3',
        label: 'Maneuver 3',
        choiceOrder: 2,
        choices: [],
        sourceCategory: 'subclass_feature',
        sourceEntityId: 'battle-master',
        sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
      },
    ],
    nextDefinitions: [
      {
        optionGroupKey: 'maneuver:battle_master:2014',
        optionKey: 'fighter:maneuver_1',
        label: 'Maneuver 1',
        choiceOrder: 0,
        choices: [],
        sourceCategory: 'subclass_feature',
        sourceEntityId: 'battle-master',
        sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
      },
      {
        optionGroupKey: 'maneuver:battle_master:2014',
        optionKey: 'fighter:maneuver_2',
        label: 'Maneuver 2',
        choiceOrder: 1,
        choices: [],
        sourceCategory: 'subclass_feature',
        sourceEntityId: 'battle-master',
        sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
      },
      {
        optionGroupKey: 'maneuver:battle_master:2014',
        optionKey: 'fighter:maneuver_3',
        label: 'Maneuver 3',
        choiceOrder: 2,
        choices: [],
        sourceCategory: 'subclass_feature',
        sourceEntityId: 'battle-master',
        sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
      },
      {
        optionGroupKey: 'maneuver:battle_master:2014',
        optionKey: 'fighter:maneuver_4',
        label: 'Maneuver 4',
        choiceOrder: 3,
        choices: [],
        sourceCategory: 'subclass_feature',
        sourceEntityId: 'battle-master',
        sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
      },
      {
        optionGroupKey: 'maneuver:battle_master:2014',
        optionKey: 'fighter:maneuver_5',
        label: 'Maneuver 5',
        choiceOrder: 4,
        choices: [],
        sourceCategory: 'subclass_feature',
        sourceEntityId: 'battle-master',
        sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
      },
    ],
  })

  assert.deepEqual(
    definitions.map((definition) => definition.optionKey),
    [
      'fighter:maneuver_1',
      'fighter:maneuver_2',
      'fighter:maneuver_3',
      'fighter:maneuver_4',
      'fighter:maneuver_5',
    ]
  )
})

test('level-up spell helpers scope editable rows to the class gaining the level and preserve other sources', () => {
  const spellSelections = [
    {
      id: 'wizard-1',
      character_id: 'character',
      character_level_id: 'lvl-1',
      spell_id: 'magic-missile',
      owning_class_id: 'wizard',
      granting_subclass_id: null,
      acquisition_mode: 'spellbook',
      counts_against_selection_limit: true,
      source_feature_key: null,
      created_at: '',
    },
    {
      id: 'wizard-2',
      character_id: 'character',
      character_level_id: 'lvl-2',
      spell_id: 'shield',
      owning_class_id: 'wizard',
      granting_subclass_id: null,
      acquisition_mode: 'spellbook',
      counts_against_selection_limit: true,
      source_feature_key: null,
      created_at: '',
    },
    {
      id: 'cleric-1',
      character_id: 'character',
      character_level_id: 'lvl-3',
      spell_id: 'bless',
      owning_class_id: 'cleric',
      granting_subclass_id: null,
      acquisition_mode: 'prepared',
      counts_against_selection_limit: true,
      source_feature_key: null,
      created_at: '',
    },
    {
      id: 'feat-1',
      character_id: 'character',
      character_level_id: 'lvl-4',
      spell_id: 'chaos-bolt',
      owning_class_id: null,
      granting_subclass_id: null,
      acquisition_mode: 'granted',
      counts_against_selection_limit: false,
      source_feature_key: 'feat_spell:dragonmark:level_1',
      created_at: '',
    },
    {
      id: 'feature-1',
      character_id: 'character',
      character_level_id: 'lvl-5',
      spell_id: 'gust',
      owning_class_id: null,
      granting_subclass_id: null,
      acquisition_mode: 'granted',
      counts_against_selection_limit: false,
      source_feature_key: 'feature_spell:species:mark_of_storm',
      created_at: '',
    },
  ] as const

  assert.deepEqual(
    getEditableLevelUpSpellChoiceIds(spellSelections as never, 'wizard'),
    ['magic-missile', 'shield']
  )

  assert.deepEqual(
    getPreservedLevelUpSpellSelections(spellSelections as never, 'wizard'),
    [
      {
        spell_id: 'bless',
        character_level_id: 'lvl-3',
        owning_class_id: 'cleric',
        granting_subclass_id: null,
        acquisition_mode: 'prepared',
        counts_against_selection_limit: true,
        source_feature_key: null,
      },
      {
        spell_id: 'gust',
        character_level_id: 'lvl-5',
        owning_class_id: null,
        granting_subclass_id: null,
        acquisition_mode: 'granted',
        counts_against_selection_limit: false,
        source_feature_key: 'feature_spell:species:mark_of_storm',
      },
    ]
  )
})

test('getLevelUpResumeStepIndex resumes at the first incomplete visible step', () => {
  const stepIndex = getLevelUpResumeStepIndex(
    ['class', 'subclass', 'spells', 'hp', 'review'] as const,
    {
      class: true,
      subclass: true,
      spells: false,
      hp: true,
      review: false,
    }
  )

  assert.equal(stepIndex, 2)
})

test('summarizeLevelUpSpellChanges distinguishes swaps from net additions', () => {
  const summary = summarizeLevelUpSpellChanges({
    beforeSpellIds: ['magic-missile', 'shield'],
    afterSpellIds: ['shield', 'misty-step', 'mirror-image'],
    spellNameById: new Map([
      ['magic-missile', 'Magic Missile'],
      ['shield', 'Shield'],
      ['misty-step', 'Misty Step'],
      ['mirror-image', 'Mirror Image'],
    ]),
  })

  assert.deepEqual(summary, {
    additions: ['Mirror Image'],
    removals: [],
    replacements: [
      {
        added: 'Misty Step',
        removed: 'Magic Missile',
      },
    ],
  })
})
