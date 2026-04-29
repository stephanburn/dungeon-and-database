import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('slice 6c migration makes character language/tool keys authoritative', () => {
  const migration = readFileSync('supabase/migrations/076_language_tool_key_cutover.sql', 'utf8')

  assert.match(migration, /UPDATE public\.character_language_choices/i)
  assert.match(migration, /UPDATE public\.character_tool_choices/i)
  assert.match(migration, /RAISE EXCEPTION 'Cannot enforce language_key/i)
  assert.match(migration, /RAISE EXCEPTION 'Cannot enforce tool_key/i)
  assert.match(migration, /ALTER COLUMN language_key SET NOT NULL/i)
  assert.match(migration, /ALTER COLUMN tool_key SET NOT NULL/i)
  assert.match(migration, /DROP CONSTRAINT IF EXISTS character_language_choices_pkey/i)
  assert.match(migration, /PRIMARY KEY \(character_id, language_key\)/i)
  assert.match(migration, /DROP CONSTRAINT IF EXISTS character_tool_choices_pkey/i)
  assert.match(migration, /PRIMARY KEY \(character_id, tool_key\)/i)
})
