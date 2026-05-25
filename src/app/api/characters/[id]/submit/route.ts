import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { assertCharacterOwnedByUser } from '@/lib/auth/ownership'
import { buildLegalityInputResult } from '@/lib/legality/build-input'
import { runLegalityChecks, shouldBlockCharacterSubmit } from '@/lib/legality/engine'
import { captureSnapshot } from '@/lib/snapshots'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const character = await assertCharacterOwnedByUser(supabase, params.id, profile.id)
  if (!character) return jsonError('Forbidden', 403)
  if (character.status !== 'draft' && character.status !== 'changes_requested') {
    return jsonError(`Cannot submit a character with status "${character.status}"`, 400)
  }

  const legalityInputResult = await buildLegalityInputResult(supabase, params.id)
  if (legalityInputResult.status === 'error') {
    return NextResponse.json({
      error: legalityInputResult.error.message,
      code: 'legality_input_load_failed',
      issues: legalityInputResult.error.issues,
    }, { status: 500 })
  }
  if (legalityInputResult.status === 'not_found') return jsonError('Character not found', 404)

  const legalityResult = runLegalityChecks(legalityInputResult.context)

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

  const snapshotResult = await captureSnapshot(supabase, params.id)
  if (!snapshotResult.ok) {
    return NextResponse.json({
      error: 'Failed to capture character snapshot.',
      code: 'snapshot_capture_failed',
      issues: snapshotResult.error.issues,
    }, { status: 500 })
  }
  return NextResponse.json({ character: data, legality: legalityResult })
}
