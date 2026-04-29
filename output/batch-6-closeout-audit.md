# Batch 6 Closeout Audit

Date: 2026-04-29

This document is the Slice 6i closeout gate for Batch 6. It answers:

1. Which Batch 6 slices were delivered?
2. Did Batch 6 close the Batch 5 carry-ins or explicitly defer them?
3. Can normal content work now use admin UI or importer paths instead of one-off SQL?
4. What does Batch 7 inherit?

## Slice Delivery Status

| Slice | Description | Status |
| --- | --- | --- |
| 6a | Spellcasting derivation seam | Delivered |
| 6b | Feature spell grants as content | Delivered |
| 6c | Language/tool key cutover | Delivered |
| 6d | Access helper closeout and legacy spell attribution | Delivered |
| 6e | Importer modularization and dry-run content validator | Delivered |
| 6f | Admin CRUD for option groups, languages, and tools | Delivered |
| 6g | Admin CRUD for equipment and starting packages | Delivered |
| 6h | Bulk source import and amendment workflow | Delivered |
| 6i | Batch 6 closeout audit | Delivered |

## Batch 5 Carry-ins

| Carry-in | Batch 6 result | Owner | Target date | Reason |
| --- | --- | --- | --- | --- |
| Consolidate spellcasting derivation into `derived.ts` | Closed in 6a | Codex | 2026-04-29 | Per-source spellcasting summaries now flow through the shared derived character shape. |
| Move feature-granted spells off hardcoded spell-name lookups | Closed in 6b | Codex | 2026-04-29 | `feature_spell_grants` rows are keyed to `spells.id`; feature spell derivation no longer depends on spell-name lookup tables. |
| Finish language/tool key cutover | Closed in 6c | Codex | 2026-04-29 | Character language/tool saves, loads, and uniqueness now use catalog keys as the durable identity. |
| Consolidate character access checks | Closed in 6d | Codex | 2026-04-29 | Mutating routes use shared owner/DM/admin helpers instead of repeated inline checks. |
| Attribute pre-Batch-4 null-class spell selections | Closed in 6d | Codex | 2026-04-29 | Legacy null-class spell selections are explicitly marked for DM audit provenance rather than silently disappearing. |
| Expand admin CRUD for Batch 3 content tables | Closed in 6f and 6g | Codex | 2026-04-29 | Languages, tools, feature option groups/options, equipment items, weapons, armor, shields, and starting equipment packages have audited admin write paths. |
| Add content validation and bulk import | Closed in 6e and 6h | Codex | 2026-04-29 | `validateContentImport()` and `content:import` provide dry-run/apply planning with stable diff output. |
| Split load-bearing modules past safe edit size | Deferred to Batch 7 | Codex | 2026-05-15 | Batch 6 removed the riskiest spell-grant and spellcasting pressure, but broad module segmentation is structural hardening rather than content/admin enablement. |
| Multi-source skill provenance audit table | Deferred to Batch 7 | Codex | 2026-05-15 | Path B still satisfies the current sheet/audit contract. Add a separate table only if Batch 7 authenticated QA finds a concrete review gap. |

## Representative Import Dry Run

Representative fixture: PHB language/tool maintenance with one new row, one amended row, three unchanged rows, and one retire candidate.

Command shape:

```bash
npm run content:import -- --fixture output/examples/phb-language-tool-import.json --state output/examples/phb-language-tool-state.json --dry-run --retire-missing
```

Stable closeout summary from the Slice 6h fixture test:

```text
Create 1 | Update 1 | No change 3 | Retire 1
No change  sources    PHB           Player Handbook  -    canonical  -
No change  languages  common        Common           PHB  canonical  -
Update     languages  draconic      Draconic         PHB  amended    amended,amendment_note,name
Create     languages  giant         Giant            PHB  canonical  -
Retire     languages  abyssal       Abyssal          PHB  canonical  retired
No change  tools      smiths_tools  Smith's Tools    PHB  canonical  -
```

The dry-run output is stable enough to paste into closeout notes because it uses non-color-only status labels (`Create`, `Update`, `No change`, `Retire`) and table/key/source columns. Rejected fixtures return validation findings before any apply path runs, and the rejected-import test proves the target snapshot is unchanged.

## Representative Admin Maintenance Walkthrough

The Batch 6 admin surface is `src/components/dm/ContentAdmin.tsx`.

Representative walkthrough:

1. Open the DM content admin surface.
2. Add or edit a language and a tool. The editor uses shared `surface-section` framing and runs `Preview before save` through `validateContentImport()`.
3. Add or edit feature option groups and feature options. The preview catches orphaned groups/options before publish.
4. Add or edit equipment items, weapons, armor, and shields. Shared admin schemas validate damage and AC fields before write.
5. Add or edit starting equipment packages. The package preview resolves item keys and quantities into compact rows before save.
6. Paste a content fixture into `Import diff`. The admin preview groups `Create`, `Update`, `No change`, and `Retire` rows and collapses detailed validation findings until needed.

Content families added in Batch 3 are now maintainable through the admin UI or importer:

- languages
- tools
- feature option groups
- feature options
- equipment items
- weapons
- armor
- shields
- starting equipment packages
- feature spell grants through importer/seeded content

## Regression Matrix

The closeout relies on existing focused matrices rather than a new broad app harness:

| Representative build | Coverage |
| --- | --- |
| Caster with feature-granted spells | `test/feature-grants.test.ts`, `test/feat-spell-options.test.ts`, and `test/eberron-regression-matrix.test.ts` cover feat, feature, species, and dragonmark grants against spell IDs. |
| Language/tool-heavy build | `test/legality-engine.test.ts`, `test/language-tool-key-cutover.test.ts`, and `test/creation-step-selections.test.ts` cover catalog-key persistence, provenance, and legality. |
| Equipment-starting-package build | `test/starting-equipment.test.ts`, `test/equipment-content.test.ts`, and `test/content-admin-6g.test.ts` cover package resolution, concrete item rows, and admin/package validation. |

## Visual QA Notes

Batch 6 admin/content surfaces were reviewed against the Batch 5.5 conventions structurally:

- List and editor surfaces use `surface-section` and `surface-row` rather than a new admin-only visual system.
- Validation detail and import findings use progressive disclosure.
- Import diff status is communicated with text labels, not color alone.
- Neutral `No change` rows are not presented as warnings.
- Package previews render compact resolved rows rather than nested heavy cards.

Authenticated screenshot coverage remains a Batch 7 task because a stable local demo auth/session fixture still does not exist. The structural convention tests cover the Batch 6 surfaces until that browser pass is available.

## Verification Run

Fresh verification run on 2026-04-29:

```bash
node --import tsx --test test/batch-6-closeout.test.ts
# 4 tests, 0 failures

node --import tsx --test test/content-import-validator.test.ts test/content-import-6h.test.ts test/content-admin-6f.test.ts test/content-admin-6g.test.ts test/batch-6-closeout.test.ts
# 27 tests, 0 failures

npm test
# 305 tests, 0 failures

npm run build
# production build completed successfully
```

## Batch 7 Entry Notes

Batch 7 should be a hardening/usability batch, not hidden content-data cleanup.

Concrete entry work:

1. Add an authenticated visual QA fixture and screenshot pass for dashboard, guided creation, character sheet, DM review/audit, and `/dm/content`.
2. Add integration coverage for admin create/edit/retire flows, including import diff preview and rejected import behavior against a real persistence boundary.
3. Split large modules by concern after the Batch 6 behavior is pinned: `build-context.ts`, `derived.ts`, `feature-grants.ts`, `legality/engine.ts`, and `CharacterSheet.tsx`.
4. Revisit multi-source skill provenance only if authenticated DM review shows a concrete missing-audit problem; otherwise keep the Slice 5c Path B decision.
5. Add `.env.example`, setup documentation, and a repeatable local demo-data path so browser QA is not blocked by private auth state.

## Closeout Result

Batch 6 is effectively complete. The Batch 5 carry-ins that blocked trustworthy content/admin work are closed, and the remaining structural hardening is assigned to Batch 7 with owner, date, and reason. Future normal content additions can use validated import fixtures or audited admin paths rather than one-off SQL patches.
