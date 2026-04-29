import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { listFeatureSpellGrants } from '@/lib/content/feature-spell-grant-content'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const { data, error } = await listFeatureSpellGrants(supabase, { campaignId })
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data)
}
