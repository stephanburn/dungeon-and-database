import { NextResponse, type NextRequest } from 'next/server'
import { requireDm, jsonError } from '@/lib/api-helpers'
import { updateUserRoleById } from '@/lib/server/user-roles'
import { z } from 'zod'

const updateUserRoleSchema = z.object({
  role: z.enum(['player', 'dm']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireDm()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const body = await request.json()
  const parsed = updateUserRoleSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data: existingUser, error: existingError } = await supabase
    .from('users')
    .select('id, role, display_name')
    .eq('id', params.id)
    .single()

  if (existingError || !existingUser) return jsonError('User not found', 404)

  if (existingUser.role === parsed.data.role) {
    return NextResponse.json(existingUser)
  }

  const { data, error } = await updateUserRoleById(params.id, parsed.data.role)

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}
