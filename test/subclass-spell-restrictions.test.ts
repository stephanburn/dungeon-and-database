import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterRestrictedSubclassSpellOptions,
  getRestrictedSubclassSpellRule,
  isRestrictedSubclassSpellSelectionValid,
} from '@/lib/characters/subclass-spell-restrictions'

test('restricted subclass spell rules expose the correct PHB off-school allowances', () => {
  assert.equal(
    getRestrictedSubclassSpellRule({
      subclassName: 'Eldritch Knight',
      subclassSource: 'PHB',
      classLevel: 7,
    })?.unrestrictedLeveledSpellAllowance,
    1
  )
  assert.equal(
    getRestrictedSubclassSpellRule({
      subclassName: 'Eldritch Knight',
      subclassSource: 'PHB',
      classLevel: 14,
    })?.unrestrictedLeveledSpellAllowance,
    3
  )
  assert.equal(
    getRestrictedSubclassSpellRule({
      subclassName: 'Arcane Trickster',
      subclassSource: 'PHB',
      classLevel: 20,
    })?.unrestrictedLeveledSpellAllowance,
    4
  )
})

test('restricted subclass spell validation enforces off-school leveled spell limits', () => {
  const rule = getRestrictedSubclassSpellRule({
    subclassName: 'Arcane Trickster',
    subclassSource: 'PHB',
    classLevel: 7,
  })
  assert.ok(rule)

  const valid = isRestrictedSubclassSpellSelectionValid({
    selectedSpells: [
      { level: 1, school: 'Illusion' },
      { level: 1, school: 'Enchantment' },
      { level: 2, school: 'Transmutation' },
    ],
    rule,
  })
  assert.equal(valid.passed, true)

  const invalid = isRestrictedSubclassSpellSelectionValid({
    selectedSpells: [
      { level: 1, school: 'Illusion' },
      { level: 1, school: 'Transmutation' },
      { level: 2, school: 'Necromancy' },
    ],
    rule,
  })
  assert.equal(invalid.passed, false)
  assert.equal(invalid.offSchoolCount, 2)
})

test('restricted subclass spell filtering keeps selected off-school spells but hides new illegal ones once slots are full', () => {
  const rule = getRestrictedSubclassSpellRule({
    subclassName: 'Eldritch Knight',
    subclassSource: 'PHB',
    classLevel: 7,
  })
  assert.ok(rule)

  const spells = [
    {
      id: 'shield',
      name: 'Shield',
      level: 1,
      school: 'Abjuration',
      casting_time: '1 reaction',
      range: 'Self',
      components: { verbal: true, somatic: true, material: false },
      duration: '1 round',
      concentration: false,
      ritual: false,
      description: '',
      classes: ['fighter'],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'magic-missile',
      name: 'Magic Missile',
      level: 1,
      school: 'Evocation',
      casting_time: '1 action',
      range: '120 feet',
      components: { verbal: true, somatic: true, material: false },
      duration: 'Instantaneous',
      concentration: false,
      ritual: false,
      description: '',
      classes: ['fighter'],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'find-familiar',
      name: 'Find Familiar',
      level: 1,
      school: 'Conjuration',
      casting_time: '1 hour',
      range: '10 feet',
      components: { verbal: true, somatic: true, material: true },
      duration: 'Instantaneous',
      concentration: false,
      ritual: true,
      description: '',
      classes: ['fighter'],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
    {
      id: 'grease',
      name: 'Grease',
      level: 1,
      school: 'Conjuration',
      casting_time: '1 action',
      range: '60 feet',
      components: { verbal: true, somatic: true, material: true },
      duration: '1 minute',
      concentration: false,
      ritual: false,
      description: '',
      classes: ['fighter'],
      source: 'PHB',
      amended: false,
      amendment_note: null,
    },
  ]

  const filtered = filterRestrictedSubclassSpellOptions({
    spells,
    selectedSpellIds: ['find-familiar'],
    rule,
  })

  assert.deepEqual(
    filtered.map((spell) => spell.id),
    ['shield', 'magic-missile', 'find-familiar']
  )
})
