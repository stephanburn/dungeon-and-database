-- 080_security_hardening.sql
-- Phase 0 security hardening from the 2026-07 code review (Supabase advisors, all WARN-level).
--
-- 1. Pin search_path on the 11 functions flagged with a mutable search_path, to
--    prevent search_path hijacking. All bodies already fully schema-qualify their
--    references, so an empty search_path is safe.
-- 2. Revoke REST-callable EXECUTE (via PUBLIC) on the four trigger-only
--    SECURITY DEFINER functions. Trigger invocation does not require the firing
--    role to hold EXECUTE on the trigger function, so this closes off direct
--    `rpc/handle_new_user`-style calls without touching trigger behavior.
--
-- Deliberately NOT revoked: is_admin(), is_dm(), is_campaign_member(),
-- is_campaign_dm(), can_manage_campaign(). These are also SECURITY DEFINER and
-- REST-callable, but they are invoked directly inside RLS policy USING/WITH CHECK
-- clauses throughout the schema. Revoking EXECUTE from authenticated would make
-- every RLS policy that calls them raise "permission denied for function" for
-- every authenticated request, breaking the app outright. The REST exposure is
-- read-only role/membership information already available to the caller through
-- normal app routes, so it is accepted risk rather than a fix here.

-- ── 1. Pin search_path ──────────────────────────────────────
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.is_dm() SET search_path = '';
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.is_campaign_member(uuid) SET search_path = '';
ALTER FUNCTION public.is_campaign_dm(uuid) SET search_path = '';
ALTER FUNCTION public.can_manage_campaign(uuid) SET search_path = '';
ALTER FUNCTION public.save_character_atomic(uuid, jsonb) SET search_path = '';
ALTER FUNCTION public.save_character_level_up_atomic(uuid, jsonb) SET search_path = '';
ALTER FUNCTION public.sync_character_class_levels_for_class(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.sync_character_class_levels_from_levels() SET search_path = '';
ALTER FUNCTION public.sync_character_class_levels_from_hp_rolls() SET search_path = '';

-- ── 2. Revoke REST EXECUTE on trigger-only functions ────────
-- Revoking from anon/authenticated alone is a no-op: every role implicitly
-- inherits privileges granted to PUBLIC, and these functions default to
-- PUBLIC EXECUTE at creation. Must revoke from PUBLIC itself. Trigger firing
-- does not require the firing role to hold EXECUTE, so this is safe.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_campaign_created() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_singleton_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_delete() FROM PUBLIC;
