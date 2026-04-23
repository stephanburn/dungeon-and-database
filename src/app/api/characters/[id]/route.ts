import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import { hasDmAccess } from '@/lib/auth/roles'
import { loadCharacterState } from '@/lib/characters/load-character'
import {
  buildCharacterAtomicSavePayload,
  saveCharacterAtomic,
} from '@/lib/characters/atomic-save'
import {
  type AbilityBonusChoiceInput,
  type AsiChoiceInput,
  type FeatChoiceInput,
  type FeatureOptionChoiceInput,
  type EquipmentItemChoiceInput,
  type LanguageChoiceInput,
  type SkillProficiencyInput,
  type SpellChoiceInput,
  type ToolChoiceInput,
} from '@/lib/characters/choice-persistence'
import { captureSnapshot } from '@/lib/snapshots'
import { z } from 'zod'

const spellChoiceSchema = z.union([
  z.string().uuid(),
  z.object({
    spell_id: z.string().uuid(),
    character_level_id: z.string().uuid().nullable().optional(),
    owning_class_id: z.string().uuid().nullable().optional(),
    granting_subclass_id: z.string().uuid().nullable().optional(),
    acquisition_mode: z.string().min(1).optional(),
    counts_against_selection_limit: z.boolean().optional(),
    source_feature_key: z.string().nullable().optional(),
  }),
])

const featChoiceSchema = z.union([
  z.string(),
  z.object({
    feat_id: z.string().uuid(),
    character_level_id: z.string().uuid().nullable().optional(),
    choice_kind: z.string().min(1).optional(),
    source_feature_key: z.string().nullable().optional(),
  }),
])

const skillProficiencySchema = z.union([
  z.string(),
  z.object({
    skill: z.string().min(1),
    expertise: z.boolean().optional(),
    character_level_id: z.string().uuid().nullable().optional(),
    source_category: z.string().min(1).optional(),
    source_entity_id: z.string().uuid().nullable().optional(),
    source_feature_key: z.string().nullable().optional(),
  }),
])

const languageChoiceSchema = z.union([
  z.string().min(1),
  z.object({
    language: z.string().min(1),
    language_key: z.string().min(1).nullable().optional(),
    character_level_id: z.string().uuid().nullable().optional(),
    source_category: z.string().min(1).optional(),
    source_entity_id: z.string().uuid().nullable().optional(),
    source_feature_key: z.string().nullable().optional(),
  }),
])

const toolChoiceSchema = z.union([
  z.string().min(1),
  z.object({
    tool: z.string().min(1),
    tool_key: z.string().min(1).nullable().optional(),
    character_level_id: z.string().uuid().nullable().optional(),
    source_category: z.string().min(1).optional(),
    source_entity_id: z.string().uuid().nullable().optional(),
    source_feature_key: z.string().nullable().optional(),
  }),
])

const abilityBonusChoiceSchema = z.object({
  ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
  bonus: z.number().int().min(1).optional(),
  character_level_id: z.string().uuid().nullable().optional(),
  source_category: z.string().min(1).optional(),
  source_entity_id: z.string().uuid().nullable().optional(),
  source_feature_key: z.string().nullable().optional(),
})

const asiChoiceSchema = z.object({
  slot_index: z.number().int().min(0),
  ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
  bonus: z.number().int().min(1).optional(),
  character_level_id: z.string().uuid().nullable().optional(),
  source_feature_key: z.string().nullable().optional(),
})

const featureOptionChoiceSchema = z.object({
  option_group_key: z.string().min(1),
  option_key: z.string().min(1),
  selected_value: z.record(z.string(), z.unknown()).optional(),
  choice_order: z.number().int().min(0).optional(),
  character_level_id: z.string().uuid().nullable().optional(),
  source_category: z.string().min(1).optional(),
  source_entity_id: z.string().uuid().nullable().optional(),
  source_feature_key: z.string().nullable().optional(),
})

const equipmentItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().min(1).optional(),
  equipped: z.boolean().optional(),
  source_package_item_id: z.string().uuid().nullable().optional(),
  source_category: z.string().min(1).optional(),
  source_entity_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species_id: z.string().uuid().nullable().optional(),
  background_id: z.string().uuid().nullable().optional(),
  alignment: z.enum(['LG','NG','CG','LN','N','CN','LE','NE','CE']).nullable().optional(),
  experience_points: z.number().int().min(0).optional(),
  stat_method: z.enum(['point_buy', 'standard_array', 'rolled']).optional(),
  base_str: z.number().int().min(1).max(30).optional(),
  base_dex: z.number().int().min(1).max(30).optional(),
  base_con: z.number().int().min(1).max(30).optional(),
  base_int: z.number().int().min(1).max(30).optional(),
  base_wis: z.number().int().min(1).max(30).optional(),
  base_cha: z.number().int().min(1).max(30).optional(),
  hp_max: z.number().int().min(0).optional(),
  character_type: z.enum(['pc', 'npc', 'test']).optional(),
  dm_notes: z.string().max(2000).optional(),
  // Skill proficiencies: chosen skill rows, optionally with provenance metadata
  skill_proficiencies: z.array(skillProficiencySchema).optional(),
  ability_bonus_choices: z.array(abilityBonusChoiceSchema).optional(),
  asi_choices: z.array(asiChoiceSchema).optional(),
  feature_option_choices: z.array(featureOptionChoiceSchema).optional(),
  equipment_items: z.array(equipmentItemSchema).optional(),
  language_choices: z.array(languageChoiceSchema).optional(),
  tool_choices: z.array(toolChoiceSchema).optional(),
  // Spell choices: full replacement of the character's typed spell selections
  spell_choices: z.array(spellChoiceSchema).optional(),
  // Feat choices: full replacement of typed feat choices (empty string = ASI taken instead)
  feat_choices: z.array(featChoiceSchema).optional(),
  // Levels: full replacement of the character's class levels
  levels: z.array(z.object({
    class_id: z.string().uuid(),
    level: z.number().int().min(1).max(20),
    subclass_id: z.string().uuid().nullable().optional(),
    hp_roll: z.number().int().nullable().optional(),
  })).optional(),
  // Stat rolls: full replacement
  stat_rolls: z.array(z.object({
    assigned_to: z.enum(['str','dex','con','int','wis','cha']),
    roll_set: z.array(z.number().int().min(1).max(6)).length(4),
  })).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const loadedState = await loadCharacterState(supabase, params.id)
  if (loadedState.status === 'not_found') return jsonError('Character not found', 404)
  if (loadedState.status === 'error') return jsonError(loadedState.error.message, 500)
  const state = loadedState.state

  return NextResponse.json({
    ...state.character,
    skill_proficiencies: state.initialSkillProficiencies,
    typed_skill_proficiencies: state.initialTypedSkillProficiencies,
    ability_bonus_choices: state.initialAbilityBonusChoices,
    typed_ability_bonus_choices: state.initialTypedAbilityBonusChoices,
    asi_choices: state.initialAsiChoices,
    language_choices: state.initialLanguageChoices,
    typed_language_choices: state.initialTypedLanguageChoices,
    tool_choices: state.initialToolChoices,
    typed_tool_choices: state.initialTypedToolChoices,
    spell_choices: state.initialSpellChoices,
    spell_selections: state.initialSpellSelections,
    feat_choices: state.initialFeatChoices,
    feature_option_choices: state.initialFeatureOptionChoices,
    equipment_items: state.initialEquipmentItems,
    stat_rolls: state.initialStatRolls,
    legality: state.legality,
    derived: state.legality?.derived ?? null,
    load_warnings: loadedState.warnings,
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  // Verify ownership (players) or DM access
  const { data: existing } = await supabase
    .from('characters')
    .select('user_id, status')
    .eq('id', params.id)
    .single()

  if (!existing) return jsonError('Character not found', 404)
  if (!hasDmAccess(profile.role) && existing.user_id !== profile.id) {
    return jsonError('Forbidden', 403)
  }

  const bodyResult = await readJsonBody<unknown>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  const parsed = updateCharacterSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { levels, stat_rolls, skill_proficiencies, ability_bonus_choices, asi_choices, feature_option_choices, equipment_items, language_choices, tool_choices, spell_choices, feat_choices, character_type, dm_notes, ...characterFields } = parsed.data

  // DM-only fields
  if (hasDmAccess(profile.role)) {
    if (character_type !== undefined) (characterFields as Record<string, unknown>).character_type = character_type
    if (dm_notes !== undefined) (characterFields as Record<string, unknown>).dm_notes = dm_notes
  }

  // Saving an approved character returns it to draft
  if (existing.status === 'approved') {
    (characterFields as Record<string, unknown>).status = 'draft'
  }

  let saveError: { message: string } | null = null
  try {
    const payload = await buildCharacterAtomicSavePayload(supabase, {
      characterFields,
      levels,
      stat_rolls,
      skill_proficiencies: skill_proficiencies as SkillProficiencyInput[] | undefined,
      ability_bonus_choices: ability_bonus_choices as AbilityBonusChoiceInput[] | undefined,
      asi_choices: asi_choices as AsiChoiceInput[] | undefined,
      feature_option_choices: feature_option_choices as FeatureOptionChoiceInput[] | undefined,
      equipment_items: equipment_items as EquipmentItemChoiceInput[] | undefined,
      language_choices: language_choices as LanguageChoiceInput[] | undefined,
      tool_choices: tool_choices as ToolChoiceInput[] | undefined,
      spell_choices: spell_choices as SpellChoiceInput[] | undefined,
      feat_choices: feat_choices as FeatChoiceInput[] | undefined,
    })

    const result = await saveCharacterAtomic(supabase, params.id, payload)
    saveError = result.error
  } catch (error) {
    saveError = {
      message: error instanceof Error ? error.message : 'Failed to save character',
    }
  }

  if (saveError) return jsonError(saveError.message, 500)

  // Capture snapshot and reload through the shared cutover loader so
  // save responses use the same class-level aggregation as the rest of the app.
  await captureSnapshot(supabase, params.id)
  const loadedState = await loadCharacterState(supabase, params.id)
  if (loadedState.status === 'not_found') return jsonError('Character not found', 404)
  if (loadedState.status === 'error') return jsonError(loadedState.error.message, 500)

  return NextResponse.json({
    character: loadedState.state.character,
    legality: loadedState.state.legality,
    derived: loadedState.state.legality?.derived ?? null,
    load_warnings: loadedState.warnings,
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const { data: existing } = await supabase
    .from('characters')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!existing) return jsonError('Character not found', 404)
  if (!hasDmAccess(profile.role) && existing.user_id !== profile.id) {
    return jsonError('Forbidden', 403)
  }

  const { error } = await supabase.from('characters').delete().eq('id', params.id)
  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
