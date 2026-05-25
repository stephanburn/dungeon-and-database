import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')

test('slice 8d wires a repo-local authenticated browser smoke harness', () => {
  const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string>, devDependencies?: Record<string, string> }
  const gitignore = read('.gitignore')

  assert.equal(packageJson.scripts['smoke:auth'], 'node --import tsx --env-file=.env.local scripts/auth-smoke/run.ts')
  assert.ok(packageJson.devDependencies?.playwright, 'playwright must be a repo dev dependency for smoke:auth')
  assert.ok(existsSync(join(ROOT, 'scripts/auth-smoke/scenarios.ts')))
  assert.ok(existsSync(join(ROOT, 'scripts/auth-smoke/run.ts')))
  assert.match(gitignore, /!\/output\/batch-8d-authenticated-smoke\.md/)

  const scenarios = read('scripts/auth-smoke/scenarios.ts')
  for (const expected of [
    'anonymous-login-desktop',
    'anonymous-login-mobile',
    'player-dashboard',
    'player-creation',
    'player-changes-requested-sheet',
    'player-level-up-entry',
    'dm-dashboard',
    'dm-submitted-review',
    'admin-content-library',
    'admin-content-import-preview',
    'content-load-error-state'
  ]) {
    assert.match(scenarios, new RegExp(`id: '${expected}'`), `${expected} scenario is missing`)
  }
  assert.match(scenarios, /expectedText:/)
  assert.match(scenarios, /screenshotName:/)
  assert.match(scenarios, /kind: 'error-state'/)

  const runner = read('scripts/auth-smoke/run.ts')
  assert.match(runner, /output\/playwright\/batch-8d/)
  assert.match(runner, /output\/batch-8d-authenticated-smoke\.md/)
  assert.match(runner, /environment\/auth setup failure/)
  assert.match(runner, /app route\/render failure/)
  assert.match(runner, /console\/runtime regression/)
  assert.match(runner, /app network regression/)
  assert.match(runner, /expected known product residual/)
  assert.match(runner, /npm run seed-demo/)
  assert.match(runner, /browser\.newContext/)
  assert.match(runner, /page\.screenshot/)
})
