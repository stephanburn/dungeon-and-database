import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { buildLegalityInput } from '@/lib/legality/build-input'
import { runLegalityChecks, shouldBlockCharacterSubmit } from '@/lib/legality/engine'
import { captureSnapshot } from '@/lib/snapshots'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const { data: character } = await supabase
    .from('characters')
    .select('user_id, status')
    .eq('id', params.id)
    .single()

  if (!character) return jsonError('Character not found', 404)
  if (character.user_id !== profile.id) return jsonError('Forbidden', 403)
  if (character.status !== 'draft' && character.status !== 'changes_requested') {
    return jsonError(`Cannot submit a character with status "${character.status}"`, 400)
  }

  const legalityInput = await buildLegalityInput(supabase, params.id)
  const legalityResult = legalityInput ? runLegalityChecks(legalityInput) : null

  if (shouldBlockCharacterSubmit(legalityResult)) {
    return NextResponse.json(
      {
        error: 'Character has blocking legality errors.',
        legality: legalityResult,
      },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('characters')
    .update({ status: 'submitted' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)

  await captureSnapshot(supabase, params.id)
  return NextResponse.json({ character: data, legality: legalityResult })
}
