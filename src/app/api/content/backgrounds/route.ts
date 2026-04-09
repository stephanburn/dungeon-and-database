import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireAdmin, jsonError, readJsonBody } from '@/lib/api-helpers'
import { getAllowedSources } from '@/lib/content-helpers'
import { writeAuditLog } from '@/lib/server/audit'
import type { StartingEquipmentItem } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const allowedSources = await getAllowedSources(supabase, campaignId)

  let query = supabase.from('backgrounds').select('*').order('name')
  if (allowedSources) {
    query = query.in('source', Array.from(allowedSources))
  }

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  if (!body.name || !body.source) return jsonError('name and source are required', 400)

  const { data, error } = await supabase
    .from('backgrounds')
    .insert({
      name: body.name as string,
      skill_proficiencies: (body.skill_proficiencies as string[] | undefined) ?? [],
      skill_choice_count: (body.skill_choice_count as number | undefined) ?? 0,
      skill_choice_from: (body.skill_choice_from as string[] | undefined) ?? [],
      tool_proficiencies: (body.tool_proficiencies as string[] | undefined) ?? [],
      languages: (body.languages as string[] | undefined) ?? [],
      starting_equipment: (body.starting_equipment as StartingEquipmentItem[] | undefined) ?? [],
      feature: (body.feature as string | undefined) ?? '',
      background_feat_id: (body.background_feat_id as string | null | undefined) || null,
      source: body.source as string,
      amended: false,
      amendment_note: null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.background_created',
    targetTable: 'backgrounds',
    targetId: data.id,
    details: { name: data.name, source: data.source },
  })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  if (!body.id) return jsonError('id is required', 400)

  const id = body.id as string
  const fields = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id'))
  const { data, error } = await supabase
    .from('backgrounds')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.background_updated',
    targetTable: 'backgrounds',
    targetId: id,
    details: { id },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return jsonError('id is required', 400)

  const { error } = await supabase.from('backgrounds').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.background_deleted',
    targetTable: 'backgrounds',
    targetId: id,
    details: { id },
  })
  return new NextResponse(null, { status: 204 })
}
