# Batch Eberron Closeout Audit

Date: 2026-04-26

This document is the Slice E7 closeout gate for Batch Eberron. It answers:

1. Which Eberron slices were delivered?
2. Which ERftLW player-facing options are now covered by the app?
3. What remains outside the current character-builder domain?
4. What does Batch 6 inherit?

## Slice Delivery Status

| Slice | Description | Status |
| --- | --- | --- |
| E1 | ERftLW coverage audit and guardrails | Delivered |
| E2 | Missing species and lineages | Delivered |
| E3 | Dragonmarked cleanup | Delivered |
| E4 | House Agent, Revenant Blade, and required equipment hooks | Delivered |
| E5 | Artificer infusions as feature options | Delivered |
| E6 | Eberron regression matrix | Delivered |
| E7 | Batch Eberron closeout | Delivered |

## Delivered Player-Options Baseline

Batch Eberron completed the practical `Eberron: Rising from the Last War` player-options surface that fits the current app domain.

### Classes and subclasses

- Artificer remains the ERftLW class anchor, with Alchemist, Artillerist, and Battle Smith support.
- The related `Exploring Eberron` Maverick subclass remains supported where it was already wired into the app.
- Artificer infusions are now modeled as reusable feature options through `artificer:infusion:2014`.

### Species and lineages

- Warforged, Changeling, Orc, Kalashtar, Shifter, Beasthide Shifter, Longtooth Shifter, Swiftstride Shifter, Wildhunt Shifter, Bugbear, Goblin, and Hobgoblin are seeded under ERftLW where applicable.
- Canonical dragonmarked species rows use `Species (Mark of X)` naming with lineage metadata.
- Legacy `Mark of X Species` rows were purged rather than carried as compatibility aliases.

### Backgrounds, feats, and equipment

- House Agent is seeded with Investigation and Persuasion, House Connections, starting equipment, and a documented mixed tool-or-language choice placeholder.
- Revenant Blade is seeded with an elf-lineage prerequisite and structured benefits.
- Double-bladed scimitar is seeded for equipment display and feat support.
- Aberrant Dragonmark remains wired through the typed feat spell-choice path.

## Regression Coverage

The batch is backed by two Eberron-specific test files:

- `test/eberron-content-audit.test.ts` pins the expected ERftLW content rows and helper coverage across migrations and source helpers.
- `test/eberron-regression-matrix.test.ts` proves representative Eberron builds can pass legality, derived sheet, source allowlist, and DM-review readiness checks.

The E6 matrix covers:

| Build | Coverage |
| --- | --- |
| Warforged Artificer with infusions | Infusion count legality, Integrated Protection, poison resistance, descriptive replication handling |
| Kalashtar caster | Quori language, psychic resistance, spellcasting, descriptive Mind Link |
| Shifter martial | Shifting traits surfaced descriptively, martial class resources, derived AC |
| Dragonmarked spellcaster | Free trait-granted spells and `Spells of the Mark` display without consuming normal picks |
| House Agent character | Background skills plus mixed language/tool choices |
| Revenant Blade eligible build | Elf-lineage feat prerequisite and descriptive combat riders |
| ERftLW omitted from allowlist | Source allowlist blocks Eberron species/class content |

## Supported Automation vs Descriptive Mechanics

The current app automates stable creation, persistence, legality, and derived-sheet mechanics. It intentionally does not automate combat-time or broad catalog behavior where the app does not yet have a general model.

Supported automation includes:

- Source allowlisting for ERftLW content.
- Species, class, background, feat, equipment, spell, and feature-option selection.
- Artificer infusion known-count legality and minimum-level prerequisites.
- Static dragonmark trait-granted spell display.
- Dragonmark spell-list expansion in spell pickers.
- Warforged Integrated Protection AC bonus.
- Elf-lineage prerequisite enforcement for Revenant Blade.

Descriptive-only mechanics include:

- House Agent mixed tool-or-language choice.
- Revenant Blade combat riders and ability-choice rider.
- Double-bladed scimitar special rider automation.
- Shifter shifting timing, temporary hit points, and rest tracking.
- Kalashtar Mind Link interaction behavior.
- Warforged rest and poison-save riders beyond the currently derived resistance/AC pieces.
- Per-infusion combat automation, infused-item attunement, daily prepared-infusion resource tracking, and replicated-item active effects.

## Remaining ERftLW gaps outside the current app domain

These are intentionally not Batch Eberron backlog. They require broader app-domain expansion before they make sense as implementation tasks.

- Last War history, faction lore, dragonmarked-house lore, and gazetteer material.
- Vehicles such as lightning rail, airships, elemental galleons, and soarsleds.
- Adventure and module content.
- NPC and monster stat blocks.
- Full magic item catalog support. Batch Eberron only references magic items where Artificer infusions descriptively replicate them.
- DM tooling for campaign frames, encounter tables, treasure tables, maps, and setting-specific prep aids.
- Visual-only assets and book presentation material.

## Batch 6 Handoff

Batch 6 begins with a known-complete ERftLW player-options baseline for the current app domain. It should improve repeatability, validation, import tooling, and admin maintainability rather than re-open sourcebook-completion work.

Explicit Batch 6 entry guidance from Batch Eberron:

1. Treat ERftLW player options as a regression baseline, not an open ingestion backlog.
2. Keep combat-time trait/feat/infusion riders descriptive until a general combat automation model exists.
3. Keep broad magic-item catalog support outside content-admin/import work unless a future batch explicitly expands the equipment domain.
4. Use `output/eberron-content-audit.md` and `test/eberron-content-audit.test.ts` as the content inventory guard.
5. Use `test/eberron-regression-matrix.test.ts` as the representative build guard when importer/admin changes touch sources, feature options, species, feats, spells, backgrounds, or equipment.

## Verification Command Set

Slice E7 should be verified with:

```bash
node --import tsx --test test/eberron-closeout.test.ts
node --import tsx --test test/eberron-content-audit.test.ts test/eberron-regression-matrix.test.ts test/eberron-closeout.test.ts
npm test
npm run build
```

## Closeout Result

Batch Eberron is effectively complete. Player-facing ERftLW character options that fit the current character-builder domain are selectable, persistable, visible in derived state, or explicitly documented as descriptive-only. Remaining ERftLW book content is outside the current app domain and is recorded as such rather than hidden as future debt.
