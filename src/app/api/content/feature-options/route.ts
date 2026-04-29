import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import {
  featureOptionCreateSchema,
  featureOptionDeleteSchema,
  featureOptionUpdateSchema,
} from '@/lib/content/admin-schemas'
import { listFeatureOptions } from '@/lib/content/feature-option-content'
import { writeAuditLog } from '@/lib/server/audit'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const optionFamily = request.nextUrl.searchParams.get('option_family')
  const groupKeys = request.nextUrl.searchParams.getAll('group_key').filter(Boolean)
  const { data, error } = await listFeatureOptions(supabase, {
    campaignId,
    optionFamily,
    groupKeys,
  })
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const parsed = featureOptionCreateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data, error } = await supabase
    .from('feature_options')
    .insert({
      group_key: parsed.data.group_key,
      key: parsed.data.key,
      name: parsed.data.name,
      description: parsed.data.description ?? '',
      option_order: parsed.data.option_order ?? 0,
      prerequisites: parsed.data.prerequisites ?? {},
      effects: parsed.data.effects ?? {},
      source: parsed.data.source,
      amended: parsed.data.amended ?? false,
      amendment_note: parsed.data.amendment_note ?? null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feature_option_created',
    targetTable: 'feature_options',
    targetId: data.id,
    details: { id: data.id, group_key: data.group_key, key: data.key, source: data.source },
  })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const parsed = featureOptionUpdateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const { id, ...fields } = parsed.data

  const { data, error } = await supabase
    .from('feature_options')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feature_option_updated',
    targetTable: 'feature_options',
    targetId: id,
    details: { id },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const parsed = featureOptionDeleteSchema.safeParse({
    id: request.nextUrl.searchParams.get('id'),
  })
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { error } = await supabase.from('feature_options').delete().eq('id', parsed.data.id)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feature_option_deleted',
    targetTable: 'feature_options',
    targetId: parsed.data.id,
    details: { id: parsed.data.id },
  })
  return new NextResponse(null, { status: 204 })
}
