import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { hasDmAccess } from '@/lib/auth/roles'
import { assertCharacterManageableByUser } from '@/lib/auth/ownership'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  if (hasDmAccess(profile.role)) {
    const character = await assertCharacterManageableByUser(supabase, params.id, profile.id, profile.role)
    if (!character) return jsonError('Forbidden', 403)
  } else {
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (characterError) return jsonError(characterError.message, 500)
    if (!character) return jsonError('Forbidden', 403)
  }

  const { data, error } = await supabase
    .from('character_snapshots')
    .select('id, level_total, created_at')
    .eq('character_id', params.id)
    .order('created_at', { ascending: false })

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}
