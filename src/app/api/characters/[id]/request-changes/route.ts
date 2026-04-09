import { NextResponse, type NextRequest } from 'next/server'
import { requireDm, jsonError } from '@/lib/api-helpers'
import { assertCharacterInDmCampaign } from '@/lib/auth/ownership'
import { z } from 'zod'

const schema = z.object({
  notes: z.string().min(1, 'Notes are required when requesting changes.'),
})

/**
 * DM transition: submitted -> changes_requested.
 * The DM must both own the campaign and provide notes for the player.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const character = await assertCharacterInDmCampaign(supabase, params.id, profile.id)
  if (!character) return jsonError('Forbidden', 403)
  if (character.status !== 'submitted') {
    return jsonError(`Cannot request changes on a character with status "${character.status}"`, 400)
  }

  const { data, error } = await supabase
    .from('characters')
    .update({ status: 'changes_requested', dm_notes: parsed.data.notes })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}
