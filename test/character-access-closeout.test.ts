import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertCharacterAccessibleByUser, assertCharacterOwnedByUser } from '@/lib/auth/ownership'

function createCharacterAccessSupabase(character: {
  user_id: string
  campaign: { dm_id: string } | null
} | null) {
  return {
    from(table: string) {
      assert.equal(table, 'characters')
      return {
        select() {
          return {
            eq() {
              return {
                async single() {
                  return {
                    data: character
                      ? {
                          id: 'character-1',
                          status: 'draft',
                          campaign_id: 'campaign-1',
                          ...character,
                        }
                      : null,
                    error: character ? null : { message: 'not found' },
                  }
                },
              }
            },
          }
        },
      }
    },
  }
}

test('assertCharacterAccessibleByUser allows owner, campaign DM, and admin only', async () => {
  const supabase = createCharacterAccessSupabase({
    user_id: 'player-1',
    campaign: { dm_id: 'dm-1' },
  })

  assert.ok(await assertCharacterAccessibleByUser(supabase as never, 'character-1', 'player-1', 'player'))
  assert.ok(await assertCharacterAccessibleByUser(supabase as never, 'character-1', 'dm-1', 'dm'))
  assert.ok(await assertCharacterAccessibleByUser(supabase as never, 'character-1', 'admin-1', 'admin'))
  assert.equal(await assertCharacterAccessibleByUser(supabase as never, 'character-1', 'player-2', 'player'), null)
  assert.equal(await assertCharacterAccessibleByUser(supabase as never, 'character-1', 'dm-2', 'dm'), null)
})

test('assertCharacterOwnedByUser is owner-only for player submit flow', async () => {
  const supabase = createCharacterAccessSupabase({
    user_id: 'player-1',
    campaign: { dm_id: 'dm-1' },
  })

  assert.ok(await assertCharacterOwnedByUser(supabase as never, 'character-1', 'player-1'))
  assert.equal(await assertCharacterOwnedByUser(supabase as never, 'character-1', 'dm-1'), null)
  assert.equal(await assertCharacterOwnedByUser(supabase as never, 'character-1', 'admin-1'), null)
})

test('character mutating routes use named access helpers instead of inline ownership checks', () => {
  const route = readFileSync('src/app/api/characters/[id]/route.ts', 'utf8')
  const submitRoute = readFileSync('src/app/api/characters/[id]/submit/route.ts', 'utf8')

  assert.match(route, /assertCharacterAccessibleByUser/)
  assert.doesNotMatch(route, /\.select\('user_id, status, updated_at'\)/)
  assert.doesNotMatch(route, /\.select\('user_id'\)/)
  assert.doesNotMatch(route, /existing\.user_id !== profile\.id/)

  assert.match(submitRoute, /assertCharacterOwnedByUser/)
  assert.doesNotMatch(submitRoute, /character\.user_id !== profile\.id/)
})

test('slice 6d migration marks legacy null owning_class_id spell rows', () => {
  const migration = readFileSync('supabase/migrations/077_legacy_spell_selection_attribution.sql', 'utf8')

  assert.match(migration, /UPDATE public\.character_spell_selections/i)
  assert.match(migration, /owning_class_id IS NULL/i)
  assert.match(migration, /counts_against_selection_limit = true/i)
  assert.match(migration, /source_feature_key = 'legacy:pre_batch_4_spell_selection'/i)
})
