import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireAdmin, jsonError, readJsonBody } from '@/lib/api-helpers'
import { getAllowedSources } from '@/lib/content-helpers'
import { writeAuditLog } from '@/lib/server/audit'
import type { AbilityScoreBonus, Sense, SizeCategory, SpeciesVariantType } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const allowedSources = await getAllowedSources(supabase, campaignId)

  let query = supabase
    .from('species')
    .select('*')
    .order('lineage_key')
    .order('variant_order')
    .order('name')
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
  const { user, supabase } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  if (!body.name || !body.source) return jsonError('name and source are required', 400)

  const { data, error } = await supabase
    .from('species')
    .insert({
      name: body.name as string,
      parent_species_id: (body.parent_species_id as string | null | undefined) ?? null,
      lineage_key: (body.lineage_key as string | undefined) ?? '',
      variant_type: (body.variant_type as SpeciesVariantType | undefined) ?? 'base',
      variant_order: (body.variant_order as number | undefined) ?? 0,
      size: (body.size as SizeCategory | undefined) ?? 'medium',
      speed: (body.speed as number | undefined) ?? 30,
      ability_score_bonuses: (body.ability_score_bonuses as AbilityScoreBonus[] | undefined) ?? [],
      languages: (body.languages as string[] | undefined) ?? [],
      traits: [],
      senses: (body.senses as Sense[] | undefined) ?? [],
      damage_resistances: [],
      condition_immunities: [],
      source: body.source as string,
      amended: false,
      amendment_note: null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.species_created',
    targetTable: 'species',
    targetId: data.id,
    details: { name: data.name, source: data.source },
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
  if (!body.id) return jsonError('id is required', 400)

  const id = body.id as string
  const fields = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'id'))
  const { data, error } = await supabase
    .from('species')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.species_updated',
    targetTable: 'species',
    targetId: id,
    details: { id },
  })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return jsonError('id is required', 400)

  const { error } = await supabase.from('species').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.species_deleted',
    targetTable: 'species',
    targetId: id,
    details: { id },
  })
  return new NextResponse(null, { status: 204 })
}
