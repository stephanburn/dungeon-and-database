import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import { listStartingEquipmentPackages } from '@/lib/content/equipment-content'
import { writeAuditLog } from '@/lib/server/audit'
import type { Database } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const { data, error } = await listStartingEquipmentPackages(supabase, { campaignId })
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data)
}

type PackageItemBody = {
  item_id: string
  quantity?: number
  item_order?: number
  choice_group?: string | null
  notes?: string | null
}

async function replacePackageItems(
  supabase: SupabaseClient<Database>,
  packageId: string,
  items: PackageItemBody[]
) {
  const { error: deleteError } = await supabase
    .from('starting_equipment_package_items')
    .delete()
    .eq('package_id', packageId)
  if (deleteError) return deleteError

  const normalizedItems = items
    .filter((item) => item.item_id?.trim().length > 0)
    .map((item, index) => ({
      package_id: packageId,
      item_id: item.item_id,
      quantity: item.quantity ?? 1,
      item_order: item.item_order ?? (index + 1) * 10,
      choice_group: item.choice_group ?? '',
      notes: item.notes ?? null,
    }))

  if (normalizedItems.length === 0) return null

  const { error } = await supabase
    .from('starting_equipment_package_items')
    .insert(normalizedItems)
  return error
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  if (!body.key || !body.name || !body.source) {
    return jsonError('key, name, and source are required', 400)
  }

  const { data, error } = await supabase
    .from('starting_equipment_packages')
    .insert({
      key: body.key as string,
      name: body.name as string,
      description: (body.description as string | undefined) ?? '',
      source: body.source as string,
      amended: false,
      amendment_note: null,
    })
    .select()
    .single()
  if (error) return jsonError(error.message, 500)

  const itemsError = await replacePackageItems(
    supabase,
    data.id,
    ((body.items as PackageItemBody[] | undefined) ?? [])
  )
  if (itemsError) return jsonError(itemsError.message, 500)

  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.starting_equipment_package_created',
    targetTable: 'starting_equipment_packages',
    targetId: data.id,
    details: { key: data.key, name: data.name },
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
  const { data, error } = await supabase
    .from('starting_equipment_packages')
    .update({
      key: body.key as string,
      name: body.name as string,
      description: (body.description as string | undefined) ?? '',
      source: body.source as string,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) return jsonError(error.message, 500)

  const itemsError = await replacePackageItems(
    supabase,
    id,
    ((body.items as PackageItemBody[] | undefined) ?? [])
  )
  if (itemsError) return jsonError(itemsError.message, 500)

  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.starting_equipment_package_updated',
    targetTable: 'starting_equipment_packages',
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

  const { error } = await supabase.from('starting_equipment_packages').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.starting_equipment_package_deleted',
    targetTable: 'starting_equipment_packages',
    targetId: id,
    details: { id },
  })
  return new NextResponse(null, { status: 204 })
}
