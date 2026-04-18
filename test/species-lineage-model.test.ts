import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/055_species_lineage_model.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

test('species lineage model migration adds parent and lineage metadata columns', () => {
  assert.match(migrationSql, /ADD COLUMN IF NOT EXISTS parent_species_id uuid/i)
  assert.match(migrationSql, /ADD COLUMN IF NOT EXISTS lineage_key text NOT NULL DEFAULT ''/i)
  assert.match(migrationSql, /ADD COLUMN IF NOT EXISTS variant_type text NOT NULL DEFAULT 'base'/i)
  assert.match(migrationSql, /ADD COLUMN IF NOT EXISTS variant_order int NOT NULL DEFAULT 0/i)
})

test('species lineage model migration backfills flattened lineage variants heuristically', () => {
  for (const lineage of ['human', 'half_elf', 'half_orc', 'dwarf', 'halfling', 'elf', 'gnome']) {
    assert.match(
      migrationSql,
      new RegExp(`lineage_key = '${lineage}'`, 'i'),
      `missing backfill for lineage ${lineage}`
    )
  }
})
