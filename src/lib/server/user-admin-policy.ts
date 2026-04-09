import { isAdminRole } from '@/lib/auth/roles'
import type { UserRole } from '@/lib/types/database'

type RoleChangePolicyInput = {
  actorUserId: string
  targetUserId: string
  existingRole: UserRole
  requestedRole: 'player' | 'dm'
}

export function validateRoleChange({
  actorUserId,
  targetUserId,
  existingRole,
  requestedRole,
}: RoleChangePolicyInput): string | null {
  if (actorUserId === targetUserId) {
    return 'Admins cannot change their own role here'
  }

  if (isAdminRole(existingRole)) {
    return 'The singleton admin role cannot be changed here'
  }

  if (existingRole === requestedRole) {
    return null
  }

  return null
}

type UserDeletionPolicyInput = {
  actorUserId: string
  targetUserId: string
  existingRole: UserRole
}

export function validateUserDeletion({
  actorUserId,
  targetUserId,
  existingRole,
}: UserDeletionPolicyInput): string | null {
  if (actorUserId === targetUserId) {
    return 'Admins cannot delete their own account here'
  }

  if (isAdminRole(existingRole)) {
    return 'The singleton admin account cannot be deleted'
  }

  return null
}

export function shouldReassignCampaignsBeforeDeletion(role: UserRole) {
  return role === 'dm'
}
