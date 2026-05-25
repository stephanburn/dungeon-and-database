import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BATTLE_MASTER_MANEUVER_GROUP_KEY,
  CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
  DRAGONBORN_ANCESTRY_GROUP_KEY,
  FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
  HIGH_ELF_CANTRIP_SOURCE_KEY,
  HUNTER_PREY_GROUP_KEY,
  MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY,
  getActiveOptionGroupsForBuild,
  getFeatureOptionClassIdEffect,
  getFeatureOptionMinimumClassLevel,
  getMaverickArcaneBreakthroughSourceKey,
  isCustomFeatureSpellSource,
  isCustomOptionGroup,
  isMaverickArcaneBreakthroughSourceKey,
  isSubclassFeatureOptionGroup,
} from '@/lib/characters/rule-handlers'

test('slice 8c registry recognizes existing custom option and feature-spell families', () => {
  const definitions = [
    { optionGroupKey: 'fighting_style:fighter:2014' },
    { optionGroupKey: BATTLE_MASTER_MANEUVER_GROUP_KEY },
    { optionGroupKey: HUNTER_PREY_GROUP_KEY },
    { optionGroupKey: CIRCLE_OF_LAND_TERRAIN_GROUP_KEY },
    { optionGroupKey: FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY },
    { optionGroupKey: 'artificer:infusion:2014' },
    { optionGroupKey: DRAGONBORN_ANCESTRY_GROUP_KEY },
    { optionGroupKey: MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY },
    { optionGroupKey: 'not-custom' },
  ]

  assert.equal(isCustomOptionGroup('fighting_style:paladin:2014'), true)
  assert.equal(isCustomOptionGroup(BATTLE_MASTER_MANEUVER_GROUP_KEY), true)
  assert.equal(isCustomOptionGroup('hunter:defensive_tactics:2014'), true)
  assert.equal(isCustomOptionGroup(CIRCLE_OF_LAND_TERRAIN_GROUP_KEY), true)
  assert.equal(isCustomOptionGroup(FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY), true)
  assert.equal(isCustomOptionGroup('artificer:infusion:2014'), true)
  assert.equal(isCustomOptionGroup(DRAGONBORN_ANCESTRY_GROUP_KEY), true)
  assert.equal(isCustomOptionGroup(MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY), true)
  assert.equal(isCustomOptionGroup('not-custom'), false)

  assert.equal(isSubclassFeatureOptionGroup(BATTLE_MASTER_MANEUVER_GROUP_KEY), true)
  assert.equal(isSubclassFeatureOptionGroup(HUNTER_PREY_GROUP_KEY), true)
  assert.equal(isSubclassFeatureOptionGroup(CIRCLE_OF_LAND_TERRAIN_GROUP_KEY), true)
  assert.equal(isSubclassFeatureOptionGroup(FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY), true)
  assert.equal(isSubclassFeatureOptionGroup(DRAGONBORN_ANCESTRY_GROUP_KEY), false)

  assert.equal(isCustomFeatureSpellSource(HIGH_ELF_CANTRIP_SOURCE_KEY), true)
  assert.equal(isCustomFeatureSpellSource('feat_spell:aberrant_dragonmark:cantrip'), true)
  assert.equal(isMaverickArcaneBreakthroughSourceKey(getMaverickArcaneBreakthroughSourceKey(2)), true)
  assert.equal(isMaverickArcaneBreakthroughSourceKey('subclass_feature:maverick_arcane_breakthroughs'), true)

  assert.deepEqual(
    Array.from(getActiveOptionGroupsForBuild(definitions)).sort(),
    definitions.slice(0, -1).map((definition) => definition.optionGroupKey).sort()
  )
})

test('slice 8c feature option metadata guards read only known prerequisites and effects shapes', () => {
  assert.equal(getFeatureOptionMinimumClassLevel({ minimum_class_level: 11 }), 11)
  assert.equal(getFeatureOptionMinimumClassLevel({ minimum_class_level: '11' }), 1)
  assert.equal(getFeatureOptionMinimumClassLevel(null), 1)

  assert.equal(getFeatureOptionClassIdEffect({ class_id: 'wizard' }), 'wizard')
  assert.equal(getFeatureOptionClassIdEffect({ class_id: 42 }), null)
  assert.equal(getFeatureOptionClassIdEffect(undefined), null)
})

test('slice 8c removes duplicated custom-option triples from UI files and keeps one Maverick source-key constant', () => {
  const uiFiles = [
    'src/components/character-sheet/CharacterSheet.tsx',
    'src/app/characters/new/CharacterNewForm.tsx',
    'src/app/characters/[id]/LevelUpWizard.tsx',
  ]
  const triple = /maneuver:battle_master:2014[\s\S]{0,220}circle_of_land:terrain:2014[\s\S]{0,220}elemental_discipline:four_elements:2014/

  for (const path of uiFiles) {
    assert.doesNotMatch(readFileSync(path, 'utf8'), triple, `${path} should use the rule-handler registry`)
  }

  const source = [
    readFileSync('src/lib/characters/feature-grants-types.ts', 'utf8'),
    readFileSync('src/lib/characters/maverick.ts', 'utf8'),
    readFileSync('src/lib/characters/rule-handlers/index.ts', 'utf8'),
    readFileSync('src/lib/legality/spell-checks.ts', 'utf8'),
  ].join('\n')

  assert.doesNotMatch(source, /MAVERICK_BREAKTHROUGH_SOURCE_FEATURE_KEY/)
  assert.match(source, /MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY/)
})
