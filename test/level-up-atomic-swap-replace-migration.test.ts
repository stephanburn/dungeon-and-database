import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/065_level_up_atomic_save_swap_replace.sql'),
  'utf8'
)

test('slice 4.5a migration replaces save_character_level_up_atomic', () => {
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION public\.save_character_level_up_atomic/i)
})

test('slice 4.5a migration deletes editable-for-class spell rows while preserving feat_spell and feature_spell rows', () => {
  assert.match(migrationSql, /DELETE FROM public\.character_spell_selections/i)
  assert.match(migrationSql, /owning_class_id = v_class_id/i)
  assert.match(migrationSql, /feat_spell:%/i)
  assert.match(migrationSql, /feature_spell:%/i)
})

test('slice 4.5a migration uses ON CONFLICT DO NOTHING on spell inserts to tolerate preserved rows', () => {
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, spell_id, owning_class_id, granting_subclass_id, acquisition_mode\)\s+DO NOTHING/i
  )
})

test('slice 4.5a migration upserts feat_choices on the (character_id, feat_id, choice_kind) key', () => {
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, feat_id, choice_kind\)\s+DO UPDATE SET/i
  )
})

test('slice 4.5a migration upserts feature_option_choices so value edits do not collide', () => {
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, option_group_key, option_key, choice_order, source_feature_key\)\s+DO UPDATE SET/i
  )
  assert.match(migrationSql, /selected_value = EXCLUDED\.selected_value/i)
  assert.match(migrationSql, /character_level_id = EXCLUDED\.character_level_id/i)
})
