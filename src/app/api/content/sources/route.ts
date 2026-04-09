import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireDm, jsonError } from '@/lib/api-helpers'

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { data, error } = await supabase.from('sources').select('*').order('key')
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const body = await request.json()
  if (!body.key || !body.full_name) return jsonError('key and full_name are required', 400)

  const { data, error } = await supabase
    .from('sources')
    .insert({ key: body.key, full_name: body.full_name, is_srd: body.is_srd ?? false, rule_set: body.rule_set ?? '2014' })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const key = request.nextUrl.searchParams.get('key')
  if (!key) return jsonError('key is required', 400)

  const { error } = await supabase.from('sources').delete().eq('key', key)
  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
