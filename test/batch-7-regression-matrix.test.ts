import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveCharacter } from '@/lib/characters/build-context'
import { loadCharacterState } from '@/lib/characters/load-character'
import { runLegalityChecks, shouldBlockCharacterSubmit } from '@/lib/legality/engine'
import {
  buildBatch7RegressionMatrix,
  createBatch7LoadStateSupabaseMock,
  runBatch7ReviewStateScenario,
  type Batch7MatrixEntry,
  type Batch7MatrixKey,
} from './helpers/batch-7-matrix-fixtures'

function matrixEntry(key: Batch7MatrixKey): Batch7MatrixEntry {
  const entry = buildBatch7RegressionMatrix().find((item) => item.key === key)
  assert.ok(entry, `Expected Batch 7 matrix entry ${key}`)
  return entry
}

function assertSubmittable(entry: Batch7MatrixEntry) {
  const legality = runLegalityChecks(entry.context)
  assert.equal(legality.passed, true, `${entry.key} should pass legality`)
  assert.equal(shouldBlockCharacterSubmit(legality), false, `${entry.key} should be submittable`)
  assert.deepEqual(legality.derived?.blockingIssues, [], `${entry.key} should have no blocking derived issues`)
  return legality.derived!
}

test('Slice 7c matrix helper exposes every required representative build', () => {
  const matrix = buildBatch7RegressionMatrix()

  assert.deepEqual(
    matrix.map((entry) => entry.key),
    [
      'single-class-wizard',
      'pact-and-non-pact-caster',
      'martial-asi-feat-feature-option',
      'dragonmarked-lineage',
      'language-tool-heavy',
      'starting-equipment-package',
      'review-state',
    ]
  )
})

test('Slice 7c pins the single-class wizard spellbook, save math, and subclass timing', () => {
  const entry = matrixEntry('single-class-wizard')
  const derived = assertSubmittable(entry)
  const wizardSource = derived.spellcasting.sources.find((source) => source.className === 'Wizard')
  const intSave = derived.savingThrows.find((savingThrow) => savingThrow.ability === 'int')

  assert.equal(derived.totalLevel, 5)
  assert.equal(derived.proficiencyBonus, 3)
  assert.equal(derived.armorClass.value, 12)
  assert.equal(derived.passivePerception, 11)
  assert.equal(intSave?.modifier, 7)
  assert.deepEqual(derived.spellcasting.spellSlots, [4, 3, 2])
  assert.equal(derived.spellcasting.maxSpellLevel, 3)
  assert.equal(wizardSource?.mode, 'spellbook')
  assert.equal(wizardSource?.spellSaveDc, 15)
  assert.equal(wizardSource?.leveledSpellSelectionCap, 14)
  assert.equal(wizardSource?.preparedSpells.length, 0)
  assert.equal(wizardSource?.spellbookSpells.some((spell) => spell.name === 'Fireball'), true)
  assert.equal(derived.subclassStates[0]?.status, 'selected')
})

test('Slice 7c pins pact and non-pact caster slots as separate derived tracks', () => {
  const entry = matrixEntry('pact-and-non-pact-caster')
  const derived = assertSubmittable(entry)
  const bardSource = derived.spellcasting.sources.find((source) => source.className === 'Bard')
  const warlockSource = derived.spellcasting.sources.find((source) => source.className === 'Warlock')

  assert.equal(derived.totalLevel, 6)
  assert.equal(derived.proficiencyBonus, 3)
  assert.deepEqual(derived.spellcasting.spellSlots, [4, 2])
  assert.deepEqual(derived.spellcasting.pactSpellSlots, [{
    classId: 'warlock',
    className: 'Warlock',
    slots: [0, 2],
  }])
  assert.equal(derived.spellcasting.maxSpellLevel, 2)
  assert.equal(bardSource?.spellSaveDc, 14)
  assert.equal(warlockSource?.spellSaveDc, 14)
  assert.equal(bardSource?.knownSpells.some((spell) => spell.name === 'Healing Word'), true)
  assert.equal(warlockSource?.knownSpells.some((spell) => spell.name === 'Hex'), true)
})

test('Slice 7c pins martial ASI, feat, and feature-option choices through derived output and reload', async () => {
  const entry = matrixEntry('martial-asi-feat-feature-option')
  const derived = assertSubmittable(entry)

  assert.equal(derived.totalLevel, 8)
  assert.equal(derived.proficiencyBonus, 3)
  assert.equal(derived.armorClass.value, 17)
  assert.equal(derived.armorClass.formula, '16 (Chain Mail) +1 (Defense)')
  assert.equal(derived.abilities.str.adjusted, 18)
  assert.equal(derived.skills.find((skill) => skill.key === 'athletics')?.modifier, 7)
  assert.equal(derived.asiFeatHistory.some((entry) => entry.label === 'Alert'), true)
  assert.equal(derived.combatActions.length, 5)
  assert.equal(derived.classResources.some((resource) => resource.label === 'Superiority Dice'), true)

  const loaded = await loadCharacterState(createBatch7LoadStateSupabaseMock(entry), entry.characterId, {
    buildLegalityInputImpl: async () => entry.context,
  })
  assert.equal(loaded.status, 'success')
  if (loaded.status !== 'success') return
  assert.equal(loaded.state.initialTypedAsiChoices[0]?.ability, 'str')
  assert.equal(loaded.state.initialFeatureOptionChoices.length, 6)
  assert.equal(loaded.state.initialTypedFeatChoices[0]?.feat_id, 'alert')
  assert.equal(loaded.state.legality?.derived?.armorClass.value, derived.armorClass.value)
})

test('Slice 7c pins dragonmarked granted spells and source allowlist filtering', () => {
  const entry = matrixEntry('dragonmarked-lineage')
  const derived = assertSubmittable(entry)

  assert.equal(derived.totalLevel, 3)
  assert.deepEqual(
    derived.spellcasting.grantedSpells.map((spell) => spell.name).sort(),
    ['Magic Weapon', 'Mending']
  )
  assert.deepEqual(derived.spellcasting.selectedSpellCountsByLevel, {})
  assert.equal(derived.speciesTraits.some((trait) => trait.name === 'Spells of the Mark'), true)

  const disallowed = runLegalityChecks({
    ...entry.context,
    allowedSources: ['PHB'],
  })
  const sourceCheck = disallowed.checks.find((check) => check.key === 'source_allowlist')
  assert.equal(disallowed.passed, false)
  assert.equal(shouldBlockCharacterSubmit(disallowed), true)
  assert.equal(sourceCheck?.passed, false)
  assert.match(sourceCheck?.message ?? '', /species \(ERftLW\).*spell \(ERftLW\)/)
})

test('Slice 7c reloads language and tool catalog keys into display labels and provenance rows', async () => {
  const entry = matrixEntry('language-tool-heavy')
  const derived = assertSubmittable(entry)
  const loaded = await loadCharacterState(createBatch7LoadStateSupabaseMock(entry), entry.characterId, {
    buildLegalityInputImpl: async () => entry.context,
  })

  assert.equal(derived.languages.includes('Draconic'), true)
  assert.equal(derived.languages.includes('Gnomish'), true)
  assert.equal(derived.proficiencies.tools.includes("smith's tools"), true)
  assert.equal(loaded.status, 'success')
  if (loaded.status !== 'success') return
  assert.deepEqual(loaded.state.initialLanguageChoices, ['Draconic', 'Gnomish'])
  assert.deepEqual(loaded.state.initialToolChoices, ["Smith's tools", "Thieves' tools"])
  assert.deepEqual(
    loaded.state.initialTypedLanguageChoices.map((row) => [row.language_key, row.language, row.source_category]),
    [
      ['draconic', 'Draconic', 'background'],
      ['gnomish', 'Gnomish', 'class'],
    ]
  )
  assert.deepEqual(
    loaded.state.initialTypedToolChoices.map((row) => [row.tool_key, row.tool, row.source_category]),
    [
      ['smiths-tools', "Smith's tools", 'background'],
      ['thieves-tools', "Thieves' tools", 'class'],
    ]
  )
  assert.equal(loaded.state.legality?.derived?.languages.includes('Gnomish'), true)
})

test('Slice 7c pins starting-equipment package resolution, quantities, AC, and reload rows', async () => {
  const entry = matrixEntry('starting-equipment-package')
  const derived = assertSubmittable(entry)
  assert.ok(entry.startingEquipment, 'expected starting-equipment fixture')

  assert.deepEqual(entry.startingEquipment.issues, [])
  assert.deepEqual(
    entry.startingEquipment.lines.map((line) => `${line.quantity}x ${line.itemName}`),
    ['1x Chain Mail', '1x Longsword', '1x Shield', '1x Explorer\'s Pack']
  )
  assert.equal(derived.armorClass.value, 18)
  assert.equal(derived.armorClass.formula, '16 (Chain Mail) +2 (Shield)')

  const loaded = await loadCharacterState(createBatch7LoadStateSupabaseMock(entry), entry.characterId, {
    buildLegalityInputImpl: async () => entry.context,
  })
  assert.equal(loaded.status, 'success')
  if (loaded.status !== 'success') return
  assert.deepEqual(
    loaded.state.initialEquipmentItems.map((item) => [item.item_id, item.quantity, item.equipped]),
    [
      ['chain-mail-id', 1, true],
      ['longsword-id', 1, false],
      ['shield-id', 1, true],
      ['explorers-pack-id', 1, false],
    ]
  )
})

test('Slice 7c pins review-state transitions across draft, submitted, changes requested, and approved', async () => {
  const trace = await runBatch7ReviewStateScenario()

  assert.deepEqual(trace.statuses, [
    'draft',
    'draft',
    'submitted',
    'changes_requested',
    'changes_requested',
    'submitted',
    'approved',
  ])
  assert.deepEqual(trace.notes, [
    null,
    null,
    null,
    'Tighten prepared spell notes.',
    'Tighten prepared spell notes.',
    'Tighten prepared spell notes.',
    null,
  ])
  assert.deepEqual(trace.snapshotEvents, ['save', 'submit', 'save', 'submit', 'approve'])
})

test('Slice 7c matrix file stays focused on Batch 7 guard coverage', () => {
  const keys = buildBatch7RegressionMatrix().map((entry) => entry.key)
  const derivedTotals = buildBatch7RegressionMatrix().map((entry) => deriveCharacter(entry.context).totalLevel)

  assert.equal(keys.length, 7)
  assert.deepEqual(derivedTotals, [5, 6, 8, 3, 1, 1, 1])
})
