import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireDm, jsonError } from '@/lib/api-helpers'
import { getAllowedSources } from '@/lib/content-helpers'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { searchParams } = request.nextUrl
  const campaignId = searchParams.get('campaign_id')
  const classId = searchParams.get('class_id')
  const levelParam = searchParams.get('level')

  const allowedSources = await getAllowedSources(supabase, campaignId)

  let query = supabase.from('spells').select('*').order('level').order('name')

  if (allowedSources) {
    query = query.in('source', Array.from(allowedSources))
  }
  if (classId) {
    query = query.contains('classes', [classId])
  }
  if (levelParam !== null) {
    query = query.eq('level', parseInt(levelParam, 10))
  }

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const body = await request.json()
  if (!body.name || body.level === undefined || !body.school || !body.casting_time ||
      !body.range || !body.duration || !body.source) {
    return jsonError('name, level, school, casting_time, range, duration, and source are required', 400)
  }

  const { data, error } = await supabase
    .from('spells')
    .insert({
      name: body.name,
      level: body.level,
      school: body.school,
      casting_time: body.casting_time,
      range: body.range,
      components: body.components ?? {},
      duration: body.duration,
      concentration: body.concentration ?? false,
      ritual: body.ritual ?? false,
      description: body.description ?? '',
      classes: body.classes ?? [],
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
    .from('spells')
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

  const { error } = await supabase.from('spells').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
