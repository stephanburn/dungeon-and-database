import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin, requireAuth, jsonError, readJsonBody } from '@/lib/api-helpers'
import { toolCreateSchema, toolDeleteSchema, toolUpdateSchema } from '@/lib/content/admin-schemas'
import { listTools } from '@/lib/content/tool-content'
import { writeAuditLog } from '@/lib/server/audit'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const { data, error } = await listTools(supabase, { campaignId })
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const parsed = toolCreateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data, error } = await supabase
    .from('tools')
    .insert({
      key: parsed.data.key,
      name: parsed.data.name,
      sort_order: parsed.data.sort_order ?? 0,
      source: parsed.data.source,
      amended: parsed.data.amended ?? false,
      amendment_note: parsed.data.amendment_note ?? null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.tool_created',
    targetTable: 'tools',
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
  const parsed = toolUpdateSchema.safeParse(bodyResult.data)
  if (!parsed.success) return jsonError(parsed.error.message, 400)
  const { key, ...fields } = parsed.data

  const { data, error } = await supabase
    .from('tools')
    .update(fields)
    .eq('key', key)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.tool_updated',
    targetTable: 'tools',
    targetId: key,
    details: { key },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const parsed = toolDeleteSchema.safeParse({
    key: request.nextUrl.searchParams.get('key'),
  })
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { error } = await supabase.from('tools').delete().eq('key', parsed.data.key)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.tool_deleted',
    targetTable: 'tools',
    targetId: parsed.data.key,
    details: { key: parsed.data.key },
  })
  return new NextResponse(null, { status: 204 })
}
