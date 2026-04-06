import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { buildLegalityInput } from '@/lib/legality/build-input'
import { runLegalityChecks } from '@/lib/legality/engine'
import { captureSnapshot } from '@/lib/snapshots'
import { z } from 'zod'

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

  const { data, error } = await supabase
    .from('characters')
    .select(`
      *,
      species:species_id(*),
      background:background_id(*),
      character_levels(*),
      character_choices(*),
      character_stat_rolls(*)
    `)
    .eq('id', params.id)
    .single()

  if (error) return jsonError('Character not found', 404)
  return NextResponse.json(data)
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
  if (profile.role !== 'dm' && existing.user_id !== profile.id) {
    return jsonError('Forbidden', 403)
  }

  const body = await request.json()
  const parsed = updateCharacterSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { levels, stat_rolls, character_type, ...characterFields } = parsed.data

  // character_type may only be changed by a DM
  if (character_type !== undefined && profile.role === 'dm') {
    (characterFields as Record<string, unknown>).character_type = character_type
  }

  // Update character fields
  if (Object.keys(characterFields).length > 0) {
    const { error } = await supabase
      .from('characters')
      .update(characterFields)
      .eq('id', params.id)

    if (error) return jsonError(error.message, 500)
  }

  // Replace levels if provided
  if (levels !== undefined) {
    await supabase.from('character_levels').delete().eq('character_id', params.id)

    if (levels.length > 0) {
      const rows = levels.map((l) => ({
        character_id: params.id,
        class_id: l.class_id,
        level: l.level,
        subclass_id: l.subclass_id ?? null,
        hp_roll: l.hp_roll ?? null,
      }))
      const { error } = await supabase.from('character_levels').insert(rows)
      if (error) return jsonError(error.message, 500)
    }
  }

  // Replace stat rolls if provided
  if (stat_rolls !== undefined) {
    await supabase.from('character_stat_rolls').delete().eq('character_id', params.id)

    if (stat_rolls.length > 0) {
      const rows = stat_rolls.map((r) => ({
        character_id: params.id,
        assigned_to: r.assigned_to,
        roll_set: r.roll_set,
      }))
      const { error } = await supabase.from('character_stat_rolls').insert(rows)
      if (error) return jsonError(error.message, 500)
    }
  }

  // Capture snapshot and run legality check
  await captureSnapshot(supabase, params.id)
  const legalityInput = await buildLegalityInput(supabase, params.id)
  const legalityResult = legalityInput ? runLegalityChecks(legalityInput) : null

  const { data: updated } = await supabase
    .from('characters')
    .select(`*, species:species_id(*), background:background_id(*), character_levels(*), character_stat_rolls(*)`)
    .eq('id', params.id)
    .single()

  return NextResponse.json({ character: updated, legality: legalityResult })
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
  if (profile.role !== 'dm' && existing.user_id !== profile.id) {
    return jsonError('Forbidden', 403)
  }

  const { error } = await supabase.from('characters').delete().eq('id', params.id)
  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
