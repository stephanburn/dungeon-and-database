import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')

function listFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(dir, entry.name)
    if (entry.name === 'node_modules' || entry.name === '.next') return []
    if (statSync(join(ROOT, relativePath)).isDirectory()) return listFiles(relativePath)
    return relativePath
  })
}

function parseEnvExample(source: string): Record<string, string> {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [key, ...valueParts] = line.split('=')
        return [key, valueParts.join('=').replace(/^"|"$/g, '')]
      })
  )
}

test('slice 7a env example covers every app env key with safe placeholders', () => {
  const envExample = read('.env.example')
  const env = parseEnvExample(envExample)
  const sourceFiles = ['src', 'scripts']
    .flatMap(listFiles)
    .filter((path) => /\.(?:ts|tsx|js|mjs)$/.test(path))
    .filter((path) => path !== 'scripts/seed-demo.ts')

  const referencedKeys = new Set<string>()
  for (const file of sourceFiles) {
    const source = read(file)
    for (const match of Array.from(source.matchAll(/process\.env\.([A-Z0-9_]+)/g))) {
      referencedKeys.add(match[1])
    }
  }

  for (const key of Array.from(referencedKeys)) {
    assert.ok(env[key], `.env.example is missing ${key}`)
  }

  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, 'https://your-project-ref.supabase.co')
  assert.equal(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'replace-with-your-supabase-anon-key')
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, 'replace-with-your-supabase-service-role-key')
  assert.doesNotMatch(envExample, /cqpyvaynpzgyjerfesmz\.supabase\.co/)
  assert.doesNotMatch(envExample, /eyJ[A-Za-z0-9_-]+\./)
})

test('slice 7a wires deterministic demo seed command and fixture states', () => {
  const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> }

  assert.equal(packageJson.scripts['seed-demo'], 'tsx --env-file=.env.local scripts/seed-demo.ts')
  assert.ok(existsSync(join(ROOT, 'scripts/seed-demo.ts')))

  const seedDemo = read('scripts/seed-demo.ts')
  assert.match(seedDemo, /createClient<Database>/)
  assert.match(seedDemo, /auth\.admin\.createUser/)
  assert.match(seedDemo, /demo-admin@dungeon-and-database\.local/)
  assert.match(seedDemo, /demo-dm@dungeon-and-database\.local/)
  assert.match(seedDemo, /demo-player@dungeon-and-database\.local/)
  assert.match(seedDemo, /campaign_source_allowlist/)
  assert.match(seedDemo, /PHB/)
  assert.match(seedDemo, /ERftLW/)
  assert.match(seedDemo, /status: 'draft'/)
  assert.match(seedDemo, /status: 'submitted'/)
  assert.match(seedDemo, /status: 'changes_requested'|status: 'approved'/)
  assert.match(seedDemo, /validateContentImport/)
  assert.match(seedDemo, /duplicate_record/)
  assert.doesNotMatch(seedDemo, /console\.log\([^)]*SUPABASE_SERVICE_ROLE_KEY/)
})

test('slice 7a documents repeatable authenticated QA start points', () => {
  const setup = read('SETUP.md')
  const readme = read('README.md')

  for (const doc of [setup, readme]) {
    assert.match(doc, /npm run seed-srd/)
    assert.match(doc, /npm run seed-demo/)
    assert.match(doc, /demo-admin@dungeon-and-database\.local/)
    assert.match(doc, /demo-dm@dungeon-and-database\.local/)
    assert.match(doc, /demo-player@dungeon-and-database\.local/)
    assert.match(doc, /\/dm\/content/)
    assert.match(doc, /\/dm\/dashboard/)
    assert.match(doc, /\/characters\/new/)
  }
})

test('slice 7a doctor warns about placeholder keys without printing secrets', () => {
  const doctor = read('scripts/doctor.sh')

  assert.match(doctor, /warn_placeholder_env/)
  assert.match(doctor, /NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  assert.match(doctor, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(doctor, /replace-with-your-supabase-anon-key/)
  assert.match(doctor, /replace-with-your-supabase-service-role-key/)
  assert.match(doctor, /npm run seed-srd/)
  assert.match(doctor, /npm run seed-demo/)
  assert.doesNotMatch(doctor, /cat \.env\.local/)
  assert.doesNotMatch(doctor, /echo "\$SUPABASE_SERVICE_ROLE_KEY"/)
})
