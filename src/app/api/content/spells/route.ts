import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { getAllowedSources } from '@/lib/content-helpers'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { searchParams } = request.nextUrl
  const campaignId = searchParams.get('campaign_id')
  const classId = searchParams.get('class_id')
  const levelParam = searchParams.get('level')

  const allowedSources = await getAllowedSources(supabase, campaignId)

  let query = supabase.from('spells').select('*').order('level').order('name')

  if (allowedSources) {
    query = query.in('source', Array.from(allowedSources))
  }
  if (classId) {
    query = query.contains('classes', [classId])
  }
  if (levelParam !== null) {
    query = query.eq('level', parseInt(levelParam, 10))
  }

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}
