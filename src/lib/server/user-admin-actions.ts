import { isAdminRole } from '@/lib/auth/roles'
import { shouldReassignCampaignsBeforeDeletion, validateUserDeletion } from '@/lib/server/user-admin-policy'
import type { UserRole } from '@/lib/types/database'

type SingletonAdminUser = {
  id: string
  display_name?: string
  email?: string
  role: UserRole
}

type DeletionDeps = {
  reassignOwnedCampaignsToAdmin: (userId: string) => Promise<{
    count: number
    error: { message: string } | Error | null
    adminUser?: SingletonAdminUser
  }>
  deleteUserById: (userId: string) => Promise<{ error: { message: string } | Error | null }>
  getSingletonAdminUser: () => Promise<{
    data: SingletonAdminUser | null
    error?: { message: string } | Error | null
  }>
  writeAuditLog: (entry: {
    actorUserId: string | null
    action: string
    targetTable: string
    targetId: string
    details?: Record<string, unknown>
    succeeded?: boolean
  }) => Promise<void>
}

type DeleteManagedUserInput = {
  actorUserId: string
  targetUserId: string
  existingRole: UserRole
}

type DeleteManagedUserResult =
  | { ok: true; status: 204 }
  | { ok: false; status: 400 | 500; message: string }

export async function deleteManagedUser(
  deps: DeletionDeps,
  input: DeleteManagedUserInput
): Promise<DeleteManagedUserResult> {
  const deletionPolicyError = validateUserDeletion({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    existingRole: input.existingRole,
  })

  if (deletionPolicyError) {
    await deps.writeAuditLog({
      actorUserId: input.actorUserId,
      action: 'user.delete_blocked',
      targetTable: 'users',
      targetId: input.targetUserId,
      details: {
        reason: isAdminRole(input.existingRole) ? 'singleton_admin' : 'self_delete',
      },
      succeeded: false,
    })

    return { ok: false, status: 400, message: deletionPolicyError }
  }

  let reassignedCampaignCount = 0
  let reassignedToAdminId: string | null = null

  if (shouldReassignCampaignsBeforeDeletion(input.existingRole)) {
    const reassignResult = await deps.reassignOwnedCampaignsToAdmin(input.targetUserId)
    if (reassignResult.error) {
      return { ok: false, status: 500, message: reassignResult.error.message }
    }
    reassignedCampaignCount = reassignResult.count
    reassignedToAdminId = reassignResult.adminUser?.id ?? null
  }

  const deleteResult = await deps.deleteUserById(input.targetUserId)
  if (deleteResult.error) {
    return { ok: false, status: 500, message: deleteResult.error.message }
  }

  const { data: adminUser } = await deps.getSingletonAdminUser()

  await deps.writeAuditLog({
    actorUserId: input.actorUserId,
    action: 'user.deleted',
    targetTable: 'users',
    targetId: input.targetUserId,
    details: {
      deleted_role: input.existingRole,
      reassigned_campaign_count: reassignedCampaignCount,
      reassigned_to_admin_id: reassignedToAdminId ?? adminUser?.id ?? null,
    },
  })

  return { ok: true, status: 204 }
}
