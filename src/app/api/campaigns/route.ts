import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireDm, jsonError } from '@/lib/api-helpers'
import { z } from 'zod'

const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  rule_set: z.enum(['2014', '2024']).optional(),
  settings: z.object({
    stat_method: z.enum(['point_buy', 'standard_array', 'rolled']).optional(),
    max_level: z.number().int().min(1).max(20).optional(),
    milestone_levelling: z.boolean().optional(),
  }).optional(),
})

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  let query = supabase.from('campaigns').select('*')

  if (profile.role !== 'dm') {
    // Players only see campaigns they're members of
    const { data: memberships } = await supabase
      .from('campaign_members')
      .select('campaign_id')
      .eq('user_id', profile.id)

    const ids = (memberships ?? []).map((m) => m.campaign_id)
    if (ids.length === 0) return NextResponse.json([])
    query = query.in('id', ids)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const body = await request.json()
  const parsed = createCampaignSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { name, rule_set, settings } = parsed.data

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name,
      dm_id: profile.id,
      rule_set: rule_set ?? '2014',
      settings: {
        stat_method: settings?.stat_method ?? 'point_buy',
        max_level: settings?.max_level ?? 20,
        milestone_levelling: settings?.milestone_levelling ?? false,
      },
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data, { status: 201 })
}
