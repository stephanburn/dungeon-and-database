import { NextResponse, type NextRequest } from 'next/server'
import { requireDm, jsonError } from '@/lib/api-helpers'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { data: character } = await supabase
    .from('characters')
    .select('status')
    .eq('id', params.id)
    .single()

  if (!character) return jsonError('Character not found', 404)
  if (character.status !== 'submitted') {
    return jsonError(`Cannot approve a character with status "${character.status}"`, 400)
  }

  const { data, error } = await supabase
    .from('characters')
    .update({ status: 'approved', dm_notes: null })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}
