# Batch 7 Visual and Accessibility-Oriented QA

Date: 2026-05-01
Updated: 2026-05-02

## Result

Slice 7e initially produced a route/state QA record while the authenticated visual pass was blocked in this Codex session. A follow-up pass on 2026-05-02 unblocked player authenticated QA.

The local app served successfully on `http://localhost:3000`. The login page rendered by HTTP with the expected login panel, focus-ring form controls, and unauthenticated redirects from protected routes to `/login`. The original blockers were the stale `node_modules/.bin/tsx` shim, the Supabase auth trigger failing to populate `public.users.email`, and the lack of a cached Playwright CLI runner.

Those blockers are now resolved for player QA: migration `078_restore_new_user_email_trigger.sql` restores the auth trigger email insert, `npm run seed-demo` uses the stable `node --import tsx` runner, and the Playwright CLI wrapper can drive normal password login plus protected player routes. DM/admin visual QA still needs its own pass, especially `/dm/dashboard` and `/dm/content`.

The seed script now requests a local `/auth/callback` redirect for singleton-admin magic links. Supabase accepts that exact allowlisted callback; sign in with the generated link, then open `/dm/content`.

## Verification Performed

- `npm run dev` started Next.js on `http://localhost:3000`.
- `GET /login` returned `200 OK` and rendered the login panel.
- `GET /`, `GET /dm/dashboard`, `GET /dm/content`, and `GET /characters/2d4c52d3-57cb-4d8f-91d3-f082082555fb` returned `307 Temporary Redirect` to `/login` without a session.
- Initial `npm run seed-demo` failed before Supabase because `node_modules/.bin/tsx` imported a missing generated module.
- Initial direct `node node_modules/tsx/dist/cli.mjs --env-file=.env.local scripts/seed-demo.ts` reached Supabase, but failed while creating demo auth users with `AuthApiError: Database error creating new user`.
- Follow-up: migration `078_restore_new_user_email_trigger.sql` was applied to Supabase, restoring `public.handle_new_user()` so it inserts `email`.
- Follow-up: `npm run seed-demo` now completes and prints deterministic demo player, DM, admin, route, and rejected-import fixtures.
- Follow-up: Playwright CLI password login succeeded for `demo-player@dungeon-and-database.local`.
- Follow-up: authenticated player routes rendered `/`, `/characters/new`, `/characters/ff792a78-8ccb-4f90-9604-7e9bf62a7332`, and `/characters/ff792a78-8ccb-4f90-9604-7e9bf62a7332/level-up`.
- Follow-up: authenticated DM/admin rerun covered `/dm/dashboard`, `/dm/content`, the submitted character review sheet, admin magic-link auth metadata/session creation, and light keyboard focus sweeps on sheet repair buttons, level-up HP buttons, and content admin tabs/rows.

## Route and State Matrix

| Surface | Route | Role | State checked or targeted | Status |
| --- | --- | --- | --- | --- |
| Login | `/login` | Anonymous | Magic-link entry, password-mode entry, reset feedback | HTTP-rendered. Visual/keyboard browser pass still pending. |
| Dashboard | `/` | Player | Post-login character list and create/resume actions | Protected route redirects to `/login` without session. Authenticated browser pass pending. |
| Guided creation | `/characters/new` | Player | Identity, species, class, spells/features where available, review | Source inspected in `CharacterNewForm`; authenticated browser pass pending. |
| Draft sheet | `/characters/2d4c52d3-57cb-4d8f-91d3-f082082555fb` | Player/DM | Header, stats, Save/Submit, sheet collapsibles, legality checklist | Protected route redirects to `/login` without session. Authenticated browser pass pending. |
| Approved sheet | `/characters/5bb84c28-fdd3-483d-b459-8556298451af` | Player/DM | Header, stats, spells, feature options, languages/tools, equipment, legality areas | Exact existing route identified. Authenticated browser pass pending. |
| Submitted review sheet | `/characters/1bb80d26-f930-4590-b1fc-951a7c8585e8` | DM | Character review/audit, request changes, approve | Exact existing route identified. Authenticated browser pass pending. |
| Level-up wizard | `/characters/2d4c52d3-57cb-4d8f-91d3-f082082555fb/level-up` | Player/DM | Entry, class/features/spells/hp/review, save draft, stale-save path | Source inspected in `LevelUpWizard`; authenticated browser pass pending. |
| Level-up blocked state | `/characters/5bb84c28-fdd3-483d-b459-8556298451af/level-up` | Player | Non-editable approved-character state | Source message is repair-oriented. Authenticated browser pass pending. |
| DM dashboard | `/dm/dashboard` | DM/Admin | Review queue, audit entry, open next review | Protected route redirects to `/login` without session. Authenticated browser pass pending. |
| Content admin | `/dm/content` | Admin | Tabs, create/edit/delete CRUD, validation preview, import diff preview, retire summary | Source inspected in `ContentAdmin`; authenticated browser pass pending. |

## Authenticated Follow-Up Matrix

| Surface | Route | Role | 2026-05-02 result |
| --- | --- | --- | --- |
| Login | `/login` | Player | Password mode submitted with demo player credentials and redirected to `/`. |
| Dashboard | `/` | Player | Rendered `My Characters`, `New character`, sign out, and the three demo character rows. |
| Guided creation | `/characters/new` | Player | Rendered identity step; campaign data loaded to `Demo QA Campaign` after the initial loading state. |
| Changes-requested sheet | `/characters/ff792a78-8ccb-4f90-9604-7e9bf62a7332` | Player | Rendered sheet header, DM notes, repair checklist, stats, and Save/Submit actions. Remaining UX issue: some sheet labels still expose raw IDs instead of friendly names. |
| Level-up wizard | `/characters/ff792a78-8ccb-4f90-9604-7e9bf62a7332/level-up` | Player | Rendered after data load with `Level 1 → 2`, `Fighter 1`, and no browser console errors. Remaining UX issue: the first snapshot shows a temporary `Level 0 → 0` / loading-class state. |

## Authenticated DM/Admin Rerun Matrix

| Surface | Route | Role | 2026-05-02 result |
| --- | --- | --- | --- |
| DM dashboard | `/dm/dashboard` | DM | Password login with `demo-dm@dungeon-and-database.local` redirected to `/dm/dashboard`; review queue showed one submitted demo character and campaign/settings links rendered. |
| Submitted review sheet | `/characters/d0ca1537-35fb-4d4a-9cf0-2a6ee2a994d3` | DM | Rendered submitted sheet, repair checklist, DM Audit disclosure, DM notes, and `Approve` / `Request changes` actions. |
| Admin magic-link auth | generated Supabase link | Admin | Generated link metadata used `http://localhost:3000/auth/callback`; the generated magic-link OTP established an admin session for local QA without a private browser session. |
| Content admin | `/dm/content` | Admin | Rendered content library, tabs, import diff disclosure, and editable background rows. Console reported a React unique-key warning in `ContentAdmin`. |
| Admin dashboard | `/dm/dashboard` | Admin | Admin session rendered dashboard with Users, Content, and New campaign links plus broader campaign/character tables. |

## Keyboard Follow-Up

- Submitted sheet: Tab order reached Back, Level up, Delete character, Save, each repair checklist button, DM Audit disclosure, and the first sheet fields.
- Level-up wizard: class step reached Back to sheet and Continue; the only visible multiclass radio was disabled, while the existing class advance was summarized automatically. HP step reached Fixed gain, Max hit die, Manual roll, Back, and Continue.
- Content admin: Tab reached Dashboard, Add background, selected tab, Import diff, table panel, and row Edit/Delete actions.
- Content admin tabs: ArrowRight on the focused selected tab did not move focus/selection to the next tab, so keyboard access to non-selected content sections depends on mouse/pointer unless this is repaired.

## Findings

| ID | Route / role / state | Finding | Decision |
| --- | --- | --- | --- |
| 7e-F1 | All authenticated routes / player, DM, admin / first browser pass | Authenticated visual QA could not run in the in-app browser because the Browser Use Node REPL tool is unavailable in this session. Screenshot automation was also unavailable until the Playwright CLI wrapper was downloaded and cached. | Partially resolved. Player authenticated browser QA now runs through Playwright CLI. DM/admin routes still need a dedicated pass. |
| 7e-F2 | Demo setup / player, DM, admin / seeded auth | Slice 7a demo credentials were not usable. The `.bin/tsx` shim was stale, and the direct runner reached Supabase but auth user creation failed with a database error. | Resolved for local QA by migration `078`, `npm run seed-demo` runner wiring, and a successful password-login browser pass. |
| 7e-F3 | `/dm/content` / admin / CRUD destructive action | Admin delete still uses native `confirm('Delete this item? This cannot be undone.')`. It is the only destructive admin flow found outside the app's shared Radix `ConfirmActionButton`, so dialog copy, focus treatment, and visual state cannot be checked against app conventions. | Fix in 7f. Replace with the shared confirmation dialog pattern and keep the action text user-facing. |
| 7e-F4 | `/characters/:id` / player or DM / stat block clipboard failure | The stat block copy fallback uses native `alert('Clipboard write failed. Copy the text manually.')`. This interrupts keyboard flow and is visually inconsistent with toast/inline feedback used elsewhere. | Fix in 7f. Replace with toast or inline status text that names the repair action. |
| 7e-F5 | `/characters/:id/level-up`, `/characters/:id`, guided choice subpanels / player or DM / raw option and jump buttons | Several required interactive surfaces use raw `<button>` elements without the shared `focus-ring` class: level-up HP mode buttons, skill choice buttons, spell choice buttons, sheet legality jump cards, and repair checklist badge buttons. Browser default focus may still appear, but this misses the app-wide visible focus convention. | Fix in 7f. Add shared focus treatment and, where appropriate, pressed/expanded state semantics. |
| 7e-F6 | `/dm/content` / admin / tabs | Content library tabs expose `role="tab"`, but ArrowRight did not move focus or selection from the focused selected tab during the rerun. Since only the selected tab is in the tab sequence, keyboard users may not be able to reach other content sections predictably. | Fix in 7f. Repair tab keyboard behavior or replace with a simpler keyboard-reachable segmented control/menu pattern. |
| 7e-F7 | `/dm/content` / admin / background table render | Browser console reported React's unique `key` warning from `ContentAdmin` while rendering the content table. | Fix in 7f. Add stable keys to the rendered row/cell/action child list. |

## Surface Notes

### Login

- HTTP-rendered login shows the email field, `Send magic link`, and `Use password`.
- Base input and button controls include `focus-ring`.
- Success states use `role="status"` and `aria-live="polite"` in source.
- Authenticated keyboard path for password login is pending real browser verification.

### Dashboard

- `/` redirects to `/login` without a session.
- Source continues to use row-level dashboard affordances from the Batch 5.5 polish pass.
- Post-login scan, keyboard focus order, and create/resume action checks are pending authenticated browser verification.

### Guided Creation

- Source includes identity, species, background, class, subclass, stats, skills, equipment, spells/features, and review states.
- Guided choice cards use `focus-ring` and disabled reason text.
- Review issues expose step jump buttons and text labels.
- Visual route progression and keyboard path through real data are pending authenticated browser verification.

### Character Sheet

- Existing concrete routes are available for draft, approved, and submitted states.
- Sheet sections expose collapsible controls and legality repair areas.
- Warning/error badges use icons and text labels rather than color alone.
- Focus convention gaps on some raw sheet buttons are assigned to 7f.

### Level-Up Wizard

- Source includes entry, restored draft notice, class/subclass/features/skills/spells/feat/hp/review steps, stale-save protection via `expected_updated_at`, and save draft return.
- Blocked non-editable state says to return to the sheet and move the character back into an editable draft.
- HP mode raw buttons miss the shared focus convention and are assigned to 7f.

### DM Review and Audit

- Submitted character route identified for review: `/characters/1bb80d26-f930-4590-b1fc-951a7c8585e8`.
- Approve uses the shared confirmation dialog.
- Request changes requires notes and uses toast feedback.
- Real keyboard and dialog focus checks are pending authenticated browser verification.

### Content Admin

- `/dm/content` route is admin-only and redirects unauthenticated users to `/login`.
- Tabs, form preview, validation preview, and import diff preview are present in source.
- Import diff preview includes Create, Update, No change, and Retire labels.
- Native delete confirmation is assigned to 7f.

## 7f Assignment List

- Replace `/dm/content` native delete confirmation with the shared confirmation dialog.
- Replace stat-block clipboard failure `alert` with toast or inline status feedback.
- Add shared `focus-ring` treatment to raw buttons in level-up HP choices, skill choices, spell choices, legality jump cards, and repair checklist buttons.
- Repair `/dm/content` tab keyboard behavior and the `ContentAdmin` unique-key warning found in the authenticated rerun.
- Rerun `/dm/content` after 7f content-admin fixes to confirm no console warning and keyboard access to all sections.

## 7f Completion Note

Completed on 2026-05-06.

- `/dm/content` delete now uses `ConfirmActionButton`, content tabs handle ArrowLeft/ArrowRight/Home/End explicitly, table cells/actions receive stable keys, import copy is labeled as an import preview, and equipment items are explained as the shared base rows for weapons, armor, and shields.
- Stat-block copy failure now uses toast feedback instead of a native alert.
- Raw player-facing buttons touched by the QA notes now use shared focus treatment, including level-up class/HP buttons, sheet repair/audit jump buttons, and skill choice rows.
- Creation now uses a compact campaign selector, moves focus to the new step heading after step changes, uses `Selected so far` disclosure copy, and cleans possible `skill_` prefixes from skill choice labels.
- Review legality details now show only failed checks; source amendment tags now read `Adjusted`; level-up save copy is shorter; existing class advancement sorts above new multiclass options; campaign settings has a bottom-local return path.

## 7f.5 Completion Note

Completed on 2026-05-06.

- Creation and level-up now expand beginner-hostile shorthand such as ASI into ability boost / ability score increase language on player-facing surfaces.
- Campaign source restrictions, no-choice states, and table-note wording now avoid exposing source allowlist, implementation-gap, or amended metadata language to new players.
- The class, ability-score, spells/feats, HP, review, and shared choice-card copy now gives compact just-in-time context without adding a tutorial layer or changing rules automation.
- Static guard coverage lives in `test/batch-7-novice-comprehension.test.ts`.

## Out of Scope

- Broad visual redesign.
- Reworking the card/surface hierarchy beyond findings above.
- New content or schema changes.
- Automated screenshot tooling before demo credentials and browser automation are stable.
