import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import {
  weaponCreateSchema,
  weaponDeleteSchema,
  weaponUpdateSchema,
} from '@/lib/content/admin-schemas'
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
  const parsed = weaponCreateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const body = parsed.data

  const validation = await validateWeaponItem(supabase, body.item_id)
  if (validation.error) return jsonError(validation.error.message, 400)

  const { data, error } = await supabase
    .from('weapons')
    .insert({
      item_id: body.item_id,
      weapon_category: body.weapon_category,
      weapon_kind: body.weapon_kind,
      damage_dice: body.damage_dice,
      damage_type: body.damage_type,
      properties: body.properties ?? [],
      normal_range: body.normal_range ?? null,
      long_range: body.long_range ?? null,
      versatile_damage: body.versatile_damage || null,
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
  const parsed = weaponUpdateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const body = parsed.data

  const validation = await validateWeaponItem(supabase, body.item_id)
  if (validation.error) return jsonError(validation.error.message, 400)

  const { data, error } = await supabase
    .from('weapons')
    .update({
      weapon_category: body.weapon_category,
      weapon_kind: body.weapon_kind,
      damage_dice: body.damage_dice,
      damage_type: body.damage_type,
      properties: body.properties ?? [],
      normal_range: body.normal_range ?? null,
      long_range: body.long_range ?? null,
      versatile_damage: body.versatile_damage || null,
    })
    .eq('item_id', body.item_id)
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

  const parsed = weaponDeleteSchema.safeParse({
    item_id: request.nextUrl.searchParams.get('item_id'),
  })
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const itemId = parsed.data.item_id

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
