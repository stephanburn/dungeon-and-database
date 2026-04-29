import { runSrdSeed } from './content-import/srd-seed'

runSrdSeed().catch((error) => {
  console.error('[seed-srd] Fatal error:', error)
  process.exit(1)
})
