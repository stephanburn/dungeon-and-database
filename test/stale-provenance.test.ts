import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  detectStaleProvenance,
  choiceTableLabel,
  sourceCategoryLabel,
  type KnownEntityIds,
  type ProvenanceRow,
} from '@/lib/characters/stale-provenance'

const ALL_KNOWN: KnownEntityIds = {
  class: new Set(['class-abc']),
  background: new Set(['bg-abc']),
  species: new Set(['species-abc']),
  subclass: new Set(['subclass-abc']),
  feat: new Set(['feat-abc']),
  starting_equipment_package: new Set(['sep-abc']),
  feature_option: new Set(['feature-option-abc']),
}

const BASE_ROW: ProvenanceRow = {
  character_id: 'char-1',
  choice_table: 'character_skill_proficiencies',
  choice_key: 'athletics',
  source_category: 'class_choice',
  source_entity_id: 'class-abc',
  source_feature_key: null,
}

test('returns empty when all source entities still exist', () => {
  const result = detectStaleProvenance([BASE_ROW], ALL_KNOWN)
  assert.equal(result.length, 0)
})

test('surfaces a row when the referenced class is retired', () => {
  const knownWithoutClass: KnownEntityIds = { ...ALL_KNOWN, class: new Set() }
  const result = detectStaleProvenance([BASE_ROW], knownWithoutClass)
  assert.equal(result.length, 1)
  assert.equal(result[0].choice_table, 'character_skill_proficiencies')
  assert.equal(result[0].choice_key, 'athletics')
  assert.equal(result[0].source_category, 'class_choice')
  assert.equal(result[0].source_entity_id, 'class-abc')
})

test('skips rows with null source_entity_id', () => {
  const row: ProvenanceRow = { ...BASE_ROW, source_entity_id: null }
  const result = detectStaleProvenance([row], ALL_KNOWN)
  assert.equal(result.length, 0)
})

test('skips rows with source_category=manual', () => {
  const row: ProvenanceRow = { ...BASE_ROW, source_category: 'manual', source_entity_id: 'anything' }
  const result = detectStaleProvenance([row], ALL_KNOWN)
  assert.equal(result.length, 0)
})

test('skips rows with unknown source_category', () => {
  const row: ProvenanceRow = { ...BASE_ROW, source_category: 'some_future_category', source_entity_id: 'xyz' }
  const result = detectStaleProvenance([row], ALL_KNOWN)
  assert.equal(result.length, 0)
})

test('flags stale background reference', () => {
  const row: ProvenanceRow = {
    ...BASE_ROW,
    choice_table: 'character_language_choices',
    choice_key: 'elvish',
    source_category: 'background_choice',
    source_entity_id: 'bg-gone',
  }
  const result = detectStaleProvenance([row], ALL_KNOWN)
  assert.equal(result.length, 1)
  assert.equal(result[0].choice_key, 'elvish')
})

test('flags stale legacy direct source categories', () => {
  const rows: ProvenanceRow[] = [
    { ...BASE_ROW, source_category: 'class', source_entity_id: 'class-gone' },
    { ...BASE_ROW, source_category: 'background', source_entity_id: 'bg-gone' },
    { ...BASE_ROW, source_category: 'species', source_entity_id: 'species-gone' },
    { ...BASE_ROW, source_category: 'subclass', source_entity_id: 'subclass-gone' },
    { ...BASE_ROW, source_category: 'package', source_entity_id: 'sep-gone' },
    { ...BASE_ROW, source_category: 'feature', source_entity_id: 'feature-option-gone' },
  ]
  const result = detectStaleProvenance(rows, ALL_KNOWN)
  assert.deepEqual(result.map((row) => row.source_category), [
    'class',
    'background',
    'species',
    'subclass',
    'package',
    'feature',
  ])
})

test('flags stale starting_equipment reference', () => {
  const row: ProvenanceRow = {
    ...BASE_ROW,
    choice_table: 'character_equipment_items',
    choice_key: 'longsword-id',
    source_category: 'starting_equipment',
    source_entity_id: 'sep-gone',
    source_feature_key: null,
  }
  const result = detectStaleProvenance([row], ALL_KNOWN)
  assert.equal(result.length, 1)
  assert.equal(result[0].source_category, 'starting_equipment')
})

test('multiple rows: only stale ones surface', () => {
  const knownWithoutSubclass: KnownEntityIds = { ...ALL_KNOWN, subclass: new Set() }
  const rows: ProvenanceRow[] = [
    BASE_ROW,
    {
      ...BASE_ROW,
      choice_key: 'history',
      source_category: 'subclass_choice',
      source_entity_id: 'subclass-abc',
    },
  ]
  const result = detectStaleProvenance(rows, knownWithoutSubclass)
  assert.equal(result.length, 1)
  assert.equal(result[0].source_category, 'subclass_choice')
})

test('choiceTableLabel returns human-readable labels', () => {
  assert.equal(choiceTableLabel('character_skill_proficiencies'), 'Skill proficiency')
  assert.equal(choiceTableLabel('character_equipment_items'), 'Equipment item')
  assert.equal(choiceTableLabel('unknown_table'), 'unknown_table')
})

test('sourceCategoryLabel returns human-readable labels', () => {
  assert.equal(sourceCategoryLabel('class_choice'), 'class')
  assert.equal(sourceCategoryLabel('starting_equipment'), 'starting equipment package')
  assert.equal(sourceCategoryLabel('package'), 'starting equipment package')
  assert.equal(sourceCategoryLabel('feature'), 'feature option')
  assert.equal(sourceCategoryLabel('feat'), 'feat')
  assert.equal(sourceCategoryLabel('unknown_cat'), 'unknown_cat')
})

test('stale provenance SQL view is security-invoker and checks legacy categories', () => {
  const migration = readFileSync('supabase/migrations/069_stale_provenance_view.sql', 'utf8')
  assert.match(migration, /WITH \(security_invoker = true\)/)
  assert.match(migration, /IN \('class', 'class_choice', 'class_feature'\)/)
  assert.match(migration, /IN \('package', 'starting_equipment'\)/)
  assert.match(migration, /p\.source_category = 'feature'/)
  assert.match(migration, /public\.feature_options/)
})

test('StaleProvenancePanel rendering contract: shows amber warning card', () => {
  const panel = readFileSync('src/components/dm/StaleProvenancePanel.tsx', 'utf8')
  assert.match(panel, /StaleProvenanceRow/)
  assert.match(panel, /choiceTableLabel/)
  assert.match(panel, /sourceCategoryLabel/)
  assert.match(panel, /amber/)
  assert.match(panel, /Content Integrity/)
})

test('character page wires stale provenance for DM only', () => {
  const page = readFileSync('src/app/characters/[id]/page.tsx', 'utf8')
  assert.match(page, /character_stale_provenance/)
  assert.match(page, /StaleProvenancePanel/)
  assert.match(page, /isDm/)
})
