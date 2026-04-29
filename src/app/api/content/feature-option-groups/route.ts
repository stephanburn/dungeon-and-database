import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import {
  featureOptionGroupCreateSchema,
  featureOptionGroupDeleteSchema,
  featureOptionGroupUpdateSchema,
} from '@/lib/content/admin-schemas'
import { listFeatureOptionGroups } from '@/lib/content/feature-option-content'
import { writeAuditLog } from '@/lib/server/audit'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const optionFamily = request.nextUrl.searchParams.get('option_family')
  const groupKeys = request.nextUrl.searchParams.getAll('key').filter(Boolean)
  const { data, error } = await listFeatureOptionGroups(supabase, {
    campaignId,
    optionFamily,
    keys: groupKeys,
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
  const parsed = featureOptionGroupCreateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data, error } = await supabase
    .from('feature_option_groups')
    .insert({
      key: parsed.data.key,
      name: parsed.data.name,
      option_family: parsed.data.option_family,
      description: parsed.data.description ?? '',
      selection_limit: parsed.data.selection_limit,
      allows_duplicate_selections: parsed.data.allows_duplicate_selections ?? false,
      metadata: parsed.data.metadata ?? {},
      source: parsed.data.source,
      amended: parsed.data.amended ?? false,
      amendment_note: parsed.data.amendment_note ?? null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feature_option_group_created',
    targetTable: 'feature_option_groups',
    targetId: data.key,
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
  const parsed = featureOptionGroupUpdateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const { key, ...fields } = parsed.data

  const { data, error } = await supabase
    .from('feature_option_groups')
    .update(fields)
    .eq('key', key)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feature_option_group_updated',
    targetTable: 'feature_option_groups',
    targetId: key,
    details: { key },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const parsed = featureOptionGroupDeleteSchema.safeParse({
    key: request.nextUrl.searchParams.get('key'),
  })
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { error } = await supabase.from('feature_option_groups').delete().eq('key', parsed.data.key)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.feature_option_group_deleted',
    targetTable: 'feature_option_groups',
    targetId: parsed.data.key,
    details: { key: parsed.data.key },
  })
  return new NextResponse(null, { status: 204 })
}
