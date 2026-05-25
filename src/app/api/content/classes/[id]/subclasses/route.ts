import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { applySourceFilter, getAllowedSources, hasContentLoadError } from '@/lib/content-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const campaignId = request.nextUrl.searchParams.get('campaign_id')
  const allowedSources = await getAllowedSources(supabase, campaignId)
  if (hasContentLoadError(allowedSources)) return jsonError(allowedSources.error.message, 500)

  let query = supabase
    .from('subclasses')
    .select('*')
    .eq('class_id', params.id)
    .order('name')

  query = applySourceFilter(query, allowedSources)

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}
