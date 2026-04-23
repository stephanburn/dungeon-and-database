import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSpellSelectionSummary,
  resolveLeveledSpellSelectionCap,
  resolvePreparedSpellCap,
  resolveSpellbookSpellCount,
} from '@/lib/characters/spell-selection'
import type { SpellcastingProgression } from '@/lib/types/database'

test('resolveSpellbookSpellCount uses explicit spellbook progression when present', () => {
  const profile: SpellcastingProgression = {
    mode: 'spellbook',
    spellbook_spells_by_level: [6, 8, 10],
  }

  assert.equal(resolveSpellbookSpellCount(profile, 3), 10)
})

test('resolveSpellbookSpellCount falls back to the standard wizard progression', () => {
  const profile: SpellcastingProgression = {
    mode: 'spellbook',
  }

  assert.equal(resolveSpellbookSpellCount(profile, 1), 6)
  assert.equal(resolveSpellbookSpellCount(profile, 4), 12)
})

test('resolveLeveledSpellSelectionCap distinguishes spellbook from prepared capacity', () => {
  const profile: SpellcastingProgression = {
    mode: 'spellbook',
    spellcasting_ability: 'int',
    spellbook_spells_by_level: [6, 8, 10],
    prepared_formula: 'class_level',
    prepared_add_ability_mod: true,
    prepared_min: 1,
  }

  assert.equal(resolvePreparedSpellCap({ profile, classLevel: 3, abilityModifier: 3 }), 6)
  assert.equal(resolveLeveledSpellSelectionCap({ profile, classLevel: 3, abilityModifier: 3 }), 10)
})

test('buildSpellSelectionSummary describes spellbook size and prepared count together', () => {
  assert.equal(
    buildSpellSelectionSummary({
      className: 'Wizard',
      classLevel: 3,
      mode: 'spellbook',
      leveledSelectionCap: 10,
      preparedSpellCap: 6,
    }),
    'Wizard has 10 leveled spells in its spellbook and can prepare 6 of them.'
  )
})
