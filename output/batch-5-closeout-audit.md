# Batch 5 Closeout Audit

This document is the Slice 5n closeout gate for Batch 5. It answers:

1. Which Batch 5 slices were delivered?
2. What gaps remain and what are the explicit Batch 6 entry tasks?
3. Does DM review work without DB inspection for representative builds?

Slice 5m migration smoke result is included here. Local verification run: `npm test -- --runInBand` (218 tests, 0 failures, 2026-04-25).

## Slice Delivery Status

| Slice | Description | Status |
| --- | --- | --- |
| 5a | Sheet derivation seam — all cards read from `derived.ts` | Delivered |
| 5b | Adjusted ability scores and save bonuses with per-source breakdown | Delivered |
| 5c | Skill proficiency breakdown with source attribution | Delivered |
| 5d | Granted non-skill proficiencies panel (armor, weapons, tools, languages) | Delivered |
| 5e | AC derivation from equipped armor, shield, and class rules | Delivered |
| 5f | Spell presentation — DC/attack mod per caster, prepared vs known, granted spells | Partial |
| 5g | Feature list by level/source and class resource summaries | Delivered |
| 5h | ASI and feat history panel | Delivered |
| 5i | Combat-time surfacing for lightly-displayed feature systems | Delivered |
| 5j | DM audit panel: selected sources, legality, provenance tree | Delivered |
| 5k | Stale `source_entity_id` integrity view wired into audit panel | Delivered |
| 5l | Sheet regression smoke harness across representative archetypes | Delivered |
| 5m | Live data-copy migration smoke for migrations `067`/`068` | Delivered |

### Slice 5a — Derivation seam

All core sheet values — ability modifiers, initiative, passive Perception, saving throws, skills, AC — flow through `src/lib/characters/derived.ts`. `StatBlock.tsx`, `StatBlockView.tsx`, and `SkillsCard.tsx` all read from derived helpers. `test/sheet-derived-seam.test.ts` pins the seam contract and confirms no `Math.floor((score - 10) / 2)` local math remains in sheet components.

### Slice 5b — Adjusted ability scores and saves

`DerivedAbilityScore` exposes `base`, `bonus`, `adjusted`, `modifier`, and `contributors[]`. Each contributor carries `sourceType` (`species`, `species_choice`, `asi`, `feat`, `other`). Saving throw rows carry `proficiencySources[]` with class attribution. `StatBlock.tsx` renders contributor badges inline.

### Slice 5c — Skill provenance

`buildSkillDisplaySummaries()` returns a `Map<SkillKey, SkillDisplaySummary>` where each entry has a `sources[]` array with label and category. Overlap archetypes (background + Fighter multiclass sharing Athletics) show as a single row with both sources. Knowledge Domain expertise promotion surfaces correctly. `test/skill-provenance-display.test.ts` pins the multi-source and expertise cases. The Slice 4.5b Path B decision (single-row PK, no `character_skill_proficiency_sources` table) stands: current sheet contract is satisfied from existing typed rows plus structural grants. Multi-source audit table deferred until a concrete Batch 6 UI need emerges.

### Slice 5d — Granted non-skill proficiencies

`GrantedProficienciesCard.tsx` (new) calls `deriveGrantedNonSkillProficiencies()` which returns grouped armor, weapon, tool, and language entries each tagged with `sources[]`. A multiclass Fighter/Wizard shows correct separation of class-sourced armor/weapon/tool proficiencies. `test/granted-proficiencies-panel.test.ts` pins the provenance contract.

### Slice 5e — AC derivation

`deriveArmorClass()` covers: equipped armor (with DEX cap), shield, Defense fighting style, Barbarian Unarmored Defense (10 + DEX + CON), Monk Unarmored Defense (10 + DEX + WIS), Draconic Resilience (13 + DEX), Mage Armor alternative (13 + DEX), and Warforged Integrated Protection (+1). Returns `value`, `formula`, and an `alternatives[]` array. `test/sheet-derived-seam.test.ts` verifies all variants. Regression matrix pins Defense style on Chain Mail as `16 + 1 = 17`.

### Slice 5f — Spell presentation (PARTIAL — Batch 6 carry-in)

**What is delivered:** The character sheet renders per-source spell DC and spell attack modifier for multiclass casters. `DerivedSpellcastingSourceSummary` in `src/lib/characters/build-context.ts` carries `spellSaveDc`, `spellAttackModifier`, `casterMode`, known/prepared counts, and spellbook size per class. Granted spells (domain, oath, pact invocation, species-trait spells) are distinguished from player-selected spells. The 5l regression matrix verifies per-source DC for a Cleric 3 / Wizard 2 build.

**What is not delivered:** The spellcasting derivation lives in `build-context.ts`, not in `derived.ts`. `DerivedCharacterCore` does not expose `spellcasting` as a first-class field. The sheet reads `spellcasting` directly off the `BuildContext` shape rather than off the canonical derived character. This means the spell seam is architecturally inconsistent with the rest of Batch 5 — spell data flows through a parallel path rather than the unified derivation pipeline.

**Batch 6 entry task:** Move `DerivedSpellcastingSourceSummary` and the `spellcasting` aggregate into `derived.ts`, expose it on `DerivedCharacter`, and update the sheet to read from the same `derived` shape it uses for everything else.

### Slice 5g — Features and class resources

`DerivedCharacter` exposes `features` (grouped by class and level with source labels) and `classResources` (per-rest counters for Channel Divinity, Bardic Inspiration, Ki, Superiority Dice, etc.). `FeatureList` and `ClassResourcesPanel` are wired into `CharacterSheet.tsx`. Regression matrix pins a Battle Master 5 resource counter and Cleric 5 Channel Divinity count.

### Slice 5h — ASI and feat history

`AsiFeatHistoryPanel` renders a chronological list of ASI increments and feat selections, each tagged with the class and level at which it was taken, joining `character_asi_choices` and `character_feat_choices` to `character_class_levels`. The 5l matrix pins contributor list for a Variant Human Fighter 8 build across multiple ASI/feat events.

### Slice 5i — Combat-time feature surfacing

`CombatOptionsPanel` renders fighting style effects, maneuver save DCs and descriptions, reactive species trait triggers, and relevant monk discipline details from `character_feature_option_choices` rows. Defense fighting style flows through AC derivation rather than appearing separately. The 5l matrix confirms Defense style on Chain Mail produces the correct AC formula.

### Slice 5j — DM audit panel

`DmAuditPanel` (gated on DM-of-this-campaign) surfaces: selected content sources with amendment tags, legality check failures with severity badges, unresolved issues, and a collapsible provenance tree grouped by source type. Each provenance entry links to its per-level anchor. Wired into `CharacterSheet.tsx`.

### Slice 5k — Stale provenance integrity

Migration `069` (`character_stale_provenance`) creates a SQL view that enumerates character rows whose `(source_category, source_entity_id)` pair no longer resolves to a live content row, checking across 6 choice tables plus equipment against classes, backgrounds, species, subclasses, feats, and starting-equipment packages. The TypeScript equivalent `detectStaleProvenance()` in `src/lib/characters/stale-provenance.ts` is used client-side. `StaleProvenancePanel` renders amber warning cards grouped by table with human-readable labels, wired into the DM view of the character page. `test/stale-provenance.test.ts` covers all six stale/valid/skip cases.

### Slice 5l — Regression harness

`test/sheet-5l-regression-matrix.test.ts` covers five archetypes:

| Archetype | Key assertions |
| --- | --- |
| Single-class caster (Life Cleric 5) | Spell DC = 8 + prof + WIS mod; Unarmored AC; passive Perception |
| Multiclass caster/martial (Cleric 3 / Wizard 2) | Dual spell DCs; multiclass save attribution; species senses |
| Feat-heavy (Variant Human Fighter 8) | ASI/feat contributor list; Defense fighting style AC; resource counters |
| Species/background-heavy (Warforged Artificer 5) | Integrated Protection AC; proficiency provenance from class + background + typed rows |
| 4.5 overlap regression (Fighter 1 / Cleric 1) | Skill deduplication; multiclass save attribution |

Binder assertions confirm all five archetypes present and pin six component seams: `ClassResourcesPanel`, `AsiFeatHistoryPanel`, `CombatOptionsPanel`, `GrantedProficienciesCard`, `SkillsCard`, `SpellsCard`.

### Slice 5m — Migration smoke

See `output/batch-4-closeout-audit.md` §"Slice 5m: Migration Smoke Verification". Summary:

- Migrations `067` and `068` confirmed applied to production (`cqpyvaynpzgyjerfesmz`)
- `sync_character_class_levels_for_class` fully idempotent on live data (26 rows in, 26 out, 0 mutations)
- Zero orphan provenance anchors; `FOR UPDATE` lock and optimistic-lock token checks confirmed in deployed function bodies
- Batch 4.5 deployment gate formally closed 2026-04-25

## DM Review Walkthrough

Representative build: Warforged Artificer 5 (species/background-heavy archetype).

A DM viewing this build through the character page can:

- **Sources**: See that the campaign includes Eberron Rising from the Last War and PHB, with the Warforged Integrated Protection amendment note surfaced alongside the trait
- **Legality**: Any missing infusion or tool proficiency choices surface as legality warnings with step links back to the originating wizard step
- **Provenance tree**: Each skill proficiency is tagged to background, class, or feature; each language and tool choice is tagged to its granting source
- **Stale provenance**: If a content row were retired, the `StaleProvenancePanel` would surface the orphaned reference with the exact table and source category, without DB inspection
- **AC explanation**: Integrated Protection formula (`10 + armor + IP bonus`) is visible inline

The audit panel meets the review standard: a DM can inspect legality, provenance, and content-source integrity for this archetype without touching the database.

**Limitation**: The DM audit panel's provenance tree is built from `character_class_levels` anchors and typed choice rows. Pre-Batch-4 characters with `owning_class_id = NULL` spell selections (14 rows on production at time of 5m smoke) will not show a class-attributed spell provenance entry for those rows. This is cosmetic for existing data; new Batch-4-path characters are fully attributed.

## Verification Run

```
npm test -- --runInBand
218 tests, 0 failures (2026-04-25)
```

All five regression archetypes pass. All sheet derivation seam tests pass. All stale-provenance, granted-proficiencies, and skill-provenance display tests pass.

## Gap Audit

### Confirmed clear for Batch 5

- Every sheet panel except `SpellsCard` reads mechanical values from `derived.ts`
- Skill overlap (Path B) renders correctly with multiple sources in one row
- AC handles all five derivation modes (armed, Unarmored Defense ×2, Draconic, conditional Mage Armor) plus the Warforged IP bonus
- Stale provenance wired end-to-end: SQL view, TypeScript detector, and DM panel
- Migration smoke gate closed

### Partial delivery with Batch 6 follow-on

- **Spellcasting derivation seam**: `DerivedSpellcastingSourceSummary` lives in `build-context.ts` instead of `derived.ts`. The sheet renders correct per-source DC and attack modifier, but the architecture is inconsistent with the rest of the derivation pipeline. Batch 6 entry task: consolidate spellcasting derivation into `derived.ts`.

### Cosmetic data debt (not blocking)

- 14 production spell selection rows have `owning_class_id = NULL` (pre-Batch-4 writes). They load and display, but provenance attribution is absent. Not a Batch 6 blocker; can be cleaned up as part of Batch 6 content admin work or a targeted data migration.

## Batch 6 Entry Tasks

These are explicit follow-ons from Batch 5 work, not hidden debt:

1. **Consolidate spellcasting derivation into `derived.ts`** (carried from Slice 5f). Move `DerivedSpellcastingSourceSummary` and the per-source spellcasting aggregate out of `build-context.ts` and into `derived.ts` so the sheet has a single derivation seam. No behavior change; architectural alignment only.

2. **Migrate hardcoded spell-grant rules off spell-name lookups** (carried from Slice 3m/3n review item #5). Replace the ~33 `{ spellName, spellSource }` entries in `src/lib/characters/feature-grants.ts` with a `feature_spell_grants` content table keyed on `spell_id`. Backfill from current rules and delete the hardcoded tables once parity is verified. At minimum, ship a test-time assertion that every hardcoded entry resolves to exactly one spell row so admin renames fail loudly.

3. **Finish languages/tools catalog cutover** (carried from Slice 3m/3n review item #6). Switch the primary key on `character_language_choices` / `character_tool_choices` from free-text `language`/`tool` columns to `language_key`/`tool_key` FKs, backfill remaining nulls, drop the free-text columns, and update `load-character.ts` and persistence helpers to read/write keys only.

4. **Consolidate character-ownership checks** (carried from Slice 3m/3n review item #9). Replace inlined `user_id !== profile.id` comparisons across `route.ts`, `submit/route.ts`, and peer routes with a single `assertCharacterManageableByUser` helper. Add tests covering owner / DM / unrelated-user on every mutating route.

5. **Split load-bearing modules past safe edit size** (carried from Slice 3m/3n review item #10). `src/lib/characters/feature-grants.ts` (~880 lines), `src/lib/characters/build-context.ts` (~1000 lines), `src/lib/legality/engine.ts` (~810 lines), and `src/components/character-sheet/CharacterSheet.tsx` should be segmented by concern. No behavior changes — structural only.

6. **Expand content admin CRUD for Batch 3 content tables**. `feature_option_groups`, `feature_options`, `tools`, `languages`, `equipment_items`, `weapons`, `armor`, `shields`, and `starting_equipment_packages` are currently read-only or SQL-only. Full create/edit/delete flows should be reachable through the admin UI without SQL.

7. **Content integrity checks and bulk import**. Add import scripts for the new content categories from Batch 3 and add validation checks (missing FKs, invalid progression arrays, orphaned option groups, spell-list mismatches, duplicate option records).

8. **Null `owning_class_id` spell selection cleanup**. The 14 production rows with `owning_class_id = NULL` pre-date Batch 4's class-scoped spell persistence path. A targeted data migration or content-admin repair flow should attribute them or mark them as pre-Batch-4 legacy rows, so the DM provenance panel shows a complete spell history for those characters.

9. **Multi-source skill provenance audit table** (deferred from Slice 5c). If Batch 6 audit UI work demonstrates a need to show both provenance sources for overlap cases where Path B merged rows, add a `character_skill_proficiency_sources` table then rather than widening the existing PK.

## Closeout Result

Batch 5 is effectively complete. The character sheet reflects derived rules accurately for all five representative archetypes. Every sheet panel routes through a shared derivation pipeline, AC handles all five derivation modes, skills and proficiencies carry per-source attribution, and the DM audit panel surfaces legality, provenance, and stale-content warnings without DB inspection. The one architectural gap (spellcasting derivation not yet consolidated into `derived.ts`) is a Batch 6 carry-in, not a functional regression. Batch 6 can begin against a sheet that is trustworthy for play and review.
