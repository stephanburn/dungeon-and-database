import test from 'node:test'
import assert from 'node:assert/strict'
import { loadCharacterState } from '@/lib/characters/load-character'
import type { Database } from '@/lib/types/database'

type QueryResponse = { data: unknown; error: { message: string } | null }

function createSupabaseMock(responses: Record<string, QueryResponse>) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq(_column: string, value: string) {
              const key = `${table}:eq:${value}`
              const response = responses[key] ?? { data: [], error: null }
              return Object.assign({}, response, {
                single: async () => response,
                maybeSingle: async () => response,
              })
            },
            in(_column: string, _values: string[]) {
              const key = `${table}:in`
              return Promise.resolve(responses[key] ?? { data: [], error: null })
            },
          }
        },
      }
    },
  } as never
}

const characterId = '00000000-0000-0000-0000-000000000001'

test('loadCharacterState returns warnings for missing optional relations', async () => {
  const supabase = createSupabaseMock({
    [`characters:eq:${characterId}`]: {
      data: {
        id: characterId,
        user_id: 'user-1',
        campaign_id: 'campaign-1',
        name: 'Aelar',
        species_id: '00000000-0000-0000-0000-000000000010',
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
      },
      error: null,
    },
    [`species:eq:00000000-0000-0000-0000-000000000010`]: { data: null, error: null },
    [`character_class_levels:eq:${characterId}`]: { data: [], error: null },
    [`character_skill_proficiencies:eq:${characterId}`]: { data: [], error: null },
    [`character_ability_bonus_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_asi_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_language_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_tool_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_feature_option_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_equipment_items:eq:${characterId}`]: { data: [], error: null },
    [`character_spell_selections:eq:${characterId}`]: { data: [], error: null },
    [`character_feat_choices:eq:${characterId}`]: { data: [], error: null },
  })

  const result = await loadCharacterState(supabase as never, characterId, {
    buildLegalityInputImpl: async () => null,
  })

  assert.equal(result.status, 'success')
  if (result.status !== 'success') return
  assert.equal(result.warnings.length, 1)
  assert.equal(result.warnings[0]?.scope, 'species')
})

test('loadCharacterState rebuilds aggregate levels from per-level class history', async () => {
  const wizardLevelOneId = '10000000-0000-0000-0000-000000000001'
  const wizardLevelTwoId = '10000000-0000-0000-0000-000000000002'
  const fighterLevelOneId = '20000000-0000-0000-0000-000000000001'
  const wizardClassId = '30000000-0000-0000-0000-000000000001'
  const fighterClassId = '30000000-0000-0000-0000-000000000002'
  const evocatorSubclassId = '40000000-0000-0000-0000-000000000001'

  const supabase = createSupabaseMock({
    [`characters:eq:${characterId}`]: {
      data: {
        id: characterId,
        user_id: 'user-1',
        campaign_id: 'campaign-1',
        name: 'Aelar',
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
        hp_max: 14,
        character_type: 'pc',
        dm_notes: null,
        created_at: '',
        updated_at: '',
      },
      error: null,
    },
    [`character_class_levels:eq:${characterId}`]: {
      data: [
        {
          id: wizardLevelOneId,
          character_id: characterId,
          class_id: wizardClassId,
          level_number: 1,
          subclass_id: null,
          hp_roll: 6,
          taken_at: '2026-04-20T10:00:00.000Z',
        },
        {
          id: fighterLevelOneId,
          character_id: characterId,
          class_id: fighterClassId,
          level_number: 1,
          subclass_id: null,
          hp_roll: 10,
          taken_at: '2026-04-21T10:00:00.000Z',
        },
        {
          id: wizardLevelTwoId,
          character_id: characterId,
          class_id: wizardClassId,
          level_number: 2,
          subclass_id: evocatorSubclassId,
          hp_roll: 4,
          taken_at: '2026-04-22T10:00:00.000Z',
        },
      ],
      error: null,
    },
    [`character_skill_proficiencies:eq:${characterId}`]: { data: [], error: null },
    [`character_ability_bonus_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_asi_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_language_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_tool_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_feature_option_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_equipment_items:eq:${characterId}`]: { data: [], error: null },
    [`character_spell_selections:eq:${characterId}`]: { data: [], error: null },
    [`character_feat_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_stat_rolls:eq:${characterId}`]: { data: [], error: null },
  })

  const result = await loadCharacterState(supabase as never, characterId, {
    buildLegalityInputImpl: async () => null,
  })

  assert.equal(result.status, 'success')
  if (result.status !== 'success') return

  assert.equal(result.state.character.character_class_levels.length, 3)
  assert.deepEqual(
    result.state.character.character_levels.map((level) => ({
      id: level.id,
      class_id: level.class_id,
      level: level.level,
      subclass_id: level.subclass_id,
      hp_roll: level.hp_roll,
    })),
    [
      {
        id: fighterLevelOneId,
        class_id: fighterClassId,
        level: 1,
        subclass_id: null,
        hp_roll: 10,
      },
      {
        id: wizardLevelTwoId,
        class_id: wizardClassId,
        level: 2,
        subclass_id: evocatorSubclassId,
        hp_roll: 4,
      },
    ]
  )
})

test('loadCharacterState derives language and tool display names from catalog keys', async () => {
  const supabase = createSupabaseMock({
    [`characters:eq:${characterId}`]: {
      data: {
        id: characterId,
        user_id: 'user-1',
        campaign_id: 'campaign-1',
        name: 'Aelar',
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
      },
      error: null,
    },
    [`character_class_levels:eq:${characterId}`]: { data: [], error: null },
    [`character_skill_proficiencies:eq:${characterId}`]: { data: [], error: null },
    [`character_ability_bonus_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_asi_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_language_choices:eq:${characterId}`]: {
      data: [{
        character_id: characterId,
        language: 'Old Common Label',
        language_key: 'common',
        character_level_id: null,
        source_category: 'manual',
        source_entity_id: null,
        source_feature_key: null,
        created_at: '',
      }],
      error: null,
    },
    [`character_tool_choices:eq:${characterId}`]: {
      data: [{
        character_id: characterId,
        tool: 'Old Smith Label',
        tool_key: 'smiths-tools',
        character_level_id: null,
        source_category: 'manual',
        source_entity_id: null,
        source_feature_key: null,
        created_at: '',
      }],
      error: null,
    },
    [`character_feature_option_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_equipment_items:eq:${characterId}`]: { data: [], error: null },
    [`character_spell_selections:eq:${characterId}`]: { data: [], error: null },
    [`character_feat_choices:eq:${characterId}`]: { data: [], error: null },
    [`character_stat_rolls:eq:${characterId}`]: { data: [], error: null },
    'languages:in': { data: [{ key: 'common', name: 'Common' }], error: null },
    'tools:in': { data: [{ key: 'smiths-tools', name: "Smith's tools" }], error: null },
  })

  const result = await loadCharacterState(supabase as never, characterId, {
    buildLegalityInputImpl: async () => null,
  })

  assert.equal(result.status, 'success')
  if (result.status !== 'success') return
  assert.deepEqual(result.state.initialLanguageChoices, ['Common'])
  assert.deepEqual(result.state.initialToolChoices, ["Smith's tools"])
  assert.equal(result.state.initialTypedLanguageChoices[0]?.language, 'Common')
  assert.equal(result.state.initialTypedToolChoices[0]?.tool, "Smith's tools")
})

test('loadCharacterState returns a hard failure when one parallel query errors', async () => {
  const supabase = createSupabaseMock({
    [`characters:eq:${characterId}`]: {
      data: {
        id: characterId,
        user_id: 'user-1',
        campaign_id: 'campaign-1',
        name: 'Aelar',
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
      },
      error: null,
    },
    [`character_class_levels:eq:${characterId}`]: {
      data: null,
      error: { message: 'permission denied for character_class_levels' },
    },
  })

  const result = await loadCharacterState(supabase as never, characterId, {
    buildLegalityInputImpl: async () => null,
  })

  assert.equal(result.status, 'error')
  if (result.status !== 'error') return
  assert.equal(result.error.issues[0]?.scope, 'levels')
  assert.match(result.error.issues[0]?.message ?? '', /permission denied/i)
})
