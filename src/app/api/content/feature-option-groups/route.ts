import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { listFeatureOptionGroups } from '@/lib/content/feature-option-content'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const optionFamily = request.nextUrl.searchParams.get('option_family')
  const groupKeys = request.nextUrl.searchParams.getAll('key').filter(Boolean)
  const { data, error } = await listFeatureOptionGroups(supabase, {
    campaignId,
    optionFamily,
    keys: groupKeys,
  })
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(data)
}
