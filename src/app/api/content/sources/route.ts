import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireAdmin, jsonError, readJsonBody } from '@/lib/api-helpers'
import { sourceCreateSchema, sourceDeleteSchema, sourceUpdateSchema } from '@/lib/content/admin-schemas'
import { writeAuditLog } from '@/lib/server/audit'

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { data, error } = await supabase.from('sources').select('*').order('key')
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const parsed = sourceCreateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data, error } = await supabase
    .from('sources')
    .insert({
      key: parsed.data.key,
      full_name: parsed.data.full_name,
      is_srd: parsed.data.is_srd ?? false,
      rule_set: parsed.data.rule_set ?? '2014',
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.source_created',
    targetTable: 'sources',
    targetId: data.key,
    details: { key: data.key, full_name: data.full_name },
  })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const parsed = sourceUpdateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data, error } = await supabase
    .from('sources')
    .update({
      key: parsed.data.key,
      full_name: parsed.data.full_name,
      is_srd: parsed.data.is_srd ?? false,
      rule_set: parsed.data.rule_set ?? '2014',
    })
    .eq('key', parsed.data.original_key)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.source_updated',
    targetTable: 'sources',
    targetId: data.key,
    details: { original_key: parsed.data.original_key, new_key: data.key },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const parsed = sourceDeleteSchema.safeParse({
    key: request.nextUrl.searchParams.get('key'),
  })
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { error } = await supabase.from('sources').delete().eq('key', parsed.data.key)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.source_deleted',
    targetTable: 'sources',
    targetId: parsed.data.key,
    details: { key: parsed.data.key },
  })
  return new NextResponse(null, { status: 204 })
}
