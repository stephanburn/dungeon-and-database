import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

test('batch 7 closeout audit records final slice status and review outcomes', () => {
  const closeout = read('output/batch-7-closeout-audit.md')

  for (const slice of ['7a', '7b', '7c', '7d', '7e', '7UserTest1', '7UserTest2', '7f', '7f.5', '7g', '7h', '7i']) {
    assert.match(closeout, new RegExp(`\\| ${slice} \\|[\\s\\S]*Delivered`, 'i'))
  }

  assert.match(closeout, /Visual QA Summary/i)
  assert.match(closeout, /User Review Summary/i)
  assert.match(closeout, /Fixed/i)
  assert.match(closeout, /Deferred with rationale/i)
  assert.match(closeout, /magic-link email branding/i)
  assert.match(closeout, /No `character_skill_proficiency_sources` migration was added/i)
})

test('batch 7 closeout audit proves verification and module-splitting coverage', () => {
  const closeout = read('output/batch-7-closeout-audit.md')

  assert.match(closeout, /Verification Coverage/i)
  assert.match(closeout, /npm test/i)
  assert.match(closeout, /npm run build/i)
  assert.match(closeout, /npm run doctor/i)
  assert.match(closeout, /route-persistence-7b/i)
  assert.match(closeout, /batch-7-regression-matrix/i)
  assert.match(closeout, /content-import/i)
  assert.match(closeout, /batch-7-visual-qa/i)

  assert.match(closeout, /Module-Splitting Summary/i)
  assert.match(closeout, /build-context\.ts/)
  assert.match(closeout, /feature-grants\.ts/)
  assert.match(closeout, /legality\/engine\.ts/)
  assert.match(closeout, /derived\.ts/)
  assert.match(closeout, /CharacterSheet\.tsx/)
})

test('batch 7 closeout assigns residuals and concrete next-batch entry notes', () => {
  const closeout = read('output/batch-7-closeout-audit.md')

  assert.match(closeout, /Residuals/i)
  assert.match(closeout, /Owner/i)
  assert.match(closeout, /Target date/i)
  assert.match(closeout, /Reason/i)
  assert.match(closeout, /Batch 8 Entry Notes/i)
  assert.match(closeout, /Finish remaining behavior-preserving module splits/i)
  assert.match(closeout, /Authenticated screenshot smoke/i)
  assert.match(closeout, /provider configuration/i)
})

test('roadmap marks batch 7 closed and starts the next batch from concrete handoff notes', () => {
  const roadmap = read('output/character-creator-roadmap.md')

  assert.match(roadmap, /Batch 7 is now effectively complete and closed out by Slice `7i` on 2026-05-06/i)
  assert.match(roadmap, /output\/batch-7-closeout-audit\.md/)
  assert.match(roadmap, /Batch 8 entry notes/i)
  assert.match(roadmap, /## Batch 8: Post-Batch-7 Stabilization/i)
  assert.match(roadmap, /Slice 8a/i)
  assert.match(roadmap, /Slice 8b/i)
  assert.match(roadmap, /Slice 8c/i)
  assert.match(roadmap, /Slice 8d/i)
  assert.match(roadmap, /Finish remaining behavior-preserving module splits/i)
  assert.match(roadmap, /Authenticated screenshot smoke/i)
  assert.match(roadmap, /magic-link email branding/i)
  assert.match(roadmap, /7i: closeout gate\. \(Done\)/)
})
