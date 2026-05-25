import { NextResponse, type NextRequest } from 'next/server'
import { requireDm, jsonError } from '@/lib/api-helpers'
import { assertCharacterManageableByUser } from '@/lib/auth/ownership'
import { buildLegalityInputResult } from '@/lib/legality/build-input'
import { captureSnapshot } from '@/lib/snapshots'

/**
 * DM transition: submitted -> approved.
 * Ownership is checked explicitly so one DM cannot approve another DM's
 * campaign character even if they both have the DM role.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const character = await assertCharacterManageableByUser(supabase, params.id, profile.id, profile.role)
  if (!character) return jsonError('Forbidden', 403)
  if (character.status !== 'submitted') {
    return jsonError(`Cannot approve a character with status "${character.status}"`, 400)
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

  const { data, error } = await supabase
    .from('characters')
    .update({ status: 'approved', dm_notes: null })
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
  return NextResponse.json(data)
}
