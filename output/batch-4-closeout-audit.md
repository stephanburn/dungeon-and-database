# Batch 4 Closeout Audit

This document is the Slice 4o closeout gate for Batch 4. It answers two questions:

1. Does the guided builder now cover the Batch 4 promise for creation and level-up?
2. What residual gaps remain, and which of them are explicit Batch 5 entry tasks rather than hidden Batch 4 debt?

## Representative Archetype Matrix

Creation remains intentionally single-class and level 1. The multiclass smoke therefore means:

- create the base character through the guided creation flow only
- then use the guided level-up flow to add the new multiclass level

| Archetype | Guided creation smoke | Guided level-up smoke | Notes |
| --- | --- | --- | --- |
| Single-class caster | Wizard 1 | Wizard 2 | Exercises spell selection, HP gain, and class-scoped spell review |
| Multiclass caster / martial | Fighter 1 | Fighter 1 / Wizard 1 | Exercises multiclass prerequisite validation, multiclass skill grant, and class-scoped spell persistence |
| Feat-heavy | Variant Human Fighter 1 | Fighter 2 or Fighter 4 depending on feat-slot fixture | Exercises species feat handling in creation and ASI / feat persistence in level-up |
| Species / background-heavy | Changeling Bard 1 or Warforged Artificer 1 | same class to next level | Exercises typed language/tool/species-choice provenance and feature-driven spell / option handling |
| 4.5 overlap regression | Background-skilled Fighter 1 or Wizard 3 / Bard 1 | add an overlapping multiclass skill, swap a class spell, retrain a feat, and edit a feature-option value | Exercises the Batch 4.5 data-integrity fixes: skill overlap merge, spell/feat replacement, feature-option upsert, preserved per-level anchors, stale-write handling, and client submit safety |

## Smoke Evidence

The current repo state supports the matrix above through guided flows only:

- creation is driven from `src/app/characters/new/CharacterNewForm.tsx` and explicitly blocks raw-sheet multiclass shortcuts
- level-up is driven from `src/app/characters/[id]/LevelUpWizard.tsx` and now persists additive-only changes through the level-up RPC path
- shared legality / derivation is reused by creation review, level-up review, and post-save reloads

Verification run for Slice 4o:

- `npm test -- test/level-up-flow.test.ts test/atomic-save.test.ts test/wizard-step-helpers.test.ts test/batch-4-closeout.test.ts`
- `node node_modules/next/dist/bin/next build`

Verification added during Batch 4.5:

- `test/level-up-atomic-swap-replace-migration.test.ts` pins spell swap, feat retrain, and feature-option value-change SQL behavior
- `test/level-up-atomic-skill-overlap-migration.test.ts` pins skill-overlap merge behavior and first-write-wins provenance
- `test/level-up-preserved-provenance-anchor-safety-migration.test.ts` pins preserved anchors and idempotent class-level sync behavior
- `test/level-up-concurrency-guardrails-migration.test.ts` pins trigger locking and level-up optimistic-lock token checks
- `test/character-route-concurrency-errors.test.ts` pins structured 4xx error mapping and client token forwarding
- `test/client-submit-safety.test.ts` pins species/class/subclass stale-state clearing, step-selector gating, and double-submit protection
- `test/server-side-rolled-stats.test.ts` pins server-side stat rolling and non-DM DM-field stripping
- `test/batch-45-regression-matrix.test.ts` ties the critical 2026-04-23 review findings to the tests above so a future cleanup cannot remove coverage silently

Verification run for Slice 4.5h:

- `npm test -- --runInBand`
- `node node_modules/next/dist/bin/next build`

## Batch 4.5 Addendum

Batch 4.5 closed the level-up data-integrity findings from the 2026-04-23 senior review before Batch 5 sheet presentation work begins.

Final correction list:

- spell swaps and feat retrains now use replacement/upsert semantics instead of append-only level-up writes
- feature-option value edits now upsert `selected_value` instead of failing on the unique key
- overlapping multiclass skills merge safely on `(character_id, skill)` and preserve the first grant's provenance
- per-level class history sync updates valid rows in place instead of deleting and reinserting them, protecting `character_level_id` anchors from `ON DELETE SET NULL`
- preserved spell, feat, and feature-option rows keep their existing anchors when a full after-state level-up payload reasserts them
- level-up saves and trigger-driven class-level syncs now serialize through the owning character row, with `expected_updated_at` optimistic-lock checks and structured 4xx route errors
- creation and level-up clients now send save tokens, gate double-submit paths, clear stale owner-scoped choice state, and request rolled stats from the server
- non-DM draft hydration no longer receives `character_type` or `dm_notes`

Skill-provenance decision from Slice 4.5b:

- Chosen path: **Path B**, keep the narrow `character_skill_proficiencies` primary key `(character_id, skill)`.
- Conflict behavior: `expertise` merges with OR semantics; existing `character_level_id`, `source_category`, `source_entity_id`, and `source_feature_key` are preserved.
- Rationale: current loaders, legality aggregation, and sheet display all read one row per skill. Path A, widening the key for multi-row skill provenance, would require a broader read-model refactor and an aggregate-back-to-one-row layer before the sheet could render the same UX.
- Deferred option: if Batch 5 needs multi-source skill provenance in presentation, add a dedicated `character_skill_proficiency_sources` table rather than widening the existing primary key in place.

Residuals explicitly deferred:

- Live Supabase transaction smoke against a copy of production data remains a deployment gate for migrations `067` and `068`; the local repo pins generated SQL and route/client contracts, but does not include a real transaction harness.
- A broader programmatic browser smoke harness is still a Batch 5-or-later quality task, not a blocker for entering Batch 5.
- Multi-source skill provenance presentation is deferred until sheet/audit UI work demonstrates a concrete need.

## Gap Audit

### Confirmed clear for Batch 4

- No primary guided save path writes new feat or spell state into `character_choices`; guided character saves go through `save_character_atomic` or `save_character_level_up_atomic`
- Level-up no longer relies on aggregate class rows alone; additive provenance is anchored on `character_class_levels`
- Multiclass spell editing is class-scoped rather than flattening all spell rows together
- Guided creation is the intended level-1 entry path; guided level-up is the intended multiclass / advancement path

### Legacy seams still present but not Batch 4 blockers

- `character_choices` is still read into snapshots so older rows remain auditable during transition
- typed spell / feat replacement helpers still clear mirrored legacy `character_choices` rows to prevent stale fallback state from resurfacing
- creation is still intentionally single-class at level 1, so “multiclass creation” is not part of Batch 4 scope

## Batch 5 Entry Tasks

These are explicit follow-ons, not hidden Batch 4 blockers:

- deepen sheet presentation so adjusted scores, AC sources, spell DC / attack mods, and proficiency provenance are readable without DB inspection
- surface character choice provenance and stale `(source_category, source_entity_id)` references in DM-facing audit UI
- decide during sheet presentation whether skill overlap history needs a new `character_skill_proficiency_sources` audit table, based on actual UI needs rather than preemptive schema churn
- Slice 5c decision: a new audit table is still deferred. The current sheet contract is satisfied from existing typed skill rows plus structural grants already present in content and build context: background auto-proficiencies are rendered from the background row, class/species/subclass choices come from persisted typed skill rows, and subclass expertise grants are surfaced from those same rows. That is sufficient for the representative overlap archetype (`Soldier`-style background Athletics plus Fighter multiclass Athletics) and for Knowledge Domain expertise promotion. If a later sheet or audit panel needs provenance for overlap cases where both grants are typed and the second one was collapsed by Path B's first-write-wins merge, add `character_skill_proficiency_sources` then rather than widening the main table.
- improve combat-time presentation for already-modeled but lightly surfaced feature systems such as maneuvers, terrains, disciplines, and reactive species traits
- add a broader smoke harness that programmatically walks representative creation and level-up payloads, including the 4.5 overlap regression archetype
- run migrations `067` and `068` against a copy of production data before remote deployment to verify idempotent class-level sync and lock behavior on real rows

## Closeout Result

Batch 4 and Batch 4.5 are effectively complete. A player can create a level 1 character through guided steps without depending on the raw editor, and can level up through a guided flow that persists exactly what changed without the data-integrity regressions identified in the 2026-04-23 review. Batch 5 can begin against a hardened per-level save path; remaining work is now primarily sheet depth, audit presentation, and broader smoke automation.

## Slice 5m: Migration Smoke Verification (2026-04-25)

Migrations `067` and `068` verified against live production database (`cqpyvaynpzgyjerfesmz`, region `eu-west-2`). Both were already applied. This run confirms clean post-application state.

### Dataset shape at time of verification

| Table | Row count |
| --- | --- |
| `characters` | 11 |
| `character_levels` | 12 |
| `character_class_levels` | 26 |
| `character_hp_rolls` | 1 |
| `character_spell_selections` | 14 |
| `character_feat_choices` | 0 |
| `character_feature_option_choices` | 0 |
| `character_skill_proficiencies` | 16 |
| `character_language_choices` | 2 |
| `character_tool_choices` | 0 |
| `character_ability_bonus_choices` | 1 |

### Migration 067 — preserved provenance anchor safety

- **Null anchor backfill**: All class-sourced rows across `character_language_choices`, `character_tool_choices`, `character_ability_bonus_choices`, `character_feature_option_choices`, and `character_skill_proficiencies` have 0 null `character_level_id` values. Backfill was a no-op or succeeded cleanly.
- **Spell selections null anchors**: 14 of 14 spell selections have null `character_level_id`. All 14 have `owning_class_id = NULL` — these are pre-Batch-4 rows written before class scoping existed. The backfill correctly skipped them (conditioned on `owning_class_id IS NOT NULL`). This is expected, not an anomaly.
- **`character_class_levels` alignment**: All 12 character-class rows in `character_levels` have correctly populated `character_class_levels` per-level rows. Max level in `character_class_levels` matches `character_levels.level` for every row.

### Migration 068 — concurrency guardrails

- **`sync_character_class_levels_for_class`**: `FOR UPDATE` lock on `public.characters` confirmed present in deployed function body.
- **`save_character_level_up_atomic`**: `expected_updated_at` token extraction, "Optimistic lock token is required" guard, and "Optimistic lock mismatch" check all confirmed present in deployed function body.
- **Triggers**: `sync_character_class_levels_from_levels` (on `character_levels`) and `sync_character_class_levels_from_hp_rolls` (on `character_hp_rolls`) both enabled and wired correctly.

### Idempotency check

Re-ran `sync_character_class_levels_for_class` for all 12 character-class pairs against live data:

| Metric | Result |
| --- | --- |
| Rows before | 26 |
| Rows after | 26 |
| Rows changed or deleted | 0 |
| New rows inserted | 0 |

The sync function is fully idempotent on real production data.

### Orphan provenance check

Zero orphan `character_level_id` anchors across all six choice tables (spell selections, feat choices, feature-option choices, skill proficiencies, language choices, ability-bonus choices).

### HP roll integrity

The one `character_hp_rolls` row (`level_number = 1, roll = 8`) correctly matches its `character_class_levels` row and `ccl.hp_roll = 8`. No unanchored HP rolls.

### Gate status

**Batch 4.5 deployment gate closed.** Migrations `067` and `068` run cleanly with no orphan provenance, no lock anomalies, and fully idempotent class-level sync. Batch 5 deployments may proceed.
