import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  featureOptionCreateSchema,
  featureOptionGroupCreateSchema,
  languageCreateSchema,
  languageDeleteSchema,
  languageUpdateSchema,
  toolCreateSchema,
  toolDeleteSchema,
  toolUpdateSchema,
} from '@/lib/content/admin-schemas'

const read = (path: string) => readFileSync(path, 'utf8')

test('slice 6f schemas validate language and tool create update delete payloads', () => {
  assert.equal(languageCreateSchema.safeParse({
    key: 'giant_eagle',
    name: 'Giant Eagle',
    sort_order: 240,
    source: 'PHB',
  }).success, true)
  assert.equal(toolCreateSchema.safeParse({
    key: 'glassblowers_tools',
    name: "Glassblower's Tools",
    sort_order: 240,
    source: 'PHB',
  }).success, true)
  assert.equal(languageUpdateSchema.safeParse({ key: 'giant_eagle', name: 'Giant Eagle' }).success, true)
  assert.equal(toolUpdateSchema.safeParse({ key: 'glassblowers_tools', name: "Glassblower's Tools" }).success, true)
  assert.equal(languageDeleteSchema.safeParse({ key: 'giant_eagle' }).success, true)
  assert.equal(toolDeleteSchema.safeParse({ key: 'glassblowers_tools' }).success, true)

  assert.equal(languageCreateSchema.safeParse({ key: 'giant eagle', name: 'Giant Eagle', source: 'PHB' }).success, false)
  assert.equal(toolUpdateSchema.safeParse({ key: 'glassblowers_tools', unknown: true }).success, false)
})

test('slice 6f schemas validate feature option group and option payloads', () => {
  assert.equal(featureOptionGroupCreateSchema.safeParse({
    key: 'fighter:fighting_style',
    name: 'Fighting Style',
    option_family: 'class_feature',
    description: 'Choose a fighting style.',
    selection_limit: 1,
    allows_duplicate_selections: false,
    metadata: { class_key: 'fighter' },
    source: 'PHB',
  }).success, true)

  assert.equal(featureOptionCreateSchema.safeParse({
    group_key: 'fighter:fighting_style',
    key: 'defense',
    name: 'Defense',
    description: 'Gain a bonus while armored.',
    option_order: 10,
    prerequisites: {},
    effects: {},
    source: 'PHB',
  }).success, true)

  assert.equal(featureOptionGroupCreateSchema.safeParse({
    key: 'fighter:fighting_style',
    name: 'Fighting Style',
    option_family: 'class_feature',
    selection_limit: 0,
    source: 'PHB',
  }).success, false)
})

test('slice 6f content routes expose admin-only audited CRUD for editable catalogs', () => {
  for (const route of [
    'src/app/api/content/languages/route.ts',
    'src/app/api/content/tools/route.ts',
    'src/app/api/content/feature-option-groups/route.ts',
    'src/app/api/content/feature-options/route.ts',
  ]) {
    const source = read(route)

    assert.match(source, /requireAdmin/)
    assert.match(source, /export async function POST/)
    assert.match(source, /export async function PUT/)
    assert.match(source, /export async function DELETE/)
    assert.match(source, /writeAuditLog/)
    assert.match(source, /safeParse/)
  }
})

test('slice 6f admin UI exposes catalogs and previews validation before publishing', () => {
  const source = read('src/components/dm/ContentAdmin.tsx')

  for (const tab of [
    'languages',
    'tools',
    'feature-option-groups',
    'feature-options',
  ]) {
    assert.match(source, new RegExp(`'${tab}'`))
  }

  assert.match(source, /validateContentImport/)
  assert.match(source, /validationPreview/)
  assert.match(source, /Preview/)
  assert.match(source, /surface-section/)
  assert.match(source, /surface-row/)
  assert.match(source, /<details/)
})
