# Code Review and Launch Plan — July 2026

Date: 2026-07-07
Scope: full repo review plus production-state audit, and a plan to get real players (Stephan's friends) using the app in earnest.

## Executive summary

The codebase is in far better shape than the "languishing" feeling suggests. Eight batches of work produced a genuinely solid character creator: atomic saves with optimistic locking, per-level history, a fail-closed derivation/legality pipeline, scoped RLS with app-layer ownership checks, audited content admin, 395 passing tests, and a repeatable authenticated browser smoke harness.

What stalled is not the code — it is the process and the operations:

1. **Production has been silently dead.** The hosted Supabase project (free tier) auto-paused from inactivity, so the deployed app has returned errors for weeks and nobody noticed. It was restored during this review (2026-07-07) and the site responds again, but it will pause again after ~1 week without traffic unless Phase 0 fixes this.
2. **The project is stuck at a decision point, not a capability gap.** Batch 8 closed on 2026-05-25 with a single instruction — "decide the product direction in Slice 9a" — and no commit has landed since. Six weeks of drift came from an unmade decision, not missing groundwork.
3. **The process rewards hardening over shipping.** Batches 4.5, 5.5, 7, and 8 were all corrective/polish/audit loops. Every slice writes closeout audits; the roadmap is ~3,000 lines. The verification machinery is excellent, but "done" has never been defined as "someone used it."

This document makes the Batch 9 direction decision explicit — **real-play: get a group through session zero and keep them using it** — and replaces the batch/slice format with four short phases aimed at that goal.

## Verification snapshot (2026-07-07)

| Check | Result |
| --- | --- |
| `npm test` | 395/395 pass |
| `npm run build` | passes |
| `npx tsc --noEmit` | **fails — 34 errors across 7 test files** (see finding C3) |
| Vercel production | last deploy 42 days ago, builds green, site up |
| Hosted Supabase | was `INACTIVE` (paused); restored during review; all 79 migrations applied; 5 users, 4 campaigns, 15 characters, 541 spells |
| Working tree | uncommitted: migration 079 (+ test), AGENTS.md, batch-7 test update (see finding C2) |

## Code review findings

### What is genuinely good (do not re-litigate)

- **Save-path integrity.** `save_character_atomic` / `save_character_level_up_atomic` RPCs, optimistic-lock tokens on every character PUT, structured 4xx error codes, and additive level-up writes. The Batch 4.5 data-integrity matrix pins all of it.
- **Per-level history.** `character_class_levels` keyed by `(character_id, class_id, level_number)` with provenance FKs; HP history survives level-ups.
- **Fail-closed loading.** Source allowlists, build-context/legality loading, snapshots, and client content fetches error explicitly instead of silently widening or rendering empty pickers.
- **Layered authorization.** RLS scoped to campaign ownership plus explicit `requireAuth`/`requireDm`/ownership assertions in every API route. Admin writes are zod-validated with unknown-key rejection and audit-logged, with impact previews before destructive content edits.
- **Content pipeline.** 79 disciplined migrations, PHB 2014 + Eberron seeded (541 spells), a dry-run import validator, and stale-provenance detection.
- **Test culture.** 395 tests including migration-pinning tests, regression matrices per batch, and the 12-scenario authenticated Playwright smoke (`npm run smoke:auth`).

This foundation is *done*. The plan below deliberately stops improving it.

### Critical / operational findings

**C1. Free-tier Supabase pauses kill production silently.**
`supabase-champagne-flower` (ref `cqpyvaynpzgyjerfesmz`) was `INACTIVE` when this review started. Free-tier projects pause after ~1 week without API activity; a paused DB means every page except static assets fails. Restored 2026-07-07 with data intact (verified: 79 migrations, all app tables and grants present). Without a fix, it will pause again a week after the last visit — the exact failure mode for a hobby app used between sessions.
*Fix in Phase 0: keep-alive cron + uptime check, or upgrade to Supabase Pro. Note: projects paused for 90+ days can become unrestorable from the dashboard — this nearly became data loss.*

**C2. Finished work is stranded uncommitted in the working tree.**
`supabase/migrations/079_explicit_data_api_grants.sql`, `test/supabase-data-api-grants.test.ts`, `AGENTS.md`, and the `test/batch-7-schema-validation.test.ts` update are untracked/modified. Migration 079 is *already applied* to the hosted DB, so git no longer reflects production. Any fresh checkout or another agent would see a 78-migration repo against a 79-migration database.
*Fix in Phase 0: commit and push.*

**C3. `tsc --noEmit` fails — 34 errors in 7 test files.**
`test/content-import-validator.test.ts` (25), `test/feature-grants.test.ts` (3), `test/content-admin-6g.test.ts` (2), and one each in `feat-spell-options`, `maverick-8c`, `multi-source-skill-provenance`, `skill-provenance-display`. Tests execute through `tsx` (which strips types without checking) and `next build` excludes `test/`, so nothing ever gates on this — the repo's own "run `npx tsc --noEmit` after editing" rule has been silently failing. The errors are mostly fixtures that drifted behind type changes (e.g. `Background` lost `equipment`, duplicated object keys), so tests still pass at runtime but their type contracts are stale.
*Fix in Phase 0: repair the fixtures and add a `verify` script so typecheck runs with the test suite.*

**C4. Onboarding will break on the built-in email sender.**
Magic link is the only signup path, and hosted Supabase is still on its built-in SMTP, which is rate-limited to a handful of emails per hour and explicitly not for production. Five friends signing up the same evening will hit the cap and conclude the app is broken. The branded templates from Slice 8gh (`supabase/templates/`) were also never applied to the hosted project (residual owner: Stephan, due 2026-05-31), so the emails that do arrive are unbranded Supabase defaults. The handoff notes in `output/slice-8gh-first-touch-polish.md` are ready to execute.
*Fix in Phase 0: custom SMTP (e.g. Resend free tier) + apply templates + verify the production redirect URL is in the Supabase auth allowlist.*

### Security findings (all WARN-level, from Supabase advisors 2026-07-07)

**S1.** Eleven `public` functions have a mutable `search_path` (`is_admin`, `is_dm`, `is_campaign_member`, `is_campaign_dm`, `can_manage_campaign`, `set_updated_at`, `handle_new_user` family, both atomic-save RPCs, the class-level sync triggers). Standard fix: `ALTER FUNCTION ... SET search_path = ''` (or pin to `public, pg_temp`).

**S2.** Nine `SECURITY DEFINER` functions are executable over the REST API by `anon`/`authenticated` — including trigger functions (`handle_new_user`, `enforce_singleton_admin`, `prevent_admin_delete`, `handle_campaign_created`) that should never be REST-callable. The app only calls `save_character_atomic` and `save_character_level_up_atomic` via `supabase.rpc(...)`; everything else can have `EXECUTE` revoked from `anon` and `authenticated`.

**S3.** Leaked-password protection (HaveIBeenPwned check) is disabled in hosted auth settings. One dashboard toggle.

All three fit one hardening migration (080) plus one dashboard setting. Low urgency at friends-scale, but cheap, and they follow the repo's own AGENTS.md explicit-grants philosophy.

### Product gaps blocking "friends use it in earnest"

**P1. No self-serve way to join a campaign.**
The only path: a friend signs up (magic link), tells the DM, and the DM adds them by email on the campaign settings page (`POST /api/campaigns/[id]/members` returns 404 if the account doesn't exist yet). Workable for one table, but it serializes onboarding through Stephan and fails in the confusing order (add-before-signup returns "No account found"). A token-based invite link (DM copies URL; new user signs up and lands auto-joined) is one small vertical slice and removes the whole dance.

**P2. Players cannot set or change their display name.**
`display_name` is written once by the `handle_new_user` trigger from auth metadata — which magic-link signups don't carry — so friends will be labelled with raw emails on dashboards, rosters, and DM review surfaces forever. There is no profile page or edit path anywhere in `src/app`. A first-login "what should we call you?" prompt (or a minimal account page) is a small, high-warmth fix.

**P3. New players land in an empty state with no guidance.**
A signed-up player who belongs to no campaign sees a dashboard whose only action is "New character" — which requires campaign membership they don't have. The empty state should say "ask your DM for an invite" (or carry the invite flow from P1).

**P4. Nothing exists for the table itself.**
Creation, review, and level-up are complete; play support is zero. The highest-value, lowest-cost piece is a DM party view: one page per campaign listing approved characters with AC, HP, passive perception, saves, and spell DCs — pure read-only aggregation of derived state that already exists. Deliberately out of scope: initiative trackers, HP tracking, combat automation. This is a character tool, not a VTT, until real play demands otherwise.

### Code-health findings (deliberately deprioritized)

- **Four oversized components remain:** `CharacterNewForm.tsx` (3,104 lines), `CharacterSheet.tsx` (2,489), `ContentAdmin.tsx` (2,286), `LevelUpWizard.tsx` (2,129). The roadmap schedules behavior-preserving splits (Slices 9b–9d). **Recommendation: don't do them now.** All four are behavior-stable, pinned by structural and regression tests, and none of the launch work below requires editing them deeply. Splitting is exactly the kind of zero-user-visible-value work that has consumed the last three batches. Split a file when a feature change actually forces you into it, using the established Slice 7g/8ef pattern.
- **`output/` doc sprawl:** ~20 batch audits plus a 3,000-line roadmap. Freeze as historical; stop adding to them (see process reset).
- Stale memory/plan artifacts referenced "Phase 1.5" work that batches 3–6 completed long ago; cleaned up as part of this review.

## The direction decision (Slice 9a, resolved)

Batch 8's handoff asked for a choice between (1) real-play features, (2) the 2024 ruleset, and (3) more sourcebooks. Given the stated goal — *friends using it in earnest* — the decision is:

**Chosen: (1) Real-play, at minimum viable scope** — launch operations, onboarding, and a DM party view, then iterate on actual player feedback.

**Rejected for now:**
- *(2) 2024 ruleset* — largest scope, and no player at this table is blocked by its absence. Revisit only if the group switches rules.
- *(3) More sourcebooks (Tasha's/Xanathar's/MotM)* — the import pipeline makes this cheap *on demand*; add a subclass/feat when a real player asks for it, not speculatively.
- *(9b–9d module splits)* — see code-health findings; do opportunistically, not as a batch.

## Implementation plan

Four phases. Each ends with a deploy. Phase 2 is the pivot: after it, the backlog comes from real players, not from audits.

### Phase 0 — Revive and stabilize production (~half a day)

Goal: the deployed app stays up unattended and can onboard multiple people in one evening.

1. **Commit the stranded work** — migration 079, its test, `AGENTS.md`, the batch-7 test update. Push and confirm the Vercel build is green.
2. **Keep the database awake.** Two options:
   - *Recommended:* add `GET /api/health` (trivial select against `sources`), a `vercel.json`/`vercel.ts` cron hitting it daily, and a free uptime monitor (e.g. UptimeRobot) on the production URL so downtime is never silent again.
   - *Alternative:* Supabase Pro (~$25/mo) removes pausing entirely. Decide based on how annoying the cron feels.
3. **Fix email before anyone signs up.** Configure custom SMTP in hosted Supabase (Resend free tier covers this scale), apply the branded templates per `output/slice-8gh-first-touch-polish.md`, confirm `https://dungeon-and-database.vercel.app/auth/callback` is in the auth redirect allowlist, and send one real magic link end-to-end.
4. **Repair the 34 test-file type errors** and add `"verify": "tsc --noEmit && npm test"` to `package.json` so the typecheck rule actually gates.
5. **Security hardening migration 080:** pin `search_path` on the eleven flagged functions; revoke REST `EXECUTE` from `anon`/`authenticated` on the internal SECURITY DEFINER functions (keep the two atomic-save RPCs per migration 079); enable leaked-password protection in the dashboard.
6. **Deploy.**

Acceptance: production survives a week untouched; a magic link arrives branded within a minute; `npm run verify` passes; advisors show no WARN items other than accepted ones.

### Phase 1 — Onboarding real people (1–2 days)

Goal: a friend with nothing but a URL gets from zero to "in the campaign, building a character" without Stephan doing database work.

1. **Campaign invite links.** New table `campaign_invites` (token, campaign_id, created_by, expires_at, max_uses/uses) with RLS + explicit grants per AGENTS.md; DM settings page gets "Create invite link"; `/join/[token]` adds the authenticated user to `campaign_members` (signing up via magic link first if needed — preserve the token through the auth redirect). This subsumes the manual add-by-email flow (which stays for edge cases).
2. **Display names.** First-login prompt (dashboard banner when `display_name` is null/email-derived) plus a minimal `PATCH` on the user's own row; show it on rosters and review surfaces.
3. **Empty states.** No-campaign player dashboard explains the invite flow; `characters/new` handles the zero-campaign case gracefully.
4. **Production QA with a fresh account** — a real inbox, not the demo fixtures: sign up, join by invite, create a character, submit, review it from the DM side.

Acceptance: one non-technical friend completes signup → join → draft character with no intervention beyond receiving a link.

### Phase 2 — Session zero (no code)

Goal: real usage, real friction list.

1. Create the real campaign with the appropriate source allowlist (PHB ± ERftLW), stat method, and max level.
2. Invite the actual group; everyone builds their character in the app; DM reviews/approves in the app.
3. Keep a raw friction log (a note, not an audit document). Timebox fixes to items that blocked someone, not items that offended taste.

Acceptance: every player at the table has an approved character that lives in the app.

### Phase 3 — Table essentials (2–4 days, shaped by Phase 2 feedback)

1. **DM party view** (`/dm/campaigns/[id]/party`): approved characters with AC, HP max, passive perception, saves, spell DC/attack, key features — read-only over the existing derived pipeline. This is the one genuinely new surface worth building before more feedback arrives.
2. **Print/compact sheet view** if players ask for paper at the table.
3. Whatever the friction log says — typically small content gaps (use the import pipeline) and copy fixes.

Acceptance: the DM runs a session with the party view open instead of asking players to read numbers aloud.

### Phase 4 — Steady state

- Iterate only on demand from play: content on request via `npm run content:import`, level-ups after sessions (already built), fixes from the friction log.
- Revisit the rejected directions (2024 rules, new sourcebooks, module splits) only when a real user need pulls them in.

## Process reset (how to stop the babysteps)

The batch/slice/closeout machinery was right for building the rules engine solo with an agent; it is wrong for a launched app with users. From here:

1. **Retire the format.** No more batch numbers, slice letters, closeout audits, or residual tables. `output/` and the 3,000-line roadmap are frozen as history. The living plan is this document plus a short friction log.
2. **Every session of work ends with a deploy.** If a change can't ship the same day, it's scoped too big.
3. **The only gates are `npm run verify` (tsc + tests) and `npm run build`**, with `npm run smoke:auth` reserved for release-sized UI changes — not every slice.
4. **Definition of done changes:** a task is done when a friend can use the result in production, not when its audit document exists.
5. **Decisions get made in the moment.** The six-week stall was a direction decision left as a residual. When a fork appears, pick the branch that gets players something visible sooner.

## Decisions needed from Stephan

| Decision | Options | Recommendation |
| --- | --- | --- |
| Database pausing | Keep-alive cron + uptime monitor vs. Supabase Pro | Cron + monitor now; Pro if it ever flakes |
| Email sender | Resend / Postmark / other SMTP | Resend free tier |
| Domain | Keep `dungeon-and-database.vercel.app` vs. custom domain | Keep Vercel domain for now (changing later only requires updating the Supabase redirect allowlist) |
| First campaign | Which group, which sources, stat method, max level | Needed before Phase 2 |
