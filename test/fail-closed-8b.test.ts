import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getAllowedSources } from '@/lib/content-helpers'
import { buildLegalityInput } from '@/lib/legality/build-input'
import { captureSnapshot } from '@/lib/snapshots'

type QueryError = { message: string }
type QueryResponse = { data: unknown; error: QueryError | null }

const characterId = '00000000-0000-0000-0000-000000000008'

function read(path: string) {
  return readFileSync(path, 'utf8')
}

class QueryMock {
  private key: string

  constructor(
    private readonly table: string,
    private readonly responses: Record<string, QueryResponse>
  ) {
    this.key = table
  }

  select(_columns?: string) {
    return this
  }

  eq(_column: string, value: string) {
    this.key = `${this.table}:eq:${value}`
    return this
  }

  in(_column: string, _values: string[]) {
    this.key = `${this.table}:in`
    return this
  }

  order(_column: string) {
    return this
  }

  lte(_column: string, _value: number) {
    return this
  }

  single() {
    return Promise.resolve(this.response())
  }

  maybeSingle() {
    return Promise.resolve(this.response())
  }

  insert(_payload: unknown) {
    return Promise.resolve(this.responses[`${this.table}:insert`] ?? { data: null, error: null })
  }

  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve(this.response()).then(onfulfilled, onrejected)
  }

  private response(): QueryResponse {
    return this.responses[this.key] ?? { data: [], error: null }
  }
}

function createSupabaseMock(responses: Record<string, QueryResponse>) {
  return {
    from(table: string) {
      return new QueryMock(table, responses)
    },
  } as never
}

function characterRow() {
  return {
    id: characterId,
    user_id: 'user-1',
    campaign_id: 'campaign-1',
    name: 'Fail Closed Target',
    species_id: null,
    background_id: null,
    alignment: null,
    experience_points: 0,
    status: 'draft',
    stat_method: 'point_buy',
    base_str: 8,
    base_dex: 14,
    base_con: 13,
    base_int: 15,
    base_wis: 12,
    base_cha: 10,
    hp_max: 8,
    character_type: 'pc',
    dm_notes: null,
    created_at: '',
    updated_at: '',
  }
}

test('slice 8b source allowlist query failures return an error instead of broadening filters', async () => {
  const result = await getAllowedSources(
    createSupabaseMock({
      'campaign_source_allowlist:eq:campaign-1': {
        data: null,
        error: { message: 'permission denied for campaign_source_allowlist' },
      },
    }),
    'campaign-1'
  )

  assert.deepEqual(result, {
    error: {
      scope: 'campaign_source_allowlist',
      message: 'permission denied for campaign_source_allowlist',
    },
  })
})

test('slice 8b legality input fails hard when typed relation queries fail', async () => {
  const supabase = createSupabaseMock({
    [`characters:eq:${characterId}`]: { data: characterRow(), error: null },
    [`character_spell_selections:eq:${characterId}`]: {
      data: null,
      error: { message: 'permission denied for character_spell_selections' },
    },
  })

  await assert.rejects(
    () => buildLegalityInput(supabase, characterId),
    /character_spell_selections.*permission denied/i
  )
})

test('slice 8b captureSnapshot reports query and insert failures', async () => {
  const queryFailure = await captureSnapshot(
    createSupabaseMock({
      [`characters:eq:${characterId}`]: { data: characterRow(), error: null },
      [`character_feat_choices:eq:${characterId}`]: {
        data: null,
        error: { message: 'permission denied for character_feat_choices' },
      },
    }),
    characterId
  )

  assert.deepEqual(queryFailure, {
    ok: false,
    error: {
      message: 'Failed to capture character snapshot',
      issues: [{
        scope: 'feat_choices',
        message: 'permission denied for character_feat_choices',
      }],
    },
  })

  const insertFailure = await captureSnapshot(
    createSupabaseMock({
      [`characters:eq:${characterId}`]: { data: characterRow(), error: null },
      'character_snapshots:insert': {
        data: null,
        error: { message: 'insert blocked for character_snapshots' },
      },
    }),
    characterId
  )

  assert.deepEqual(insertFailure, {
    ok: false,
    error: {
      message: 'Failed to insert character snapshot',
      issues: [{
        scope: 'character_snapshots',
        message: 'insert blocked for character_snapshots',
      }],
    },
  })
})

test('slice 8b character routes map relation and snapshot failures explicitly', () => {
  const saveRoute = read('src/app/api/characters/[id]/route.ts')
  const submitRoute = read('src/app/api/characters/[id]/submit/route.ts')
  const approveRoute = read('src/app/api/characters/[id]/approve/route.ts')
  const requestChangesRoute = read('src/app/api/characters/[id]/request-changes/route.ts')
  const legalityRoute = read('src/app/api/legality/check/route.ts')

  assert.match(saveRoute, /snapshot_capture_failed/)
  assert.match(submitRoute, /buildLegalityInputResult/)
  assert.match(submitRoute, /snapshot_capture_failed/)
  assert.match(approveRoute, /buildLegalityInputResult/)
  assert.match(approveRoute, /snapshot_capture_failed/)
  assert.match(requestChangesRoute, /buildLegalityInputResult/)
  assert.match(legalityRoute, /buildLegalityInputResult/)
  assert.match(legalityRoute, /legality_input_load_failed/)
})

test('slice 8b content clients use fetchContent instead of unchecked response.json chains', () => {
  for (const file of [
    'src/components/character-sheet/CharacterSheet.tsx',
    'src/app/characters/new/CharacterNewForm.tsx',
    'src/app/characters/[id]/LevelUpWizard.tsx',
    'src/components/dm/ContentAdmin.tsx',
  ]) {
    const source = read(file)
    assert.match(source, /fetchContent/)
    assert.doesNotMatch(
      source,
      /fetch\(\s*`?['"]?\/api\/content[\s\S]{0,120}\.then\(\s*\(?r\)?\s*=>\s*r\.json\(\)/,
      file
    )
  }
})
