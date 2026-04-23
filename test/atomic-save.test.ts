import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCharacterAtomicSavePayload,
  buildCharacterLevelUpSavePayload,
  saveCharacterAtomic,
  saveCharacterLevelUpAtomic,
} from '@/lib/characters/atomic-save'

function createSupabaseMock() {
  const queries: Array<{ table: string; action: string; columns?: string }> = []
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = []

  return {
    queries,
    rpcCalls,
    client: {
      from(table: string) {
        return {
          select(columns: string) {
            queries.push({ table, action: 'select', columns })

            if (table === 'languages') {
              return Promise.resolve({
                data: [
                  { key: 'common', name: 'Common' },
                  { key: 'elvish', name: 'Elvish' },
                ],
                error: null,
              })
            }

            if (table === 'tools') {
              return Promise.resolve({
                data: [
                  { key: 'smiths-tools', name: "Smith's tools" },
                  { key: 'thieves-tools', name: "Thieves' tools" },
                ],
                error: null,
              })
            }

            return Promise.resolve({ data: [], error: null })
          },
        }
      },
      async rpc(fn: string, args: Record<string, unknown>) {
        rpcCalls.push({ fn, args })
        return { data: null, error: null }
      },
    },
  }
}

test('buildCharacterAtomicSavePayload normalizes typed rows and resolves language/tool keys', async () => {
  const supabase = createSupabaseMock()

  const payload = await buildCharacterAtomicSavePayload(supabase.client as never, {
    characterFields: { name: 'Aelar', status: 'draft' },
    levels: [{
      class_id: 'wizard',
      level: 3,
      subclass_id: null,
      hp_roll: 4,
    }],
    language_choices: [
      'Common',
      {
        language: 'Elvish',
        source_category: 'species',
      },
    ],
    tool_choices: [
      "Smith's tools",
      {
        tool: "Thieves' tools",
        source_category: 'background',
      },
    ],
    spell_choices: ['spell-1'],
    feat_choices: ['feat-1', ''],
  })

  assert.deepEqual(payload, {
    name: 'Aelar',
    status: 'draft',
    levels: [{
      class_id: 'wizard',
      level: 3,
      subclass_id: null,
      hp_roll: 4,
    }],
    language_choices: [{
      language: 'Common',
      language_key: 'common',
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    }, {
      language: 'Elvish',
      language_key: 'elvish',
      character_level_id: null,
      source_category: 'species',
      source_entity_id: null,
      source_feature_key: null,
    }],
    tool_choices: [{
      tool: "Smith's tools",
      tool_key: 'smiths-tools',
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    }, {
      tool: "Thieves' tools",
      tool_key: 'thieves-tools',
      character_level_id: null,
      source_category: 'background',
      source_entity_id: null,
      source_feature_key: null,
    }],
    spell_choices: [{
      spell_id: 'spell-1',
      character_level_id: null,
      owning_class_id: null,
      granting_subclass_id: null,
      acquisition_mode: 'known',
      counts_against_selection_limit: true,
      source_feature_key: null,
    }],
    feat_choices: [{
      feat_id: 'feat-1',
      character_level_id: null,
      choice_kind: 'feat',
      source_feature_key: null,
    }],
  })

  assert.deepEqual(supabase.queries, [
    { table: 'languages', action: 'select', columns: 'key, name' },
    { table: 'tools', action: 'select', columns: 'key, name' },
  ])
})

test('saveCharacterAtomic sends the full payload through the atomic RPC', async () => {
  const supabase = createSupabaseMock()
  const payload = {
    name: 'Aelar',
    levels: [{ class_id: 'wizard', level: 2, subclass_id: null, hp_roll: 5 }],
  }

  const result = await saveCharacterAtomic(
    supabase.client as never,
    'character-123',
    payload
  )

  assert.equal(result.error, null)
  assert.deepEqual(supabase.rpcCalls, [{
    fn: 'save_character_atomic',
    args: {
      p_character_id: 'character-123',
      p_payload: payload,
    },
  }])
})

test('buildCharacterLevelUpSavePayload normalizes only additive level-up rows', async () => {
  const supabase = createSupabaseMock()

  const payload = await buildCharacterLevelUpSavePayload(supabase.client as never, {
    characterFields: { hp_max: 17, status: 'draft' },
    level_up: {
      class_id: 'wizard',
      previous_level: 2,
      new_level: 3,
      subclass_id: 'evocation',
      hp_roll: 4,
    },
    skill_proficiencies: [{
      skill: 'Arcana',
      source_category: 'class',
    }],
    asi_choices: [{
      slot_index: 1,
      ability: 'int',
      bonus: 2,
    }],
    spell_choices: ['spell-2'],
    feat_choices: ['feat-2'],
  })

  assert.deepEqual(payload, {
    hp_max: 17,
    status: 'draft',
    level_up: {
      class_id: 'wizard',
      previous_level: 2,
      new_level: 3,
      subclass_id: 'evocation',
      hp_roll: 4,
    },
    skill_proficiencies: [{
      skill: 'Arcana',
      expertise: false,
      character_level_id: null,
      source_category: 'class',
      source_entity_id: null,
      source_feature_key: null,
    }],
    asi_choices: [{
      slot_index: 1,
      ability: 'int',
      bonus: 2,
      character_level_id: null,
      source_feature_key: null,
    }],
    spell_choices: [{
      spell_id: 'spell-2',
      character_level_id: null,
      owning_class_id: null,
      granting_subclass_id: null,
      acquisition_mode: 'known',
      counts_against_selection_limit: true,
      source_feature_key: null,
    }],
    feat_choices: [{
      feat_id: 'feat-2',
      character_level_id: null,
      choice_kind: 'feat',
      source_feature_key: null,
    }],
  })
})

test('saveCharacterLevelUpAtomic sends the additive payload through the level-up RPC', async () => {
  const supabase = createSupabaseMock()
  const payload = {
    hp_max: 17,
    level_up: { class_id: 'wizard', previous_level: 2, new_level: 3, subclass_id: null, hp_roll: 4 },
    spell_choices: [{ spell_id: 'spell-2' }],
  }

  const result = await saveCharacterLevelUpAtomic(
    supabase.client as never,
    'character-123',
    payload
  )

  assert.equal(result.error, null)
  assert.deepEqual(supabase.rpcCalls, [{
    fn: 'save_character_level_up_atomic',
    args: {
      p_character_id: 'character-123',
      p_payload: payload,
    },
  }])
})
