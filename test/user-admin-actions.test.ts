import test from 'node:test'
import assert from 'node:assert/strict'
import { deleteManagedUser } from '@/lib/server/user-admin-actions'
import type { UserRole } from '@/lib/types/database'

function createDeps() {
  const auditEntries: Array<Record<string, unknown>> = []
  type ReassignResult = {
    count: number
    error: Error | { message: string } | null
    adminUser?: { id: string; role: UserRole }
  }

  return {
    auditEntries,
    deps: {
      reassignOwnedCampaignsToAdmin: async (_userId: string): Promise<ReassignResult> => ({
        count: 2,
        error: null,
        adminUser: { id: 'admin-1', role: 'admin' as const },
      }),
      deleteUserById: async (_userId: string) => ({ error: null }),
      getSingletonAdminUser: async () => ({
        data: { id: 'admin-1', role: 'admin' as const },
        error: null,
      }),
      writeAuditLog: async (entry: Record<string, unknown>) => {
        auditEntries.push(entry)
      },
    },
  }
}

test('dm deletion reassigns campaigns and emits deletion audit log', async () => {
  const { deps, auditEntries } = createDeps()

  const result = await deleteManagedUser(deps, {
    actorUserId: 'admin-1',
    targetUserId: 'dm-1',
    existingRole: 'dm',
  })

  assert.deepEqual(result, { ok: true, status: 204 })
  assert.equal(auditEntries.length, 1)
  assert.deepEqual(auditEntries[0], {
    actorUserId: 'admin-1',
    action: 'user.deleted',
    targetTable: 'users',
    targetId: 'dm-1',
    details: {
      deleted_role: 'dm',
      reassigned_campaign_count: 2,
      reassigned_to_admin_id: 'admin-1',
    },
  })
})

test('player deletion skips reassignment and still emits deletion audit log', async () => {
  const { deps, auditEntries } = createDeps()
  let reassignmentCalls = 0

  deps.reassignOwnedCampaignsToAdmin = async (_userId: string) => {
    reassignmentCalls += 1
    return {
      count: 99,
      error: null,
      adminUser: { id: 'admin-1', role: 'admin' as const },
    }
  }

  const result = await deleteManagedUser(deps, {
    actorUserId: 'admin-1',
    targetUserId: 'player-1',
    existingRole: 'player',
  })

  assert.deepEqual(result, { ok: true, status: 204 })
  assert.equal(reassignmentCalls, 0)
  assert.equal(auditEntries.length, 1)
  assert.deepEqual(auditEntries[0], {
    actorUserId: 'admin-1',
    action: 'user.deleted',
    targetTable: 'users',
    targetId: 'player-1',
    details: {
      deleted_role: 'player',
      reassigned_campaign_count: 0,
      reassigned_to_admin_id: 'admin-1',
    },
  })
})

test('blocked admin deletion writes blocked audit log', async () => {
  const { deps, auditEntries } = createDeps()

  const result = await deleteManagedUser(deps, {
    actorUserId: 'admin-1',
    targetUserId: 'admin-2',
    existingRole: 'admin',
  })

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    message: 'The singleton admin account cannot be deleted',
  })
  assert.equal(auditEntries.length, 1)
  assert.deepEqual(auditEntries[0], {
    actorUserId: 'admin-1',
    action: 'user.delete_blocked',
    targetTable: 'users',
    targetId: 'admin-2',
    details: { reason: 'singleton_admin' },
    succeeded: false,
  })
})

test('reassignment failure aborts deletion and emits no success audit log', async () => {
  const { deps, auditEntries } = createDeps()
  let deleteCalls = 0

  deps.reassignOwnedCampaignsToAdmin = async (_userId: string) => ({
    count: 0,
    error: new Error('reassignment failed'),
  })
  deps.deleteUserById = async (_userId: string) => {
    deleteCalls += 1
    return { error: null }
  }

  const result = await deleteManagedUser(deps, {
    actorUserId: 'admin-1',
    targetUserId: 'dm-1',
    existingRole: 'dm',
  })

  assert.deepEqual(result, {
    ok: false,
    status: 500,
    message: 'reassignment failed',
  })
  assert.equal(deleteCalls, 0)
  assert.equal(auditEntries.length, 0)
})
