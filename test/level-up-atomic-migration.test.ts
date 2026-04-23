import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/064_level_up_atomic_save.sql'),
  'utf8'
)

test('level-up atomic migration creates additive save rpc', () => {
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION public\.save_character_level_up_atomic/i)
  assert.match(migrationSql, /Level-up must advance exactly one class level/i)
  assert.match(migrationSql, /INSERT INTO public\.character_spell_selections/i)
  assert.match(migrationSql, /INSERT INTO public\.character_feat_choices/i)
  assert.match(migrationSql, /INSERT INTO public\.character_asi_choices/i)
})

test('level-up atomic migration includes rollback test hook and preserves aggregate row path', () => {
  assert.match(migrationSql, /Injected level-up failure/i)
  assert.doesNotMatch(migrationSql, /DELETE FROM public\.character_levels/i)
  assert.match(migrationSql, /UPDATE public\.character_levels/i)
})
