import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/066_level_up_atomic_save_skill_overlap.sql'),
  'utf8'
)

test('slice 4.5b migration replaces save_character_level_up_atomic', () => {
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION public\.save_character_level_up_atomic/i)
})

test('slice 4.5b migration upserts skill_proficiencies on the narrow (character_id, skill) key', () => {
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, skill\)\s+DO UPDATE SET/i
  )
})

test('slice 4.5b migration OR-merges expertise on conflict and preserves existing provenance', () => {
  assert.match(
    migrationSql,
    /expertise = character_skill_proficiencies\.expertise OR EXCLUDED\.expertise/i
  )
  assert.doesNotMatch(migrationSql, /source_category = EXCLUDED\.source_category,\s*\n\s*expertise/i)
  assert.doesNotMatch(migrationSql, /source_entity_id = EXCLUDED\.source_entity_id,\s*\n\s*expertise/i)
})

test('slice 4.5b migration keeps the 4.5a swap/replace behavior for spells, feats, and feature options', () => {
  assert.match(migrationSql, /DELETE FROM public\.character_spell_selections/i)
  assert.match(migrationSql, /feat_spell:%/i)
  assert.match(migrationSql, /feature_spell:%/i)
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, spell_id, owning_class_id, granting_subclass_id, acquisition_mode\)\s+DO NOTHING/i
  )
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, feat_id, choice_kind\)\s+DO UPDATE SET/i
  )
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, option_group_key, option_key, choice_order, source_feature_key\)\s+DO UPDATE SET/i
  )
})
