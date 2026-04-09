import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin, jsonError } from '@/lib/api-helpers'
import { deleteUserById, updateUserRoleById } from '@/lib/server/user-roles'
import { isAdminRole } from '@/lib/auth/roles'
import { z } from 'zod'

const updateUserRoleSchema = z.object({
  role: z.enum(['player', 'dm', 'admin']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const body = await request.json()
  const parsed = updateUserRoleSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data: existingUser, error: existingError } = await supabase
    .from('users')
    .select('id, role, display_name')
    .eq('id', params.id)
    .single()

  if (existingError || !existingUser) return jsonError('User not found', 404)
  if (existingUser.id === user.id) return jsonError('Admins cannot change their own role here', 400)

  if (existingUser.role === parsed.data.role) {
    return NextResponse.json(existingUser)
  }

  if (isAdminRole(existingUser.role) && parsed.data.role !== 'admin') {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if ((count ?? 0) <= 1) {
      return jsonError('At least one admin must remain', 400)
    }
  }

  const { data, error } = await updateUserRoleById(params.id, parsed.data.role)

  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const { data: existingUser, error: existingError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', params.id)
    .single()

  if (existingError || !existingUser) return jsonError('User not found', 404)
  if (existingUser.id === user.id) return jsonError('Admins cannot delete their own account here', 400)

  if (isAdminRole(existingUser.role)) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if ((count ?? 0) <= 1) {
      return jsonError('At least one admin must remain', 400)
    }
  }

  const { error } = await deleteUserById(params.id)
  if (error) return jsonError(error.message, 500)
  return new NextResponse(null, { status: 204 })
}
