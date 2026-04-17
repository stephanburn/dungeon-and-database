import test from 'node:test'
import assert from 'node:assert/strict'
import {
  replaceCharacterEquipmentItems,
  replaceCharacterFeatureOptionChoices,
  type EquipmentItemChoiceInput,
  type FeatureOptionChoiceInput,
} from '@/lib/characters/choice-persistence'

function createSupabaseMock() {
  const deleted: Array<{ table: string; column: string; value: string }> = []
  const inserted: Array<{ table: string; rows: Array<Record<string, unknown>> }> = []

  return {
    deleted,
    inserted,
    client: {
      from(table: string) {
        return {
          delete() {
            return {
              async eq(column: string, value: string) {
                deleted.push({ table, column, value })
                return { error: null }
              },
            }
          },
          async insert(rows: Array<Record<string, unknown>>) {
            inserted.push({ table, rows })
            return { error: null }
          },
        }
      },
    },
  }
}

test('replaceCharacterFeatureOptionChoices rewrites typed feature-option rows with defaults', async () => {
  const supabase = createSupabaseMock()
  const choices: FeatureOptionChoiceInput[] = [{
    option_group_key: 'maverick_arcane_breakthrough',
    option_key: 'breakthrough_1',
    selected_value: { spell_id: 'spell-chaos-bolt' },
    source_feature_key: 'subclass_feature:maverick:arcane_breakthrough',
  }]

  const error = await replaceCharacterFeatureOptionChoices(
    supabase.client as never,
    'character-1',
    choices
  )

  assert.equal(error, null)
  assert.deepEqual(supabase.deleted, [{
    table: 'character_feature_option_choices',
    column: 'character_id',
    value: 'character-1',
  }])
  assert.deepEqual(supabase.inserted, [{
    table: 'character_feature_option_choices',
    rows: [{
      character_id: 'character-1',
      option_group_key: 'maverick_arcane_breakthrough',
      option_key: 'breakthrough_1',
      selected_value: { spell_id: 'spell-chaos-bolt' },
      choice_order: 0,
      character_level_id: null,
      source_category: 'feature',
      source_entity_id: null,
      source_feature_key: 'subclass_feature:maverick:arcane_breakthrough',
    }],
  }])
})

test('replaceCharacterFeatureOptionChoices skips blank option keys after clearing existing rows', async () => {
  const supabase = createSupabaseMock()
  const choices: FeatureOptionChoiceInput[] = [{
    option_group_key: '   ',
    option_key: 'breakthrough_1',
  }, {
    option_group_key: 'maverick_arcane_breakthrough',
    option_key: '   ',
  }]

  const error = await replaceCharacterFeatureOptionChoices(
    supabase.client as never,
    'character-2',
    choices
  )

  assert.equal(error, null)
  assert.deepEqual(supabase.deleted, [{
    table: 'character_feature_option_choices',
    column: 'character_id',
    value: 'character-2',
  }])
  assert.deepEqual(supabase.inserted, [])
})

test('replaceCharacterEquipmentItems rewrites typed equipment rows with defaults', async () => {
  const supabase = createSupabaseMock()
  const items: EquipmentItemChoiceInput[] = [{
    item_id: 'item-1',
    quantity: 2,
    equipped: true,
    source_category: 'package',
    source_entity_id: 'pkg-1',
    notes: 'two torches',
  }]

  const error = await replaceCharacterEquipmentItems(
    supabase.client as never,
    'character-3',
    items
  )

  assert.equal(error, null)
  assert.deepEqual(supabase.deleted, [{
    table: 'character_equipment_items',
    column: 'character_id',
    value: 'character-3',
  }])
  assert.deepEqual(supabase.inserted, [{
    table: 'character_equipment_items',
    rows: [{
      character_id: 'character-3',
      item_id: 'item-1',
      quantity: 2,
      equipped: true,
      source_package_item_id: null,
      source_category: 'package',
      source_entity_id: 'pkg-1',
      notes: 'two torches',
    }],
  }])
})
