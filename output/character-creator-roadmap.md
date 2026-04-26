# Dungeon & Database Character Creator Roadmap

This document turns the repo analysis into an execution plan for making the app a usable D&D 2014 character creator.

## Current Status

This roadmap now has meaningful implementation behind it.

- Batch 1 is effectively complete.
- Batch 2 is effectively complete.
- Batch 3 is now effectively complete and closed out by Slice `3l` on 2026-04-18.
- Batch 4 is now effectively complete and closed out by Slice `4o` on 2026-04-23.
- Batch 4.5 is now effectively complete and closed out by Slice `4.5h` on 2026-04-24. The intended next step is Batch 5 sheet calculation and presentation.
- Batch 5 is now effectively complete and closed out by Slice `5n` on 2026-04-25. The live data-copy migration smoke (Slice `5m`) was completed before Batch 5 closed; the Batch 4.5 deployment gate is formally closed. The one architectural gap carried into Batch 6 is consolidating the spellcasting derivation from `build-context.ts` into `derived.ts`.
- Batch 5.5 is now effectively complete and closed out by Slice `5.5h` on 2026-04-25. Slice `5.5a` landed the shared UI hierarchy, surface, radius, and focus conventions. Slice `5.5b` shortened high-traffic player-facing copy and removed implementation language. Slice `5.5c` reduced wizard summary weight and made simple guided choices render as compact rows. Slice `5.5d` refined login and dashboard entry states. Slice `5.5e` made guided creation more momentum-oriented. Slice `5.5f` compacted the character sheet header and simplified section toggles. Slice `5.5g` made validation, DM audit, and stale-provenance states more repair-oriented and calmer by default. Slice `5.5h` closed the polish pass with visual/accessibility QA notes and a Batch 6 handoff.
- Batch Eberron is now effectively complete and closed out by Slice `E7` on 2026-04-26. Slice E1 locked the audit/guardrails, Slice E2 added the missing species and lineages, Slice E3 cleaned up dragonmarked lineage metadata, stale notes, and legacy dragonmarked rows/code by deleting any characters still tied to the old rows before purging them, Slice E4 added House Agent, Revenant Blade, double-bladed scimitar support, and elf-lineage feat prerequisite checks, Slice E5 modeled the full ERftLW Artificer infusion roster as repeating feature options with minimum-level prerequisites, count legality, and sheet/wizard surfaces, Slice E6 added an automated ERftLW regression matrix covering representative creation, legality, derived sheet, source allowlist, and DM-review paths, and Slice E7 recorded `output/batch-eberron-closeout-audit.md` with the Batch 6 handoff and the remaining ERftLW gaps outside the current app domain.
- A post-Batch-4 production hotfix shipped on 2026-04-23 to stop the character sheet from entering a React update loop when loading class-scoped spell options for newly created characters.
- A Batch 4 senior-review pass on 2026-04-23 found several level-up data-integrity bugs that the additive save path makes reachable in normal play (silent spell/feat swap loss, skill PK collision on multiclass overlap, feature-option value-change collision, preserved-spell level misattribution, and a concurrency window in the per-level sync trigger). Batch 4.5 is scheduled before Batch 5 to close these.
- Batch 4 delivered the end-to-end guided builder workflows that were blocking real character creation:
  - creation now saves through the typed atomic persistence path instead of the old generic write flow
  - the review step summarizes the actual persisted build state and legality output before save
  - starting equipment is resolved into character equipment rows during guided creation
  - feature-option and feature-spell choice surfaces now cover the Batch 4 support matrix rather than only the earliest special cases
  - level-up now runs as a resumable guided flow with step-local validation, class-scoped spell editing, additive save behavior, and grouped review output
  - Batch 4 closeout coverage and audit notes live in `output/batch-4-closeout-audit.md`
- The app now has a shared derivation pipeline flowing through:
  - raw persistence
  - normalized build context
  - canonical derived character state
- That shared path is now used by:
  - legality
  - character page loading
  - character sheet rendering
  - creation review
  - level-up review
- Spellcasting has been expanded beyond a single flattened summary:
  - aggregate summary still exists for compatibility
  - per-source spellcasting summaries now exist for multiclass and mixed-caster builds
  - legality and picker caps can validate per source

Recent content added as test/support data during Batch 2:

- `Oath of the Ancients` for Paladin (`PHB`)
- `Orc` from `Eberron: Rising from the Last War` (`ERftLW`)
- `Warforged` from `Eberron: Rising from the Last War` (`ERftLW`)
- `Changeling` from `Eberron: Rising from the Last War` (`ERftLW`)
- All ERftLW dragonmarked species rows with inherited language / tool / flexible ability choices
- `School of Necromancy` for Wizard (`PHB`) and `Maverick` for Artificer (`EE`) subclass seeds
- `Aberrant Dragonmark` feat (`ERftLW`) with structured spell-choice metadata

Batch 2 is now effectively complete:

- typed spell and feat persistence tables exist and are the only active source for current app flows
- save paths clear the old mirrored `character_choices` rows when typed spell/feat data is rewritten, preventing stale legacy data from resurfacing
- older incompatible test characters can be discarded instead of carrying extra compatibility logic
- chosen skill proficiencies now have provenance columns so class/background/species skill choices can be tagged on save
- typed language and tool choice tables flow through load/save, snapshots, and derived character state
- the creation wizard and editable sheet persist Changeling extra languages and Warforged extra language/tool picks with provenance
- typed species ability-bonus choice rows exist, and Changeling / Warforged flexible `+1` bonuses flow through derivation rather than being treated as missing schema
- Warforged receives the shared derived `Integrated Protection` `+1` AC bonus
- typed ASI rows exist, and unlocked ASI slots can persist explicit `+2` or split `+1/+1` allocations through creation, edit, and level-up flows
- typed feature-option choice infrastructure exists and is now consumed by Maverick support
- shared feature-grants support now covers generic feature spell choices, Maverick Arcane Breakthrough class picks, Maverick bonus cantrip and free prepared breakthrough spells, and feat spell choices through the shared feature-spell path
- dragonmarked species spell-list expansion is modeled through `species_bonus_spells`, so marked species expose `Spells of the Mark` inside the spell picker
- static dragonmark trait-granted spells are modeled in shared feature-grants derivation, including source fallback handling where local seeded spell sources differ
- species traits (e.g. `Vigilant Guardian`) are surfaced in derived state and on the character sheet

Important remaining limitations after Batch 2:

- some species rows are still intentionally flattened rather than fully inheriting parent-species structure
- richer combat-time automation for reactive traits such as `Vigilant Guardian` does not exist yet
- equipment remains outside Batch 2 normalization and is still future work
- the generic `character_feature_option_choices` table exists but Maverick is its only consumer, and no `feature_option_groups` / `feature_options` content tables exist yet
- languages and tools are still free-text strings across species, background, and character rows

Batch 3 closeout status:

- `feature_option_groups` / `feature_options` content tables exist and now drive more than Maverick
- languages and tools have first-class content catalogs with tolerant migration paths
- equipment catalogs, starting-equipment packages, character equipment rows, and admin CRUD landed
- PHB species/subrace support, PHB class option families, PHB subclass spell restrictions, and starting-equipment resolution all landed during the late Batch 3 slices
- local and remote Supabase migration history match through migration `060`

Known remaining PHB amendment notes after Batch 3 are now explicit rather than hidden:

- Drow sunlight-sensitivity penalties are still not automated
- Battle Master, Hunter, Circle of the Land, and Four Elements still have combat-time or resource-tracking automation gaps
- Arcane Trickster and Eldritch Knight still have subclass-feature automation gaps beyond spell legality

The intended next step is Batch 6 content ingestion and admin tooling. Batch 4 / 4.5 closeout notes live in `output/batch-4-closeout-audit.md`; Batch Eberron closeout notes live in `output/batch-eberron-closeout-audit.md`.

This plan is written for a single implementation agent working inside the repo, not for a human team. That changes the shape of the backlog:

- Work should be broken into self-contained slices that fit inside one Codex session.
- Each slice should leave the app in a coherent state.
- Schema, API, derivation, and UI changes should usually be shipped together by vertical feature area.
- The limiting factors are context window, verification effort, and migration safety, not developer hours.

## Guiding Principles

1. Persist rule choices explicitly.
   A character must be reconstructable from rows, not from broad JSON blobs and UI assumptions.

2. Derive mechanics in one place.
   The UI should render derived state, not invent it.

3. Expand data types before adding more content rows.
   The main blocker is missing categories of data, not just missing entries.

4. Prefer incremental vertical slices.
   Each milestone should include schema, routes, derivation, UI, and tests for one coherent rules area.

5. Optimize for resumable work.
   Every batch should be small enough that a later Codex run can re-read the relevant files and continue without large hidden context.

## Current Repo Summary

The repo already has:

- Campaign-scoped source allowlisting.
- 2014 vs 2024 ruleset tagging.
- Character draft / submit / approve workflow.
- First-class tables for species, backgrounds, classes, subclasses, spells, feats, and sources.
- A legality engine and progression helper layer.
- Guided creation and level-up UIs.

The main limitations are:

- Character persistence is still too generic for many 2014 rule choices.
- Derived mechanics are fragmented and partly simplified.
- Multiclassing and spellcasting are only partially modeled.
- Important content categories are missing as first-class tables.
- The creator cannot guide many required decisions because the schema does not represent them.

## Full Plan

## Batch 1: Rules Engine Foundation

### Objective

Create one canonical derived-character pipeline that every route and UI surface can trust, in two deliberate passes: a thin core derivation first, then a broader pre-schema expansion.

### Why First

Right now mechanical logic is split between progression helpers, legality helpers, and UI components. Important outputs such as AC, ability totals, saves, and spellcasting are partly simplified. If this foundation is not stabilized first, later schema and UI work will rest on inconsistent assumptions.

### Scope

- Define canonical raw and derived character shapes.
- Centralize mechanics derivation.
- Stop calculating important sheet values directly inside UI components.
- Land the foundation in two slices:
  - Milestone 1A: total level, proficiency bonus, adjusted ability scores, and HP summary over current persistence
  - Milestone 1B: saves, skills, spellcasting, subclass state, features, and broader review output

### Tasks

- Design a `CharacterAggregate` boundary representing the minimum raw persisted state needed by derivation, ideally via:
  - raw persistence -> normalized build context -> derived character
- In Milestone 1A, introduce the initial thin `DerivedCharacter` shape containing:
  - total level
  - proficiency bonus
  - base and adjusted ability scores from currently modeled bonuses
  - HP summary over current persistence
- In Milestone 1B, extend `DerivedCharacter` to include:
  - saving throws
  - skills
  - proficiencies
  - languages
  - senses
  - AC summary
  - spellcasting summary
  - feat / ASI slots
  - subclass state
  - unlocked features
  - warnings and blocking issues
- Refactor `src/lib/characters/build-context.ts` into a clearer pipeline that feeds the shared derivation layer.
- Refactor legality checks to consume the same derived model instead of separate partial assumptions.
- Move stat block calculations out of `src/components/character-sheet/StatBlockView.tsx` in stages, starting with the Milestone 1A core fields.
- Add stable loader or API helpers that can return both raw and derived state for a character where that convergence reduces duplication.
- Define explicit 2014 rules assumptions in code comments and tests during Milestone 1B, especially:
  - multiclass spell slot math
  - pact magic treatment
  - prepared vs known vs spellbook casters
  - subclass timing
  - ASI cadence
  - species and background bonuses

### Risks

- Half-refactoring will create duplicate derivation paths.
- Letting Batch 1 absorb schema normalization will slow it down and blur the 1A/1B boundary.
- If UI components keep their own calculations, later fixes will drift again.

### Exit Criteria

- One derivation pipeline exists.
- Milestone 1A lands a thin shared core without requiring schema change.
- Milestone 1B expands that same pipeline rather than replacing it.
- Character page, stat block, legality engine, and review summary consume the shared derived source appropriate to their milestone.
- No major mechanical value is calculated ad hoc in UI by the end of Batch 1.

## Batch 2: Character Schema Normalization

### Objective

Replace overly-generic character choice persistence with explicit, auditable tables for build decisions.

### Why

The current `character_choices` table is too generic for a full 2014 builder. It stores core decisions like spells and feats as broad blobs, which makes reconstruction, validation, and UI guidance harder than necessary.

### Scope

- Keep `characters`, `character_levels`, and `character_skill_proficiencies`.
- Introduce explicit tables for major recurring choice families.
- Reduce generic JSON persistence to true edge cases.

### Recommended New Tables

- `character_asi_choices`
  - records whether a level took ASI or feat
  - stores chosen ability increases when ASI is used
- `character_feat_choices`
  - stores feat selected, source level, and provenance
- `character_spell_selections`
  - stores spell, owning class, acquisition mode, granting feature, and whether it counts against limits
- `character_language_choices`
  - tracks chosen languages granted by species, background, class, or feature
- `character_tool_choices`
  - tracks chosen tool proficiencies
- `character_feature_option_choices`
  - reusable typed table for selectable feature families such as fighting styles, maneuvers, metamagic, invocations, infusions, and similar systems
- `character_equipment_items`
  - stores starting gear and equipped state for sheet calculation

### Existing Schema Adjustments

- Reconcile the `character_choices.character_level_id` mismatch between original schema and current typed usage.
- Add foreign keys from new choice tables to `character_levels` where appropriate.
- Add provenance fields so the app can explain where a choice came from.
- Add uniqueness constraints to prevent illegal duplicates.

### Migration Strategy

- Add new tables first.
- Backfill feat and spell rows from `character_choices`.
- Update save/load routes.
- Deprecate `character_choices` or shrink it to truly miscellaneous cases.

### Risks

- If the new schema is too generic, it recreates the old problem.
- If it is too specialized, every new rules subsystem needs a new table.
- The right balance is typed tables for common recurring systems plus one constrained feature-option system.

### Exit Criteria

- Every major player build choice has a first-class persistence path.
- A character can be reconstructed exactly from rows.
- The database can answer what a character chose and why.

## Batch 3: Missing Content Model Expansion

### Objective

Add the missing categories of content required to support a broad set of 2014 character builds, and migrate already-hardcoded option families onto that same content-driven model.

### Why

Batch 2 gave the app typed per-character persistence for the major recurring choice systems (spells, feats, ASI, languages, tools, species flex bonuses, feature options). What it did not do is describe those choice systems as data. Today the only recurring-choice helpers that drive picks are hand-coded, with Maverick as the sole consumer of the generic `character_feature_option_choices` table. The rest of the 2014 option surface (fighting styles, invocations, infusions, metamagic, maneuvers) is absent from both content and UI. At the same time, languages and tools are still free-text strings, and equipment does not exist as data at all.

### Current State Going In

- typed per-character `character_feature_option_choices` exists (Batch 2) but has only one consumer (Maverick subclass choices)
- no `feature_option_groups` / `feature_options` content tables yet
- languages and tools are still free-text strings on character rows and seed data — there are no `languages` or `tools` content tables
- `classes.multiclass_prereqs` already exists (`001_initial_schema.sql`) and is consumed by the legality engine; no extra multiclass-prereq schema work is required
- no equipment, weapon, armor, shield, or starting-equipment tables exist yet

### Scope Decisions

- Batch 3 is a content-model batch. It adds content tables and migrates per-character persistence to reference them. It should not rewrite the creation or level-up wizards (that is Batch 4 / Milestone 6) or the sheet (Batch 5 / Milestone 8).
- Equipment can balloon. Batch 3 equipment work stops at catalog tables plus shield / armor / weapon data needed for later AC derivation, plus a thin per-character equipment-state table. Packaged starting gear is scoped, but inventory simulation is not.
- The generic `character_feature_option_choices` table is the target for every recurring option family in this batch. New typed per-character tables should not be added unless a concrete requirement resists the generic one.

### Recommended New Content Types

**Required for Batch 3**

- `languages` — catalog of 2014 languages, replacing free-text strings across species, background, and character persistence
- `tools` — catalog of 2014 tools, same rationale
- `feature_option_groups` — descriptor rows for each recurring option family (fighting_style, eldritch_invocation, metamagic, infusion, maneuver, etc.)
- `feature_options` — option rows belonging to a group, with prerequisites and effect metadata sufficient to validate picks
- `weapons`, `armor`, `shields` — catalog data that AC and attack derivation will later consume
- `equipment_items` — generic gear catalog (packs, adventuring gear, etc.)
- `character_equipment_items` — per-character equipped/owned state
- `starting_equipment_packages` — class and background starting-gear references

**Deferred past Batch 3**

- `class_resource_progressions`, `conditions`, `damage_types`, `senses_catalog`, `spell_list_rules` — valuable later but not load-bearing for Batch 4 creation/level-up work.

### Modeling Strategy

Use `feature_option_groups` plus `feature_options` for reusable "choose N from this list" systems (fighting styles, metamagic, maneuvers, invocations, infusions). Per-character picks continue to land in `character_feature_option_choices`, which already exists and already has one working consumer. Prerequisite and effect columns on `feature_options` should be concrete enough to drive legality and sheet text for the first two consumers (Maverick and fighting styles) before being pushed further.

### Execution Slices

Each slice should fit in one Codex session and land schema + types + loader/save + at least one consuming UI or derivation surface + tests.

**Slice 3a — Feature option groups and options (content side)**

- add `feature_option_groups` and `feature_options` migrations, types, and loaders
- seed fighting-style options for 2014 classes that use them (Fighter, Paladin, Ranger) and seed the Maverick breakthrough class list as a group
- expose read endpoints for admin and builder surfaces
- migrate Maverick's hardcoded breakthrough class list off the helper constant and onto content rows, keeping the same `character_feature_option_choices` write path
- acceptance: Maverick picks continue to work end-to-end, driven by content rows instead of constants; fighting-style content is queryable

**Slice 3b — Fighting styles as the second consumer**

- surface fighting-style option groups in legality and in the relevant wizard step (creation flow for Fighter/Paladin, level-2 step for Ranger and Fighter level-up)
- persist through `character_feature_option_choices`
- render selected fighting style on the character sheet
- acceptance: a level-1 Fighter can choose a fighting style through the wizard, the pick persists and round-trips, and legality flags missing picks

**Slice 3c — Languages as content**

- add `languages` migration and seed from existing string constants
- add foreign-key columns where the app needs to reference languages (species fixed languages, background fixed languages, `character_language_choices.language` → `language_id`, species flex-language grants)
- leave display paths tolerant of unknown content for un-migrated rows during the transition
- acceptance: all currently seeded species/background languages map to rows; existing character language picks still load and render

**Slice 3d — Tools as content**

- add `tools` migration and seed
- parallel FK work for species/background/feature tool grants and `character_tool_choices.tool`
- acceptance: existing tool picks continue to load, round-trip, and render

**Slice 3e — Equipment catalog phase 1**

- add `equipment_items`, `weapons`, `armor`, `shields`
- seed 2014 PHB core weapons, armor, and shields
- extend admin UI enough to inspect the new catalogs
- no character-facing UI in this slice
- acceptance: catalogs exist, seed data is queryable, admin can view

**Slice 3f — Starting equipment and per-character equipment state**

- add `starting_equipment_packages` and `character_equipment_items`
- reference packages from class and background seed data
- stop here for Batch 3; consumption by AC derivation and wizard is Batch 4 / Batch 5 work
- acceptance: packages resolve to catalog rows; per-character equipment rows persist and reload

**Slice 3g — Equipment catalog admin CRUD**

- extend Content Admin from read-only inspection to full create / edit / delete flows for `equipment_items`, `weapons`, `armor`, `shields`, and `starting_equipment_packages`
- support subtype-aware validation so weapon / armor / shield detail rows stay aligned with their base `equipment_items` entries
- expose package-item editing against catalog item references rather than free-text names
- keep this slice admin-only; no builder or sheet consumption changes
- acceptance: a DM/admin can add a new equipment item and, where relevant, its weapon / armor / shield detail row through the admin UI, then attach it to a starting-equipment package without SQL

**Slice 3h — Remaining PHB species behavior**

- finish the PHB species systems that are now modeled in data but still only partially automated
- add end-to-end behavior for Dragonborn breath weapon and tighten any remaining High Elf / Drow / Tiefling species-spell handling where the current implementation still stops at availability rather than full rules behavior
- keep the persistence path on the existing typed choice tables instead of introducing one-off species tables
- acceptance: PHB species with active combat or spell-use choices no longer rely on placeholder amendment notes for their core builder-facing behavior

**Slice 3i — PHB class option systems**

- move the next choice-heavy PHB class and subclass systems onto `feature_option_groups` / `feature_options`
- prioritize `Battle Master` maneuvers, `Hunter` choice trees, `Circle of the Land` terrain choice, and `Way of the Four Elements` disciplines
- add enough prerequisite and effect metadata for legality and sheet rendering, not just picker labels
- acceptance: those PHB option families can be selected, persisted, reviewed, and validated through the shared feature-option infrastructure

**Slice 3j — PHB subclass spellcasting restrictions**

- model the rule constraints that make PHB half-casters and third-casters more than generic spell pickers
- start with `Eldritch Knight` and `Arcane Trickster` spell-school restrictions and off-school exception levels
- keep the spell route and legality engine aligned so builders only see legal options and saved rows remain re-checkable
- acceptance: those subclasses no longer rely on broad class spell access that overstates what they may legally choose

**Slice 3k — Starting equipment choice resolution UX**

- bridge the gap between seeded starting-equipment packages and actual builder consumption
- add support for package alternatives, bundle choices, and instantiating selected package contents into `character_equipment_items`
- stop short of full inventory simulation; this is about legal starting gear selection and durable persistence
- acceptance: class and background starting equipment can be chosen through guided flows without SQL or manual sheet edits

**Slice 3l — PHB completeness audit and migration verification**

- do a structured pass over the seeded PHB 2014 content after the earlier slices land
- verify migration coverage against the intended PHB scope, check for missing rows or unresolved amendment notes, and reconcile any content that exists locally but has not yet been pushed/applied
- treat this as the Batch 3 closeout gate before Batch 4 begins
- acceptance: Batch 3 ends with a concrete PHB completeness checklist and no major unresolved “content exists but behavior is missing” gaps that would surprise Batch 4

**Slice 3m — Pre-Batch-4 structural blockers**

A focused review between Batch 3 closeout and Batch 4 surfaced three issues that would either actively fight Batch 4's builder-workflow work or silently invalidate its promises. Each item was verified in the current repo (`main` at Batch 3 close). This slice is deliberately narrow: no content, no derivation rewrite, no wizard edits. It fixes the structural ground under Batch 4.

Scope items:

1. **Atomicity on the character PUT route.**
   - `src/app/api/characters/[id]/route.ts` (PUT, ~lines 237–406) runs sequential `delete` + `insert` pairs against `character_levels`, `character_stat_rolls`, and nine typed choice tables, with no transactional wrapper.
   - A mid-request failure (RLS error, network drop, constraint violation) leaves the character half-wiped: levels deleted but spells not re-inserted, equipment cleared but ability rows not rewritten, etc. The next load then fails inside derivation rather than cleanly surfacing the error.
   - Batch 4's level-up rewrite will call this path repeatedly and add more tables to it, so fixing the pattern now is cheaper than retrofitting later.
   - Fix: replace the cascade with a Postgres function / RPC that performs all replacements inside a single transaction, or move each table to an upsert + targeted delete pattern scoped by character + owning-level so a failure cannot strand the row in a partial state.

2. **`character_levels` conflates class-totals with per-level history.**
   - The schema stores one row per class with the current class level (`LevelUpWizard.tsx:488` increments `level` in place; `[id]/route.ts:254–264` replaces the whole set on save).
   - `hp_roll` is therefore overwritten at every level-up, which `src/lib/characters/derived.ts:150` explicitly acknowledges (`The current schema stores at most one per-class HP roll`). HP history is unrecoverable after the first level-up in a class.
   - `character_level_id` foreign keys on `character_asi_choices`, `character_feat_choices`, `character_spell_selections`, and provenance columns elsewhere therefore carry no "which level was this chosen at" information — only "which class". That undermines Batch 4's promise that level-up persists exactly what the new level added.
   - Fix: introduce a per-level table (e.g. `character_class_levels` with `(character_id, class_id, level_number)` unique, carrying `hp_roll` and `taken_at`), backfill from existing rows, and migrate the provenance FKs before Batch 4's level-up rewrite begins. If full migration is too large for this slice, at minimum add a `character_hp_rolls(character_id, class_id, level_number, roll)` table so HP history stops being destroyed on level-up, and sequence the full `character_class_levels` cutover as the first task inside Milestone 9 (Level-Up Rewrite).

3. **RLS on `characters` blocks owners from their own non-PC rows.**
   - `supabase/migrations/016_scoped_dm_rls.sql:60–84` restricts the owner-side SELECT/INSERT/UPDATE/DELETE clauses to `user_id = auth.uid() AND character_type = 'pc'`.
   - Test characters and NPC rows a player legitimately owns are invisible to them through the standard policies; only DMs can interact with those rows. Batch 4 scenarios that touch non-PC character types (fixture-based builder tests, player-authored companions, DM hand-off drafts) will silently 404.
   - Fix: drop the `character_type = 'pc'` predicate from the owner-side clauses. Keep the role-based gating on who can set `character_type` at creation (already enforced in route code via `hasDmAccess`). Audit the nine child-table policies (all key off the parent), and add a regression test that a logged-in owner can read a non-PC character they created.

Acceptance:

- PUT character saves are atomic end-to-end, verified by a test that injects a mid-save failure and asserts no partial state remains.
- HP roll history is preserved across level-ups for at least one representative multiclass build, via either a per-level `character_class_levels` table or a dedicated HP-rolls table; if a full cutover is deferred, the follow-up is captured as an explicit first task of Milestone 9.
- Owners can read, update, and delete their own NPC / test characters through standard RLS.
- A short follow-up note is added to the roadmap if any items had to be deferred into Batch 4 itself, so Batch 4 inherits them explicitly rather than implicitly.

Follow-up note:

- Slice `3m` may land the dedicated `character_hp_rolls` table as the minimum safe fix for preserved HP history.
- If that narrower fix lands first, the full `character_class_levels` cutover remains the explicit first task inside Milestone 9 (Level-Up Rewrite), rather than an implicit debt.

**Slice 3n — Pre-Batch-4 hygiene (validation and loader errors)**

Two items from the same review that do not block Batch 4 outright but will compound with every new flow Batch 4 adds. Cheap to fix now, painful to retrofit.

1. **Content admin PUT routes are pass-through over `body`.**
   - Seven admin PUT routes (`classes`, `subclasses`, `backgrounds`, `feats`, `species`, `spells`, `equipment-items`) build their update object as `Object.fromEntries(Object.entries(body).filter(([k]) => k !== 'id'))` and send it directly to Supabase `.update()`. No zod schema, no column allowlist, no coercion beyond a couple of numeric fields.
   - `requireAdmin` gates access, so this is not a public-facing vulnerability, but it lets UI typos or a stale form silently change FK-sensitive columns (`source`, `amended`, arrays, jsonb config fields) without validation. A bad admin save can silently break content referenced by existing characters, which Batch 4 will then inherit.
   - Fix: per-entity zod schemas with an explicit column allowlist; reject unknown keys with a 400; reuse the schemas for POST where the entity overlaps.

2. **`load-character.ts` swallows per-query errors in its `Promise.all`.**
   - Lines 57–75 run thirteen parallel queries and then destructure only `.data`, defaulting to `null` / `[]`. A transient RLS denial, network failure, or schema drift on any one query produces a silent partial load; derivation then throws deep inside with an opaque "cannot read X of null".
   - Batch 4 will add more parallel loaders off this seam; formalizing the failure mode now avoids multiplying opaque errors later.
   - Fix: inspect `.error` on each result, aggregate into a typed `CharacterLoadError`, and either fail the load or attach warnings that the legality engine and UI can render instead of letting derivation crash.

Acceptance:

- Every content admin PUT rejects unknown keys with a 400 and validates known keys through a per-entity zod schema shared with POST where applicable.
- `loadCharacterState` returns a typed result that distinguishes success, soft warnings (missing optional relations), and hard failures; no consumer sees a silent `null` where an error occurred.

### Risks

- Designing `feature_option_groups` / `feature_options` too generically will push validation burden back into per-option code. Prerequisite and effect fields should be concrete enough to drive legality and sheet text for Maverick and fighting styles before being pushed further.
- Equipment modeling can balloon. Batch 3 stops at catalog and packaging; Batch 5 is where AC and sheet presentation use this data.
- Migrating languages/tools to FKs is only safe if display paths tolerate unknown entries during the transition. Every string-consuming component needs a short audit first.

### Exit Criteria

- The database can represent languages, tools, equipment categories, and recurring option families as first-class content.
- At least two recurring option systems (Maverick breakthroughs, fighting styles) are driven by the content tables rather than hardcoded helpers.
- Existing characters with free-text language/tool picks still load and round-trip through the new schema.
- Creation wizard work (Batch 4) can consume the content model without needing to invent new persistence.

## Batch 4: Builder Workflow Completion

### Objective

Turn the creation and level-up flows into complete rules workflows rather than broad-form editors.

### Why

The current wizards are a good skeleton, but they still behave like convenience forms over a thin model. Important assumptions are simplified, especially for multiclassing and spell selection.

### Scope

- New character creation
- Level-up workflow
- Class-specific and feature-specific choice handling
- Spell selection and preparation
- ASI vs feat handling
- Equipment selection

### Creation Flow Target

1. Campaign and identity
2. Species
3. Background
4. Class selection
5. Ability score generation
6. Starting proficiencies and option choices
7. Starting spell choices or preparation
8. Starting equipment
9. Derived summary and legality review
10. Save draft

### Level-Up Flow Target

1. Choose class to advance or multiclass
2. Validate multiclass prerequisites
3. Resolve subclass unlock if needed
4. Resolve feature options unlocked by the new level
5. Resolve ASI vs feat if applicable
6. Resolve spell gains or preparation changes
7. Resolve HP gain
8. Review derived change summary and save

### Tasks

- Rework local wizard context to use real campaign allowlist and ruleset data.
- Remove first-class-only spell assumptions.
- Make level-up additive and level-specific instead of coarse replacement updates.
- Persist each step into explicit tables from Batch 2.
- Build reusable UI for:
  - choose one
  - choose N
  - prerequisite-aware options
  - replaceable options on later level-up
- Add change summaries before saving.
- Preserve draft safety for partially completed states.

### Execution Slices

Each slice should fit in one Codex session and land schema (where needed) + types + loader/save + at least one consuming UI or derivation surface + tests. Creation slices (4a–4h) come first so a level-1 character can be built through guided steps without the raw editor. Level-up slices (4i–4n) come after and start with the `character_class_levels` cutover carried in as the explicit first level-up task from Slice 3m. Slice 4o is the Batch 4 closeout gate before Batch 5 begins.

**Slice 4a — Real wizard context: campaign allowlist and ruleset wiring**

- replace the placeholder local wizard context with the character's actual campaign allowlist and ruleset, so creation and level-up flows filter content identically
- audit every wizard-side content fetch/picker for the old stub and move it to the shared context
- no new guided steps in this slice; pickers should simply reflect campaign settings
- acceptance: creation and level-up pickers in a campaign with a restricted allowlist show only allowed content end-to-end, and the placeholder context is gone

**Slice 4b — Reusable guided-choice primitives and change-summary scaffold**

- extract shared "choose one", "choose N", prerequisite-aware, and replaceable-option components that every later Batch 4 step can consume
- extract a shared per-step review / change-summary scaffold and a draft-safety wrapper that commits only completed steps
- convert one low-risk existing creation step (e.g. background skill choice) onto the new primitives to prove the pattern
- acceptance: primitives and scaffold exist with tests, and at least one migrated step renders and persists through them

**Slice 4c — Creation: identity, species, and background steps on the new primitives**

- migrate the campaign/identity, species, and background steps of the creation wizard onto the Slice 4b primitives
- drive species flex ability bonuses, flex languages/tools, and species-trait feat grants through the unified path, writing into the Batch 2 typed rows
- drive background skill, tool, language, and feat choices through the same primitives with provenance tagging
- acceptance: a level-1 character can complete the first three guided steps end-to-end, with every choice landing in typed rows instead of the generic blob

**Slice 4d — Creation: class selection and ability score generation**

- migrate class selection and ability score generation onto shared primitives
- support standard array, point-buy, and rolled variants inside the ability generation step with durable persistence
- keep creation single-class (multiclassing is a level-up concern in Slice 4k); surface this constraint explicitly in UI copy
- acceptance: a level-1 character reaches the end of ability generation with persisted class + ability score rows, and the step re-loads cleanly from a draft

**Slice 4e — Creation: class proficiencies and level-1 feature option choices**

- drive level-1 class feature option picks (Fighter fighting style, Cleric domain, Sorcerer origin, Warlock patron, Wizard tradition, Druid circle where level-1, etc.) through `feature_option_groups` / `feature_options`
- handle class skill / tool / weapon / language choices through the same primitives with provenance
- persist through `character_feature_option_choices` and provenance-tagged skill/tool/language rows; no new typed per-feature tables
- acceptance: every level-1 class-side option pick across PHB classes is selectable through guided steps, persists, round-trips, and is re-checked by legality

**Slice 4f — Creation: spell selection without first-class-only assumptions**

- remove the first-class-only assumption from the creation spell picker and treat each class as its own caster source
- drive cantrip count, known/prepared counts, spellbook starting list, and caster-mode distinctions (known vs prepared vs spellbook vs pact) from class data for the player's level-1 class
- persist through `character_spell_selections` with acquisition mode and source class, consuming Batch 3 subclass spell-school restrictions where applicable
- acceptance: level-1 wizards, clerics, druids, sorcerers, warlocks, bards, and paladins/rangers (where relevant) each emerge from creation with correct caster-mode persistence, and legality no longer flags false errors against single-class casters

**Slice 4g — Creation: starting equipment selection**

- wire the creation wizard into Slice 3k's starting-equipment resolution UX, so class and background packages drive a guided equipment step
- support package alternatives and bundle sub-choices inside the wizard instead of forcing a raw editor pass
- persist into `character_equipment_items` with provenance so the sheet can explain where each item came from
- acceptance: a level-1 character leaves creation with `character_equipment_items` rows that match the chosen packages, including at least one class with alternatives and one background with bundle choices

**Slice 4h — Creation: derived review, legality summary, and draft safety**

- replace the current ad-hoc final step with a review that reads the canonical `DerivedCharacter` and presents grouped legality issues linked back to the originating step
- formalize partial-completion UX: each step commits its own persistence, a later exit does not corrupt the draft, and re-entering the wizard resumes at the first unresolved step
- no new choice systems in this slice; it is the closeout that ties creation 4a–4g together
- acceptance: a player can create a level-1 character across several sessions, saving and resuming at each step, and submit it without touching the raw sheet editor; all final values on the sheet come from shared derivation

**Slice 4i — Per-level history cutover (`character_class_levels`)**

- first level-up-side task, carried in from the Slice 3m follow-up note
- introduce `character_class_levels` keyed on `(character_id, class_id, level_number)` with `hp_roll`, `taken_at`, and any other per-level attributes the level-up rewrite needs
- backfill from the existing `character_levels` rows, retire the temporary `character_hp_rolls` table if Slice 3m landed it, and repoint every provenance FK (`character_asi_choices`, `character_feat_choices`, `character_spell_selections`, equipment-acquired-at, etc.) to the per-level row
- update load-character, snapshots, and the legacy save path to read from the new table without rewriting the save-path cascade yet
- acceptance: existing characters' per-level history is preserved and visible in derivation, HP rolls from earlier levels survive subsequent level-ups, and provenance FKs reference the exact level at which each choice was made

**Slice 4j — Level-up: additive save path**

- replace the delete-and-replace level-up cascade in the character PUT path with an additive writer that inserts only the new level's rows and leaves prior levels untouched
- scope HP gain persistence to the new per-level row from Slice 4i so HP roll history is permanent (resolves Slice 3m item #2 at the save layer)
- preserve the atomic-transaction guarantee from Slice 3m item #1 across the new narrower save path
- acceptance: leveling a representative character writes only new rows, earlier-level rows are unchanged by the save, and an injected mid-save failure leaves no partial state


**Slice 4k — Level-up: multiclass selection and subclass unlock**

- add dedicated multiclass selection step that checks `classes.multiclass_prereqs` against the character's adjusted ability scores before accepting the class
- add dedicated subclass-unlock step firing at each class's correct level, persisting through the existing subclass columns
- wire Batch 3 subclass spell-school restrictions (Eldritch Knight, Arcane Trickster) into legality on unlock so restricted spell selection kicks in immediately
- acceptance: a player cannot level into a second class whose prereqs they fail, subclass unlock fires at the right per-class level, and restricted-caster subclasses narrow the spell picker at level-up time

**Slice 4l — Level-up: feature-option unlocks including replaceable options**

- render feature-option unlocks (new maneuver, new invocation, new metamagic, new fighting style slot, etc.) through the Slice 4b primitives at the exact level they unlock
- support the "replace an existing option" pattern (invocation swap, fighting-style retrain) by preserving historical provenance rows while recording the replacement
- reuse `character_feature_option_choices` with level-tagged rows from Slice 4i; no new typed tables unless a concrete case resists the generic one
- acceptance: representative characters (Battle Master, Warlock with invocations, Sorcerer with metamagic, Fighter with retrainable fighting style) can level up through guided unlocks and the app records both the new pick and the swapped-out option

**Slice 4m — Level-up: ASI vs feat, spell gains, and HP**

- combine the remaining per-level resolution into one guided sub-flow:
  - ASI-vs-feat decision at unlocked levels, persisted to `character_asi_choices` / `character_feat_choices` tagged to the per-level row
  - spell gains by caster source: new known / prepared / spellbook additions with swap rules, persisted to `character_spell_selections`
  - HP gain (average or rolled) persisted to the per-level row from Slice 4i
- keep out-of-level-up preparation edits out of this slice; they land in Batch 5 sheet work
- acceptance: a multiclass caster leveling into a spellcasting class produces correct new spell rows, an ASI level produces either a `+2`/`+1+1` ASI row or a feat row, and HP history accumulates rather than overwrites

**Slice 4n — Level-up: change summary, draft safety, and save**

- final step consumes the canonical `DerivedCharacter` to show a before/after diff of exactly what the new level added, grouped by resolution area
- apply the same draft-safety wrapper from Slice 4b so a partial level-up cannot corrupt the character and can be resumed later
- surface legality warnings linked back to the originating sub-step
- acceptance: a representative multiclass build levels up end-to-end through the guided flow without raw-editor usage, the review clearly shows deltas, and an abandoned mid-flow level-up leaves the character at its prior stable state

**Slice 4o — Batch 4 closeout: end-to-end smoke and gap audit**

- run creation + level-up smokes across representative archetypes: single-class caster, multiclass caster/martial, feat-heavy (Variant Human or equivalent 2014 path if in scope), and species/background-heavy
- audit what slipped past earlier slices: leftover first-class-only assumptions, placeholder wizard contexts, direct-to-`character_choices` writes, delete-and-replace save paths
- capture any deferred work as explicit Batch 5 prep notes inside this roadmap rather than as implicit debt
- closeout artifact: `output/batch-4-closeout-audit.md` records the archetype matrix, verification run, and explicit Batch 5 entry tasks
- acceptance: Batch 4 ends with a concrete archetype matrix that passes creation + level-up through guided steps only, and any remaining gaps are documented as Batch 5 entry tasks

### Risks

- This batch becomes messy if attempted before explicit choice tables exist.
- A flexible “full sheet editor” should not become the primary path before guided rules flows are correct.

### Exit Criteria

- A player can create a level 1 character through guided steps without relying on the raw sheet editor.
- A player can level up through a guided flow and the app persists exactly what changed.
- Multiclassing and spellcasting no longer rely on first-class-only assumptions.

## Batch 4.5: Level-Up Data-Integrity Hardening

### Objective

Close the correctness and concurrency bugs introduced by the additive level-up save path before Batch 5 builds sheet presentation on top of it. This is a narrow corrective batch, not a new feature batch.

### Why

The 2026-04-23 senior-review pass on Batch 4 identified a cluster of data-integrity bugs concentrated in `save_character_level_up_atomic` (migration 064), the client filter logic in `LevelUpWizard.tsx`, and the per-level sync triggers in migration 063. Each bug is reachable in documented Batch 4 archetypes:

- spell swaps on caster level-up silently leave the old spell attached (client filter discards removals; RPC is INSERT-only)
- multiclass skill grants fail outright when any granted skill overlaps a skill already held, because `character_skill_proficiencies` primary key is `(character_id, skill)` and the RPC has no `ON CONFLICT` handling
- editing a persisted feature-option value during level-up aborts the save via unique-key collision on `(character_id, option_group_key, option_key, choice_order, source_feature_key)`
- feat swaps leave the outgoing feat attached for the same reason as spell swaps
- preserved spell rows risk being re-anchored to the wrong per-level row when `character_level_id` is defaulted to `v_level_row_id`
- `sync_character_class_levels_for_class` deletes-then-inserts, which combined with the `ON DELETE SET NULL` cascade on provenance FKs can silently strip `character_level_id` from choice rows under admin edits or concurrent saves

Batch 5 will key sheet presentation (AC provenance, spell preparation state, feat/ASI history, DM audit panel) off per-level rows that must be trustworthy. Shipping Batch 5 on top of the current level-up path would surface these bugs as apparent sheet bugs and make them much harder to isolate.

### Scope

In:

- RPC behavior for level-up writes: spell/feat/feature-option upsert semantics, skill overlap handling, `character_level_id` anchoring rules
- Per-level sync trigger idempotency and FK-null-ification avoidance
- Concurrency guardrails on the level-up transaction and on the trigger-driven sync
- Structured error mapping from RPC validation exceptions to 4xx responses with stable error codes
- Client-side contract alignment with the RPC: route creation through `buildCharacterAtomicSavePayload`, clear species-scoped choice state on species change, gate the step selector against incomplete steps, add double-submit protection
- Server-side rolled-stat generation to remove the client `Math.random` path
- Hydration gating so DM-only fields are not pushed into non-DM component state
- Regression test matrix that exercises every critical-severity scenario from the review

Out (deferred to later batches as appropriate):

- Adding new content (no species, class, subclass, feat, or equipment rows)
- Sheet presentation changes (these belong to Batch 5)
- Rewriting feature-grants off spell-name lookups (Batch 6 carry-in)
- Consolidating character-ownership checks behind a single helper (Batch 7 carry-in)
- Splitting load-bearing modules past safe edit size (Batch 7 carry-in)

### Execution Slices

Each slice should fit in one Codex session and leave the repo in a coherent state. Slices 4.5a–4.5d change RPC/trigger behavior and are the main data-integrity correction. Slices 4.5e–4.5f are client-side hardening. Slice 4.5g is the regression test matrix. Slice 4.5h is the Batch 4.5 closeout gate before Batch 5 begins.

**Slice 4.5a — RPC swap/replace semantics for spells, feats, and feature options** (delivered)

- rewrite the `spell_choices`, `feat_choices`, and `feature_option_choices` branches of `save_character_level_up_atomic` to match the unique constraints on their target tables
- for `spell_choices`: when the payload is present, delete existing non-feature, non-feat-granted rows for `owning_class_id = v_class_id` scoped to the level-up's class, then insert the full after-state; feature-spell and feat-spell rows must be left untouched
- for `feat_choices`: replace the outgoing feat row for the same `(character_id, feat_id, choice_kind)` scope instead of appending; support the "retrained feat" shape rather than silently orphaning the old row
- for `feature_option_choices`: `INSERT ... ON CONFLICT (character_id, option_group_key, option_key, choice_order, source_feature_key) DO UPDATE SET selected_value = EXCLUDED.selected_value, character_level_id = EXCLUDED.character_level_id` so value changes succeed without UNIQUE violations
- update `LevelUpWizard.tsx` to send the full after-state for these three families (no more client-side "new keys only" filter), and update `atomic-save.ts` helpers to carry the correct `owning_class_id` / `character_level_id` through
- acceptance: spell swap, feat retrain, and feature-option value change all round-trip through level-up for a representative caster and a representative Battle Master without leaving orphan rows or failing on unique collisions

**Slice 4.5b — Skill overlap handling and multi-source provenance** (delivered 2026-04-24)

- recorded decision: **Path B**. Keep the narrow `(character_id, skill)` PK and make the level-up RPC upsert with `ON CONFLICT (character_id, skill) DO UPDATE SET expertise = character_skill_proficiencies.expertise OR EXCLUDED.expertise`. Existing provenance (`source_category`, `source_entity_id`, `source_feature_key`, `character_level_id`) is **preserved** on conflict — i.e. first-write-wins for provenance — which matches the sheet's one-row-per-skill read at `src/lib/characters/load-character.ts:104` and avoids a cascade through legality aggregation, `initialTypedSkillProficiencies`, and the sheet's skill display. Path A was rejected because widening the PK would require touching every skill read site and add a new "aggregate-back-to-one-row" layer purely to preserve current UX.
- migration `supabase/migrations/066_level_up_atomic_save_skill_overlap.sql` replaces `save_character_level_up_atomic` with the ON CONFLICT handling above; spells/feats/feature-options semantics from 4.5a carry forward unchanged
- `LevelUpWizard.tsx` now holds a single `initialSkillProficiencyKeys` Set (replacing the duplicate `knownSkills` Set and the repeated `initialSkillProficiencies.includes(...)` scans) and uses it to dedupe the `newLevelSkillChoices` payload, the multiclass-skill options filter, and the skill picker's `onChange` bucketing
- regression: `test/level-up-atomic-skill-overlap-migration.test.ts` pins the ON CONFLICT clause and the preservation-on-conflict policy so a future edit cannot silently revert to overwrite-on-conflict
- acceptance carried: a Fighter-1 multiclass save against a character whose background already grants one of the Fighter multiclass skills no longer fails at the RPC; the pre-existing skill's provenance is retained; an expertise-granting later source (e.g. Knowledge Domain) can still promote an existing skill to expertise
- residual for 4.5h: capture the Path B decision and rationale inside `output/batch-4-closeout-audit.md` alongside the rest of the 4.5 addendum; no parallel provenance audit table was introduced in this slice because nothing downstream reads multi-source skill provenance today — if Batch 5's sheet presentation needs it, add a dedicated `character_skill_proficiency_sources` table then rather than up-front here

**Slice 4.5c — Preserved provenance and per-level anchor safety** (delivered 2026-04-24)

- migration `supabase/migrations/067_level_up_preserved_provenance_anchor_safety.sql` replaces `sync_character_class_levels_for_class` with an idempotent insert/upsert path: valid existing `character_class_levels` rows keep their stable `id`, missing rows are inserted, and only rows above an explicit lowered/deleted aggregate class level are removed
- `save_character_level_up_atomic` now carries forward 4.5a/4.5b behavior while preserving existing feature-option and feat `character_level_id` anchors when the full after-state payload reasserts already-held choices; spell fallback remains scoped so cross-class preserved rows are not defaulted onto the new level
- conservative backfills restore null anchors where the class source can be inferred: class-owned spells by `owning_class_id`, and class-sourced language, tool, ability-bonus, feature-option, and skill rows by `source_category = 'class'` plus `source_entity_id`
- regression: `test/level-up-preserved-provenance-anchor-safety-migration.test.ts` pins the idempotent sync, class-recoverable backfills, feat/feature-option anchor preservation, and cross-class spell fallback behavior
- residual for 4.5h: test this migration against a copy of production data before applying remotely, because trigger rewrites are the highest-risk part of Batch 4.5 and regex tests cannot prove data-shape safety

**Slice 4.5d — Concurrency guardrails and structured error mapping** (delivered 2026-04-24)

- migration `supabase/migrations/068_level_up_concurrency_guardrails.sql` carries forward 4.5c and adds `FOR UPDATE` on `public.characters` inside `sync_character_class_levels_for_class`, so trigger-driven syncs serialize against the same owning character row that level-up saves lock
- `save_character_level_up_atomic` now requires `expected_updated_at` in the JSON payload and rejects stale tokens with an `Optimistic lock mismatch` exception before mutating character or level rows
- `src/app/api/characters/[id]/route.ts` requires `expected_updated_at` on every character `PUT`, performs an early stale-token check for all save modes, forwards the token into the RPC payload, and maps known save failures to stable structured 4xx responses (`optimistic_lock_required`, `stale_character`, `stale_level_up`, `invalid_level_up_increment`, `duplicate_level_up_choice`)
- character sheet saves, guided level-up saves, and resumed creation-draft saves now send and refresh the current `updated_at` token so normal repeated saves do not trip the guardrail
- regressions: `test/level-up-concurrency-guardrails-migration.test.ts` pins the trigger lock and RPC token checks; `test/character-route-concurrency-errors.test.ts` pins route error mapping and client token forwarding
- acceptance carried: two concurrent level-up attempts on the same loaded character now serialize through the character row lock; the second stale writer receives a structured 409 instead of a generic 500

**Slice 4.5e — Client contract alignment and submit safety** (delivered 2026-04-24)

- creation and level-up `PUT` requests continue through `src/app/api/characters/[id]/route.ts`, which normalizes via `buildCharacterAtomicSavePayload` / `buildCharacterLevelUpSavePayload`; `test/client-submit-safety.test.ts` now pins that server-side contract
- `CharacterNewForm.tsx` now centralizes dependent-state clearing in `handleSpeciesChange`, `handleBackgroundChange`, `setPrimaryClass`, and subclass updates: stale species ability/language/tool/skill choices, background choices, class choices, subclass choices, feature spells, feat spells, and relevant feature-option rows are cleared when their owner changes
- the creation step selector is now a gated button strip; steps beyond `completedSteps.length + 1` are disabled and `goToStep` refuses jump-ahead attempts with a specific toast
- creation draft saves and the level-up final save now use `AbortController` plus early `working` guards, so rapid repeated clicks cannot launch overlapping writes from the same client
- the previous ability-generation constant cleanup remains satisfied: `CharacterNewForm.tsx` imports `STANDARD_ARRAY`, `ABILITY_KEYS`, and point-buy helpers from `src/lib/characters/ability-generation.ts`
- regressions: `test/client-submit-safety.test.ts` pins the shared server normalizer contract, stale-state clearing handlers, gated step selector, and abortable/working-gated save submits

**Slice 4.5f — Server-side rolled stats and DM-only hydration** (delivered 2026-04-24)

- added `POST /api/characters/[id]/stat-rolls`, which checks character ownership / DM manage access and generates six 4d6 sets with Node `crypto.randomInt`
- `CharacterNewForm.tsx` no longer imports or calls the local `createRolledStatSets` / `Math.random` path; the roll button creates/uses the draft character, requests server rolls, renders the returned sets immediately, and persists the final assignment through the existing atomic save path
- `GET /api/characters/[id]` now strips `character_type` and `dm_notes` from non-DM responses before draft hydration, and `CharacterNewForm` keeps `characterType` unset for non-DM users
- regressions: `test/server-side-rolled-stats.test.ts` pins server-side crypto roll generation, client fetch-based roll generation, and non-DM DM-field stripping

**Slice 4.5g — Regression test matrix** (delivered 2026-04-24)

- added `test/batch-45-regression-matrix.test.ts`, which ties every critical 2026-04-23 data-integrity finding to concrete SQL, route, or client regression coverage rather than leaving the coverage spread implicit across slice tests
- extended `output/batch-4-closeout-audit.md` with a `4.5 overlap regression` archetype covering overlapping multiclass skills, class spell swaps, feat retrains, feature-option edits, preserved anchors, stale-write handling, and client submit safety
- extended `test/batch-4-closeout.test.ts` so the closeout matrix fails if the overlap archetype or its key safeguards disappear
- documented the Batch 4.5 verification file list in the audit: swap/replace SQL, skill-overlap SQL, anchor-safety SQL, concurrency guardrails, structured route errors, client submit safety, server-side rolls / DM-field stripping, and the matrix binder test itself
- acceptance carried locally: this repo does not currently include a live Supabase transaction harness; the regression matrix pins the generated SQL/RPC definitions and App Router/client contracts that would feed such a harness, while 4.5h remains responsible for smoke-running the full archetype flow against a real environment before Batch 5 opens

**Slice 4.5h — Batch 4.5 closeout and Batch 5 entry update** (delivered 2026-04-24)

- `output/batch-4-closeout-audit.md` now includes a Batch 4.5 addendum with the final correction list, the Slice 4.5b Path B skill-provenance decision, and explicit residuals
- the representative archetype matrix now includes the 4.5 overlap regression scenario; local verification covers the archetype contract through targeted SQL, route, client, and matrix tests plus a successful Next build
- Batch 5 entry tasks were reconciled: sheet/audit presentation remains the next product work; multi-source skill provenance is deferred until sheet UI needs it; broader smoke automation and live data-copy migration validation for `067`/`068` are explicit follow-ons
- acceptance carried: Batch 5 can begin against a hardened per-level save path, with remote data-copy migration smoke retained as a deployment gate rather than hidden backlog

### Risks

- Changing spell/feat/feature-option semantics on the RPC without aligning the client will break the level-up flow for existing in-progress drafts. Slice 4.5a should land the RPC and client changes together.
- The skill-provenance decision in Slice 4.5b (narrow-PK-with-merge vs widened-PK-with-multi-row) has downstream implications for the sheet. Pick deliberately and record the choice; do not drift later.
- Trigger rewrites in Slice 4.5c are the most migration-risky change in this batch. Test on a copy of production data before shipping.
- Optimistic-lock tokens (4.5d) must be threaded through every PUT path, not only level-up, or non-level-up saves will silently lose the token and hit false stale-write rejections.
- Server-side roll generation (4.5f) must not break the "rolled stats are visible to the player before assignment" UX; surface rolls through an API call that returns them immediately rather than hiding them until save.

### Exit Criteria

- The review's six critical findings (C1–C6) are closed by code changes and pinned by regression tests.
- The review's high-severity findings (H1–H7) are closed or have explicit deferral notes in the audit doc with justification.
- A double-click on any save button produces exactly one write.
- A species change during creation no longer persists stale bonus / language / tool / skill state.
- A concurrent two-tab level-up on the same character produces exactly one successful advance and one clear error message.
- Batch 5 can begin against a per-level save path whose data-integrity guarantees are documented and tested.

## Batch 5: Sheet Calculation and Presentation

### Objective

Make the resulting character sheet mechanically trustworthy and useful during play and review.

### Why

The current stat block is closer to a summary card than a correct character sheet. It uses simplified calculations and does not fully surface derived build state.

### Scope

- Character page
- Stat block
- Derived summary panels
- DM review presentation

### Tasks

- Render adjusted ability scores, not only base scores.
- Show proficiency breakdown for saves and skills.
- Compute AC from equipment and class rules, not unarmored fallback only.
- Show initiative, passive Perception, spell save DC, spell attack modifier, and relevant class resource summaries.
- Display granted proficiencies:
  - skills
  - armor
  - weapons
  - tools
  - languages
- Display feature list by level and source.
- Separate prepared spells from known spells clearly.
- Distinguish granted spells that do not count against selection limits.
- Show ASI and feat history.
- Add a build audit panel for DMs:
  - selected sources
  - legality warnings
  - unresolved issues
  - provenance for selected features and choices
- Add a `source_entity_id` integrity view that surfaces character rows whose `(source_category, source_entity_id)` pair no longer resolves to a live content row (carried from the Slice 3m/3n review — item #8). Wire it into the DM audit panel so stale provenance is visible before it confuses review.

### Execution Slices

Each slice should fit in one Codex session and land derivation/helpers + at least one consuming sheet surface + tests, with schema only where presentation needs force it. Presentation slices (5a–5i) come first so the sheet itself becomes trustworthy, audit/integrity slices (5j–5k) follow once presentation is stable, and slices 5l–5m cover regression and deployment safety before Slice 5n closes the batch.

**Slice 5a — Sheet derivation seam: make every sheet card read from `derived.ts`** (delivered 2026-04-25)

- audit `CharacterSheet.tsx`, `StatBlockView.tsx`, `StatBlock.tsx`, and the per-card components under `src/components/character-sheet/` for any remaining ad-hoc math (ability mods, initiative, passive Perception, proficiency bonus, save/skill totals)
- route every one of those surfaces through `src/lib/characters/derived.ts`, extending the derived shape where a field is not yet exposed but keeping persistence unchanged
- pin the contract with per-field regression tests so future slices cannot drift back into local recomputation
- acceptance: no sheet component computes a mechanical value locally; `derived.ts` exposes every number the current sheet shows, and a fixture test asserts parity with the prior UI values

**Slice 5b — Adjusted ability scores and save bonuses with per-source breakdown** (delivered 2026-04-25)

- render base and adjusted scores side-by-side, with contributors listed (species bonus, species flex, ASI, feat, amendment note where present)
- render save rows as `mod + prof (if proficient) = total` with the proficiency source (class at first level, multiclass first level, feat) surfaced
- consume existing provenance from `asi-provenance.ts` and `species-ability-bonus-provenance.ts`; do not add new tables here
- acceptance: a Variant Human Fighter with a background-granted feat shows base/adjusted scores with each contributor, and save totals on a multiclass build attribute proficiency to the correct first-level class

**Slice 5c — Skill proficiency breakdown with source attribution** (delivered 2026-04-25)

- render the skill list with per-skill provenance (class, background, species, feat), expertise badges, and the bonus formula
- consume `skill-provenance.ts` directly; Path B decision confirmed: the multi-source overlap case is expressible from current rows plus per-level anchors without a `character_skill_proficiency_sources` table; decision recorded in `output/batch-5-closeout-audit.md`
- acceptance: an overlap archetype (background + Fighter multiclass sharing Athletics) shows a single row with both sources; a Knowledge Domain / Rogue expertise promotion displays correctly; a screenshot-equivalent test fixture pins the rendering contract

**Slice 5d — Granted non-skill proficiencies panel: armor, weapons, tools, languages** (delivered 2026-04-25)

- new `GrantedProficienciesCard.tsx` panel listing armor, weapon, tool, and language proficiencies, each with source tags (class, subclass, background, species, feat)
- languages/tools come from the Batch 3 typed choice tables via `language-tool-provenance.ts`; armor/weapon proficiencies come from `classes.armor_profs` / `weapon_profs`, subclass grants, and feat grants
- acceptance: a multiclass Fighter/Wizard correctly shows Heavy/Medium/Light armor and all martial weapons from Fighter plus daggers/darts/slings/quarterstaffs/light crossbows from Wizard, each tagged to its source; tool grants from background render with provenance

**Slice 5e — AC derivation from equipped armor, shield, and class rules** (delivered 2026-04-25)

- replaced the unarmored fallback with AC derived from `character_equipment_items` plus the armor/shield catalog, honoring the DEX cap, armor type, and shield bonus
- supports all standard class-rule variants: Barbarian Unarmored Defense (CON), Monk Unarmored Defense (WIS), Draconic Resilience, Mage Armor as a conditional alternative, Defense fighting style, Warforged Integrated Protection (+1)
- every AC display exposes its formula (base + mod + shield + misc) on the sheet and in the audit panel seam

**Slice 5f — Spell presentation: DC / attack mod per caster, prepared vs known vs spellbook, granted spells** (partial — Batch 6 carry-in)

- per-source spell DC and spell attack modifier render correctly in `CharacterSheet.tsx` for multiclass casters; caster mode (Prepared/Known/Spellbook) and granted spells are separated and tagged
- **architectural gap**: `DerivedSpellcastingSourceSummary` lives in `src/lib/characters/build-context.ts` rather than `src/lib/characters/derived.ts`; the sheet reads spellcasting off `BuildContext` instead of the canonical derived shape
- Batch 6 entry task: consolidate spellcasting derivation into `derived.ts` so the sheet has a single derivation seam for all mechanical values (no behavior change required)

**Slice 5g — Feature list by level and source + class resource summaries** (delivered 2026-04-24)

- render unlocked features grouped by `(class, level)` with the source label (class, subclass, species, feat, background) and a short description pulled from content
- add a class-resource panel showing per-rest counters with current usage semantics: Rage uses, Channel Divinity, Ki points, Sorcery Points, Superiority Dice, Bardic Inspiration, Spell Slots (by spellcaster table row)
- acceptance: a Battle Master 5 shows Second Wind (Fighter 1), Action Surge (Fighter 2), Martial Archetype + maneuvers (Fighter 3), Ability Score Improvement (Fighter 4), Extra Attack (Fighter 5) with a resource panel for superiority dice; a Cleric 5 shows spell slots and Channel Divinity uses

**Slice 5h — ASI and feat history panel** (delivered 2026-04-24)

- chronological panel listing every ASI increment and feat with the class/level at which it was chosen, joining `character_asi_choices` and `character_feat_choices` to `character_class_levels`
- show `+2 to X` vs `+1/+1` rows explicitly and name the feat / half-feat bonus where applicable
- acceptance: a level 12 character with two ASIs and one feat shows all three events in order, each tagged to the class and level at which it was taken, matching the raw rows

**Slice 5i — Combat-time surfacing for lightly-displayed feature systems** (delivered 2026-04-24)

- render the selected Battle Master maneuvers with save DC, effect, and superiority-die cost; Ranger favored terrains/enemies with the mechanical effect; Monk disciplines (for subclasses that expose them) with ki cost; reactive species traits (Silver Lining, Fury of the Small, etc.) with their trigger and effect
- everything here is already modeled but only minimally displayed; this slice is presentation on top of existing `character_feature_option_choices` rows, not new persistence
- acceptance: a Battle Master shows each selected maneuver inline with trigger/effect/cost; a Stout Halfling shows Fury of the Small with its trigger; no DB inspection is needed to understand what a player can do in combat

**Slice 5j — DM audit panel: selected sources, legality, and provenance tree** (delivered 2026-04-24)

- new DM-only section on the character page (gated on DM-of-this-campaign) that summarizes:
  - selected content sources with amendment tags
  - current legality warnings linked back to their originating wizard step
  - unresolved issues (missing required choices, incomplete level-up)
  - a collapsible provenance tree for skill / feat / spell / feature-option / equipment choices
- reuse the legality engine output rather than reimplementing the summary; link each provenance row to the per-level anchor from Slice 4i
- acceptance: a DM viewing a representative multiclass build sees each warning with a step link, every major choice with its source row, and amendment tags visible at a glance without raw-row inspection

**Slice 5k — Stale `(source_category, source_entity_id)` integrity view wired into the audit panel** (delivered 2026-04-25)

- migration `069` (`character_stale_provenance`) creates a SQL view enumerating orphaned references across 6 choice tables plus equipment against classes, backgrounds, species, subclasses, feats, and starting-equipment packages
- `detectStaleProvenance()` in `src/lib/characters/stale-provenance.ts` provides the TypeScript equivalent for client-side use; `StaleProvenancePanel` renders amber warning cards in the DM view, wired into the character page
- `test/stale-provenance.test.ts` covers all valid/retired/null/manual/unknown-category cases

**Slice 5l — Sheet regression smoke harness across representative archetypes** (delivered 2026-04-24)

- extend the Batch 4/4.5 archetype matrix into a sheet-level regression harness that walks representative creation + level-up payloads (single-class caster, multiclass caster/martial, feat-heavy, species/background-heavy, 4.5 overlap regression) through save → load → `derived.ts` → rendered sheet fields
- assert concrete presentation contracts per archetype: AC formula, spell DC / attack mod per caster, proficiency provenance, ASI/feat history, resource counters, combat-time feature display
- `test/sheet-5l-regression-matrix.test.ts` (7 tests) covers all five archetypes with concrete value assertions and pins the component seams (ClassResourcesPanel, AsiFeatHistoryPanel, CombatOptionsPanel, GrantedProficienciesCard, SkillsCard, SpellsCard) that consume each contract
- acceptance: `npm test` runs the matrix and fails loudly on any regression against the Batch 5 sheet contract; the harness is callable from `test/` without a live Supabase round-trip

**Slice 5m — Live data-copy migration smoke for migrations `067` / `068`** (delivered 2026-04-25)

- verified against live production database (`cqpyvaynpzgyjerfesmz`); both migrations already applied
- `sync_character_class_levels_for_class` confirmed idempotent: 26 rows before = 26 after, 0 changed, 0 inserted across 12 character-class pairs
- `FOR UPDATE` lock and optimistic-lock token checks confirmed present in deployed function bodies
- zero orphan `character_level_id` anchors across all six choice tables; spell selection null anchors are expected (all have `owning_class_id = NULL`, pre-Batch-4 rows correctly not backfillable)
- HP roll integrity confirmed; both triggers enabled
- Batch 4.5 deployment gate formally closed; verification documented in `output/batch-4-closeout-audit.md`

**Slice 5n — Batch 5 closeout: archetype verification, DM-review walkthrough, Batch 6 entry notes** (delivered 2026-04-25)

- 218 tests, 0 failures; all five regression archetypes pass; DM-review walkthrough on Warforged Artificer 5 confirms audit panel meets review needs without DB inspection
- Batch 5 deployment is unblocked: Batch 4.5 migration gate closed (5m), sheet derivation seam confirmed (5l), no orphan provenance
- Batch 6 entry tasks documented in `output/batch-5-closeout-audit.md` and in the Batch 6 section of this roadmap
- one architectural carry-in: spellcasting derivation consolidation into `derived.ts` (from 5f partial)

### Risks

- AC and equipment presentation depend on Batch 3 and Batch 4 support.
- Without provenance, review becomes harder even if totals are correct.

### Exit Criteria

- The sheet reflects derived rules accurately enough to use in play.
- DM review can rely on the sheet and audit summary rather than manual DB inspection.

## Batch 5.5: UI Polish

### Objective

Make the existing product feel calmer, clearer, and more refined before the content/admin surface expands. This is a subtraction-and-polish batch: preserve the current workflows, but reduce visual noise, shorten copy, clarify hierarchy, and make the app feel easier to trust on a laptop browser.

### Why

Batch 5 made the sheet mechanically useful, but the UI now carries a lot of equal-weight cards, borders, badges, helper text, and derived/audit detail. The app is coherent, but it often asks users to parse too much at once. Batch 6 will add content ingestion and admin tooling; if UI hierarchy is not tightened first, those larger surfaces will inherit the same density and become harder to use.

### Design Principles

1. **Prefer subtraction over addition.** Remove redundant explanatory text, repeated empty states, and unnecessary containers before introducing new components.
2. **One primary focus per screen.** Login focuses on sign-in, dashboard on choosing or creating a character, wizard on the current decision, sheet on current character state and next action.
3. **Keep advanced detail available, not dominant.** DM audit/provenance, rules details, and derived explanations should be easy to reach but visually quieter than the player task.
4. **Use consistent visual weight.** Reserve strong cards, badges, alerts, and accent colors for moments that need them.
5. **Polish must improve accessibility.** Better contrast, focus states, keyboard flow, and simpler layouts are part of the polish, not follow-up work.

### Scope

- Login, player dashboard, guided character creation, character sheet, and DM review/audit surfaces.
- Visual hierarchy, spacing, copy, component consistency, focus states, empty states, and validation presentation.
- No new rules systems, schema changes, sourcebook content, combat automation, or broad mobile redesign.
- Primary viewport: laptop browser. Mobile should not regress, but it is not the optimization target.

### Non-Goals

- Rebranding or a decorative visual redesign.
- New onboarding, tutorials, or feature tours.
- Replacing the dark theme.
- Adding new character-builder capabilities.
- Rewriting shadcn/Radix primitives unless a small local variant removes repeated friction.

### Execution Slices

Each slice should fit in one Codex session and leave the app coherent. Slices 5.5a-5.5c establish the product-wide visual and copy rules. Slices 5.5d-5.5g apply them to the highest-traffic surfaces. Slice 5.5h verifies the polish pass before Batch 6 begins.

**Slice 5.5a — UI hierarchy inventory and polish tokens** (delivered 2026-04-25)

- Goal: define a small product-wide hierarchy system so surfaces stop competing visually.
- Added shared utilities in `src/app/globals.css`: `surface-primary`, `surface-section`, `surface-row`, `text-metadata`, and `focus-ring`.
- Updated shared card, alert, form, button, select, checkbox, tabs, dialog, and guided-choice primitives to use the shared focus/radius conventions.
- Added `test/ui-polish-conventions.test.ts` to pin these conventions before the surface-specific polish slices continue.
- Documented usage rules in `output/batch-5-5-ui-polish-notes.md`.
- acceptance: common UI treatments now have clear reusable rules; dense shared controls use crisper radii; keyboard focus is visible and consistent across core primitives.

**Slice 5.5b — UX writing and terminology simplification** (delivered 2026-04-25)

- Goal: replace implementation-language copy with short user-facing task language.
- Simplified dashboard empty-state and return-copy language around starting/continuing characters.
- Shortened login mode-switch and reset labels: `Use password`, `Use magic link`, `Reset password`.
- Rewrote guided-creation descriptions to focus on the user's next choice instead of persistence, ownership, derivation, and rules-engine mechanics.
- Standardized key action labels: `Create character`, `Submit`, and `Open sheet`.
- Updated the language/tool helper copy and DM audit subtitle to avoid exposing implementation details.
- Extended `test/ui-polish-conventions.test.ts` with player-facing copy guardrails for internal terminology and verbose action labels.
- acceptance: high-traffic player-facing copy avoids the known internal terms; primary actions are shorter; remaining destructive/blocking states still keep their explanatory text.

**Slice 5.5c — Component restraint pass** (delivered 2026-04-25)

- Goal: reduce the repeated "card inside card inside card" feeling without changing workflows.
- Replaced the wizard frame's always-visible summary card with a quiet `details` summary that only appears when there are selected items.
- Removed the "Nothing selected" empty alert from wizard steps so undecided states do not read as warnings.
- Added compact guided-choice rows for simple options, while retaining roomier card spacing for options with descriptions, requirements, replacement labels, or disabled reasons.
- Removed the unselected chevron from guided choices so unchosen rows are quieter and selected rows carry the primary mark.
- Extended `test/ui-polish-conventions.test.ts` to guard against nested summary cards/alerts and to keep simple guided choices compact.
- acceptance: simple wizard steps now have less competing surface weight; summaries appear only when useful; selected/disabled/rich-option states remain visible without making every option feel like a large card.

**Slice 5.5d — Login and dashboard refinement** (delivered 2026-04-25)

- Goal: make first entry and character selection feel warm, direct, and trustworthy.
- Reduced login title scale and tightened the login panel rhythm around one obvious sign-in path.
- Converted magic-link and password-reset success feedback from alert blocks into calm `role="status"` messages with polite live-region announcements.
- Replaced raw secondary sign-in links with ghost buttons so alternate actions stay legible, keyboard-friendly, and clearly secondary.
- Simplified the dashboard empty state onto the shared primary surface treatment.
- Converted character cards into compact clickable rows showing only name, campaign, and status; removed the redundant `Open` label and added explicit accessible labels to the row links.
- Extended `test/ui-polish-conventions.test.ts` to guard the calmer login feedback and row-based dashboard affordance.
- acceptance: unauthenticated users see one obvious sign-in path and quiet alternatives; returning players can scan characters by name, campaign, and status without extra visual clutter; dashboard primary and secondary actions have distinct hierarchy.

**Slice 5.5e — Guided creation flow refinement** (delivered 2026-04-25)

- Goal: make the 10-step wizard feel lighter and more momentum-oriented.
- Replaced the boxed 10-button step grid with a quieter ordered progress treatment that keeps direct navigation but makes it secondary to the current step.
- Added explicit `Current`, `Done`, `Available`, and `Locked` state labels through accessible labels and visible shape/text treatment so progress is not color-only.
- Added inline `Next:` guidance to `WizardStepFrame` for incomplete required choices, making missing picks feel like direction instead of a warning state.
- Moved Back/Continue/Open Sheet actions into the wizard card footer so navigation is attached to the current decision.
- Wrapped equipment and spells/feats in the same step frame pattern so the high-level wizard rhythm is consistent across every step.
- Changed incomplete-step and locked-step toasts from destructive alerts to neutral guidance.
- Extended `test/ui-polish-conventions.test.ts` to guard the quieter progress treatment and in-frame guidance/footer navigation.
- acceptance: first-time character creation presents one obvious next decision at a time; completed/current/locked/reachable states are distinguishable without relying on color alone; resumable draft-save and reachable-step logic remain unchanged.

**Slice 5.5f — Character sheet hierarchy and sticky header polish** (delivered 2026-04-25)

- Goal: make the sheet feel like a usable character surface, not a dense rules dashboard.
- Reduced the sticky sheet header from a large rounded chrome block to the shared `surface-primary` treatment with tighter spacing.
- Kept character name, level/campaign, status, legality, Save, and Submit as the main header priorities.
- Replaced four heavy stat tiles in the sticky header with an inline quick-stat definition list for HP, initiative, speed, and passive perception.
- Simplified collapsible section headers from large rounded panels with `Hide`/`Show` pills to quieter `surface-section` headers with a chevron affordance.
- Added `aria-expanded` to section toggles and retained visible focus via the shared `focus-ring`.
- Extended `test/ui-polish-conventions.test.ts` to guard the compact header and icon-based section affordance.
- acceptance: the sheet first viewport has less chrome; save/submit state remains prominent; section scanning is faster because headers and content now carry distinct visual weight.

**Slice 5.5g — Validation, DM audit, and review-state calmness** (delivered 2026-04-25)

- Goal: make correctness support feel helpful rather than administrative.
- Reworked legality badges to use icons and short repair labels (`Fix needed`, `Review`, `Clear`) so severity is not communicated by color alone.
- Renamed the sheet issue panel to `Repair checklist` and removed raw legality keys from player-facing issue chips.
- Made DM audit a quiet disclosure panel; detailed sources, open issues, and provenance are still available when expanded.
- Changed provenance groups from always-open detail blocks to compact `surface-row` disclosures.
- Converted stale-provenance content integrity from a heavy amber card to a quiet expandable `surface-section`.
- Refined DM review panel styling onto the shared section surface while keeping approve/request-changes actions clear.
- Improved jump-to-issue behavior by focusing the destination section after smooth scroll.
- Extended `test/ui-polish-conventions.test.ts` to guard repair-oriented validation, quiet audit disclosure, and focusable jump targets.
- acceptance: players see what to fix next without raw legality keys; DMs can still inspect provenance and stale references; neutral audit data no longer reads as an alert.

**Slice 5.5h — Visual QA, accessibility, and closeout** (delivered 2026-04-25)

- `output/batch-5-5-ui-polish-closeout.md` records the final visual QA notes for login, dashboard, guided creation, character sheet, and DM review/audit.
- Browser and keyboard checks covered the locally reachable laptop-browser surfaces; auth-gated surfaces that could not be reached without a live session are called out explicitly instead of being hidden.
- The closeout confirms the app now has fewer competing containers, shorter copy, clearer primary actions, visible focus treatment, and non-color-only severity communication.
- Remaining polish debt is assigned to Batch 7, keeping Batch 6 focused on content/admin tooling rather than another broad UI refinement pass.

### Suggested Order

1. 5.5a: UI hierarchy inventory and polish tokens.
2. 5.5b: UX writing and terminology simplification.
3. 5.5c: component restraint pass.
4. 5.5d: login and dashboard refinement.
5. 5.5e: guided creation flow refinement.
6. 5.5f: character sheet hierarchy and sticky header polish.
7. 5.5g: validation, DM audit, and review-state calmness.
8. 5.5h: visual QA, accessibility, and closeout.

### Risks

- Cosmetic-only changes could miss the real problem: hierarchy and cognitive load. Every slice should remove friction, not just restyle it.
- Over-simplifying DM audit/provenance could hide review-critical detail. Keep the detail available, but make it progressively disclosed.
- Component changes may affect many surfaces. Keep each pass small and verify the core creation/sheet paths after each slice.
- The dark theme can become too low-contrast if muted text is pushed too far. Accessibility checks are part of the batch, not optional polish.

### Exit Criteria

- The app feels calmer and more intentional across login, dashboard, wizard, sheet, and DM review.
- Primary actions and current task are obvious on each surface.
- Repeated explanatory copy, empty alerts, neutral badges, and nested heavy cards are materially reduced.
- Keyboard focus, contrast, and non-color state communication are improved.
- Batch 6 can add content/admin tooling without inheriting avoidable UI noise.

## Batch Eberron: Rising Player Options Completion

### Objective

Complete practical character-builder support for player-facing options from `Eberron: Rising from the Last War` before Batch 6 expands the content/admin tooling surface.

### Why Before Batch 6

The repo already contains a partial ERftLW slice: Artificer, several dragonmarked species, Warforged, Changeling, Orc, Aberrant Dragonmark, and dragonmark spell-list support. Coverage is useful but uneven. Finishing this source now gives Batch 6 a cleaner real-world content target and avoids building admin/import tools around known incomplete Eberron assumptions.

Batch Eberron is intentionally a source-completion exception to Batch 6's "stabilization and tooling before broad content" posture. It should be small, player-facing, and backed by regression coverage rather than a new round of open-ended sourcebook ingestion.

### Scope

- Complete missing ERftLW species and lineages supported by the existing character-builder model.
- Add missing ERftLW player background and feat content.
- Model artificer infusions as selectable feature options.
- Tighten dragonmarked species behavior, lineage metadata, and amendment notes.
- Add regression coverage proving ERftLW campaign allowlists can create representative Eberron builds.

### Non-Goals

- Full book text transcription.
- Adventure, gazetteer, faction lore, monsters, NPC stat blocks, vehicles, or encounter content.
- Broad magic-item catalog support beyond what is needed to describe artificer infusion choices.
- Combat-time automation for every trait, feat, or infusion rider.
- Replacing Batch 6 importer/admin work.

### Execution Slices

Each slice should fit in one Codex session and leave the app coherent. Slices E1-E5 complete the player-option support surface. Slice E6 proves representative Eberron builds end to end. Slice E7 closes the batch and hands a cleaner content baseline to Batch 6.

**Slice E1 — ERftLW coverage audit and guardrails**

- Goal: lock the expected ERftLW character-option surface before adding data.
- Deliver:
  - `output/eberron-content-audit.md`
  - migration/source tests listing expected ERftLW player options
  - current coverage table: present, partial, missing, out of scope
- Acceptance:
  - missing support is explicit before implementation
  - tests fail for the known missing player-facing content
  - out-of-domain book material is documented rather than treated as hidden backlog

**Slice E2 — Missing species and lineages**

- Goal: add missing selectable ERftLW species rows that fit the current builder.
- Add:
  - `Kalashtar`
  - Shifter variants
  - `Bugbear`
  - `Goblin`
  - `Hobgoblin`
- Update:
  - species traits
  - ability/language/skill/tool choice helpers where needed
  - lineage metadata
  - amendment notes for non-automated trait riders
- Acceptance:
  - each new species appears under an ERftLW allowlist
  - required choices persist with provenance
  - derived sheet shows traits, senses, speed, resistances, languages, and proficiencies correctly

**Slice E3 — Dragonmarked cleanup**

- Goal: make the existing dragonmarked rows coherent and less "partial slice" flavored.
- Update:
  - canonical naming and lineage metadata
  - stale amendment notes
  - language/tool/ability choice rules
  - static trait-granted spell coverage where current feature-grants support allows it
- Acceptance:
  - no amendment note claims an already-implemented choice is missing
  - dragonmark spell-list expansion remains available in spell pickers
  - duplicate legacy-style rows are either clearly retained for compatibility or explicitly marked as legacy

**Slice E4 — House Agent, Revenant Blade, and required equipment hooks**

- Goal: add the remaining player-facing background/feat pieces.
- Add:
  - `House Agent` background with skill/tool/language support and concise feature summary
  - `Revenant Blade` feat with prerequisites and structured benefits
  - double-bladed scimitar equipment row if needed for feat/equipment display
- Acceptance:
  - House Agent can be selected and saved
  - Revenant Blade appears only when its source is allowed
  - any unautomated feat combat riders are marked with precise amendment notes

**Slice E5 — Artificer infusions as feature options**

- Goal: make the Artificer's core recurring choice system real instead of descriptive only.
- Add:
  - infusion option groups
  - infusion options and prerequisites
  - level-based selection counts
  - legality checks for missing/extra infusion choices
  - sheet display of selected infusions
- Acceptance:
  - Artificer characters must choose the correct number of infusions at relevant levels
  - selected infusions persist through creation and level-up
  - unsupported magic-item replication details are surfaced descriptively, not silently automated

**Slice E6 — Eberron regression matrix**

- Goal: prove representative Eberron builds work end to end.
- Cover:
  - Warforged Artificer with infusions
  - Kalashtar caster
  - Shifter martial build
  - Dragonmarked spellcaster
  - House Agent character
  - Revenant Blade eligible build
- Acceptance:
  - creation, legality, derived sheet, source allowlisting, and DM review all pass for the matrix
  - the regression matrix distinguishes supported automation from descriptive-only book mechanics

**Slice E7 — Batch Eberron closeout**

- Goal: hand Batch 6 a clean content baseline.
- Deliver:
  - `output/batch-eberron-closeout-audit.md`
  - updated `Current Status` and Batch 6 entry notes in this roadmap
  - short list of remaining ERftLW gaps that are intentionally outside the current app domain
- Acceptance:
  - player-facing ERftLW character options are either supported or explicitly documented as not in the app's current domain
  - Batch 6 can proceed with importer/admin tooling against a known-complete Eberron character-options slice

### Suggested Order

1. E1: ERftLW coverage audit and guardrails.
2. E2: missing species and lineages.
3. E3: dragonmarked cleanup.
4. E4: House Agent, Revenant Blade, and required equipment hooks. (complete)
5. E5: artificer infusions as feature options. (complete)
6. E6: Eberron regression matrix. (complete)
7. E7: Batch Eberron closeout. (complete)

### Risks

- Eberron's book content extends well beyond character-builder scope. Slice E1 must hold the scope line so the batch closes against a finished player-options slice rather than an open-ended sourcebook ingestion target.
- Existing dragonmarked species rows carried lineage ambiguity and stale amendment notes. Slice E3 resolves this by keeping canonical `Species (Mark of X)` rows, deleting characters still tied to older `Mark of X Species` rows, and removing the old rows/code paths rather than carrying a compatibility layer.
- Artificer infusion modeling can drift toward replicating the magic-item catalog. Keep magic-item replication descriptive unless the current equipment/feature-grant model already supports the underlying item shape.
- Several Eberron traits (e.g. Shifter shifting, Kalashtar Mind Link, Warforged trait riders) are reaction-time or resource-tracking mechanics that Batch 5 only surfaces descriptively. Mark them with precise amendment notes rather than partially automating combat-time behavior.
- New player options land before Batch 6's importer/validator, so structural mistakes can only be caught by tests and the regression matrix. Slice E6 is the safety net; do not skip it to ship E7 faster.

### Exit Criteria

- ERftLW player options that fit the current character-builder domain are selectable, persistable, and visible on the derived sheet.
- Eberron-specific required choices have provenance and legality coverage.
- Artificer infusions are represented as reusable feature options rather than only prose.
- Remaining book content outside the app's current character-builder domain is documented for a later content-model expansion.
- Batch 6 begins with a cleaner sourcebook baseline and a concrete Eberron regression matrix.

## Batch 6: Content Ingestion and Admin Tooling

### Objective

Make content expansion sustainable instead of relying on ad hoc patches and narrow seed scripts, while closing the small architectural and data-shape debts that would make a larger content/admin surface brittle.

### Batch 5.5 handoff and Batch Eberron handoff

The Batch 5.5 closeout on 2026-04-25 confirms content/admin work can begin on the polished UI foundation. Batch 6 should reuse the shared surface, focus, copy, and progressive-disclosure conventions from the polish pass rather than inventing new admin chrome. Any remaining broad visual polish belongs in Batch 7, not inside the Batch 6 content/admin scope.

Batch Eberron closed on 2026-04-26 with `output/batch-eberron-closeout-audit.md`. Batch 6 begins with a known-complete ERftLW player-options baseline and an Eberron regression matrix. Batch 6 should then improve repeatability and admin maintainability and should not re-open sourcebook-completion work.

The practical effect for future batches is:

- Batch 6 admin/content surfaces should be built as restrained work tools: compact rows for scannable lists, `surface-section` for bounded editor areas, `surface-primary` only for the main workspace, and progressive disclosure for validation, provenance, import diffs, and destructive/retire explanations.
- New Batch 6 UI copy should stay task-first and avoid implementation terms such as raw rows, derivation seams, persistence internals, or rules-engine language unless the user is explicitly in an admin diagnostics view.
- Batch 6 should add focused convention tests for each new admin surface it introduces, extending `test/ui-polish-conventions.test.ts` or a sibling test rather than relying on manual visual judgment.
- Batch 7 should not reopen broad product polish unless the Batch 6 closeout finds a specific regression. Its UI work should focus on authenticated visual QA, keyboard coverage, setup clarity, and production-readiness friction.

### Why

The seed pipeline currently imports only a subset of content types, and the admin UI is not yet shaped for the broader content model needed by the builder. Several structural carry-ins from Batches 3–5 have accumulated and are cheapest to close before the content surface grows further.

Batch 6 should be treated as a stabilization-and-tooling batch, not as "add lots more rules content." The immediate win is to make future content changes repeatable, validated, and maintainable.

### Batch 5 Carry-ins (resolved by Slices 6a-6d)

These items were explicitly deferred from Batch 5 or earlier review passes. They are not prerequisites before Slice 6a; they are the priority work that opens Batch 6. Slices 6a-6d are the planned resolution path before the batch expands into importer/admin tooling:

1. **Consolidate spellcasting derivation into `derived.ts`** (from Slice 5f). Move `DerivedSpellcastingSourceSummary` and the per-source spellcasting aggregate out of `src/lib/characters/build-context.ts` into `src/lib/characters/derived.ts`. No behavior change — architectural alignment only. After this change the sheet has a single derivation seam for all mechanical values.

2. **Migrate hardcoded spell-grant rules off spell-name lookups** (from Slice 3m/3n review item #5). Replace the ~33 `{ spellName, spellSource }` entries in `src/lib/characters/feature-grants.ts` with a `feature_spell_grants` content table keyed on `spell_id`. Backfill from current rules, delete the hardcoded tables once parity is verified. Minimum viable gate: ship a test-time assertion that every hardcoded entry resolves to exactly one spell row so admin renames fail loudly.

3. **Finish languages/tools catalog cutover** (from Slice 3m/3n review item #6). `language_key` and `tool_key` columns already exist; Batch 6 should make them authoritative. Backfill remaining nulls, add uniqueness / not-null constraints where live data allows, update loaders and persistence helpers to read/write keys as the source of truth, and only then drop or retire the free-text `language` / `tool` columns.

4. **Finish character-access consolidation** (from Slice 3m/3n review item #9). `assertCharacterManageableByUser` now exists in `src/lib/auth/ownership.ts` and is already used by several peer routes. Batch 6 should finish the remaining route audit, especially `src/app/api/characters/[id]/route.ts` and `submit/route.ts`, and add focused tests for player-owner, campaign DM, admin, and unrelated-user behavior.

5. **Split load-bearing modules past safe edit size** (from Slice 3m/3n review item #10). `src/lib/characters/feature-grants.ts` (~880 lines), `src/lib/characters/build-context.ts` (~1000 lines), `src/lib/legality/engine.ts` (~810 lines), and `src/components/character-sheet/CharacterSheet.tsx` should be segmented by concern. No behavior changes.

6. **Null `owning_class_id` spell selection cleanup**. The 14 production rows written before Batch 4's class-scoped spell path have no `owning_class_id`. They load and display, but carry no class provenance in the DM audit panel. A targeted data migration or content-admin repair flow should attribute or mark them as pre-Batch-4 legacy rows.

### Scope

- Architectural cleanup that keeps Batch 5 sheet behavior unchanged.
- Data-shape migrations needed before content import/admin tooling grows.
- Import pipeline and content integrity checks for Batch 3 content families.
- Admin CRUD for rules-significant content categories that are currently SQL-only or read-mostly.
- Source/version handling, amendment metadata, preview, and validation before publishing content changes.

### Non-Goals

- Broad new sourcebook ingestion before the validator exists.
- Combat automation for rules that Batch 5 only surfaces descriptively.
- A generic CMS abstraction. Build the minimum admin/import tooling needed for this rules model.
- Adding `character_skill_proficiency_sources` by default. Keep the Slice 5c Path B decision unless a concrete Batch 6 audit UI needs a separate overlap-source table.

### Execution Slices

Each slice should fit in one Codex session and leave the repo coherent. Slices 6a–6d close carry-ins that would otherwise make import/admin work unstable. Slices 6e–6h build the content tooling. Slice 6i is the closeout gate.

**Slice 6a — Spellcasting derivation seam**

- Goal: move spellcasting mechanical output onto the canonical derived character shape with no behavior change.
- Modify:
  - `src/lib/characters/derived.ts`
  - `src/lib/characters/build-context.ts`
  - `src/components/character-sheet/SpellsCard.tsx`
  - any sheet/page loader that still passes spellcasting from build context directly
- Tests:
  - update `test/sheet-derived-seam.test.ts` so `spellcasting` is asserted on `DerivedCharacter`
  - keep the Slice 5l multiclass caster assertions passing
  - add a guard that `SpellsCard` reads `derived.spellcasting` rather than `buildContext.spellcasting`
- Acceptance:
  - `DerivedSpellcastingSourceSummary` and the aggregate spellcasting summary are exported from `derived.ts`
  - the sheet has one derivation seam for AC, saves, skills, features, ASI/feat history, and spellcasting
  - no spell DC, attack modifier, prepared/known count, or granted-spell behavior changes

**Slice 6b — Feature spell grants as content**

- Goal: replace spell-name feature-grant lookups with content rows keyed to `spells.id`.
- Modify/create:
  - new migration: `feature_spell_grants` table with stable feature key, source category/entity metadata, acquisition mode, optional owning class/subclass constraints, and `spell_id uuid not null references spells(id)`
  - `src/lib/characters/feature-grants.ts`
  - database types in `src/lib/types/database.ts`
  - tests around granted spells in `test/feature-grants.test.ts`
- Suggested sequence:
  - first add a parity test proving every current hardcoded `{ spellName, spellSource }` resolves to exactly one spell row
  - add the table and seed/backfill rows from current hardcoded definitions
  - switch derivation to consume rows through a small loader/normalizer
  - remove the hardcoded spell-name table once parity and feature-grant tests pass
- Acceptance:
  - admin renaming or duplicate spell seeding cannot silently break feature grants
  - domain/oath/species/feat-granted spells still render as granted, not player-selected
  - all current feature-grant tests pass against content-backed grants

**Slice 6c — Language/tool key cutover**

- Goal: make language/tool catalog keys authoritative for character choices.
- Modify:
  - new migration to backfill remaining null `language_key` / `tool_key`, tighten constraints, and retire free-text uniqueness
  - `src/lib/characters/load-character.ts`
  - `src/lib/characters/choice-persistence.ts`
  - `src/lib/characters/atomic-save.ts`
  - `src/lib/characters/language-tool-provenance.ts`
  - stale provenance view / detector if the retired text fields are referenced
- Tests:
  - add migration-text tests for not-null/unique/index behavior
  - update `test/load-character.test.ts` and `test/atomic-save.test.ts` to assert key-first behavior
  - keep creation and level-up language/tool persistence tests passing
- Acceptance:
  - new saves write catalog keys
  - loaders derive display names from catalogs or typed rows, not from free-text primary identity
  - existing rows are backfilled or explicitly quarantined before constraints tighten

**Slice 6d — Access helper closeout and legacy spell attribution**

- Goal: close small data/access carry-ins before admin write surfaces expand.
- Modify:
  - `src/lib/auth/ownership.ts`
  - `src/app/api/characters/[id]/route.ts`
  - `src/app/api/characters/[id]/submit/route.ts`
  - `approve`, `request-changes`, `snapshots`, `stat-rolls`, and legality routes only if the audit finds gaps
  - migration or admin repair helper for pre-Batch-4 spell selections with `owning_class_id is null`
- Tests:
  - route-source tests that every mutating character route uses the shared access helper or a deliberately stricter owner-only helper
  - owner / campaign-DM / admin / unrelated-user tests for update, submit, approve/request-changes, snapshots, and stat rolls
  - migration test documenting the chosen handling for the 14 legacy spell rows
- Acceptance:
  - no inlined character-management permission logic remains in mutating character routes, except submit if intentionally owner-only and covered by a named helper
  - legacy null `owning_class_id` rows are either attributed or marked as pre-Batch-4 legacy so DM audit output is explicit

**Slice 6e — Importer modularization and dry-run validator**

- Goal: turn `scripts/seed-srd.ts` into a reusable import/validation harness before adding more content families.
- Modify/create:
  - split importer modules under `scripts/content-import/` or `src/lib/content/import/`
  - keep `scripts/seed-srd.ts` as a thin orchestration entrypoint
  - add a validation command that can run without mutating the database
- Validation checks:
  - missing foreign keys
  - invalid progression arrays
  - orphaned option groups / options
  - duplicate option records
  - spell-list mismatches
  - feature spell grants that do not resolve to exactly one spell row
  - language/tool/equipment references that do not resolve to catalog keys
- Tests:
  - fixture-based validator tests for each failure class
  - one happy-path fixture that covers classes, subclasses, spells, languages, tools, option groups, equipment, and starting packages
- Acceptance:
  - content can be validated in dry-run mode before any insert/update
  - validator errors name the table/entity/key and suggested owner slice

**Slice 6f — Admin CRUD for option groups, languages, and tools**

- Goal: make non-equipment Batch 3 content maintainable without SQL.
- Modify:
  - `src/components/dm/ContentAdmin.tsx`
  - `src/app/api/content/feature-option-groups/route.ts`
  - `src/app/api/content/feature-options/route.ts`
  - `src/app/api/content/languages/route.ts`
  - `src/app/api/content/tools/route.ts`
  - `src/lib/content/admin-schemas.ts`
  - `src/lib/content/feature-option-content.ts`, `language-content.ts`, `tool-content.ts`
- UI requirements:
  - list, create, edit, retire/delete where safe using the Batch 5.5 hierarchy conventions rather than new admin-specific chrome
  - compact `surface-row` list entries for scannable catalogs; reserve `surface-section` for the active editor and validation preview
  - source tag / ruleset fields
  - validation preview before save, progressively disclosed when it contains detailed row-level findings
  - blocked delete/retire messaging when character rows reference the content
  - short task-first labels (`Create`, `Save`, `Retire`, `Preview`) with implementation detail kept out of default copy
- Tests:
  - API schema tests for create/update/delete validation
  - source-code guard tests that admin panels call validation before publishing
  - UI convention guard that the new admin panel uses shared surfaces, shared focus treatment, and progressive disclosure for detailed validation
- Acceptance:
  - a DM/admin can maintain feature option groups/options, languages, and tools through the admin UI
  - invalid keys, duplicate keys, and dangling group references are blocked before write
  - the admin UI feels like the same product as the polished dashboard/sheet, not a separate dense back-office tool

**Slice 6g — Admin CRUD for equipment and starting packages**

- Goal: make item/armor/weapon/shield/starting-equipment content maintainable without SQL.
- Modify:
  - `src/components/dm/ContentAdmin.tsx`
  - `src/app/api/content/equipment-items/route.ts`
  - `src/app/api/content/armor/route.ts`
  - `src/app/api/content/weapons/route.ts`
  - `src/app/api/content/shields/route.ts`
  - `src/app/api/content/starting-equipment-packages/route.ts`
  - `src/lib/content/equipment-content.ts`
  - `src/lib/content/admin-schemas.ts`
- UI requirements:
  - reuse the Batch 5.5 admin conventions from Slice 6f for list rows, editor surfaces, focus treatment, and disclosure
  - stable item keys and source/ruleset fields
  - armor/shield AC fields with validation against `deriveArmorClass()`
  - weapon damage/proficiency fields
  - starting package preview showing resolved items and quantities as compact grouped rows, with detailed validation collapsed until needed
- Tests:
  - API/schema tests for each equipment family
  - a fixture test proving a starting package resolves to concrete equipment rows
  - an AC regression that still passes after editing armor/shield content shape
  - UI convention guard that equipment editors do not introduce nested heavy cards, alert-heavy neutral states, or verbose implementation copy
- Acceptance:
  - admin UI can maintain all Batch 3 equipment families
  - starting packages can be previewed and validated before publish
  - equipment editing stays scannable even when packages contain several alternatives or bundle choices

**Slice 6h — Bulk source import and amendment workflow**

- Goal: support repeatable source/amendment import without hidden SQL patches.
- Modify/create:
  - bulk import command using the Slice 6e validator
  - source/amendment metadata handling in content APIs
  - admin preview surface for import diff: create/update/retire/no-op, using calm grouped rows and disclosure for detailed row errors
  - import documentation in `SETUP.md` or `docs/architecture.md`
- Tests:
  - fixture import with create/update/no-op rows
  - duplicate source/key conflict test
  - rejected import leaves no partial writes
  - UI convention guard that import diffs use non-color-only status labels and do not present neutral no-op rows as warnings
- Acceptance:
  - importer can dry-run and then apply the same validated payload
  - import output is stable enough to paste into closeout notes
  - source amendments remain visible to campaign allowlisting and DM review
  - admin users can understand the import diff without reading raw payloads

**Slice 6i — Batch 6 closeout gate**

- Goal: prove Batch 6 made content/admin work safer and identify the next batch cleanly.
- Deliver:
  - `output/batch-6-closeout-audit.md`
  - updated `Current Status` and Batch 7 entry notes in this roadmap
  - one representative import dry run and one representative admin maintenance walkthrough
- Verification:
  - `npm test -- --runInBand`
  - content validator happy-path and failure fixtures
  - regression matrix covering a caster with feature-granted spells, a language/tool-heavy build, and an equipment-starting-package build
  - visual QA notes for the Batch 6 admin/content surfaces against the Batch 5.5 conventions
- Acceptance:
  - all Batch 5 carry-ins are closed or explicitly deferred with owner/date/reason
  - content families added in Batch 3 can be maintained through admin UI or importer
  - future content additions no longer require one-off SQL for normal cases
  - any UI polish debt created by the new admin surfaces is assigned to Batch 7 with a concrete route/surface, not hidden in generic "UX polish"

### Suggested Order

1. 6a: spellcasting derivation seam.
2. 6b: feature spell grants as content.
3. 6c: language/tool key cutover.
4. 6d: access helper closeout and legacy spell attribution.
5. 6e: importer modularization and dry-run validator.
6. 6f: admin CRUD for option groups, languages, and tools.
7. 6g: admin CRUD for equipment and starting packages.
8. 6h: bulk source import and amendment workflow.
9. 6i: closeout audit.

### Risks

- Weak content validation will surface as builder bugs.
- Importing more source content before the model is ready will increase data debt.
- The spellcasting derivation consolidation touches both `build-context.ts` and `derived.ts`; keep it isolated in Slice 6a.
- The language/tool cutover changes persistence identity; do not drop free-text columns until a migration/test proves every live row has a key or an explicit quarantine path.
- Admin CRUD can sprawl. Keep the first pass boring: validated forms, preview, create/edit/retire, and clear blocked-delete messaging.
- Module splitting is easy to overdo. Use it only where it directly supports the current slice or removes risk from an already-touched load-bearing file.

### Exit Criteria

- New content families can be imported and maintained without one-off SQL work.
- Admin UI supports all rules-significant content categories.
- Validation catches structural content issues early.
- All Batch 5 carry-ins are closed.
- Batch 7 can focus on hardening/usability rather than hidden content-data cleanup.

## Batch 7: Hardening, Tests, and Usability

### Objective

Make the app reliable enough for actual campaign use.

### Why

A sophisticated builder that is hard to trust is not useful. The repo already has some legality tests, but broader behavioral coverage is needed.

### Scope

- Unit tests
- Integration tests
- Seed and migration validation
- Authenticated visual QA and production-readiness UX hardening

### Tasks

- Expand derivation tests for:
  - multiclass progression
  - pact and non-pact spellcasting
  - ASI / feat resolution
  - proficiency aggregation
  - AC calculation
  - spell limits by mode
- Add route and persistence integration tests:
  - create character
  - save draft
  - level up
  - choose feat
  - choose feature options
  - choose spells
  - reload and verify persisted state
- Add fixture-based regression builds.
- Add migration tests for backfilling from current schema to normalized schema.
- Improve UX around partial completion:
  - incomplete-step warnings
  - save state indicators
  - clear blocked-state explanations
- Run the authenticated visual QA pass deferred from Slice 5.5h:
  - dashboard
  - wizard identity/species/review steps
  - character sheet
  - DM dashboard and review/audit surfaces
  - Batch 6 content/admin screens
- Extend keyboard and screen-reader-oriented checks over the authenticated surfaces:
  - login
  - wizard controls
  - sheet collapsibles
  - Save/Submit
  - validation jump links
  - admin create/edit/retire flows
- Keep Batch 7 polish bounded to specific friction found during authenticated QA, Batch 6 admin closeout, or usability testing. Do not re-open the visual system without a concrete regression.
- Add `.env.example` and setup documentation.
- Treat language/tool key cutover, character-access consolidation, feature-grant content migration, and module splitting as Batch 6 prerequisites. Batch 7 should only revisit them if the Batch 6 closeout audit explicitly defers a residual with rationale.

### Exit Criteria

- Representative build archetypes persist and reload accurately.
- Derived outputs are stable across refactors.
- The app explains invalid states clearly.
- Authenticated player, DM, and admin surfaces continue to follow the Batch 5.5 visual hierarchy, focus, copy, and progressive-disclosure conventions.

## Implementation Strategy for Codex

This section translates the roadmap into a concrete backlog for a single implementation agent working sequentially inside the repo.

The main constraint is not human coordination but context management. That means the backlog should be structured as a series of vertical slices that:

- touch a bounded set of files
- have clear acceptance criteria
- are testable in one run
- do not require holding the entire product model in working memory at once

## Recommended Execution Pattern

For each implementation slice:

1. Read only the relevant schema, route, helper, and component files.
2. Patch schema and types first if needed.
3. Patch data-loading and save routes next.
4. Patch derivation and legality logic.
5. Patch UI against the new derived or persistence contract.
6. Add or update tests.
7. Verify the changed slice before moving on.

This is better than doing:

- all schema first
- all APIs later
- all UI later

because that approach creates long stretches where the repo is internally inconsistent.

## Concrete Backlog

## Milestone 0: Repo Prep (non-blocking)

These tasks are useful but should not gate real work. Do them opportunistically during the first milestone that touches the relevant area.

- Add `.env.example` when first touching environment config.
- Add a concise schema map to `docs/architecture.md` when first touching the schema.
- Add a short “current builder assumptions” note when first touching derivation.

## Milestone 1A: Core Derived Character (thin cut)

### Goal

Create the first canonical derivation module and migrate the highest-value calculations out of UI: total level, proficiency bonus, adjusted ability scores, and a thin HP summary. This milestone is deliberately narrow so it lands fast, proves the pattern, and does not accidentally expand into schema work.

### Implementation Note

Treat Milestone 1A as a derivation extraction, not a persistence redesign.

The current repo can already support:

- total level
- proficiency bonus
- adjusted ability scores from currently modeled bonuses
- an HP summary derived from class hit dice, Constitution, stored HP max, and recorded HP rolls

The current repo does not yet cleanly support a full final model for:

- ASI-derived ability bonuses as first-class rows
- all background-derived mechanical bonuses
- replacing stored `hp_max` with fully canonical computed HP

So the 1A contract should be:

- centralize derivation for the core fields that already exist in the model
- label HP clearly as a shared summary over current persistence
- leave full ASI/background normalization and final HP authority for later milestones

### Tasks

- Introduce `src/lib/characters/derive-character.ts`.
- Define initial `CharacterAggregate` as the minimum raw shape needed for Milestone 1A, preferably using the existing normalized build context rather than inventing a second full loading path.
- Define initial `DerivedCharacter` with:
  - total level
  - proficiency bonus
  - base ability scores
  - adjusted ability scores from currently modeled bonuses
  - HP summary including:
    - stored max HP
    - Constitution modifier
    - hit dice by class
    - expected or explainable HP total from current rows where possible
    - warnings when stored HP and explainable HP diverge
- Extract shared primitives now split across `build-context.ts`, legality helpers, and UI:
  - ability modifier
  - total level
  - proficiency bonus
  - adjusted ability score calculation
- Refactor existing progression helpers to reuse those shared primitives where possible, but do not broaden Milestone 1A into saves, skills, spellcasting, or feature derivation.
- Move total level, proficiency bonus, adjusted ability score, and HP interpretation logic out of `StatBlockView.tsx` and any other ad hoc UI calculations.
- Refactor `runLegalityChecks` to compute the thin derived character once and consume it for the fields it already checks, especially adjusted ability scores and total level.
- Add a small loader or helper seam for character surfaces that need both raw and derived state, without changing the existing write contract.
- Keep existing persistence and API write contracts unchanged.

### Suggested Execution Order

1. Add `derive-character.ts` with the initial types and pure derivation helpers.
2. Refactor `build-context.ts` to call the new shared helpers instead of owning duplicate core math.
3. Update `runLegalityChecks` to use the new thin derived result.
4. Update `StatBlockView.tsx` to render derived values instead of recomputing them locally.
5. Expose the thin derived result from character loaders or API responses only where it helps consumers converge on the shared path.
6. Update and expand tests around the new derivation contract.

### Explicit Non-Goals

- No schema migration for ASIs, feat provenance, or feature-option persistence.
- No full replacement of `hp_max` persistence with computed HP.
- No full `DerivedCharacter` shape for saves, skills, spellcasting, subclass timing, or unlocked features.
- No broad rework of the wizard flow beyond consuming the shared thin derivation where it is easy and low risk.

### File Areas

- `src/lib/characters/build-context.ts`
- `src/lib/characters/derive-character.ts`
- `src/lib/legality/engine.ts`
- `src/components/character-sheet/StatBlockView.tsx`
- character page loaders as needed

### Acceptance Criteria

- One shared derivation path exists for the core fields.
- UI and legality read the same total level, adjusted ability scores, proficiency bonus, and HP summary.
- `StatBlockView.tsx` no longer computes these values ad hoc.
- The implementation does not require any schema change to land.
- Existing tests pass with updated assertions.

## Milestone 1B: Derived Character Expansion (pre-schema)

### Goal

Extend the derivation module to cover saves, skills, spellcasting summary, subclass state, and feature lists — still without changing persistence.

### Tasks

- Extend `DerivedCharacter` to include:
  - saving throws
  - skill proficiencies and bonuses
  - spellcasting summary (DC, attack mod, slot progression, known/prepared counts)
  - subclass state and timing
  - unlocked features list
  - feat / ASI slot tracking
  - warnings and blocking issues
- Move remaining ad hoc calculations out of UI components.
- Define explicit 2014 rules assumptions in code comments and tests:
  - multiclass spell slot math
  - pact magic treatment
  - prepared vs known vs spellbook casters
  - subclass timing
  - ASI cadence
  - species and background bonuses

### File Areas

- `src/lib/characters/derive-character.ts`
- `src/lib/legality/engine.ts`
- `src/components/character-sheet/StatBlockView.tsx`
- wizard helpers as needed

### Acceptance Criteria

- The full `DerivedCharacter` shape is populated.
- Character page, stat block, legality engine, and review summary all consume the same derived source.
- No major mechanical value is calculated ad hoc in UI.

## Milestone 2: Character Choice Schema Phase 1

### Goal

Normalize the highest-value recurring choices first.

### Tasks

- Add migration for:
  - `character_asi_choices`
  - `character_feat_choices`
  - `character_spell_selections`
- Add matching TypeScript types in `src/lib/types/database.ts`.
- Add backfill migration logic from `character_choices`.
- Update character load route to fetch the new tables.
- Update character save route to write the new tables.
- Keep `character_choices` temporarily for backward compatibility if necessary.

### File Areas

- `supabase/migrations/`
- `src/lib/types/database.ts`
- `src/app/api/characters/[id]/route.ts`
- `src/lib/snapshots.ts`

### Acceptance Criteria

- Feats, spells, and ASI decisions no longer rely on the old generic table for current code paths.
- Existing character data can still be loaded.

## Milestone 3: Character Choice Schema Phase 2

### Goal

Normalize the choice systems needed for guided workflows.

### Tasks

- Add migration for:
  - `character_language_choices`
  - `character_tool_choices`
  - `character_feature_option_choices`
- Add database types and route support.
- Extend snapshots to capture these rows.
- Add loaders that aggregate these rows into the canonical raw character state.

### Acceptance Criteria

- Language, tool, and feature-option decisions are persistable.
- The derivation layer can consume them.

## Milestone 4: Derived Character Provenance Expansion

### Goal

Use the richer persistence model to compute more accurate mechanics and provenance once explicit choice tables and content structures exist.

### Tasks

- Extend derivation to include:
  - full proficiency aggregation
  - language and tool provenance
  - ASI / feat provenance
  - spell preparation vs known spell state
  - feature-option grants
- Replace temporary assumptions in wizard helpers.
- Remove duplicated helper logic that no longer fits the model.

### Scope Note

This milestone is intentionally different from Milestone 1B.

- Milestone 1B expands the shared derived shape while the app still relies on the current persistence model.
- Milestone 4 deepens that derivation after Milestones 2, 3, and 5 provide explicit persisted choices and richer content data.

### Acceptance Criteria

- Derived output explains not only totals but origins.
- Build audit data is usable for review UI.

## Milestone 5: Content Model Phase 1

### Goal

Add the content types needed for reusable class option systems.

### Tasks

- Add migrations and types for:
  - `languages`
  - `tools`
  - `fighting_styles`
  - `feature_option_groups`
  - `feature_options`
- Multiclass prerequisite data on the `classes` table (`multiclass_prereqs`) already exists from the initial schema and is consumed by the legality engine, so no extra schema work is needed; confirm seed coverage when the level-up flow is reworked in Milestone 9.
- Add content API routes or extend existing admin routes.
- Add option-group-aware derivation hooks.
- Add minimal admin UI support for these new content types.

### Acceptance Criteria

- The app can define “choose N from this set” systems as data.
- Language and tool selections can be driven by content instead of raw strings.
- Multiclass ability score prerequisites are stored per class and queryable.

## Milestone 6: Creation Wizard Rewrite Phase 1

### Goal

Make level 1 character creation complete enough to be called usable.

### Tasks

- Replace placeholder local context in `CharacterNewForm`.
- Load real campaign allowlist and ruleset data into the creation flow.
- Rework creation persistence to use new explicit choice tables.
- Add guided steps for:
  - class skill choices
  - background skill choices
  - language choices
  - tool choices
  - feat or granted background feat display
  - spell selections for supported caster flows
- Add summary page showing derived outputs before save.

### Acceptance Criteria

- A level 1 character can be created end-to-end with persisted explicit choices.
- The saved character renders correct derived output on its page.

## Milestone 7: Equipment Model Phase 1

### Goal

Add enough item and equipment structure to support sheet calculations and starting gear.

### Tasks

- Add migrations and types for:
  - `equipment_items`
  - `weapons`
  - `armor`
  - `shields`
  - `starting_equipment_packages`
  - `character_equipment_items`
- Add basic admin support and minimal content APIs.
- Add derivation logic for:
  - equipped armor
  - shield state
  - AC calculation based on equipment
- Add creation-flow support for choosing starting equipment.

### Acceptance Criteria

- AC can be derived from actual equipment data.
- Starting gear is selectable and persisted.

## Milestone 8: Sheet Overhaul

### Goal

Replace the current simplified stat block with a trustworthy derived sheet.

### Dependency Note

AC explanation requires Milestone 7 (equipment model). If equipment is not yet landed, display AC with an explicit "unarmored / equipment not yet modeled" qualifier rather than faking it. All other sheet fields can be completed independently.

### Tasks

- Refactor `CharacterSheet` and related cards to consume canonical derived state.
- Display:
  - adjusted abilities
  - save bonuses
  - skill bonuses
  - AC explanation (or unarmored placeholder, see dependency note)
  - languages and proficiencies
  - feat and ASI history
  - spell save DC and attack bonus
  - class features and option choices
- Add a DM review audit section.

### Acceptance Criteria

- The sheet reflects actual persisted rules state.
- A DM can review the build without inspecting raw rows.

## Milestone 9: Level-Up Rewrite

### Goal

Make level-up a proper additive progression workflow.

### Tasks

- Rework `LevelUpWizard` so it operates in terms of new explicit choice tables.
- Make level-up additive instead of broad record replacement.
- Add guided handling for:
  - multiclass selection
  - subclass unlocks
  - ASI vs feat
  - new feature options
  - spell updates
  - HP gain
- Add derived before/after diff on the review step.

### Acceptance Criteria

- Leveling a character persists exactly what the new level added.
- Multiclass and spellcasting updates are handled correctly for supported systems.

## Milestone 10: Content Import Expansion

### Goal

Support broader content growth without hand-maintained SQL.

### Tasks

- Modularize `scripts/seed-srd.ts`.
- Add import scripts for new content categories.
- Add content validation script checking:
  - missing foreign keys
  - invalid group references
  - broken progression rows
  - duplicate option definitions
- Add import documentation.

### Acceptance Criteria

- New content families can be loaded repeatably.
- Structural problems are caught before app usage.

## Milestone 11: Hardening and Regression

### Goal

Stabilize the app for repeated use.

### Tasks

- Expand unit tests for derivation and legality.
- Add integration tests for create, edit, and level-up persistence.
- Add fixture-based character regression tests.
- Add migration tests for backfills.
- Improve UX around save states and blocked decisions.

### Acceptance Criteria

- Representative builds persist and render consistently.
- Refactors do not silently break builder behavior.

## Prioritized Execution Order

If the goal is fastest path to a usable creator, use this order:

1. Milestone 1A — thin derivation core (fast, proves the pattern)
2. Milestone 2 — explicit persistence for ASI, feats, spells
3. Milestone 1B — expand derivation over the current model
4. Milestone 3 — language, tool, and feature-option persistence (needed before creation wizard)
5. Milestone 5 — content model for option groups and multiclass prerequisites
6. Milestone 4 — provenance-rich derivation using richer persistence
7. Milestone 6 — creation wizard rewrite
8. Milestone 7 — equipment model
9. Milestone 8 — sheet overhaul (can start before M7, but AC needs equipment)
10. Milestone 9 — level-up rewrite
11. Milestone 10 — content import expansion
12. Milestone 11 — hardening and regression

### Why this order differs from the conceptual roadmap

- **1A before 1B**: The full `DerivedCharacter` shape is too large for one pass. Landing core stats first gives immediate value and lets 1B benefit from lessons learned during schema work in Milestone 2.
- **Milestone 3 restored**: The original prioritized order skipped Milestone 3, but Milestones 5 and 6 both need language/tool/feature-option persistence. Without it, the creation wizard would have to improvise storage for those choices.
- **1B after Milestone 2**: Expanding derivation after explicit choice tables exist means derivation can consume real typed data instead of guessing at the old generic table's shape.
- **Milestone 4 after Milestone 5**: Provenance-rich derivation is a second derivation pass that benefits from content model tables (languages, tools, option groups) being available.

## Suggested Slice Sizes for Codex

To keep token usage and verification manageable, each Codex run should usually target one of these slice sizes:

### Small Slice

- 1 migration
- 1 type update
- 1 route update
- 1 helper update
- tests for that exact change

### Medium Slice

- one coherent choice family end-to-end
  - example: feat persistence
  - schema + route + derivation + UI + tests

### Large Slice

- one full workflow rewrite
  - example: level 1 creation flow
- only when earlier foundations are already stable

Avoid slices that touch:

- schema
- all routes
- all derivation
- all UI

at the same time. Those will be harder to reason about and harder to resume safely later.

## Definition of “Usable”

The app should only be considered a usable 2014 character creator once all of the following are true:

- Level 1 creation works end-to-end through guided flow.
- Characters persist explicit rule choices.
- Derived sheet values are trustworthy.
- Feat, spell, and option choices are explainable from persisted state.
- DM review can inspect legality and provenance clearly.
- AC, proficiencies, and spellcasting no longer rely on placeholder logic.

## Recommended First Build Target

If implementation starts immediately, the first serious target should be:

1. Core derivation module — ability scores, proficiency bonus, HP (Milestone 1A).
2. Explicit persistence for ASI, feats, and spells (Milestone 2).
3. Expanded derivation — saves, skills, spellcasting, features (Milestone 1B).
4. Explicit persistence for languages, tools, and feature options (Milestone 3).
5. Content model for option groups and multiclass prerequisites (Milestone 5).
6. Provenance-rich derivation over the normalized model (Milestone 4).
7. Creation wizard rewrite for level 1 (Milestone 6).
8. Sheet refactor to render derived output (Milestone 8).

That produces the fastest route from current repo state to something that is meaningfully closer to a real character creator, without leaving persistence gaps that force later workarounds.

## Final Note

This roadmap assumes sequential implementation by Codex across multiple runs. The best results will come from treating each milestone as a bounded contract:

- update schema
- update types
- update loaders and saves
- update derivation
- update UI
- update tests

and only then move on.
