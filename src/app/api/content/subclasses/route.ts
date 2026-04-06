import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireDm, jsonError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const classId = request.nextUrl.searchParams.get('class_id')

  let query = supabase.from('subclasses').select('*').order('name')
  if (classId) query = query.eq('class_id', classId)

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const body = await request.json()
  if (!body.name || !body.class_id || !body.source) {
    return jsonError('name, class_id, and source are required', 400)
  }

  const { data, error } = await supabase
    .from('subclasses')
    .insert({
      name: body.name,
      class_id: body.class_id,
      choice_level: body.choice_level ?? 3,
      source: body.source,
      amended: false,
      amendment_note: null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const body = await request.json()
  if (!body.id) return jsonError('id is required', 400)

  const { id, ...fields } = body
  const { data, error } = await supabase
    .from('subclasses')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return jsonError('id is required', 400)

  const { error } = await supabase.from('subclasses').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
