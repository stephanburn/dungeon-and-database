import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireAdmin, jsonError, readJsonBody } from '@/lib/api-helpers'
import { getAllowedSources } from '@/lib/content-helpers'
import { writeAuditLog } from '@/lib/server/audit'
import type { SpellComponents } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { searchParams } = request.nextUrl
  const campaignId = searchParams.get('campaign_id')
  const classId = searchParams.get('class_id')
  const subclassIds = searchParams.getAll('subclass_id').filter(Boolean)
  const speciesId = searchParams.get('species_id')
  const classLevel = parseInt(searchParams.get('class_level') ?? '0', 10)
  const levelParam = searchParams.get('level')

  const allowedSources = await getAllowedSources(supabase, campaignId)
  const activeBonusRows = subclassIds.length > 0
    ? await supabase
        .from('subclass_bonus_spells')
        .select('*')
        .in('subclass_id', subclassIds)
        .lte('required_class_level', Number.isNaN(classLevel) ? 0 : classLevel)
    : { data: [], error: null }

  if (activeBonusRows.error) return jsonError(activeBonusRows.error.message, 500)

  const speciesBonusRows = speciesId
    ? await supabase
        .from('species_bonus_spells')
        .select('*')
        .eq('species_id', speciesId)
    : { data: [], error: null }

  if (speciesBonusRows.error) return jsonError(speciesBonusRows.error.message, 500)

  const grantedSpellIds = new Set((activeBonusRows.data ?? []).map((row) => row.spell_id))
  const speciesBonusSpellIds = new Set((speciesBonusRows.data ?? []).map((row) => row.spell_id))
  const baseQuery = supabase.from('spells').select('*').order('level').order('name')
  const { data: allSpells, error } = await baseQuery
  if (error) return jsonError(error.message, 500)

  const bonusRowsBySpellId = new Map<string, Array<(typeof activeBonusRows.data)[number]>>()
  for (const row of activeBonusRows.data ?? []) {
    const existing = bonusRowsBySpellId.get(row.spell_id) ?? []
    existing.push(row)
    bonusRowsBySpellId.set(row.spell_id, existing)
  }

  const filtered = (allSpells ?? []).filter((spell) => {
    const baseAllowed = !classId || spell.classes.includes(classId)
    const bonusAllowed = grantedSpellIds.has(spell.id)
    const speciesAllowed = speciesBonusSpellIds.has(spell.id)
    const sourceAllowed = !allowedSources || allowedSources.has(spell.source) || bonusAllowed || speciesAllowed
    const levelAllowed = levelParam === null || spell.level === parseInt(levelParam, 10)
    return sourceAllowed && levelAllowed && (baseAllowed || bonusAllowed || speciesAllowed)
  }).map((spell) => ({
    ...spell,
    granted_by_subclasses: (bonusRowsBySpellId.get(spell.id) ?? []).map((row) => row.subclass_id),
    expanded_by_species: speciesBonusSpellIds.has(spell.id) ? [speciesId].filter((value): value is string => Boolean(value)) : [],
    counts_against_selection_limit: !(bonusRowsBySpellId.get(spell.id) ?? []).some(
      (row) => !row.counts_against_selection_limit
    ),
  }))

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  if (!body.name || body.level === undefined || !body.school || !body.casting_time ||
      !body.range || !body.duration || !body.source) {
    return jsonError('name, level, school, casting_time, range, duration, and source are required', 400)
  }

  const { data, error } = await supabase
    .from('spells')
    .insert({
      name: body.name as string,
      level: body.level as number,
      school: body.school as string,
      casting_time: body.casting_time as string,
      range: body.range as string,
      components: (body.components as SpellComponents | undefined) ?? {
        verbal: false,
        somatic: false,
        material: false,
      },
      duration: body.duration as string,
      concentration: (body.concentration as boolean | undefined) ?? false,
      ritual: (body.ritual as boolean | undefined) ?? false,
      description: (body.description as string | undefined) ?? '',
      classes: (body.classes as string[] | undefined) ?? [],
      source: body.source as string,
      amended: false,
      amendment_note: null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.spell_created',
    targetTable: 'spells',
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
    .from('spells')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.spell_updated',
    targetTable: 'spells',
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

  const { error } = await supabase.from('spells').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.spell_deleted',
    targetTable: 'spells',
    targetId: id,
    details: { id },
  })
  return new NextResponse(null, { status: 204 })
}
