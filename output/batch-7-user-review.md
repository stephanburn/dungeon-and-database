# Batch 7 User Review

Date: 2026-05-01

## Session

First hands-on product trial after Slice 7e. The reviewer logged out, tested magic-link login, opened the dashboard and campaign settings, created a new character in the "Embers of the Last Wall" campaign, opened the resulting sheet, saved a sheet edit, then attempted level-up. The session ended when level-up produced an application error and console output.

## Session 2

Second hands-on trial after the `7UserTest1` follow-up commit. The level-up entry crash was confirmed resolved. The reviewer then attempted the level-up flow, hit a recoverable duplicate-choice error when only HP appeared to be changing, explored an apparent raw class-level edit path on the sheet, retried level-up into the subclass-choice step, saw duplicate `Thief` subclass options, and then reviewed the DM content library/admin area.

## Session 2 Decision

Create a fresh narrow `7UserTest2` slice before `7f`.

Reason: the resolved crash proves `7UserTest1` closed the React blocker, but Session 2 surfaced new level-up workflow integrity issues. A level-up that appears to only add HP should not save a duplicate choice payload, and the sheet should not let a player bypass guided level-up by directly editing class levels unless that path is deliberately constrained and validated. Those are functional/data-trust blockers, not broad usability polish.

Keep the visual density, button wording, ordering, content-admin scrolling, and admin information-architecture comments in `7f` unless investigation proves they directly cause the level-up save failure.

## Blocking Finding

| ID | Severity | Route / State | Observation | Desired outcome | Triage |
| --- | --- | --- | --- | --- | --- |
| UT1-001 | P0 | `PUT /api/characters/70a78581-bbf0-442f-a3fd-ad60ab6ffb34` during level-up save and `/characters/[id]/level-up` entry | Network request returned `409`, then the browser showed "Application error" and console reported minified React error `#185`. The first retry still crashed when clicking level up. React 18 maps `#185` to maximum update depth. | The save conflict should show a recoverable stale-state message, and entering level-up must not crash or enter a render loop. | Fixed in `7UserTest1` follow-up; confirmed resolved in Session 2. |
| UT2-001 | P0 | Level-up save after crash fix | Level-up entry now works, but saving a level-up that appeared to only add HP returned `duplicate_level_up_choice` / "This level up contains duplicate choice" even though the reviewer did not add spells, feats, or feature choices. | A no-choice HP-only level-up should save, or the UI should identify the exact duplicated row before save. | Fixed in `7UserTest2`: level-up submit no longer resends unchanged feature-option or feat after-state rows. |
| UT2-002 | P1 | Character sheet class/level editing | Reviewer appeared able to bypass guided level-up by editing class/level directly on the sheet, then submit/approve with no active issues. | Player-facing class-level changes should route through guided level-up or be explicitly locked/validated so level history, HP, and required choices cannot be bypassed. | Fixed in `7UserTest2`: raw class progression edits are DM repair-only. |
| UT2-003 | P1 | Rogue level-up subclass step | Rogue subclass choices showed `Thief` twice. | Duplicate subclass names should be deduped, source-labeled, or explained; investigate whether duplicate source rows are contributing to duplicate-choice payloads. | Fixed in `7UserTest2`: duplicate subclass names are source-labeled. |

Console excerpt:

```text
/api/characters/70a78581-bbf0-442f-a3fd-ad60ab6ffb34:1 Failed to load resource: the server responded with a status of 409 ()
Error: Minified React error #185
```

Missing evidence to collect during reproduction:

- response JSON body for the `409`
- request payload `expected_updated_at`
- request payload `level_up.class_id`, `previous_level`, and `new_level`
- current database `characters.updated_at` and class-level rows after the failed save
- non-minified React component/effect stack

## Creation Flow Findings

| ID | Severity | Route / State | Observation | Desired outcome | Triage |
| --- | --- | --- | --- | --- | --- |
| UT1-002 | P1 | Campaign settings | Bottom of a long page has `Save allow list`, but no obvious route back to dashboard without scrolling to the top. | Provide a persistent or bottom-local back path. | Fix in 7f. |
| UT1-003 | P2 | Campaign settings allowlist | `Player's Handbook` appeared duplicated or visually confusing. | Source allowlist display should not look duplicated and should explain grouping if there are multiple source rows. | Investigate in `7UserTest1`, fix in 7f if display-only. |
| UT1-004 | P2 | New character campaign selection | Campaign choices render as very large blocks; reviewer expected a compact dropdown or denser selector. | Use a denser campaign selector suited to repeat use. | Fix in 7f. |
| UT1-005 | P1 | Wizard step transitions | Continue/save often leaves the user near the bottom of the page, requiring repeated manual scroll back to the top. | Step changes should move focus/scroll to the new step heading or keep navigation visible. | Fix in 7f unless blocking validation reproduction. |
| UT1-006 | P2 | Wizard selected summaries | `Current picks N items` was confusing and did not explain why it mattered. | Rename, relocate, or hide this summary until it reads as useful selected-context disclosure. | Fix in 7f. |
| UT1-007 | P2 | Species/background/class choices | Species and background selection involve long scrolling through large boxes. | Use denser lists, grouping, search, or responsive columns. | Fix in 7f. |
| UT1-008 | P1 | Background step | Urban Bounty Hunter and Soldier appeared to grant no skills or no flexible skill choices, which surprised the reviewer. | Verify seed data and UI copy; distinguish fixed grants, no choices, and missing modeled content. | Investigated in `7UserTest1`; fixed grant/no-choice copy. |
| UT1-009 | P1 | Level-1 Rogue creation | Subclass step appeared for a level-1 character, and spell/feat/ASI step appeared despite no relevant choices. | Skip irrelevant steps or present compact no-action summaries. | Fixed in `7UserTest1`. |
| UT1-010 | P2 | Skill step | Skill labels include repetitive `skill` prefixes and appear in one long unwieldy list. | Show clean skill names and a denser grouped/two-column layout. | Fix in 7f. |
| UT1-011 | P1 | Skill step/save | Duplicate skill choice was allowed until save failed with `Duplicate skill choice`; reviewer expected prevention earlier. Toast also covered the save/continue area. | Prevent duplicate choices before save and keep error feedback out of the primary action path. | Fixed in `7UserTest1`. |
| UT1-012 | P1 | Ability scores/review | Campaign requires point buy, but standard array was selectable; review blocked later. | Disable or hide disallowed stat methods before review. | Fixed in `7UserTest1`. |
| UT1-013 | P2 | Review legality | Detailed legality check showed many boxes saying `Clear`, which felt like noise rather than detail. | Hide all-clear checks by default or summarize them compactly. | Fix in 7f. |
| UT2-004 | P2 | Level-up class choice | Current class advance, e.g. Rogue level 1 to 2, appeared inside the alphabetical class list rather than as the obvious default/top option. | Put the existing class advance first and visually separate legal new multiclass options. | Fix in 7f. |
| UT2-005 | P2 | Level-up save action | `Save level up draft and return to sheet` felt too long and unclear as a primary button. | Use a shorter, outcome-focused label. | Fix in 7f. |

## Sheet and Content Trust Findings

| ID | Severity | Route / State | Observation | Desired outcome | Triage |
| --- | --- | --- | --- | --- | --- |
| UT1-014 | P2 | Character sheet/source labels | `amended` was not understandable, especially on classes/species. | Replace or explain source-amendment language in user-facing terms. | Fix in 7f. |
| UT1-015 | P2 | Character sheet/content limitations | Notes such as "not yet automated" and implementation gaps made the sheet feel unfinished. | Move limitation detail behind calmer disclosure and use user-facing language. | Fix in 7f, with content-completeness gaps deferred if they require new mechanics. |

## Login and Dashboard Findings

| ID | Severity | Route / State | Observation | Desired outcome | Triage |
| --- | --- | --- | --- | --- | --- |
| UT1-016 | P2 | Magic-link email | Email link worked, but the email was generic and did not clearly identify Dungeon and Database or why the user received it. | Branded/trustworthy auth email copy and sender context. | Fix in 7f or auth-provider configuration task. |
| UT1-017 | P3 | Dashboard visual tone | Dashboard worked but felt very stark black-and-white; reviewer wanted a little color and warmth. | Add restrained color cues without broad redesign. | Fix in 7f if within Batch 5.5 conventions. |

## DM Content Admin Findings

| ID | Severity | Route / State | Observation | Desired outcome | Triage |
| --- | --- | --- | --- | --- | --- |
| UT2-006 | P2 | `/dm/content` list tables | Several content library sections require horizontal scrolling for one-line text fields, especially backgrounds, species, and classes. | Reduce horizontal scroll through responsive columns, truncation, disclosure, or denser row layout. | Fix in 7f. |
| UT2-007 | P2 | `/dm/content` information architecture | `Import` was unclear, and the relationship between equipment items versus weapons/armor/shields was not self-explanatory. | Clarify admin tab labels and helper copy without expanding the surface into a new content-model batch. | Fix in 7f. |

## 7UserTest1 Scope

Fix before broader 7f:

- UT1-001 level-up `409` plus React `#185` crash
- UT1-008 background grant/choice confusion investigation
- UT1-009 irrelevant level-1 subclass/spells-feats-ASI steps
- UT1-011 duplicate skill prevention and error placement
- UT1-012 campaign stat method enforcement before review

## 7UserTest1 Outcome

Completed on 2026-05-01.

- Initial root cause found for one React `#185` render-loop path: feature-spell cards could call a parent spell-option setter from an effect while the parent supplied a freshly-created callback; the setter returned a new spell array even when nothing changed. `CharacterSheet` now uses a stable `useCallback`, and shared stable merge/replace helpers return the existing array when spell options are semantically unchanged.
- Follow-up root cause after the live retry still crashed on level-up entry: the level-up wizard mounted a Radix `Select` for the initial class choice, and the minified stack mapped into Radix's composed-ref helper during a maximum-update-depth failure. The wizard now renders the initial class choice as a button radiogroup instead of hidden Select content, stabilizes its current build context with `useMemo`, uses an equality-preserving feat-spell cleanup setter, and passes a stable feat-spell options callback.
- `SpellsCard` now keys fetch effects by stable scalar keys for subclass IDs, expanded class IDs, and selected spell IDs, and uses a stable replace helper for fetched spell options.
- Level-up `409` responses with `stale_character`, `stale_level_up`, or `duplicate_level_up_choice` now show inline recovery instead of only a destructive toast. `stale_level_up` can clear the local draft when the user returns to the refreshed sheet.
- Sheet save conflicts now show inline refresh recovery for stale edit-token responses, keeping the primary action area clear.
- Level-1 creation now hides the subclass step unless the selected class actually unlocks a subclass at level 1, and hides the spells/feats step when there are no spell, feat, ASI, or feature-spell choices to make.
- Campaign-required stat method now gates the ability-score method options before review; disallowed methods are disabled with the campaign requirement shown inline.
- Species/background/class/subclass skill choices now disable choices already selected from earlier sources and filter duplicate selections before save.
- Background UI now distinguishes fixed skill grants from extra flexible background skill picks. Soldier is confirmed in migrations with fixed `Athletics` and `Intimidation`; `Urban Bounty Hunter` is not present in tracked migrations, so any live row needs a later content-source investigation if it remains visible.

Verification:

- `node --import tsx --test test/ut1-user-test-regressions.test.ts`
- `node --import tsx --test test/creation-step-selections.test.ts`
- `node --import tsx --test test/level-up-flow.test.ts`
- `node --import tsx --test test/client-submit-safety.test.ts test/character-route-concurrency-errors.test.ts`
- `node --import tsx --test test/ui-polish-conventions.test.ts`
- `node node_modules/next/dist/bin/next build`
- `npm test`

Session 2 confirmed the React `#185` crash is resolved. The remaining level-up save conflict is now tracked separately as `UT2-001` / `7UserTest2`.

## 7UserTest2 Outcome

Completed on 2026-05-01.

- Root cause found for the HP-only duplicate-choice conflict: the level-up wizard computed new-level feature and feat rows, but submitted full after-state feature and feat choices to an additive level-up RPC. That could re-submit old persisted choices even when the visible level-up only changed HP.
- Level-up submit now sends `newLevelFeatureOptionChoices` and `newLevelFeatChoices`. Spell choices remain after-state because class spell swaps intentionally use replacement semantics.
- Duplicate level-up save conflicts now return more specific copy and a `duplicate_choice_kind` field when the database error identifies feature option, spell, feat, ASI, skill, or class-level persistence.
- Player-facing sheet class progression edits are locked to the guided level-up path. The raw class/level editor remains available to DMs for repair/admin use.
- Duplicate subclass names in the level-up subclass selector are source-labeled, so duplicate `Thief` rows are distinguishable without changing the underlying allowed-source data.

Verification:

- `npm test -- test/ut2-user-test-regressions.test.ts test/level-up-flow.test.ts test/character-route-concurrency-errors.test.ts`
- `npm run build`

Carry into 7f after blocker fixes:

- magic-link email branding
- dashboard/campaign visual warmth
- campaign settings return navigation
- dense selectors and scrolling ergonomics
- `Current picks` wording
- skill list layout and labels
- legality all-clear noise
- `amended` and content limitation language

## 7f Outcome

Completed on 2026-05-06.

- Fixed in this pass: campaign settings return navigation, dense campaign selection, wizard step focus after Continue/Back/jump, `Current picks` wording, skill label cleanup, shared focus treatment on raw choice/jump buttons, legality all-clear noise, `amended` source wording, level-up class ordering, shorter level-up save copy, stat-block clipboard feedback, and the concrete `/dm/content` keyboard/delete/key-warning findings.
- Partially addressed: content-admin horizontal scrolling is reduced with fixed-table presentation and clarified admin copy; broader dashboard/campaign visual warmth is left for the novice comprehension pass to avoid another broad visual redesign inside 7f.
- Deferred with rationale: magic-link email branding likely belongs in Supabase auth/provider configuration rather than the app UI code touched by this slice.

## 7f.5 Outcome

Completed on 2026-05-06.

- Fixed in this pass: beginner-facing copy now explains campaign sources, class role, ability scores, ability boosts, feats, spells, level-up HP defaults, and final rules checks without relying on ASI, source allowlist, or legality shorthand.
- No-choice states for campaign-filtered content, spell choices, source table notes, and background skill grants now read as normal product states rather than missing implementation.
- Existing progressive disclosure and sheet/review surfaces remain intact; this pass did not add new rules automation, tutorial flows, schema work, or broad visual redesign.

## Next Reproduction Script

1. Log in through magic link.
2. Open dashboard, campaign settings, and the `Embers of the Last Wall` campaign.
3. Create a new character in that campaign.
4. Choose Changeling, a background checked against the transcript, Rogue, standard array first, then point buy after review blocks it.
5. Pick overlapping skills once to reproduce duplicate skill handling.
6. Continue through equipment with rapier, shortbow, and dungeoneer's pack.
7. Open sheet, make a small edit, save, then start level-up.
8. If the duplicate-choice conflict appears, capture the `PUT /api/characters/:id` request payload and response body, especially the submitted spell, feat, feature-option, class, and level-up rows.
