import { readFileSync, writeFileSync } from 'node:fs'
import {
  applyContentImportPlan,
  formatContentImportPlan,
  planContentImport,
  type ContentImportSnapshot,
} from './import-workflow'
import type { ContentImportBundle } from './validator'

type ImportArgs = {
  fixturePath: string | null
  statePath: string | null
  apply: boolean
  dryRun: boolean
  retireMissing: boolean
  format: 'json' | 'text'
}

function parseArgs(argv: string[]): ImportArgs {
  const fixtureIndex = argv.indexOf('--fixture')
  const stateIndex = argv.indexOf('--state')
  const formatIndex = argv.indexOf('--format')
  const format = formatIndex === -1 ? 'text' : argv[formatIndex + 1]

  return {
    fixturePath: fixtureIndex === -1 ? null : argv[fixtureIndex + 1] ?? null,
    statePath: stateIndex === -1 ? null : argv[stateIndex + 1] ?? null,
    apply: argv.includes('--apply'),
    dryRun: argv.includes('--dry-run') || !argv.includes('--apply'),
    retireMissing: argv.includes('--retire-missing'),
    format: format === 'json' ? 'json' : 'text',
  }
}

function printUsage() {
  console.error('Usage: npm run content:import -- --fixture path/to/content-import.json [--state path/to/import-state.json] [--dry-run|--apply] [--retire-missing] [--format json|text]')
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function printResult(result: unknown, text: string, format: 'json' | 'text') {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(text)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.fixturePath) {
    printUsage()
    process.exit(1)
  }

  const bundle = readJsonFile<ContentImportBundle>(args.fixturePath)
  const snapshot = args.statePath ? readJsonFile<ContentImportSnapshot>(args.statePath) : {}

  if (args.apply) {
    if (!args.statePath) {
      console.error('--apply requires --state so the same validated payload has an explicit write target.')
      process.exit(1)
    }

    const result = applyContentImportPlan(bundle, snapshot, { retireMissing: args.retireMissing })
    printResult(result, formatContentImportPlan(result.plan), args.format)
    if (!result.ok) process.exit(1)
    writeFileSync(args.statePath, `${JSON.stringify(result.nextSnapshot, null, 2)}\n`)
    return
  }

  if (args.dryRun) {
    const plan = planContentImport(bundle, snapshot, { retireMissing: args.retireMissing })
    printResult(plan, formatContentImportPlan(plan), args.format)
    if (!plan.ok) process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
