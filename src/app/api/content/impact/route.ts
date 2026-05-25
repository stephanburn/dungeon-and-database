import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin, jsonError } from '@/lib/api-helpers'
import { summarizeContentImpactForEntity } from '@/lib/content/content-impact'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const tab = request.nextUrl.searchParams.get('tab')
  const id = request.nextUrl.searchParams.get('id')
  if (!tab || !id) return jsonError('tab and id are required', 400)

  const { summary, error } = await summarizeContentImpactForEntity(supabase, tab, id)
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(summary)
}
