import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/068_level_up_concurrency_guardrails.sql'),
  'utf8'
)

test('slice 4.5d migration locks the owning character during trigger-driven class-level sync', () => {
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION public\.sync_character_class_levels_for_class/i)
  assert.match(
    migrationSql,
    /FROM public\.characters\s+WHERE id = p_character_id\s+FOR UPDATE/i
  )
})

test('slice 4.5d migration requires and validates expected_updated_at before level-up mutation', () => {
  assert.match(migrationSql, /v_expected_updated_at timestamptz := NULLIF\(p_payload->>'expected_updated_at', ''\)::timestamptz/i)
  assert.match(migrationSql, /Optimistic lock token is required/i)
  assert.match(migrationSql, /v_existing\.updated_at IS DISTINCT FROM v_expected_updated_at/i)
  assert.match(migrationSql, /Optimistic lock mismatch/i)
})

test('slice 4.5d migration keeps slice 4.5c idempotent sync and anchor-preservation behavior', () => {
  assert.match(
    migrationSql,
    /ON CONFLICT \(character_id, class_id, level_number\) DO UPDATE/i
  )
  assert.match(migrationSql, /COALESCE\(incoming\.character_level_id, existing\.character_level_id, v_level_row_id\)/i)
  assert.match(
    migrationSql,
    /WHEN incoming\.owning_class_id IS NOT DISTINCT FROM v_class_id THEN v_level_row_id[\s\S]+ELSE NULL/i
  )
})
