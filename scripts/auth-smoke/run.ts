import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient, type Session } from '@supabase/supabase-js'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import {
  DESKTOP_VIEWPORT,
  rejectedImportFixture,
  smokeScenarios,
  type SmokeRole,
  type SmokeScenario,
} from './scenarios'

type DemoRoutes = {
  login: string
  playerDashboard: string
  newCharacter: string
  changesRequestedSheet: string
  changesRequestedLevelUp: string
  dmDashboard: string
  submittedReview: string
  contentAdmin: string
}

type AdminAccess =
  | { kind: 'password'; email: string; password: string }
  | { kind: 'magic_link'; url: string }
  | { kind: 'unavailable'; reason: string }

type DemoFixture = {
  seedOutput: string
  routes: DemoRoutes
  adminAccess: AdminAccess
  characterRoutes: string[]
}

type ScenarioStatus = 'passed' | 'failed' | 'skipped'

type ScenarioResult = {
  id: string
  label: string
  role: SmokeRole
  kind: string
  route: string
  status: ScenarioStatus
  screenshotPath?: string
  failureCategory?: string
  message?: string
  consoleErrors: string[]
  pageErrors: string[]
  networkFailures: string[]
  allowedFindings: string[]
}

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const SUPABASE_URL = requiredEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_ANON_KEY = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const SUPABASE_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`
const ROOT = process.cwd()
const ARTIFACT_DIR = join(ROOT, 'output/playwright/batch-8d')
const REPORT_PATH = join(ROOT, 'output/batch-8d-authenticated-smoke.md')
const DEMO_PASSWORD = 'DemoPassw0rd!'
const PLAYER_EMAIL = 'demo-player@dungeon-and-database.local'
const DM_EMAIL = 'demo-dm@dungeon-and-database.local'
const DEMO_ADMIN_EMAIL = 'demo-admin@dungeon-and-database.local'
const FAILURE_TAXONOMY = [
  'environment/auth setup failure',
  'app route/render failure',
  'console/runtime regression',
  'app network regression',
  'expected known product residual',
]

let devServer: ChildProcessWithoutNullStreams | null = null

async function main() {
  await mkdir(ARTIFACT_DIR, { recursive: true })

  const server = await ensureServer()
  const fixture = runSeedDemo()
  const browser = await chromium.launch()
  const contexts = new Map<SmokeRole, BrowserContext>()
  const results: ScenarioResult[] = []

  try {
    for (const scenario of smokeScenarios) {
      const result = await runScenario(browser, contexts, fixture, scenario)
      results.push(result)
      console.log(`[smoke:auth] ${result.status.toUpperCase()} ${scenario.id}${result.message ? ` - ${result.message}` : ''}`)
    }
  } finally {
    for (const context of Array.from(contexts.values())) await context.close().catch(() => undefined)
    await browser.close().catch(() => undefined)
    if (server.started) stopDevServer()
  }

  await writeReport({
    fixture,
    results,
    serverStarted: server.started,
    serverMessage: server.message,
  })

  const failures = results.filter((result) => result.status === 'failed')
  if (failures.length > 0) {
    console.error(`[smoke:auth] ${failures.length} scenario(s) failed. See ${relative(REPORT_PATH)}.`)
    process.exitCode = 1
    return
  }

  console.log(`[smoke:auth] ${results.length} scenario(s) completed. See ${relative(REPORT_PATH)}.`)
}

async function ensureServer(): Promise<{ started: boolean; message: string }> {
  if (await canReachLogin()) {
    return { started: false, message: `${BASE_URL}/login was already reachable.` }
  }

  const url = new URL(BASE_URL)
  const port = url.port || (url.protocol === 'https:' ? '443' : '3000')
  devServer = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '-p', port], {
    cwd: ROOT,
    env: { ...process.env, PORT: port },
  })

  const logs: string[] = []
  devServer.stdout.on('data', (chunk) => logs.push(String(chunk).trim()))
  devServer.stderr.on('data', (chunk) => logs.push(String(chunk).trim()))

  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (await canReachLogin()) {
      return { started: true, message: `Started Next dev server on ${BASE_URL}.` }
    }
    await delay(750)
  }

  stopDevServer()
  throw new Error(`environment/auth setup failure: ${BASE_URL}/login did not become reachable. ${logs.slice(-5).join(' ')}`)
}

async function canReachLogin() {
  try {
    const response = await fetch(new URL('/login', BASE_URL), { redirect: 'manual' })
    return response.status < 500
  } catch {
    return false
  }
}

function stopDevServer() {
  if (!devServer) return
  devServer.kill('SIGTERM')
  devServer = null
}

function runSeedDemo(): DemoFixture {
  const result = spawnSync('npm', ['run', 'seed-demo'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  })
  const seedOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  if (result.status !== 0) {
    throw new Error(`environment/auth setup failure: npm run seed-demo failed.\n${seedOutput}`)
  }

  const characterRoutes = Array.from(seedOutput.matchAll(/\[seed-demo\]\s+(\/characters\/[0-9a-f-]+)/g)).map((match) => match[1])
  if (characterRoutes.length < 3) {
    throw new Error(`environment/auth setup failure: npm run seed-demo did not print the expected character routes.\n${seedOutput}`)
  }

  return {
    seedOutput,
    characterRoutes,
    routes: {
      login: '/login',
      playerDashboard: '/',
      newCharacter: '/characters/new',
      changesRequestedSheet: characterRoutes[2],
      changesRequestedLevelUp: `${characterRoutes[2]}/level-up`,
      dmDashboard: '/dm/dashboard',
      submittedReview: characterRoutes[1],
      contentAdmin: '/dm/content',
    },
    adminAccess: parseAdminAccess(seedOutput),
  }
}

function parseAdminAccess(seedOutput: string): AdminAccess {
  const passwordMatch = seedOutput.match(/\[seed-demo\]\s+admin:\s+([^/\s]+)\s+\/\s+([^\s]+)/)
  if (passwordMatch) {
    return { kind: 'password', email: passwordMatch[1], password: passwordMatch[2] }
  }

  const magicLinkMatch = seedOutput.match(/\[seed-demo\]\s+(https?:\/\/\S+)/)
  if (magicLinkMatch) return { kind: 'magic_link', url: magicLinkMatch[1] }

  const unavailableMatch = seedOutput.match(/\[seed-demo\]\s+admin:\s+(.+)/)
  return {
    kind: 'unavailable',
    reason: unavailableMatch?.[1] ?? 'No admin credential or magic link was printed by npm run seed-demo.',
  }
}

async function runScenario(
  browser: Browser,
  contexts: Map<SmokeRole, BrowserContext>,
  fixture: DemoFixture,
  scenario: SmokeScenario
): Promise<ScenarioResult> {
  const route = fixture.routes[scenario.routeKey]
  const result: ScenarioResult = {
    id: scenario.id,
    label: scenario.label,
    role: scenario.role,
    kind: scenario.kind,
    route,
    status: 'failed',
    consoleErrors: [],
    pageErrors: [],
    networkFailures: [],
    allowedFindings: [],
  }

  let page: Page | null = null

  try {
    const context = await contextFor(browser, contexts, fixture, scenario.role, scenario.viewport ?? DESKTOP_VIEWPORT)
    if (!context) {
      return {
        ...result,
        status: 'skipped',
        failureCategory: 'environment/auth setup failure',
        message: fixture.adminAccess.kind === 'unavailable' ? fixture.adminAccess.reason : 'Role context unavailable.',
      }
    }

    page = await context.newPage()
    attachScenarioCapture(page, scenario, result)

    if (scenario.id === 'content-load-error-state') {
      await page.route('**/api/content/classes**', async (route) => {
        result.allowedFindings.push('Controlled Slice 8b content-load failure: /api/content/classes returned 500.')
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Smoke forced content failure' }),
        })
      })
    }

    await page.goto(resolveUrl(route), { waitUntil: 'domcontentloaded' })
    await afterNavigate(page, scenario)
    await waitForVisibleText(page, scenario.expectedText)
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined)

    const screenshotPath = join(ARTIFACT_DIR, scenario.screenshotName)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    result.screenshotPath = screenshotPath

    const hardFailures = scenarioHardFailures(scenario, result)
    if (hardFailures.length > 0) {
      result.status = 'failed'
      result.failureCategory = hardFailures[0].category
      result.message = hardFailures.map((entry) => entry.message).join(' | ')
    } else {
      result.status = 'passed'
    }

    await page.close()
    return result
  } catch (error) {
    if (page && !page.isClosed()) {
      const failureScreenshotPath = join(ARTIFACT_DIR, scenario.screenshotName.replace(/\.png$/, '-failure.png'))
      await page.screenshot({ path: failureScreenshotPath, fullPage: true }).catch(() => undefined)
      result.screenshotPath = failureScreenshotPath
      await page.close().catch(() => undefined)
    }
    result.status = 'failed'
    result.failureCategory = error instanceof Error && error.message.startsWith('environment/auth setup failure')
      ? 'environment/auth setup failure'
      : 'app route/render failure'
    result.message = error instanceof Error ? error.message : String(error)
    return result
  }
}

async function contextFor(
  browser: Browser,
  contexts: Map<SmokeRole, BrowserContext>,
  fixture: DemoFixture,
  role: SmokeRole,
  viewport: { width: number; height: number }
) {
  if (role === 'anonymous') return browser.newContext({ viewport })
  const existing = contexts.get(role)
  if (existing) return existing

  if (role === 'player') {
    const context = await loginWithPassword(browser, PLAYER_EMAIL, DEMO_PASSWORD, viewport)
    contexts.set(role, context)
    return context
  }

  if (role === 'dm') {
    const context = await loginWithPassword(browser, DM_EMAIL, DEMO_PASSWORD, viewport)
    contexts.set(role, context)
    return context
  }

  if (fixture.adminAccess.kind === 'unavailable') return null

  const context = fixture.adminAccess.kind === 'password'
    ? await loginWithPassword(browser, fixture.adminAccess.email, fixture.adminAccess.password, viewport)
    : await loginWithMagicLink(browser, fixture.adminAccess.url, viewport)
  contexts.set(role, context)
  return context
}

async function loginWithPassword(
  browser: Browser,
  email: string,
  password: string,
  viewport: { width: number; height: number }
) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  await page.goto(resolveUrl('/login'), { waitUntil: 'networkidle' })
  await switchToPasswordMode(page)
  await page.locator('#email-pw').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 })
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined)
  await page.close()
  return context
}

async function switchToPasswordMode(page: Page) {
  const passwordField = page.locator('#password')
  if (await passwordField.isVisible().catch(() => false)) return

  const button = page.getByRole('button', { name: 'Use password' })
  await button.waitFor({ state: 'visible', timeout: 20_000 })
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await button.click()
    if (await passwordField.waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false)) {
      return
    }
    await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => undefined)
  }

  throw new Error('environment/auth setup failure: password login mode did not become visible.')
}

async function loginWithMagicLink(
  browser: Browser,
  actionLink: string,
  viewport: { width: number; height: number }
) {
  const session = await verifyMagicLinkSession(actionLink)
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  await installSupabaseSessionCookies(context, session)
  await page.goto(resolveUrl('/dm/content'), { waitUntil: 'domcontentloaded' })
  await waitForVisibleText(page, 'Content Library')
  await page.close()
  return context
}

async function verifyMagicLinkSession(actionLink: string) {
  const link = new URL(actionLink)
  const tokenHash = link.searchParams.get('token')
  if (!tokenHash) {
    throw new Error('environment/auth setup failure: seed-demo admin magic link did not include a token hash.')
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  })
  if (error || !data.session) {
    throw new Error(`environment/auth setup failure: admin magic link verification failed: ${error?.message ?? 'no session returned'}`)
  }
  return data.session
}

async function installSupabaseSessionCookies(context: BrowserContext, session: Session) {
  const sessionCookie = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`
  const cookieUrl = new URL(BASE_URL)
  await context.addCookies(
    chunkCookie(SUPABASE_STORAGE_KEY, sessionCookie).map((cookie) => ({
      ...cookie,
      url: BASE_URL,
      httpOnly: false,
      secure: cookieUrl.protocol === 'https:',
      sameSite: 'Lax' as const,
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }))
  )
}

function chunkCookie(key: string, value: string) {
  const maxChunkSize = 3180
  if (encodeURIComponent(value).length <= maxChunkSize) return [{ name: key, value }]

  const chunks: Array<{ name: string; value: string }> = []
  for (let start = 0; start < value.length; start += maxChunkSize) {
    chunks.push({
      name: `${key}.${chunks.length}`,
      value: value.slice(start, start + maxChunkSize),
    })
  }
  return chunks
}

function attachScenarioCapture(page: Page, scenario: SmokeScenario, result: ScenarioResult) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      if (scenario.id === 'content-load-error-state' && message.text().startsWith('Failed to load resource') && message.text().includes('500')) {
        result.allowedFindings.push(`Controlled browser console finding: ${message.text()}`)
        return
      }
      result.consoleErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    result.pageErrors.push(error.message)
  })
  page.on('requestfailed', (request) => {
    if (isAppUrl(request.url())) {
      result.networkFailures.push(`${request.method()} ${request.url()} failed: ${request.failure()?.errorText ?? 'unknown'}`)
    }
  })
  page.on('response', (response) => {
    if (!isAppUrl(response.url()) || response.status() < 400) return
    if (scenario.id === 'content-load-error-state' && response.url().includes('/api/content/classes')) {
      return
    }
    result.networkFailures.push(`${response.request().method()} ${response.url()} returned ${response.status()}`)
  })
}

async function afterNavigate(page: Page, scenario: SmokeScenario) {
  if (scenario.id === 'admin-content-import-preview') {
    await waitForVisibleText(page, 'Content Library')
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined)
    await page.locator('summary').filter({ hasText: 'Import preview' }).click()
    await page.getByLabel('Import fixture').fill(JSON.stringify(rejectedImportFixture, null, 2))
    await page.locator('details').filter({ hasText: 'Import preview' }).getByRole('button', { name: 'Preview' }).click()
  }
}

async function waitForVisibleText(page: Page, text: string) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 20_000 })
}

function scenarioHardFailures(scenario: SmokeScenario, result: ScenarioResult) {
  const failures: Array<{ category: string; message: string }> = []
  if (result.pageErrors.length > 0) {
    failures.push({ category: 'console/runtime regression', message: `Page errors: ${result.pageErrors.join('; ')}` })
  }
  if (result.consoleErrors.length > 0) {
    failures.push({ category: 'console/runtime regression', message: `Console errors: ${result.consoleErrors.join('; ')}` })
  }
  if (result.networkFailures.length > 0) {
    failures.push({ category: 'app network regression', message: `Network failures: ${result.networkFailures.join('; ')}` })
  }
  if (scenario.kind === 'error-state' && result.allowedFindings.length === 0) {
    failures.push({ category: 'expected known product residual', message: 'Controlled content-load failure was not observed.' })
  }
  return failures
}

async function writeReport(input: {
  fixture: DemoFixture
  results: ScenarioResult[]
  serverStarted: boolean
  serverMessage: string
}) {
  const now = new Date().toISOString()
  const rows = input.results.map((result) => (
    `| ${result.id} | ${result.role} | ${result.kind} | ${result.status} | ${escapeCell(result.route)} | ${escapeCell(result.screenshotPath ? relative(result.screenshotPath) : '')} | ${escapeCell(result.failureCategory ?? '')} |`
  ))
  const findingRows = input.results.flatMap((result) => {
    const findings = [
      ...result.consoleErrors.map((message) => ['console/runtime regression', message] as const),
      ...result.pageErrors.map((message) => ['console/runtime regression', message] as const),
      ...result.networkFailures.map((message) => ['app network regression', message] as const),
      ...result.allowedFindings.map((message) => ['expected known product residual', message] as const),
    ]
    return findings.map(([category, message]) => `| ${result.id} | ${category} | ${escapeCell(message)} |`)
  })

  const report = [
    '# Batch 8d Authenticated Browser Smoke',
    '',
    `Date: ${now}`,
    `Base URL: ${BASE_URL}`,
    `Command: \`npm run smoke:auth\``,
    `Server: ${input.serverMessage}`,
    '',
    '## Failure Taxonomy',
    '',
    ...FAILURE_TAXONOMY.map((entry) => `- ${entry}`),
    '',
    '## Fixture',
    '',
    '- Seed command: `npm run seed-demo`',
    `- Character routes: ${input.fixture.characterRoutes.map((route) => `\`${route}\``).join(', ')}`,
    `- Admin access: ${input.fixture.adminAccess.kind}`,
    '',
    '## Scenario Results',
    '',
    '| Scenario | Role | Kind | Status | Route | Screenshot | Failure category |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '## Console and Network Findings',
    '',
    findingRows.length > 0
      ? ['| Scenario | Category | Finding |', '| --- | --- | --- |', ...findingRows].join('\n')
      : 'No console/runtime or app-network findings were recorded.',
    '',
    '## Follow-up Decisions',
    '',
    '- Slice 8b controlled content-load error coverage is included through the `content-load-error-state` scenario when route interception is stable.',
    '- Screenshot artifacts are written under `output/playwright/batch-8d/`; the markdown report is the tracked summary artifact.',
    '- Environment/auth setup failures are reported separately from app route/render failures so future reruns do not confuse local session problems with product regressions.',
    '',
  ].join('\n')

  await writeFile(REPORT_PATH, report)
}

function resolveUrl(path: string) {
  return new URL(path, BASE_URL).toString()
}

function isAppUrl(url: string) {
  try {
    return new URL(url).origin === new URL(BASE_URL).origin
  } catch {
    return false
  }
}

function escapeCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

function relative(path: string) {
  return path.startsWith(ROOT) ? path.slice(ROOT.length + 1) : path
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function requiredEnv(key: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value = process.env[key]
  if (!value || value.includes('your-project-ref') || value.includes('replace-with-')) {
    throw new Error(`environment/auth setup failure: ${key} is missing or still uses the .env.example placeholder.`)
  }
  return value
}

main().catch(async (error) => {
  await mkdir(join(ROOT, 'output'), { recursive: true }).catch(() => undefined)
  const message = error instanceof Error ? error.message : String(error)
  await writeFile(
    REPORT_PATH,
    [
      '# Batch 8d Authenticated Browser Smoke',
      '',
      `Date: ${new Date().toISOString()}`,
      `Base URL: ${BASE_URL}`,
      '',
      '## Failure Taxonomy',
      '',
      ...FAILURE_TAXONOMY.map((entry) => `- ${entry}`),
      '',
      '## Scenario Results',
      '',
      `environment/auth setup failure: ${message}`,
      '',
    ].join('\n')
  ).catch(() => undefined)
  stopDevServer()
  console.error(`[smoke:auth] ${message}`)
  process.exitCode = 1
})
