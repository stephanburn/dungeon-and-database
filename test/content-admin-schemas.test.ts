import test from 'node:test'
import assert from 'node:assert/strict'
import {
  classCreateSchema,
  classUpdateSchema,
  subclassUpdateSchema,
  backgroundUpdateSchema,
  featUpdateSchema,
  speciesUpdateSchema,
  spellUpdateSchema,
  equipmentItemUpdateSchema,
} from '@/lib/content/admin-schemas'

test('class create schema rejects unknown keys', () => {
  const parsed = classCreateSchema.safeParse({
    name: 'Wizard',
    hit_die: 6,
    source: 'PHB',
    unexpected: true,
  })

  assert.equal(parsed.success, false)
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
