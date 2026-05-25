export type SmokeRole = 'anonymous' | 'player' | 'dm' | 'admin'

export type SmokeScenarioKind =
  | 'setup-login'
  | 'player'
  | 'dm'
  | 'admin'
  | 'error-state'

export type SmokeRouteKey =
  | 'login'
  | 'playerDashboard'
  | 'newCharacter'
  | 'changesRequestedSheet'
  | 'changesRequestedLevelUp'
  | 'dmDashboard'
  | 'submittedReview'
  | 'contentAdmin'

export type SmokeScenarioId =
  | 'anonymous-login-desktop'
  | 'anonymous-login-mobile'
  | 'player-dashboard'
  | 'player-creation'
  | 'player-changes-requested-sheet'
  | 'player-level-up-entry'
  | 'dm-dashboard'
  | 'dm-submitted-review'
  | 'admin-content-library'
  | 'admin-content-import-preview'
  | 'admin-content-impact-preview'
  | 'content-load-error-state'

export type SmokeScenario = {
  id: SmokeScenarioId
  label: string
  role: SmokeRole
  kind: SmokeScenarioKind
  routeKey: SmokeRouteKey
  expectedText: string
  screenshotName: string
  viewport?: { width: number; height: number }
}

export const DESKTOP_VIEWPORT = { width: 1440, height: 1000 }
export const MOBILE_VIEWPORT = { width: 390, height: 844 }

export const smokeScenarios: SmokeScenario[] = [
  {
    id: 'anonymous-login-desktop',
    label: 'Anonymous login desktop',
    role: 'anonymous',
    kind: 'setup-login',
    routeKey: 'login',
    expectedText: 'Dungeon & Database',
    screenshotName: 'anonymous-login-desktop.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'anonymous-login-mobile',
    label: 'Anonymous login mobile',
    role: 'anonymous',
    kind: 'setup-login',
    routeKey: 'login',
    expectedText: 'Use password',
    screenshotName: 'anonymous-login-mobile.png',
    viewport: MOBILE_VIEWPORT,
  },
  {
    id: 'player-dashboard',
    label: 'Player dashboard',
    role: 'player',
    kind: 'player',
    routeKey: 'playerDashboard',
    expectedText: 'My Characters',
    screenshotName: 'player-dashboard.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'player-creation',
    label: 'Guided character creation',
    role: 'player',
    kind: 'player',
    routeKey: 'newCharacter',
    expectedText: 'Guided Character Creation',
    screenshotName: 'player-creation.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'player-changes-requested-sheet',
    label: 'Changes-requested character sheet',
    role: 'player',
    kind: 'player',
    routeKey: 'changesRequestedSheet',
    expectedText: 'Demo Changes Requested Character',
    screenshotName: 'player-changes-requested-sheet.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'player-level-up-entry',
    label: 'Level-up entry',
    role: 'player',
    kind: 'player',
    routeKey: 'changesRequestedLevelUp',
    expectedText: 'Level-Up Wizard',
    screenshotName: 'player-level-up-entry.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'dm-dashboard',
    label: 'DM dashboard',
    role: 'dm',
    kind: 'dm',
    routeKey: 'dmDashboard',
    expectedText: 'DM Dashboard',
    screenshotName: 'dm-dashboard.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'dm-submitted-review',
    label: 'DM submitted review sheet',
    role: 'dm',
    kind: 'dm',
    routeKey: 'submittedReview',
    expectedText: 'Demo Submitted Character',
    screenshotName: 'dm-submitted-review.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'admin-content-library',
    label: 'Admin content library',
    role: 'admin',
    kind: 'admin',
    routeKey: 'contentAdmin',
    expectedText: 'Content Library',
    screenshotName: 'admin-content-library.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'admin-content-import-preview',
    label: 'Admin content import preview',
    role: 'admin',
    kind: 'admin',
    routeKey: 'contentAdmin',
    expectedText: 'Validation findings',
    screenshotName: 'admin-content-import-preview.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'admin-content-impact-preview',
    label: 'Admin content impact preview',
    role: 'admin',
    kind: 'admin',
    routeKey: 'contentAdmin',
    expectedText: 'Stale references across content',
    screenshotName: 'admin-content-impact-preview.png',
    viewport: DESKTOP_VIEWPORT,
  },
  {
    id: 'content-load-error-state',
    label: 'Controlled content load error',
    role: 'player',
    kind: 'error-state',
    routeKey: 'newCharacter',
    expectedText: 'Character options could not be loaded',
    screenshotName: 'content-load-error-state.png',
    viewport: DESKTOP_VIEWPORT,
  },
]

export const rejectedImportFixture = {
  sources: [
    { key: 'PHB', name: "Player's Handbook" },
    { key: 'PHB', name: 'Duplicate Player Handbook' },
  ],
  languages: [
    { key: 'common', name: 'Common', source: 'PHB' },
    { key: 'common', name: 'Duplicate Common', source: 'PHB' },
  ],
}
