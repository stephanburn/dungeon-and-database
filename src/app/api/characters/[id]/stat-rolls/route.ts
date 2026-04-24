import { randomInt, randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { hasDmAccess } from '@/lib/auth/roles'
import { assertCharacterManageableByUser } from '@/lib/auth/ownership'
import type { RolledStatSet } from '@/lib/characters/ability-generation'

function rollStatSet(): number[] {
  return Array.from({ length: 4 }, () => randomInt(1, 7))
}

export async function POST(
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
    const { data: character, error } = await supabase
      .from('characters')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (error) return jsonError(error.message, 500)
    if (!character) return jsonError('Forbidden', 403)
  }

  const rolledSets: RolledStatSet[] = Array.from({ length: 6 }, (_, index) => ({
    id: `server-roll-${index + 1}-${randomUUID()}`,
    rolls: rollStatSet(),
  }))

  return NextResponse.json({ rolled_sets: rolledSets })
}
