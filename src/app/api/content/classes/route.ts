import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireDm, jsonError } from '@/lib/api-helpers'
import { getAllowedSources } from '@/lib/content-helpers'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const allowedSources = await getAllowedSources(supabase, campaignId)

  let query = supabase.from('classes').select('*').order('name')
  if (allowedSources) {
    query = query.in('source', Array.from(allowedSources))
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
  if (!body.name || !body.source || body.hit_die == null) {
    return jsonError('name, hit_die, and source are required', 400)
  }

  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: body.name,
      hit_die: Number(body.hit_die),
      primary_ability: body.primary_ability ?? [],
      saving_throw_proficiencies: body.saving_throw_proficiencies ?? [],
      armor_proficiencies: body.armor_proficiencies ?? [],
      weapon_proficiencies: body.weapon_proficiencies ?? [],
      tool_proficiencies: body.tool_proficiencies ?? {},
      skill_choices: body.skill_choices ?? { count: 0, from: [] },
      multiclass_prereqs: body.multiclass_prereqs ?? [],
      multiclass_proficiencies: body.multiclass_proficiencies ?? {},
      is_spellcaster: body.is_spellcaster ?? false,
      spellcasting_type: body.spellcasting_type || null,
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
    .from('classes')
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

  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
