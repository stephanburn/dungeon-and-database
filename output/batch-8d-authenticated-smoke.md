# Batch 8d Authenticated Browser Smoke

Date: 2026-05-25T14:18:16.363Z
Base URL: http://localhost:3000
Command: `npm run smoke:auth`
Server: Started Next dev server on http://localhost:3000.

## Failure Taxonomy

- environment/auth setup failure
- app route/render failure
- console/runtime regression
- app network regression
- expected known product residual

## Fixture

- Seed command: `npm run seed-demo`
- Character routes: `/characters/6888c606-312d-40d4-81f9-d0c42974faf2`, `/characters/d0ca1537-35fb-4d4a-9cf0-2a6ee2a994d3`, `/characters/ff792a78-8ccb-4f90-9604-7e9bf62a7332`
- Admin access: magic_link

## Scenario Results

| Scenario | Role | Kind | Status | Route | Screenshot | Failure category |
| --- | --- | --- | --- | --- | --- | --- |
| anonymous-login-desktop | anonymous | setup-login | passed | /login | output/playwright/batch-8d/anonymous-login-desktop.png |  |
| anonymous-login-mobile | anonymous | setup-login | passed | /login | output/playwright/batch-8d/anonymous-login-mobile.png |  |
| player-dashboard | player | player | passed | / | output/playwright/batch-8d/player-dashboard.png |  |
| player-creation | player | player | passed | /characters/new | output/playwright/batch-8d/player-creation.png |  |
| player-changes-requested-sheet | player | player | passed | /characters/ff792a78-8ccb-4f90-9604-7e9bf62a7332 | output/playwright/batch-8d/player-changes-requested-sheet.png |  |
| player-level-up-entry | player | player | passed | /characters/ff792a78-8ccb-4f90-9604-7e9bf62a7332/level-up | output/playwright/batch-8d/player-level-up-entry.png |  |
| dm-dashboard | dm | dm | passed | /dm/dashboard | output/playwright/batch-8d/dm-dashboard.png |  |
| dm-submitted-review | dm | dm | passed | /characters/d0ca1537-35fb-4d4a-9cf0-2a6ee2a994d3 | output/playwright/batch-8d/dm-submitted-review.png |  |
| admin-content-library | admin | admin | passed | /dm/content | output/playwright/batch-8d/admin-content-library.png |  |
| admin-content-import-preview | admin | admin | passed | /dm/content | output/playwright/batch-8d/admin-content-import-preview.png |  |
| content-load-error-state | player | error-state | passed | /characters/new | output/playwright/batch-8d/content-load-error-state.png |  |

## Console and Network Findings

| Scenario | Category | Finding |
| --- | --- | --- |
| content-load-error-state | expected known product residual | Controlled Slice 8b content-load failure: /api/content/classes returned 500. |
| content-load-error-state | expected known product residual | Controlled browser console finding: Failed to load resource: the server responded with a status of 500 (Internal Server Error) |

## Follow-up Decisions

- Slice 8b controlled content-load error coverage is included through the `content-load-error-state` scenario when route interception is stable.
- Screenshot artifacts are written under `output/playwright/batch-8d/`; the markdown report is the tracked summary artifact.
- Environment/auth setup failures are reported separately from app route/render failures so future reruns do not confuse local session problems with product regressions.
