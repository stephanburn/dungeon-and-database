import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '080_security_hardening.sql')
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

test('migration 080 pins search_path on every function flagged by the search_path advisor', () => {
  const pinnedFunctions = [
    'public.set_updated_at()',
    'public.is_dm()',
    'public.is_admin()',
    'public.is_campaign_member(uuid)',
    'public.is_campaign_dm(uuid)',
    'public.can_manage_campaign(uuid)',
    'public.save_character_atomic(uuid, jsonb)',
    'public.save_character_level_up_atomic(uuid, jsonb)',
    'public.sync_character_class_levels_for_class(uuid, uuid)',
    'public.sync_character_class_levels_from_levels()',
    'public.sync_character_class_levels_from_hp_rolls()',
  ]

  for (const signature of pinnedFunctions) {
    const escaped = signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(
      migrationSql,
      new RegExp(`ALTER FUNCTION ${escaped} SET search_path = ''`),
      `missing search_path pin for ${signature}`
    )
  }
})

test('migration 080 revokes REST execute only on trigger-only SECURITY DEFINER functions', () => {
  const revokedTriggerFunctions = [
    'public.handle_new_user()',
    'public.handle_campaign_created()',
    'public.enforce_singleton_admin()',
    'public.prevent_admin_delete()',
  ]

  for (const signature of revokedTriggerFunctions) {
    const escaped = signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Must revoke from PUBLIC, not just anon/authenticated: every role
    // implicitly inherits privileges granted to PUBLIC, so revoking from a
    // named role alone leaves the function callable via the PUBLIC grant.
    assert.match(
      migrationSql,
      new RegExp(`REVOKE EXECUTE ON FUNCTION ${escaped} FROM PUBLIC;`),
      `missing REST execute revoke for ${signature}`
    )
  }

  // RLS predicate functions must keep their execute grant — RLS policies call
  // them directly and revoking would break every policy for authenticated users.
  for (const rlsPredicate of ['is_admin', 'is_dm', 'is_campaign_member', 'is_campaign_dm', 'can_manage_campaign']) {
    assert.doesNotMatch(
      migrationSql,
      new RegExp(`REVOKE EXECUTE ON FUNCTION public\\.${rlsPredicate}\\([^)]*\\) FROM`),
      `${rlsPredicate} must not have its execute grant revoked — it is used inside RLS policies`
    )
  }
})
