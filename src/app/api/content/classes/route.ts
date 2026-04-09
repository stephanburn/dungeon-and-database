import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireAdmin, jsonError, readJsonBody } from '@/lib/api-helpers'
import { getAllowedSources } from '@/lib/content-helpers'
import { writeAuditLog } from '@/lib/server/audit'
import type { MulticlassPrereq, SkillChoices, SpellcastingType } from '@/lib/types/database'

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
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const bodyResult = await readJsonBody<Record<string, unknown>>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  if (!body.name || !body.source || body.hit_die == null) {
    return jsonError('name, hit_die, and source are required', 400)
  }

  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: body.name as string,
      hit_die: Number(body.hit_die),
      primary_ability: (body.primary_ability as string[] | undefined) ?? [],
      saving_throw_proficiencies: (body.saving_throw_proficiencies as string[] | undefined) ?? [],
      armor_proficiencies: (body.armor_proficiencies as string[] | undefined) ?? [],
      weapon_proficiencies: (body.weapon_proficiencies as string[] | undefined) ?? [],
      tool_proficiencies: (body.tool_proficiencies as Record<string, unknown> | undefined) ?? {},
      skill_choices: (body.skill_choices as SkillChoices | undefined) ?? { count: 0, from: [] },
      multiclass_prereqs: (body.multiclass_prereqs as MulticlassPrereq[] | undefined) ?? [],
      multiclass_proficiencies: (body.multiclass_proficiencies as Record<string, unknown> | undefined) ?? {},
      spellcasting_type: (body.spellcasting_type as SpellcastingType | null | undefined) ?? null,
      subclass_choice_level: (body.subclass_choice_level as number | undefined) ?? 3,
      source: body.source as string,
      amended: false,
      amendment_note: null,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.class_created',
    targetTable: 'classes',
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
    .from('classes')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.class_updated',
    targetTable: 'classes',
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

  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  await writeAuditLog({
    actorUserId: user.id,
    action: 'content.class_deleted',
    targetTable: 'classes',
    targetId: id,
    details: { id },
  })
  return new NextResponse(null, { status: 204 })
}
