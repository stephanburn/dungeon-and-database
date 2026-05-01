import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildCreationStepList,
  getAllowedStatMethodOptions,
  normalizeStatMethodForCampaign,
} from '@/lib/characters/creation-flow'
import {
  filterDuplicateSkillChoices,
  getSkillChoiceDuplicateReason,
} from '@/lib/characters/creation-step-selections'
import { mergeSpellOptionsStable, replaceSpellOptionsStable } from '@/lib/characters/spell-options'

test('UT1: spell option merging preserves array identity when nothing meaningful changed', () => {
  const current = [
    { id: 'magic-missile', name: 'Magic Missile' },
    { id: 'shield', name: 'Shield' },
  ]

  assert.equal(mergeSpellOptionsStable(current, []), current)
  assert.equal(mergeSpellOptionsStable(current, [{ id: 'shield', name: 'Shield' }]), current)

  const withNewSpell = mergeSpellOptionsStable(current, [{ id: 'sleep', name: 'Sleep' }])
  assert.notEqual(withNewSpell, current)
  assert.deepEqual(withNewSpell.map((spell) => spell.id), ['magic-missile', 'shield', 'sleep'])

  assert.equal(replaceSpellOptionsStable(current, [...current]), current)
  assert.deepEqual(replaceSpellOptionsStable(current, []).map((spell) => spell.id), [])
})

test('UT1: creation step list hides level-1 subclass and no-op spells/feats steps', () => {
  assert.deepEqual(
    buildCreationStepList({
      includeSubclassStep: false,
      includeSpellsFeatsStep: false,
    }).map((step) => step.id),
    ['identity', 'species', 'background', 'classes', 'stats', 'skills', 'equipment', 'review']
  )

  assert.deepEqual(
    buildCreationStepList({
      includeSubclassStep: true,
      includeSpellsFeatsStep: true,
    }).map((step) => step.id),
    ['identity', 'species', 'background', 'classes', 'subclasses', 'stats', 'skills', 'equipment', 'spells-feats', 'review']
  )
})

test('UT1: campaign stat method gates disallowed ability-score methods before review', () => {
  assert.equal(normalizeStatMethodForCampaign('standard_array', 'point_buy'), 'point_buy')
  assert.equal(normalizeStatMethodForCampaign('point_buy', 'point_buy'), 'point_buy')

  const options = getAllowedStatMethodOptions('point_buy')
  assert.deepEqual(
    options.map((option) => ({ id: option.id, disabled: Boolean(option.disabledReason) })),
    [
      { id: 'point_buy', disabled: false },
      { id: 'standard_array', disabled: true },
      { id: 'rolled', disabled: true },
    ]
  )
})

test('UT1: duplicate skill choices are blocked before save', () => {
  const sources = [
    { label: 'species', skills: ['deception'] },
    { label: 'background', skills: ['Insight'] },
  ]

  assert.equal(getSkillChoiceDuplicateReason('Deception', sources), 'Already selected from species.')
  assert.equal(getSkillChoiceDuplicateReason('stealth', sources), null)
  assert.deepEqual(filterDuplicateSkillChoices(['deception', 'stealth', 'insight'], sources), ['stealth'])
})

test('UT1: clients expose inline conflict recovery and avoid unstable spell-option callbacks', () => {
  const sheetSource = fs.readFileSync(
    path.join(process.cwd(), 'src/components/character-sheet/CharacterSheet.tsx'),
    'utf8'
  )
  const levelUpSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/characters/[id]/LevelUpWizard.tsx'),
    'utf8'
  )
  const spellsCardSource = fs.readFileSync(
    path.join(process.cwd(), 'src/components/character-sheet/SpellsCard.tsx'),
    'utf8'
  )

  assert.match(sheetSource, /useCallback/)
  assert.match(sheetSource, /mergeSpellOptionsStable/)
  assert.match(spellsCardSource, /subclassIdsKey/)
  assert.match(spellsCardSource, /expandedClassIdsKey/)
  assert.match(spellsCardSource, /spellChoicesKey/)
  assert.match(spellsCardSource, /replaceSpellOptionsStable/)
  assert.match(levelUpSource, /levelUpConflict/)
  assert.match(levelUpSource, /code === 'stale_character'/)
  assert.match(levelUpSource, /code === 'stale_level_up'/)
})
