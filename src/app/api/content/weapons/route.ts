import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import { listWeapons } from '@/lib/content/equipment-content'
import { writeAuditLog } from '@/lib/server/audit'
import type { Database } from '@/lib/types/database'

async function validateWeaponItem(supabase: SupabaseClient<Database>, itemId: string) {
  const { data, error } = await supabase
    .from('equipment_items')
    .select('id, item_category')
    .eq('id', itemId)
    .single()
  if (error) return { error }
  if (!data || data.item_category !== 'weapon') {
    return { error: { message: 'Selected equipment item must have item_category "weapon"' } }
  }
  return { error: null }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const { data, error } = await listWeapons(supabase, { campaignId })
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

  const validation = await validateWeaponItem(supabase, body.item_id as string)
  if (validation.error) return jsonError(validation.error.message, 400)

  const { data, error } = await supabase
    .from('weapons')
    .insert({
      item_id: body.item_id as string,
      weapon_category: body.weapon_category as string,
      weapon_kind: body.weapon_kind as string,
      damage_dice: body.damage_dice as string,
      damage_type: body.damage_type as string,
      properties: (body.properties as string[] | undefined) ?? [],
      normal_range: body.normal_range == null || body.normal_range === '' ? null : Number(body.normal_range),
      long_range: body.long_range == null || body.long_range === '' ? null : Number(body.long_range),
      versatile_damage: (body.versatile_damage as string | undefined) || null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.weapon_created',
    targetTable: 'weapons',
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

  const validation = await validateWeaponItem(supabase, body.item_id as string)
  if (validation.error) return jsonError(validation.error.message, 400)

  const { data, error } = await supabase
    .from('weapons')
    .update({
      weapon_category: body.weapon_category as string,
      weapon_kind: body.weapon_kind as string,
      damage_dice: body.damage_dice as string,
      damage_type: body.damage_type as string,
      properties: (body.properties as string[] | undefined) ?? [],
      normal_range: body.normal_range == null || body.normal_range === '' ? null : Number(body.normal_range),
      long_range: body.long_range == null || body.long_range === '' ? null : Number(body.long_range),
      versatile_damage: (body.versatile_damage as string | undefined) || null,
    })
    .eq('item_id', body.item_id as string)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.weapon_updated',
    targetTable: 'weapons',
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

  const { error } = await supabase.from('weapons').delete().eq('item_id', itemId)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.weapon_deleted',
    targetTable: 'weapons',
    targetId: itemId,
    details: { item_id: itemId },
  })
  return new NextResponse(null, { status: 204 })
}
