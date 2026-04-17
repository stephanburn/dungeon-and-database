import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import { listEquipmentItems } from '@/lib/content/equipment-content'
import { writeAuditLog } from '@/lib/server/audit'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const { data, error } = await listEquipmentItems(supabase, { campaignId })
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
  if (!body.key || !body.name || !body.item_category || !body.source) {
    return jsonError('key, name, item_category, and source are required', 400)
  }

  const { data, error } = await supabase
    .from('equipment_items')
    .insert({
      key: body.key as string,
      name: body.name as string,
      item_category: body.item_category as string,
      cost_quantity: Number(body.cost_quantity ?? 0),
      cost_unit: (body.cost_unit as string | undefined) ?? 'gp',
      weight_lb: body.weight_lb == null || body.weight_lb === '' ? null : Number(body.weight_lb),
      source: body.source as string,
      amended: false,
      amendment_note: null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.equipment_item_created',
    targetTable: 'equipment_items',
    targetId: data.id,
    details: { key: data.key, name: data.name, source: data.source },
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
  if (!body.id) return jsonError('id is required', 400)

  const id = body.id as string
  const fields = {
    ...Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id')),
    weight_lb: body.weight_lb == null || body.weight_lb === '' ? null : Number(body.weight_lb),
    cost_quantity: body.cost_quantity == null ? undefined : Number(body.cost_quantity),
  }

  const { data, error } = await supabase
    .from('equipment_items')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.equipment_item_updated',
    targetTable: 'equipment_items',
    targetId: id,
    details: { id },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return jsonError('id is required', 400)

  const { error } = await supabase.from('equipment_items').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.equipment_item_deleted',
    targetTable: 'equipment_items',
    targetId: id,
    details: { id },
  })
  return new NextResponse(null, { status: 204 })
}
