import type { UserRole } from '@/lib/types/database'

export function isAdminRole(role: UserRole | null | undefined): role is 'admin' {
  return role === 'admin'
}

export function hasDmAccess(role: UserRole | null | undefined): role is 'dm' | 'admin' {
  return role === 'dm' || role === 'admin'
}
