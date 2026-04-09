import { NextResponse, type NextRequest } from 'next/server'
import { requireDm, jsonError } from '@/lib/api-helpers'
import { assertCharacterInDmCampaign } from '@/lib/auth/ownership'
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

  const character = await assertCharacterInDmCampaign(supabase, params.id, profile.id)
  if (!character) return jsonError('Forbidden', 403)
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
  await captureSnapshot(supabase, params.id)
  return NextResponse.json(data)
}
