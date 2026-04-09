import test from 'node:test'
import assert from 'node:assert/strict'
import {
  shouldReassignCampaignsBeforeDeletion,
  validateRoleChange,
  validateUserDeletion,
} from '@/lib/server/user-admin-policy'

test('singleton admin cannot be role-changed', () => {
  assert.equal(
    validateRoleChange({
      actorUserId: 'admin-1',
      targetUserId: 'admin-2',
      existingRole: 'admin',
      requestedRole: 'dm',
    }),
    'The singleton admin role cannot be changed here'
  )
})

test('admin cannot change their own role', () => {
  assert.equal(
    validateRoleChange({
      actorUserId: 'admin-1',
      targetUserId: 'admin-1',
      existingRole: 'dm',
      requestedRole: 'player',
    }),
    'Admins cannot change their own role here'
  )
})

test('dm can be demoted to player', () => {
  assert.equal(
    validateRoleChange({
      actorUserId: 'admin-1',
      targetUserId: 'dm-1',
      existingRole: 'dm',
      requestedRole: 'player',
    }),
    null
  )
})

test('singleton admin cannot be deleted', () => {
  assert.equal(
    validateUserDeletion({
      actorUserId: 'admin-1',
      targetUserId: 'admin-2',
      existingRole: 'admin',
    }),
    'The singleton admin account cannot be deleted'
  )
})

test('admin cannot delete themselves', () => {
  assert.equal(
    validateUserDeletion({
      actorUserId: 'admin-1',
      targetUserId: 'admin-1',
      existingRole: 'dm',
    }),
    'Admins cannot delete their own account here'
  )
})

test('dm deletion triggers campaign reassignment, player deletion does not', () => {
  assert.equal(shouldReassignCampaignsBeforeDeletion('dm'), true)
  assert.equal(shouldReassignCampaignsBeforeDeletion('player'), false)
  assert.equal(shouldReassignCampaignsBeforeDeletion('admin'), false)
})
