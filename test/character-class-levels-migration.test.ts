import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/063_character_class_levels_cutover.sql'),
  'utf8'
)

test('character class levels migration creates per-level history and sync triggers', () => {
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS public\.character_class_levels/i)
  assert.match(migrationSql, /UNIQUE \(character_id, class_id, level_number\)/i)
  assert.match(migrationSql, /CREATE TRIGGER sync_character_class_levels_from_levels/i)
  assert.match(migrationSql, /CREATE TRIGGER sync_character_class_levels_from_hp_rolls/i)
})

test('character class levels migration repoints character_level_id foreign keys', () => {
  assert.match(migrationSql, /REFERENCES public\.character_class_levels \(id\)/i)
  assert.match(migrationSql, /ALTER TABLE public\.character_spell_selections/i)
  assert.match(migrationSql, /ALTER TABLE public\.character_feat_choices/i)
  assert.match(migrationSql, /ALTER TABLE public\.character_asi_choices/i)
})
