import test from 'node:test'
import assert from 'node:assert/strict'
import { hasDmAccess, isAdminRole } from '@/lib/auth/roles'

test('admin is recognized as admin role', () => {
  assert.equal(isAdminRole('admin'), true)
  assert.equal(isAdminRole('dm'), false)
  assert.equal(isAdminRole('player'), false)
})

test('dm access includes admin and dm, but not player', () => {
  assert.equal(hasDmAccess('admin'), true)
  assert.equal(hasDmAccess('dm'), true)
  assert.equal(hasDmAccess('player'), false)
})
