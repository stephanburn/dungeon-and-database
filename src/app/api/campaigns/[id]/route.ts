import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireDm, jsonError } from '@/lib/api-helpers'
import { assertCampaignOwnedByDm } from '@/lib/auth/ownership'
import { z } from 'zod'

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rule_set: z.enum(['2014', '2024']).optional(),
  settings: z.object({
    stat_method: z.enum(['point_buy', 'standard_array', 'rolled']).optional(),
    max_level: z.number().int().min(1).max(20).optional(),
    milestone_levelling: z.boolean().optional(),
  }).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return jsonError('Campaign not found', 404)
  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const ownedCampaign = await assertCampaignOwnedByDm(supabase, params.id, profile.id)
  if (!ownedCampaign) return jsonError('Forbidden', 403)

  const body = await request.json()
  const parsed = updateCampaignSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.rule_set !== undefined) updates.rule_set = parsed.data.rule_set
  if (parsed.data.settings !== undefined) {
    // Merge settings rather than replace
    const { data: existing, error: existingError } = await supabase
      .from('campaigns')
      .select('settings')
      .eq('id', ownedCampaign.id)
      .single()

    if (existingError) return jsonError(existingError.message, 500)
    updates.settings = { ...existing?.settings, ...parsed.data.settings }
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}
