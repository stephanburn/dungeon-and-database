import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { buildLegalityInput } from '@/lib/legality/build-input'
import { runLegalityChecks } from '@/lib/legality/engine'
import { z } from 'zod'

const checkSchema = z.object({
  character_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const body = await request.json()
  const parsed = checkSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const input = await buildLegalityInput(supabase, parsed.data.character_id)
  if (!input) return jsonError('Character not found', 404)

  const result = runLegalityChecks(input)
  return NextResponse.json(result)
}
