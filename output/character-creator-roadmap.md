# Dungeon & Database Character Creator Roadmap

This document turns the repo analysis into an execution plan for making the app a usable D&D 2014 character creator.

## Current Status

This roadmap now has meaningful implementation behind it.

- Batch 1 is effectively complete.
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

The intended next step is Batch 3 content-model expansion, structured as the execution slices described in the Batch 3 section below.

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

### Risks

- This batch becomes messy if attempted before explicit choice tables exist.
- A flexible “full sheet editor” should not become the primary path before guided rules flows are correct.

### Exit Criteria

- A player can create a level 1 character through guided steps without relying on the raw sheet editor.
- A player can level up through a guided flow and the app persists exactly what changed.
- Multiclassing and spellcasting no longer rely on first-class-only assumptions.

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

### Risks

- AC and equipment presentation depend on Batch 3 and Batch 4 support.
- Without provenance, review becomes harder even if totals are correct.

### Exit Criteria

- The sheet reflects derived rules accurately enough to use in play.
- DM review can rely on the sheet and audit summary rather than manual DB inspection.

## Batch 6: Content Ingestion and Admin Tooling

### Objective

Make content expansion sustainable instead of relying on ad hoc patches and narrow seed scripts.

### Why

The seed pipeline currently imports only a subset of content types, and the admin UI is not yet shaped for the broader content model needed by the builder.

### Scope

- Import pipeline
- Admin UI
- Content validation
- Source/version handling

### Tasks

- Split content import into modular importers by entity type.
- Extend import support for the new content categories from Batch 3.
- Add content integrity checks:
  - missing foreign keys
  - invalid progression arrays
  - orphaned option groups
  - spell list mismatches
  - duplicate option records
- Expand admin UI to manage:
  - option groups
  - feature options
  - tools
  - languages
  - items
  - armor
  - weapons
  - starting packages
- Add preview and validation before publishing content changes.
- Add bulk source import and amendment tools.

### Risks

- Weak content validation will surface as builder bugs.
- Importing more source content before the model is ready will increase data debt.

### Exit Criteria

- New content families can be imported and maintained without one-off SQL work.
- Admin UI supports all rules-significant content categories.
- Validation catches structural content issues early.

## Batch 7: Hardening, Tests, and Usability

### Objective

Make the app reliable enough for actual campaign use.

### Why

A sophisticated builder that is hard to trust is not useful. The repo already has some legality tests, but broader behavioral coverage is needed.

### Scope

- Unit tests
- Integration tests
- Seed and migration validation
- UX polish

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
- Add `.env.example` and setup documentation.

### Exit Criteria

- Representative build archetypes persist and reload accurately.
- Derived outputs are stable across refactors.
- The app explains invalid states clearly.

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
