# Batch 7 User Review

Date: 2026-05-01

## Session

First hands-on product trial after Slice 7e. The reviewer logged out, tested magic-link login, opened the dashboard and campaign settings, created a new character in the "Embers of the Last Wall" campaign, opened the resulting sheet, saved a sheet edit, then attempted level-up. The session ended when level-up produced an application error and console output.

## Blocking Finding

| ID | Severity | Route / State | Observation | Desired outcome | Triage |
| --- | --- | --- | --- | --- | --- |
| UT1-001 | P0 | `PUT /api/characters/70a78581-bbf0-442f-a3fd-ad60ab6ffb34` during level-up save | Network request returned `409`, then the browser showed "Application error" and console reported minified React error `#185`. React 18 maps `#185` to maximum update depth. | The save conflict should show a recoverable stale-state message and must not crash or enter a render loop. | Fixed in `7UserTest1`; browser confirmation pending. |

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

## 7UserTest1 Scope

Fix before broader 7f:

- UT1-001 level-up `409` plus React `#185` crash
- UT1-008 background grant/choice confusion investigation
- UT1-009 irrelevant level-1 subclass/spells-feats-ASI steps
- UT1-011 duplicate skill prevention and error placement
- UT1-012 campaign stat method enforcement before review

## 7UserTest1 Outcome

Completed on 2026-05-01.

- Root cause found for the React `#185` render loop: feature-spell cards could call a parent spell-option setter from an effect while the parent supplied a freshly-created callback; the setter returned a new spell array even when nothing changed. `CharacterSheet` now uses a stable `useCallback`, and shared stable merge/replace helpers return the existing array when spell options are semantically unchanged.
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

Manual browser confirmation remains for the exact original character/session because the first report did not include the `409` JSON body. Existing route tests already cover the structured conflict codes.

Carry into 7f after blocker fixes:

- magic-link email branding
- dashboard/campaign visual warmth
- campaign settings return navigation
- dense selectors and scrolling ergonomics
- `Current picks` wording
- skill list layout and labels
- legality all-clear noise
- `amended` and content limitation language

## Next Reproduction Script

1. Log in through magic link.
2. Open dashboard, campaign settings, and the `Embers of the Last Wall` campaign.
3. Create a new character in that campaign.
4. Choose Changeling, a background checked against the transcript, Rogue, standard array first, then point buy after review blocks it.
5. Pick overlapping skills once to reproduce duplicate skill handling.
6. Continue through equipment with rapier, shortbow, and dungeoneer's pack.
7. Open sheet, make a small edit, save, then start level-up.
8. Capture the failed `PUT /api/characters/70a78581-bbf0-442f-a3fd-ad60ab6ffb34` response body and non-minified console stack.
