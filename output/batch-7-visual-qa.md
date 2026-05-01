# Batch 7 Visual and Accessibility-Oriented QA

Date: 2026-05-01

## Result

Slice 7e produced a route/state QA record, but the authenticated visual pass is blocked in this Codex session.

The local app served successfully on `http://localhost:3000`. The login page rendered by HTTP with the expected login panel, focus-ring form controls, and unauthenticated redirects from protected routes to `/login`. The in-app browser control required by the Browser Use skill is not exposed in this session, Playwright or another screenshot runner is not installed in the repo, and the Slice 7a demo seed could not create the demo users in Supabase.

This file records the exact routes, roles, states, and concrete fix/defer decisions that are available from the local app, source inspection, and HTTP route checks. The first real authenticated browser pass remains a prerequisite for the stop point user hands-on review.

## Verification Performed

- `npm run dev` started Next.js on `http://localhost:3000`.
- `GET /login` returned `200 OK` and rendered the login panel.
- `GET /`, `GET /dm/dashboard`, `GET /dm/content`, and `GET /characters/2d4c52d3-57cb-4d8f-91d3-f082082555fb` returned `307 Temporary Redirect` to `/login` without a session.
- `npm run seed-demo` failed before Supabase because `node_modules/.bin/tsx` imports a missing generated module.
- Direct `node node_modules/tsx/dist/cli.mjs --env-file=.env.local scripts/seed-demo.ts` reached Supabase, but failed while creating demo auth users with `AuthApiError: Database error creating new user`.
- Supabase admin lookup confirmed the three Slice 7a demo users are not present:
  - `demo-admin@dungeon-and-database.local`
  - `demo-dm@dungeon-and-database.local`
  - `demo-player@dungeon-and-database.local`

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

## Findings

| ID | Route / role / state | Finding | Decision |
| --- | --- | --- | --- |
| 7e-F1 | All authenticated routes / player, DM, admin / first browser pass | Authenticated visual QA could not run in the in-app browser because the Browser Use Node REPL tool is unavailable in this session. Screenshot automation is also unavailable because no Playwright or equivalent browser package is installed. | Defer with rationale. This is an environment/tooling blocker, not product friction. Resolve before the stop point user review. |
| 7e-F2 | Demo setup / player, DM, admin / seeded auth | Slice 7a demo credentials are not usable yet. The `.bin/tsx` shim is stale, and the direct runner reaches Supabase but auth user creation fails with a database error. | Defer with rationale. Treat as a setup blocker before user hands-on review and before automated authenticated screenshot tooling. |
| 7e-F3 | `/dm/content` / admin / CRUD destructive action | Admin delete still uses native `confirm('Delete this item? This cannot be undone.')`. It is the only destructive admin flow found outside the app's shared Radix `ConfirmActionButton`, so dialog copy, focus treatment, and visual state cannot be checked against app conventions. | Fix in 7f. Replace with the shared confirmation dialog pattern and keep the action text user-facing. |
| 7e-F4 | `/characters/:id` / player or DM / stat block clipboard failure | The stat block copy fallback uses native `alert('Clipboard write failed. Copy the text manually.')`. This interrupts keyboard flow and is visually inconsistent with toast/inline feedback used elsewhere. | Fix in 7f. Replace with toast or inline status text that names the repair action. |
| 7e-F5 | `/characters/:id/level-up`, `/characters/:id`, guided choice subpanels / player or DM / raw option and jump buttons | Several required interactive surfaces use raw `<button>` elements without the shared `focus-ring` class: level-up HP mode buttons, skill choice buttons, spell choice buttons, sheet legality jump cards, and repair checklist badge buttons. Browser default focus may still appear, but this misses the app-wide visible focus convention. | Fix in 7f. Add shared focus treatment and, where appropriate, pressed/expanded state semantics. |

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
- After demo auth is repaired, rerun this route matrix in a real browser and capture the first authenticated screenshot set only if the session and credentials are stable.

## Out of Scope

- Broad visual redesign.
- Reworking the card/surface hierarchy beyond findings above.
- New content or schema changes.
- Automated screenshot tooling before demo credentials and browser automation are stable.
