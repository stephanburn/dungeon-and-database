import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireAdmin, jsonError } from '@/lib/api-helpers'
import { getAllowedSources } from '@/lib/content-helpers'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const allowedSources = await getAllowedSources(supabase, campaignId)

  let query = supabase.from('species').select('*').order('name')
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
  const { supabase } = auth

  const body = await request.json()
  if (!body.name || !body.source) return jsonError('name and source are required', 400)

  const { data, error } = await supabase
    .from('species')
    .insert({
      name: body.name,
      size: body.size ?? 'medium',
      speed: body.speed ?? 30,
      ability_score_bonuses: body.ability_score_bonuses ?? [],
      languages: body.languages ?? [],
      traits: [],
      senses: body.senses ?? [],
      damage_resistances: [],
      condition_immunities: [],
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
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const body = await request.json()
  if (!body.id) return jsonError('id is required', 400)

  const { id, ...fields } = body
  const { data, error } = await supabase
    .from('species')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return jsonError('id is required', 400)

  const { error } = await supabase.from('species').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
