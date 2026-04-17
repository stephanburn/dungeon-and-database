import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import { listArmor } from '@/lib/content/equipment-content'
import { writeAuditLog } from '@/lib/server/audit'
import type { Database } from '@/lib/types/database'

async function validateArmorItem(supabase: SupabaseClient<Database>, itemId: string) {
  const { data, error } = await supabase
    .from('equipment_items')
    .select('id, item_category')
    .eq('id', itemId)
    .single()
  if (error) return { error }
  if (!data || data.item_category !== 'armor') {
    return { error: { message: 'Selected equipment item must have item_category "armor"' } }
  }
  return { error: null }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const { data, error } = await listArmor(supabase, { campaignId })
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  if (!body.item_id) return jsonError('item_id is required', 400)

  const validation = await validateArmorItem(supabase, body.item_id as string)
  if (validation.error) return jsonError(validation.error.message, 400)

  const { data, error } = await supabase
    .from('armor')
    .insert({
      item_id: body.item_id as string,
      armor_category: body.armor_category as string,
      base_ac: Number(body.base_ac),
      dex_bonus_cap: body.dex_bonus_cap == null || body.dex_bonus_cap === '' ? null : Number(body.dex_bonus_cap),
      minimum_strength: body.minimum_strength == null || body.minimum_strength === '' ? null : Number(body.minimum_strength),
      stealth_disadvantage: Boolean(body.stealth_disadvantage),
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.armor_created',
    targetTable: 'armor',
    targetId: data.item_id,
    details: { item_id: data.item_id },
  })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  if (!body.item_id) return jsonError('item_id is required', 400)

  const validation = await validateArmorItem(supabase, body.item_id as string)
  if (validation.error) return jsonError(validation.error.message, 400)

  const { data, error } = await supabase
    .from('armor')
    .update({
      armor_category: body.armor_category as string,
      base_ac: Number(body.base_ac),
      dex_bonus_cap: body.dex_bonus_cap == null || body.dex_bonus_cap === '' ? null : Number(body.dex_bonus_cap),
      minimum_strength: body.minimum_strength == null || body.minimum_strength === '' ? null : Number(body.minimum_strength),
      stealth_disadvantage: Boolean(body.stealth_disadvantage),
    })
    .eq('item_id', body.item_id as string)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.armor_updated',
    targetTable: 'armor',
    targetId: data.item_id,
    details: { item_id: data.item_id },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const itemId = request.nextUrl.searchParams.get('item_id')
  if (!itemId) return jsonError('item_id is required', 400)

  const { error } = await supabase.from('armor').delete().eq('item_id', itemId)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.armor_deleted',
    targetTable: 'armor',
    targetId: itemId,
    details: { item_id: itemId },
  })
  return new NextResponse(null, { status: 204 })
}
