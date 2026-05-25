import test from 'node:test'
import assert from 'node:assert/strict'
import { getMaverickFeatureSpellChoiceDefinitions } from '@/lib/characters/feature-grants'
import { checkMaverickBreakthroughSelections } from '@/lib/legality/spell-checks'
import type { LegalityInput } from '@/lib/legality/types'

test('slice 8c Maverick legality validates active generated Arcane Breakthrough source keys', () => {
  const activeDefinitions = getMaverickFeatureSpellChoiceDefinitions({
    artificerClassId: 'artificer',
    classLevel: 3,
    selectedBreakthroughClassIds: ['wizard'],
    classList: [
      { id: 'artificer', name: 'Artificer' },
      { id: 'wizard', name: 'Wizard' },
    ] as never,
  })
  const activeLevelOneKey = activeDefinitions.find((definition) => definition.spellLevel === 1)?.sourceFeatureKey
  assert.equal(activeLevelOneKey, 'feature_spell:maverick:arcane_breakthrough:1')

  const result = checkMaverickBreakthroughSelections({
    classes: [{
      classId: 'artificer',
      name: 'Artificer',
      level: 3,
      subclass: { id: 'maverick', name: 'Maverick', source: 'EE' },
    }],
    selectedSpells: [
      {
        id: 'burning-hands',
        name: 'Burning Hands',
        level: 1,
        classes: ['wizard'],
        grantedBySubclassIds: [],
        countsAgainstSelectionLimit: false,
        sourceFeatureKey: activeLevelOneKey,
      },
      {
        id: 'shield',
        name: 'Shield',
        level: 1,
        classes: ['wizard'],
        grantedBySubclassIds: [],
        countsAgainstSelectionLimit: false,
        sourceFeatureKey: activeLevelOneKey,
      },
    ],
  } as LegalityInput)

  assert.equal(result.passed, false)
  assert.match(result.message, /Too many Breakthrough spells selected for level 1/)
})
