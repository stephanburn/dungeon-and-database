import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import {
  shieldCreateSchema,
  shieldDeleteSchema,
  shieldUpdateSchema,
} from '@/lib/content/admin-schemas'
import { listShields } from '@/lib/content/equipment-content'
import { writeAuditLog } from '@/lib/server/audit'
import type { Database } from '@/lib/types/database'

async function validateShieldItem(supabase: SupabaseClient<Database>, itemId: string) {
  const { data, error } = await supabase
    .from('equipment_items')
    .select('id, item_category')
    .eq('id', itemId)
    .single()
  if (error) return { error }
  if (!data || data.item_category !== 'shield') {
    return { error: { message: 'Selected equipment item must have item_category "shield"' } }
  }
  return { error: null }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const { data, error } = await listShields(supabase, { campaignId })
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const parsed = shieldCreateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const body = parsed.data

  const validation = await validateShieldItem(supabase, body.item_id)
  if (validation.error) return jsonError(validation.error.message, 400)

  const { data, error } = await supabase
    .from('shields')
    .insert({
      item_id: body.item_id,
      armor_class_bonus: body.armor_class_bonus,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.shield_created',
    targetTable: 'shields',
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
  const parsed = shieldUpdateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const body = parsed.data

  const validation = await validateShieldItem(supabase, body.item_id)
  if (validation.error) return jsonError(validation.error.message, 400)

  const { data, error } = await supabase
    .from('shields')
    .update({
      armor_class_bonus: body.armor_class_bonus,
    })
    .eq('item_id', body.item_id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.shield_updated',
    targetTable: 'shields',
    targetId: data.item_id,
    details: { item_id: data.item_id },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const parsed = shieldDeleteSchema.safeParse({
    item_id: request.nextUrl.searchParams.get('item_id'),
  })
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const itemId = parsed.data.item_id

  const { error } = await supabase.from('shields').delete().eq('item_id', itemId)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.shield_deleted',
    targetTable: 'shields',
    targetId: itemId,
    details: { item_id: itemId },
  })
  return new NextResponse(null, { status: 204 })
}
