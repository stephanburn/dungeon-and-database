# Batch 8 Closeout Audit

Date: 2026-05-25

Slice 8j closes Batch 8 by checking every Batch 7 residual against the shipped Batch 8 work, recording the remaining owner/date/reason items, and turning Batch 9 into a concrete direction-decision handoff rather than another loose hardening loop.

## Slice Delivery Status

| Slice | Focus | Status |
| --- | --- | --- |
| 8a | Doctor and local environment alignment around Node 24.x | Delivered |
| 8b | Fail-closed source allowlists, build/legality loading, snapshots, and client fetches | Delivered |
| 8c | Rule-handler registry and Maverick Arcane Breakthrough legality repair | Delivered |
| 8d | Authenticated Playwright screenshot smoke harness and report | Delivered |
| 8ef | Derived and CharacterSheet splits with per-level HP history correction | Delivered |
| 8gh | Supabase transactional email templates and first-touch entry polish | Delivered |
| 8i | Content-admin write-loop hardening, impact preview, and stale-provenance surface | Delivered |
| 8j | Batch 8 closeout audit, roadmap status, and Batch 9 handoff | Delivered |

## Batch 7 Residual Closeout

| Batch 7 residual | Batch 8 outcome | Evidence |
| --- | --- | --- |
| Finish behavior-preserving splits for `src/lib/characters/derived.ts` and `src/components/character-sheet/CharacterSheet.tsx` | Closed | Slice 8ef split HP/ability helpers, sheet content loading, save payload assembly, and HP-card presentation while correcting HP history to use per-level `character_class_levels`. |
| Authenticated screenshot smoke | Closed | Slice 8d added `npm run smoke:auth`, `scripts/auth-smoke/scenarios.ts`, screenshots under `output/playwright/batch-8d/`, and the report at `output/batch-8d-authenticated-smoke.md`; Slice 8i expanded the harness to 12 scenarios. |
| Magic-link email branding provider configuration | Locally closed; hosted handoff remains | Slice 8gh added local Supabase templates in `supabase/templates/` and recorded hosted-provider application steps in `output/slice-8gh-first-touch-polish.md`. Applying those templates to hosted Supabase still needs provider credentials. |
| Local doctor environment alignment | Closed | Slice 8a aligned `.nvmrc`, setup docs, and `scripts/doctor.sh` on Node 24.x. Slice 8j reran `npm run doctor` successfully with Vercel and Supabase CLI authentication available. |
| Dashboard/campaign visual warmth | Closed | Slice 8gh added calmer login, dashboard, DM campaign-pulse, and selected-campaign entry states, then refreshed the authenticated smoke baseline. |
| Content-admin table ergonomics | Closed for Batch 8; module split carried forward | Slice 8i made the admin table wider and scan-safe, added acknowledgement-gated impact previews, aggregate stale-provenance visibility, strict `sources` schemas, and import-preview catalog-load errors. Splitting `ContentAdmin.tsx` remains a Batch 9 code-health carry-in by design. |

## Verification Summary

Fresh Slice 8j verification run, 2026-05-25:

- `node --import tsx --test test/batch-8-closeout.test.ts` passed: 4/4 tests.
- `npm test` passed: 392/392 tests.
- `npm run build` passed.
- `npm run doctor` passed. Output confirmed Node 24.x, required env keys, Vercel CLI auth, Supabase CLI auth, and Supabase project ref; the final line was `Doctor check passed.`
- `npm run smoke:auth` passed: 12/12 authenticated browser scenarios, refreshing `output/batch-8d-authenticated-smoke.md` and the screenshot baseline under `output/playwright/batch-8d/`.

The smoke harness is the targeted screenshot smoke for this closeout. It covers anonymous login desktop/mobile, player dashboard, character creation, sheet, DM review, content admin, and the Slice 8i admin impact-preview path.

## Residuals

| Residual | Owner | Target date | Reason |
| --- | --- | --- | --- |
| Batch 9 direction decision and entry plan in `output/batch-9-direction-decision.md` | Codex + Stephan | 2026-05-26 | Batch 8 closed the residual hardening loop; the next product move should be chosen explicitly before new feature work starts. |
| Behavior-preserving split for `src/app/characters/new/CharacterNewForm.tsx` | Codex | 2026-05-27 | The creation wizard is still a load-bearing large component; Slice 8c reduced shared custom-rule drift but did not split the form. |
| Behavior-preserving split for `src/app/characters/[id]/LevelUpWizard.tsx` | Codex | 2026-05-29 | The level-up wizard keeps important additive-save and stale-state behavior in one large file; split only behind structural and regression tests. |
| Behavior-preserving split for `src/components/dm/ContentAdmin.tsx` | Codex | 2026-06-02 | Slice 8i hardened the write loop but deliberately left the module split for Batch 9 so UX and data-safety changes stayed bounded. |
| Hosted Supabase email templates applied and inbox-rendering checked | Stephan | 2026-05-31 | Local templates and exact provider-field handoff exist, but hosted Supabase settings require provider access outside this local code session. |

## Batch 9 Entry Notes

1. Open with Slice 9a: create `output/batch-9-direction-decision.md`, choose the next product direction, record rejected alternatives, and rewrite the direction-specific Batch 9 tail against that choice.
2. Treat this residual table as the authoritative Batch 9 carry-in list; do not reopen the broader Batch 7 residual list unless new evidence appears.
3. Keep the wizard and content-admin splits behavior-preserving, using the Slice 7g and 8ef structural-test pattern.
4. Use `npm run smoke:auth` as the visual/screenshot baseline for any entry-funnel, DM, sheet, or content-admin UI changes that Batch 9 touches.
5. Do not let Batch 9 become generic polish by default: after Slice 9a, every feature slice should tie back to the chosen direction.
