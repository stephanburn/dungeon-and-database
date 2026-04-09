import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { hasDmAccess } from '@/lib/auth/roles'
import { assertCharacterInDmCampaign } from '@/lib/auth/ownership'
import { buildLegalityInput } from '@/lib/legality/build-input'
import { runLegalityChecks } from '@/lib/legality/engine'
import { z } from 'zod'

const checkSchema = z.object({
  character_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { profile, supabase } = auth

  const body = await request.json()
  const parsed = checkSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  if (hasDmAccess(profile.role)) {
    const character = await assertCharacterInDmCampaign(supabase, parsed.data.character_id, profile.id)
    if (!character) return jsonError('Forbidden', 403)
  } else {
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id')
      .eq('id', parsed.data.character_id)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (characterError) return jsonError(characterError.message, 500)
    if (!character) return jsonError('Forbidden', 403)
  }

  const input = await buildLegalityInput(supabase, parsed.data.character_id)
  if (!input) return jsonError('Character not found', 404)

  const result = runLegalityChecks(input)
  return NextResponse.json(result)
}
