import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  classCreateSchema,
  classUpdateSchema,
  subclassUpdateSchema,
  backgroundUpdateSchema,
  featUpdateSchema,
  speciesUpdateSchema,
  spellUpdateSchema,
  equipmentItemUpdateSchema,
  sourceCreateSchema,
  sourceUpdateSchema,
  sourceDeleteSchema,
} from '@/lib/content/admin-schemas'

const read = (path: string) => readFileSync(path, 'utf8')

test('class create schema rejects unknown keys', () => {
  const parsed = classCreateSchema.safeParse({
    name: 'Wizard',
    hit_die: 6,
    source: 'PHB',
    unexpected: true,
  })

  assert.equal(parsed.success, false)
})

test('source write schemas are strict for create update and delete', () => {
  const validCreate = sourceCreateSchema.safeParse({
    key: 'XGtE',
    full_name: "Xanathar's Guide to Everything",
    rule_set: '2014',
    is_srd: false,
  })
  assert.equal(validCreate.success, true)

  const createWithUnknown = sourceCreateSchema.safeParse({
    key: 'XGtE',
    full_name: "Xanathar's Guide to Everything",
    rule_set: '2014',
    extra: true,
  })
  assert.equal(createWithUnknown.success, false)

  const updateWithUnknown = sourceUpdateSchema.safeParse({
    original_key: 'XGtE',
    key: 'XGtE',
    full_name: "Xanathar's Guide to Everything",
    future_flag: true,
  })
  assert.equal(updateWithUnknown.success, false)

  const deleteWithUnknown = sourceDeleteSchema.safeParse({
    key: 'XGtE',
    future_flag: true,
  })
  assert.equal(deleteWithUnknown.success, false)
})

test('sources route uses source schemas instead of manual body validation', () => {
  const route = read('src/app/api/content/sources/route.ts')

  assert.match(route, /sourceCreateSchema/)
  assert.match(route, /sourceUpdateSchema/)
  assert.match(route, /sourceDeleteSchema/)
  assert.doesNotMatch(route, /key and full_name are required/)
  assert.doesNotMatch(route, /original_key, key, and full_name are required/)
})

test('content update schemas reject unknown keys across slice 3n routes', () => {
  const payloads = [
    classUpdateSchema.safeParse({ id: '11111111-1111-1111-1111-111111111111', unknown: true }),
    subclassUpdateSchema.safeParse({ id: '11111111-1111-1111-1111-111111111111', unknown: true }),
    backgroundUpdateSchema.safeParse({ id: '11111111-1111-1111-1111-111111111111', unknown: true }),
    featUpdateSchema.safeParse({ id: '11111111-1111-1111-1111-111111111111', unknown: true }),
    speciesUpdateSchema.safeParse({ id: '11111111-1111-1111-1111-111111111111', unknown: true }),
    spellUpdateSchema.safeParse({ id: '11111111-1111-1111-1111-111111111111', unknown: true }),
    equipmentItemUpdateSchema.safeParse({ id: '11111111-1111-1111-1111-111111111111', unknown: true }),
  ]

  for (const payload of payloads) {
    assert.equal(payload.success, false)
  }
})
