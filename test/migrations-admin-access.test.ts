import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
const migration019 = readFileSync(join(migrationsDir, '019_set_stephan_as_admin.sql'), 'utf8')
const migration020 = readFileSync(join(migrationsDir, '020_singleton_admin_audit_and_access.sql'), 'utf8')

test('migration 019 no longer hard-codes a personal admin email', () => {
  assert.doesNotMatch(migration019, /stephan\.burn@gmail\.com/i)
})

test('migration 020 creates audit log table and admin-only read policy', () => {
  assert.match(migration020, /CREATE TABLE IF NOT EXISTS public\.audit_logs/i)
  assert.match(migration020, /CREATE POLICY "audit_logs_select_admin" ON public\.audit_logs/i)
  assert.match(migration020, /FOR SELECT USING \(public\.is_admin\(\)\)/i)
})

test('migration 020 enforces singleton admin invariants', () => {
  assert.match(migration020, /CREATE OR REPLACE FUNCTION public\.enforce_singleton_admin\(\)/i)
  assert.match(migration020, /Only one admin account is allowed/i)
  assert.match(migration020, /The singleton admin role cannot be changed/i)
  assert.match(migration020, /CREATE TRIGGER users_singleton_admin_guard/i)
  assert.match(migration020, /CREATE OR REPLACE FUNCTION public\.prevent_admin_delete\(\)/i)
  assert.match(migration020, /The singleton admin account cannot be deleted/i)
  assert.match(migration020, /CREATE TRIGGER users_prevent_admin_delete/i)
})

test('migration 020 normalizes existing admins to a single canonical admin', () => {
  assert.match(
    migration020,
    /UPDATE public\.users\s+SET role = 'dm'\s+WHERE role = 'admin'\s+AND id <> canonical_admin_id;/i
  )
})

test('migration 020 grants admins global campaign management through can_manage_campaign', () => {
  assert.match(migration020, /CREATE OR REPLACE FUNCTION public\.can_manage_campaign\(p_campaign_id uuid\)/i)
  assert.match(migration020, /SELECT public\.is_admin\(\) OR public\.is_campaign_dm\(p_campaign_id\);/i)
  assert.match(migration020, /campaign_members_insert_dm[\s\S]*FOR INSERT WITH CHECK \(public\.can_manage_campaign\(campaign_id\)\);/i)
  assert.match(migration020, /allowlist_insert_dm[\s\S]*FOR INSERT WITH CHECK \(public\.can_manage_campaign\(campaign_id\)\);/i)
  assert.match(migration020, /characters_update_own[\s\S]*public\.can_manage_campaign\(campaign_id\)/i)
  assert.match(migration020, /char_choices_update_own[\s\S]*public\.can_manage_campaign\(c\.campaign_id\)/i)
})
