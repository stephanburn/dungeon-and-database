import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireAdmin, jsonError, readJsonBody } from '@/lib/api-helpers'
import { featCreateSchema, featUpdateSchema } from '@/lib/content/admin-schemas'
import { getAllowedSources } from '@/lib/content-helpers'
import { writeAuditLog } from '@/lib/server/audit'
import type { FeatPrerequisite } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const allowedSources = await getAllowedSources(supabase, campaignId)

  let query = supabase.from('feats').select('*').order('name')
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
  const parsed = featCreateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const body = parsed.data

  const { data, error } = await supabase
    .from('feats')
    .insert({
      name: body.name as string,
      description: (body.description as string | undefined) ?? '',
      prerequisites: (body.prerequisites as FeatPrerequisite[] | undefined) ?? [],
      benefits: (body.benefits as Record<string, unknown> | undefined) ?? {},
      source: body.source as string,
      amended: false,
      amendment_note: null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feat_created',
    targetTable: 'feats',
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
  const parsed = featUpdateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const { id, ...fields } = parsed.data

  const { data, error } = await supabase
    .from('feats')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feat_updated',
    targetTable: 'feats',
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

  const { error } = await supabase.from('feats').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feat_deleted',
    targetTable: 'feats',
    targetId: id,
    details: { id },
  })
  return new NextResponse(null, { status: 204 })
}
