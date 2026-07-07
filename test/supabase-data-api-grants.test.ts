import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
const grantMigrationPath = path.join(migrationsDir, '079_explicit_data_api_grants.sql')

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const migrationSql = fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => fs.readFileSync(path.join(migrationsDir, file), 'utf8'))
  .join('\n')

const publicTables = Array.from(
  migrationSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)? public\.([a-z0-9_]+)/gi),
  ([, tableName]) => tableName
).sort()

const publicViews = Array.from(
  migrationSql.matchAll(/CREATE OR REPLACE VIEW public\.([a-z0-9_]+)/gi),
  ([, viewName]) => viewName
).sort()

test('all public Data API relations have explicit grants', () => {
  const grantMigrationSql = fs.readFileSync(grantMigrationPath, 'utf8')

  for (const tableName of publicTables) {
    const escapedTableName = escapeRegExp(tableName)
    assert.match(
      grantMigrationSql,
      new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\\.${escapedTableName} TO authenticated;`, 'i'),
      `missing authenticated Data API grant for public.${tableName}`
    )
    assert.match(
      grantMigrationSql,
      new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\\.${escapedTableName} TO service_role;`, 'i'),
      `missing service_role Data API grant for public.${tableName}`
    )
  }

  for (const viewName of publicViews) {
    const escapedViewName = escapeRegExp(viewName)
    assert.match(
      grantMigrationSql,
      new RegExp(`GRANT SELECT ON TABLE public\\.${escapedViewName} TO authenticated;`, 'i'),
      `missing authenticated Data API grant for public.${viewName}`
    )
    assert.match(
      grantMigrationSql,
      new RegExp(`GRANT SELECT ON TABLE public\\.${escapedViewName} TO service_role;`, 'i'),
      `missing service_role Data API grant for public.${viewName}`
    )
  }
})

test('agent instructions require explicit Supabase Data API grants', () => {
  const agents = fs.readFileSync(path.join(process.cwd(), 'AGENTS.md'), 'utf8')

  assert.match(agents, /Supabase Data API/i)
  assert.match(agents, /explicit GRANT/i)
  assert.match(agents, /public schema/i)
})

test('public RPC functions called through supabase-js have explicit execute grants', () => {
  const grantMigrationSql = fs.readFileSync(grantMigrationPath, 'utf8')

  for (const functionName of ['save_character_atomic', 'save_character_level_up_atomic']) {
    assert.match(
      grantMigrationSql,
      new RegExp(`GRANT EXECUTE ON FUNCTION[\\s\\S]*public\\.${functionName}\\(uuid, jsonb\\)[\\s\\S]*TO authenticated, service_role;`, 'i'),
      `missing authenticated execute grant for public.${functionName}`
    )
  }
})
