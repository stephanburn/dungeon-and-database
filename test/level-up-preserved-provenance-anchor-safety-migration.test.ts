import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/067_level_up_preserved_provenance_anchor_safety.sql'),
  'utf8'
)

test('slice 4.5c migration replaces class-level sync with an idempotent upsert path', () => {
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION public\.sync_character_class_levels_for_class/i)
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, class_id, level_number\) DO UPDATE/i
  )
  assert.match(migrationSql, /COALESCE\(existing\.id,/i)
  assert.doesNotMatch(migrationSql, /AND level_number = v_current\.level\s+AND id <> v_current\.id/i)
})

test('slice 4.5c migration backfills class-recoverable null anchors', () => {
  assert.match(migrationSql, /UPDATE public\.character_spell_selections spell_choice/i)
  assert.match(migrationSql, /spell_choice\.owning_class_id IS NOT NULL/i)
  assert.match(migrationSql, /UPDATE public\.character_language_choices language_choice/i)
  assert.match(migrationSql, /UPDATE public\.character_tool_choices tool_choice/i)
  assert.match(migrationSql, /UPDATE public\.character_feature_option_choices feature_choice/i)
  assert.match(migrationSql, /UPDATE public\.character_skill_proficiencies skill_choice/i)
  assert.match(migrationSql, /source_category = 'class'/i)
})

test('slice 4.5c migration preserves existing feature-option and feat anchors on full after-state payloads', () => {
  assert.match(migrationSql, /LEFT JOIN public\.character_feature_option_choices existing/i)
  assert.match(
    migrationSql,
    /COALESCE\(incoming\.character_level_id, existing\.character_level_id, v_level_row_id\)/i
  )
  assert.match(migrationSql, /LEFT JOIN public\.character_feat_choices existing/i)
  assert.match(
    migrationSql,
    /existing\.feat_id = incoming\.feat_id/i
  )
})

test('slice 4.5c migration keeps preserved cross-class spell rows from defaulting to the new level', () => {
  assert.match(
    migrationSql,
    /WHEN incoming\.owning_class_id IS NOT DISTINCT FROM v_class_id THEN v_level_row_id[\s\S]+ELSE NULL/i
  )
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, spell_id, owning_class_id, granting_subclass_id, acquisition_mode\)\s+DO NOTHING/i
  )
})
