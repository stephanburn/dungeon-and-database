import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const closeoutAudit = readFileSync(
  join(process.cwd(), 'output', 'batch-4-closeout-audit.md'),
  'utf8'
)
const roadmap = readFileSync(
  join(process.cwd(), 'output', 'character-creator-roadmap.md'),
  'utf8'
)
const characterRoute = readFileSync(
  join(process.cwd(), 'src', 'app', 'api', 'characters', '[id]', 'route.ts'),
  'utf8'
)

test('batch 4 closeout audit records the representative archetype matrix', () => {
  assert.match(closeoutAudit, /Single-class caster/i)
  assert.match(closeoutAudit, /Multiclass caster \/ martial/i)
  assert.match(closeoutAudit, /Feat-heavy/i)
  assert.match(closeoutAudit, /Species \/ background-heavy/i)
  assert.match(closeoutAudit, /guided creation flow only/i)
  assert.match(closeoutAudit, /guided level-up flow/i)
})

test('batch 4 closeout audit carries explicit batch 5 entry tasks', () => {
  assert.match(closeoutAudit, /Batch 5 Entry Tasks/i)
  assert.match(closeoutAudit, /stale .*source_category.*source_entity_id/i)
  assert.match(closeoutAudit, /sheet presentation/i)
})

test('guided character saves stay on the atomic save paths rather than direct legacy choice writes', () => {
  assert.match(characterRoute, /saveCharacterAtomic/i)
  assert.match(characterRoute, /saveCharacterLevelUpAtomic/i)
  assert.doesNotMatch(characterRoute, /from\('character_choices'\)\.(insert|upsert|update)/i)
})

test('roadmap marks slice 4o as the batch 4 closeout gate before batch 5', () => {
  assert.match(roadmap, /Slice 4o is the Batch 4 closeout gate before Batch 5 begins/i)
  assert.match(roadmap, /Batch 5: Sheet Calculation and Presentation/i)
})
