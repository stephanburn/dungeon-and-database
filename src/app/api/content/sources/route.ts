import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireAdmin, jsonError, readJsonBody } from '@/lib/api-helpers'
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
  const body = bodyResult.data
  if (!body.key || !body.full_name) return jsonError('key and full_name are required', 400)

  const { data, error } = await supabase
    .from('sources')
    .insert({
      key: body.key as string,
      full_name: body.full_name as string,
      is_srd: (body.is_srd as boolean | undefined) ?? false,
      rule_set: (body.rule_set as '2014' | '2024' | undefined) ?? '2014',
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
  const body = bodyResult.data
  if (!body.original_key || !body.key || !body.full_name) {
    return jsonError('original_key, key, and full_name are required', 400)
  }

  const { data, error } = await supabase
    .from('sources')
    .update({
      key: body.key as string,
      full_name: body.full_name as string,
      is_srd: (body.is_srd as boolean | undefined) ?? false,
      rule_set: (body.rule_set as '2014' | '2024' | undefined) ?? '2014',
    })
    .eq('key', body.original_key as string)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.source_updated',
    targetTable: 'sources',
    targetId: data.key,
    details: { original_key: body.original_key as string, new_key: data.key },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const key = request.nextUrl.searchParams.get('key')
  if (!key) return jsonError('key is required', 400)

  const { error } = await supabase.from('sources').delete().eq('key', key)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.source_deleted',
    targetTable: 'sources',
    targetId: key,
    details: { key },
  })
  return new NextResponse(null, { status: 204 })
}
