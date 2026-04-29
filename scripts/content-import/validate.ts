import { readFileSync } from 'node:fs'
import { validateContentImport, type ContentImportBundle } from './validator'

function parseArgs(argv: string[]): { fixturePath: string | null } {
  const fixtureIndex = argv.indexOf('--fixture')
  if (fixtureIndex === -1) return { fixturePath: null }
  return { fixturePath: argv[fixtureIndex + 1] ?? null }
}

function printUsage() {
  console.error('Usage: npm run content:validate -- --fixture path/to/content-import.json')
}

async function main() {
  const { fixturePath } = parseArgs(process.argv.slice(2))
  if (!fixturePath) {
    printUsage()
    process.exit(1)
  }

  const bundle = JSON.parse(readFileSync(fixturePath, 'utf8')) as ContentImportBundle
  const result = validateContentImport(bundle)

  if (result.ok) {
    console.log(JSON.stringify({ ok: true, errors: [] }, null, 2))
    return
  }

  console.error(JSON.stringify(result, null, 2))
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
