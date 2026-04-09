import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin, jsonError, readJsonBody } from '@/lib/api-helpers'
import {
  deleteUserById,
  getSingletonAdminUser,
  reassignOwnedCampaignsToAdmin,
  updateUserRoleById,
} from '@/lib/server/user-roles'
import { writeAuditLog } from '@/lib/server/audit'
import {
  validateRoleChange,
} from '@/lib/server/user-admin-policy'
import { deleteManagedUser } from '@/lib/server/user-admin-actions'
import { z } from 'zod'

const updateUserRoleSchema = z.object({
  role: z.enum(['player', 'dm']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { user, supabase } = auth

  const bodyResult = await readJsonBody<unknown>(request)
  if ('response' in bodyResult) return bodyResult.response
  const body = bodyResult.data
  const parsed = updateUserRoleSchema.safeParse(body)
  if (!parsed.success) return jsonError(parsed.error.message, 400)

  const { data: existingUser, error: existingError } = await supabase
    .from('users')
    .select('id, role, display_name')
    .eq('id', params.id)
    .single()

  if (existingError || !existingUser) return jsonError('User not found', 404)
  const roleChangePolicyError = validateRoleChange({
    actorUserId: user.id,
    targetUserId: existingUser.id,
    existingRole: existingUser.role,
    requestedRole: parsed.data.role,
  })
  if (roleChangePolicyError) return jsonError(roleChangePolicyError, 400)

  if (existingUser.role === parsed.data.role) {
    return NextResponse.json(existingUser)
  }

  const { data, error } = await updateUserRoleById(params.id, parsed.data.role)

  if (error) return jsonError(error.message, 500)

  await writeAuditLog({
    actorUserId: user.id,
    action: 'user.role_updated',
    targetTable: 'users',
    targetId: params.id,
    details: {
      previous_role: existingUser.role,
      new_role: parsed.data.role,
    },
  })

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
  const result = await deleteManagedUser(
    {
      reassignOwnedCampaignsToAdmin,
      deleteUserById: async (userId) => {
        const { error } = await deleteUserById(userId)
        return { error }
      },
      getSingletonAdminUser: async () => {
        const { data, error } = await getSingletonAdminUser()
        return { data: data ?? null, error }
      },
      writeAuditLog,
    },
    {
      actorUserId: user.id,
      targetUserId: existingUser.id,
      existingRole: existingUser.role,
    }
  )

  if (!result.ok) return jsonError(result.message, result.status)
  return new NextResponse(null, { status: result.status })
}
