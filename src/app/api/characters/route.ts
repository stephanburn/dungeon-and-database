import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { z } from 'zod'

const createCharacterSchema = z.object({
  campaign_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  stat_method: z.enum(['point_buy', 'standard_array', 'rolled']).optional(),
  character_type: z.enum(['pc', 'npc', 'test']).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')

  let query = supabase
    .from('characters')
    .select(`
      *,
      species:species_id(id, name, source),
      background:background_id(id, name, source),
      character_levels(id, class_id, level, subclass_id)
    `)
    .order('created_at', { ascending: false })

  if (profile.role !== 'dm') {
    query = query.eq('user_id', profile.id)
  }

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const body = await request.json()
  const parsed = createCharacterSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data, error } = await supabase
    .from('characters')
    .insert({
      user_id: profile.id,
      campaign_id: parsed.data.campaign_id,
      name: parsed.data.name,
      stat_method: parsed.data.stat_method ?? 'point_buy',
      status: 'draft',
      ...(profile.role === 'dm' && parsed.data.character_type
        ? { character_type: parsed.data.character_type }
        : {}),
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data, { status: 201 })
}
