# Slice 8gh First-Touch Polish Notes

Date: 2026-05-25

## Transactional Email Ownership

The magic-link branding issue is provider-owned. Local Supabase can read checked-in HTML templates from `supabase/config.toml`; hosted Supabase projects must be updated in the provider dashboard or through the Management API.

Hosted Supabase owner: Stephan

Production handoff: open Supabase Dashboard > Authentication > Email Templates and apply the same subjects and HTML from:

- `supabase/templates/magic-link.html`
- `supabase/templates/recovery.html`
- `supabase/templates/confirmation.html`
- `supabase/templates/email-change.html`

Management API field names to patch when an access token is available:

- `mailer_subjects_magic_link`
- `mailer_templates_magic_link_content`
- `mailer_subjects_recovery`
- `mailer_templates_recovery_content`
- `mailer_subjects_confirmation`
- `mailer_templates_confirmation_content`
- `mailer_subjects_email_change`
- `mailer_templates_email_change_content`

Reason this remains a handoff for hosted mail: this repo has service-role Supabase credentials for app data access, but no Supabase Management API token or confirmed hosted auth-template write path in the local environment. The local dev provider configuration is now checked in so Inbucket renders branded templates after the Supabase stack is restarted.

Manual inbox-rendering check: pending hosted-template application. Run one real magic-link send and one password-reset send after updating the hosted provider templates, then record the received rendering here or in `output/batch-8d-authenticated-smoke.md`.

References:

- Supabase local template config: https://supabase.com/docs/guides/local-development/customizing-email-templates
- Supabase hosted email template management: https://supabase.com/docs/guides/auth/auth-email-templates

## Entry Funnel

- Login now tells users to expect a branded Dungeon & Database email and explains that magic links only work once.
- Player dashboard keeps the same dense row selection flow while adding a quiet session-readiness summary.
- DM dashboard adds a compact campaign pulse with per-campaign roster and submitted-review counts.
- Character creation's campaign picker now gives selected-campaign context in a small "Campaign guide" surface instead of a bare implementation summary.
