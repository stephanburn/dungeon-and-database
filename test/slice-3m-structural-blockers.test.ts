import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const migration061 = readFileSync(
  join(process.cwd(), 'supabase', 'migrations', '061_slice_3m_pre_batch4_structural_blockers.sql'),
  'utf8'
)
const roadmap = readFileSync(
  join(process.cwd(), 'output', 'character-creator-roadmap.md'),
  'utf8'
)

test('slice 3m migration widens owner access beyond pc-only characters', () => {
  assert.doesNotMatch(migration061, /character_type\s*=\s*'pc'/i)
  assert.match(migration061, /CREATE POLICY "characters_select" ON public\.characters[\s\S]*OR user_id = auth\.uid\(\)/i)
  assert.match(migration061, /CREATE POLICY "characters_update_own" ON public\.characters[\s\S]*OR user_id = auth\.uid\(\)/i)
  assert.match(migration061, /CREATE POLICY "characters_delete_own" ON public\.characters[\s\S]*OR user_id = auth\.uid\(\)/i)
})

test('slice 3m migration adds hp roll history storage and the atomic save rpc', () => {
  assert.match(migration061, /CREATE TABLE IF NOT EXISTS public\.character_hp_rolls/i)
  assert.match(migration061, /UNIQUE \(character_id, class_id, level_number\)/i)
  assert.match(migration061, /CREATE OR REPLACE FUNCTION public\.save_character_atomic/i)
  assert.match(migration061, /DELETE FROM public\.character_levels/i)
  assert.match(migration061, /DELETE FROM public\.character_spell_selections/i)
  assert.match(migration061, /DELETE FROM public\.character_feat_choices/i)
})

test('roadmap carries the explicit hp history follow-up note into batch 4', () => {
  assert.match(roadmap, /Slice `3m` may land the dedicated `character_hp_rolls` table/i)
  assert.match(roadmap, /full `character_class_levels` cutover remains the explicit first task inside Milestone 9/i)
})
