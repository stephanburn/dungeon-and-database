import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const [classResult, progressionResult] = await Promise.all([
    supabase.from('classes').select('*').eq('id', params.id).single(),
    supabase
      .from('class_feature_progression')
      .select('*')
      .eq('class_id', params.id)
      .order('level'),
  ])

  if (classResult.error) return jsonError('Class not found', 404)

  return NextResponse.json({
    ...classResult.data,
    progression: progressionResult.data ?? [],
  })
}
