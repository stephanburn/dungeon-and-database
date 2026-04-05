import { NextResponse, type NextRequest } from 'next/server'
import { requireDm, jsonError } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  notes: z.string().min(1, 'Notes are required when requesting changes.'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data: character } = await supabase
    .from('characters')
    .select('status')
    .eq('id', params.id)
    .single()

  if (!character) return jsonError('Character not found', 404)
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
