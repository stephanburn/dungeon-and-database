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
  assert.match(closeoutAudit, /4\.5 overlap regression/i)
  assert.match(closeoutAudit, /skill overlap merge/i)
  assert.match(closeoutAudit, /stale-write handling/i)
  assert.match(closeoutAudit, /guided creation flow only/i)
  assert.match(closeoutAudit, /guided level-up flow/i)
})

test('batch 4 closeout audit carries explicit batch 5 entry tasks', () => {
  assert.match(closeoutAudit, /Batch 5 Entry Tasks/i)
  assert.match(closeoutAudit, /stale .*source_category.*source_entity_id/i)
  assert.match(closeoutAudit, /sheet presentation/i)
  assert.match(closeoutAudit, /character_skill_proficiency_sources/i)
  assert.match(closeoutAudit, /copy of production data/i)
})

test('batch 4.5 addendum records final corrections and residual deployment gates', () => {
  assert.match(closeoutAudit, /Batch 4\.5 Addendum/i)
  assert.match(closeoutAudit, /Final correction list/i)
  assert.match(closeoutAudit, /Path B/i)
  assert.match(closeoutAudit, /first grant's provenance/i)
  assert.match(closeoutAudit, /migrations `067` and `068`/i)
  assert.match(closeoutAudit, /Batch 4 and Batch 4\.5 are effectively complete/i)
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

test('roadmap marks batch 4.5 closed and batch 5 unblocked', () => {
  assert.match(roadmap, /Batch 4\.5 is now effectively complete/i)
  assert.match(roadmap, /Slice `4\.5h`/i)
  assert.match(roadmap, /The intended next step is Batch 5 sheet calculation and presentation/i)
  assert.match(roadmap, /live data-copy migration smoke.*deployment gate/i)
})
