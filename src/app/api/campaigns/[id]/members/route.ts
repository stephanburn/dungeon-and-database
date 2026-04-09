import { NextResponse, type NextRequest } from 'next/server'
import { requireDm, jsonError, readJsonBody } from '@/lib/api-helpers'
import { assertCampaignManageableByUser } from '@/lib/auth/ownership'
import { z } from 'zod'

const addSchema = z.object({
  email: z.string().email().optional(),
  user_id: z.string().uuid().optional(),
}).refine((d) => d.email || d.user_id, { message: 'Provide email or user_id' })
const removeSchema = z.object({ user_id: z.string().uuid() })

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const ownedCampaign = await assertCampaignManageableByUser(supabase, params.id, profile.id, profile.role)
  if (!ownedCampaign) return jsonError('Forbidden', 403)

  const { data: rows, error } = await supabase
    .from('campaign_members')
    .select('user_id')
    .eq('campaign_id', ownedCampaign.id)

  if (error) return jsonError(error.message, 500)

  const ids = (rows ?? []).map((r) => r.user_id)
  if (ids.length === 0) return NextResponse.json([])

  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, display_name, email, role')
    .in('id', ids)

  if (uErr) return jsonError(uErr.message, 500)
  return NextResponse.json(users ?? [])
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const ownedCampaign = await assertCampaignManageableByUser(supabase, params.id, profile.id, profile.role)
  if (!ownedCampaign) return jsonError('Forbidden', 403)

  const bodyResult = await readJsonBody<unknown>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const query = supabase.from('users').select('id, display_name')
  const { data: user, error: uErr } = await (
    parsed.data.user_id
      ? query.eq('id', parsed.data.user_id)
      : query.eq('email', parsed.data.email!)
  ).single()

  if (uErr || !user) return jsonError('No account found with that email address.', 404)

  const { error } = await supabase
    .from('campaign_members')
    .upsert({ campaign_id: ownedCampaign.id, user_id: user.id }, { onConflict: 'campaign_id,user_id', ignoreDuplicates: true })

  if (error) return jsonError(error.message, 500)
  return NextResponse.json({ id: user.id, display_name: user.display_name }, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const ownedCampaign = await assertCampaignManageableByUser(supabase, params.id, profile.id, profile.role)
  if (!ownedCampaign) return jsonError('Forbidden', 403)

  const bodyResult = await readJsonBody<unknown>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  const parsed = removeSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  // Don't allow removing the campaign DM
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('dm_id')
    .eq('id', ownedCampaign.id)
    .single()

  if (campaign?.dm_id === parsed.data.user_id) {
    return jsonError('Cannot remove the campaign DM.', 400)
  }

  const { error } = await supabase
    .from('campaign_members')
    .delete()
    .eq('campaign_id', ownedCampaign.id)
    .eq('user_id', parsed.data.user_id)

  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
