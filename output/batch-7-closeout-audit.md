# Batch 7 Closeout Audit

Date: 2026-05-06

Slice 7i closes Batch 7 by recording what shipped, which user-review findings were fixed or deliberately deferred, and what Batch 8 should pick up first.

## Slice Delivery Status

| Slice | Focus | Status |
| --- | --- | --- |
| 7a | Demo-login QA setup, seeded campaign/character fixtures, and first browser evidence | Delivered |
| 7b | Route persistence and refresh/deep-link coverage for setup, creator, sheet, and DM flows | Delivered |
| 7c | Batch 7 regression matrix across creation, level-up, sheet, and DM review workflows | Delivered |
| 7d | Content schema/import guardrails for class/subclass/skills/equipment trust | Delivered |
| 7e | Visual QA pass and screenshot evidence notes across authenticated routes | Delivered |
| 7UserTest1 | First user-review pass, blocking creation/save issues, and usability gaps | Delivered |
| 7UserTest2 | Second user-review pass, duplicate/provenance/DM-repair issues | Delivered |
| 7f | User-review fix slice for navigation, focus, copy, legality noise, and content-admin rough edges | Delivered |
| 7f.5 | Beginner-facing copy pass for no-choice states and source wording | Delivered |
| 7g | Behavior-preserving module split for the highest-risk service modules | Delivered |
| 7h | Skill-provenance trigger decision and multi-source overlap test coverage | Delivered |
| 7i | Batch 7 closeout audit, roadmap status, and Batch 8 handoff | Delivered |

## Visual QA Summary

Fixed:

- Demo/authenticated route QA has a stable written record in `output/batch-7-visual-qa.md`.
- Campaign setup no longer strands the user at the bottom after changing settings.
- Campaign selection, step focus, fixed-grant/no-choice states, and selected-option wording were tightened in Slice 7f and 7f.5.
- Content admin destructive actions now use a shared confirmation control, tabs support keyboard navigation, unstable list keys were removed, import/equipment copy was clarified, and the wide-table presentation was made denser.
- Legality messaging now emphasizes failed or actionable issues instead of noisy all-clear text.

Deferred with rationale:

- Authenticated screenshot smoke remains a Batch 8 residual because the current evidence is route-by-route visual QA notes rather than a stable automated screenshot gate.
- Broad dashboard/campaign visual warmth is deferred because Batch 7 focused on trust, correctness, and review-blocking polish instead of a full visual redesign.
- Magic-link email branding is deferred because the likely fix is provider configuration rather than application code.

## User Review Summary

Fixed:

- UT1-001: React error and conflicting level-up save state were fixed and confirmed during the second user-review pass.
- UT2-001: HP-only duplicate advancement choices were removed.
- UT2-002: Raw class-level repair controls are locked to DM repair mode.
- UT2-003: Duplicate Thief skill provenance is labelled by source rather than treated as a silent duplicate.
- UT1-002 through UT1-006 and UT2-004 through UT2-005: campaign settings return path, source allowlist display, dense selector, step focus, selected-choice wording, class ordering, and save-label copy were addressed in Slice 7f.
- UT1-008 through UT1-013: fixed grants, irrelevant steps, duplicate-skill blocking, stat-method timing, and legality-noise issues were addressed across 7UserTest1 and 7f.
- UT1-014 and UT1-015: sheet wording was changed away from confusing `amended` or implementation-gap language.
- UT2-006 and UT2-007: content-admin scrolling and import/equipment IA were reduced through denser table and clearer copy.

Deferred with rationale:

- UT1-016 magic-link email branding is deferred to provider configuration review.
- UT1-017 dashboard warmth is deferred to Batch 8 because it is a visual-design pass, not a blocker for Batch 7 trust.
- Remaining content-admin table ergonomics are deferred because Batch 7 reduced the immediate horizontal-scroll pain without reworking the larger IA.

## Verification Coverage

Fresh Slice 7i verification run:

- `node --import tsx --test test/batch-7-closeout.test.ts` passed: 4/4 tests.
- `node --import tsx --test test/setup-demo-qa.test.ts test/route-persistence-7b.test.ts test/batch-7-regression-matrix.test.ts test/batch-7-schema-validation.test.ts test/content-import-validator.test.ts test/content-import-6h.test.ts test/ui-polish-conventions.test.ts test/batch-7-usability-copy.test.ts test/batch-7-novice-comprehension.test.ts test/multi-source-skill-provenance.test.ts test/build-context-module-split.test.ts test/feature-grants-module-split.test.ts test/legality-engine-module-split.test.ts test/batch-7-closeout.test.ts` passed: 83/83 tests.
- `npm test` passed: 367/367 tests.
- `npm run build` passed.
- `npm run doctor` ran but did not pass because the local shell is on Node 25.x while `.nvmrc` expects Node 20.x, and the Supabase CLI is not authenticated. The same doctor run confirmed Vercel CLI authentication and the expected Supabase project ref.

The focused suite above carries the route-persistence-7b, Batch 7 matrix, content-import, and batch-7-visual-qa checks forward into the closeout gate.

## Module-Splitting Summary

Slice 7g proved the high-risk service split can stay behavior-preserving under tests.

| Module | Batch 7 result | Remaining |
| --- | --- | --- |
| `src/lib/character-creation/build-context.ts` | Reduced to a coordinator with focused helper modules for feature assembly, grant bucketing, and sheet materialization | Watch future edits for orchestration bloat |
| `src/lib/character-creation/feature-grants.ts` | Converted into a barrel over smaller grant/copy/proficiency/source helpers | Keep grant-source naming consistent |
| `src/lib/character-creation/legality/engine.ts` | Split into a small orchestration layer over focused legality checks | Add new checks in dedicated modules |
| `src/lib/character-creation/derived.ts` | Not split in Batch 7 | Finish remaining behavior-preserving module splits in Batch 8 |
| `src/components/character-sheet/CharacterSheet.tsx` | Not split in Batch 7 | Finish remaining behavior-preserving module splits in Batch 8 |

## Slice 7h Decision

Trigger status: Not triggered.

No `character_skill_proficiency_sources` migration was added. There was no authenticated DM review finding showing that the current Path B display failed to explain overlap, selected source, replacement, or expertise provenance. The authenticated user-review gap was already covered by duplicate-skill blocking and source-labelled overlap display, so Batch 7 kept the existing persistence shape and added focused multi-source skill-provenance regression coverage instead.

## Residuals

| Residual | Owner | Target date | Reason |
| --- | --- | --- | --- |
| Finish remaining behavior-preserving module splits for `derived.ts` and `CharacterSheet.tsx` | Codex | 2026-05-15 | Slice 7g safely split three high-risk modules; these two are still large enough to deserve isolated follow-up. |
| Authenticated screenshot smoke | Codex | 2026-05-15 | Batch 7 has visual QA notes, but a stable automated screenshot smoke gate still needs setup. |
| Magic-link email branding provider configuration | Stephan + Codex | 2026-05-15 | The issue appears to live in auth/provider configuration rather than the local application surface. |
| Local doctor environment alignment | Stephan + Codex | 2026-05-15 | `npm run doctor` found Node 25.x instead of the expected Node 20.x and an unauthenticated Supabase CLI. |
| Dashboard/campaign visual warmth | Codex | 2026-05-15 | User review called the experience stark; Batch 7 only took the trust/blocker fixes. |
| Content-admin table ergonomics | Codex | 2026-05-15 | The immediate horizontal-scroll problem was reduced, but deeper responsive IA remains. |

## Batch 8 Entry Notes

1. Finish remaining behavior-preserving module splits for `derived.ts` and `CharacterSheet.tsx`, keeping the 7g structural tests as the model.
2. Add Authenticated screenshot smoke for the same setup, character, sheet, and DM/admin paths recorded in `output/batch-7-visual-qa.md`.
3. Review magic-link email branding provider configuration with Supabase/auth settings access.
4. Rerun `npm run doctor` under Node 20.x with Supabase CLI authentication available.
5. Make a targeted warmth pass on dashboard and campaign-selection surfaces without changing creation rules.
6. Continue content-admin table ergonomics once the screenshot smoke gives reliable visual regression coverage.
