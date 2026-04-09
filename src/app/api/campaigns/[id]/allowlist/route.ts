import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, requireDm, jsonError, readJsonBody } from '@/lib/api-helpers'
import { assertCampaignManageableByUser } from '@/lib/auth/ownership'
import { z } from 'zod'

const updateAllowlistSchema = z.object({
  source_keys: z.array(z.string().min(1)),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { data, error } = await supabase
    .from('campaign_source_allowlist')
    .select('source_key')
    .eq('campaign_id', params.id)

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data.map((r) => r.source_key))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const ownedCampaign = await assertCampaignManageableByUser(supabase, params.id, profile.id, profile.role)
  if (!ownedCampaign) return jsonError('Forbidden', 403)

  const bodyResult = await readJsonBody<unknown>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  const parsed = updateAllowlistSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  // Replace the entire allowlist: delete existing, insert new
  const { error: deleteError } = await supabase
    .from('campaign_source_allowlist')
    .delete()
    .eq('campaign_id', ownedCampaign.id)

  if (deleteError) return jsonError(deleteError.message, 500)

  if (parsed.data.source_keys.length > 0) {
    const rows = parsed.data.source_keys.map((source_key) => ({
      campaign_id: ownedCampaign.id,
      source_key,
    }))

    const { error: insertError } = await supabase
      .from('campaign_source_allowlist')
      .insert(rows)

    if (insertError) return jsonError(insertError.message, 500)
  }

  return NextResponse.json(parsed.data.source_keys)
}
