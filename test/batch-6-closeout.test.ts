import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

test('batch 6 closeout audit records delivered slices and verification coverage', () => {
  const closeout = read('output/batch-6-closeout-audit.md')

  for (const slice of ['6a', '6b', '6c', '6d', '6e', '6f', '6g', '6h', '6i']) {
    assert.match(closeout, new RegExp(`\\| ${slice} \\|[\\s\\S]*Delivered`, 'i'))
  }

  assert.match(closeout, /Spellcasting derivation seam/i)
  assert.match(closeout, /feature spell grants/i)
  assert.match(closeout, /language\/tool key cutover/i)
  assert.match(closeout, /legacy spell attribution/i)
  assert.match(closeout, /dry-run content validator/i)
  assert.match(closeout, /admin CRUD/i)
  assert.match(closeout, /bulk source import/i)
  assert.match(closeout, /npm test/i)
  assert.match(closeout, /npm run build/i)
})

test('batch 6 closeout audit proves import and admin maintenance walkthroughs', () => {
  const closeout = read('output/batch-6-closeout-audit.md')

  assert.match(closeout, /Representative import dry run/i)
  assert.match(closeout, /Create\s+1/i)
  assert.match(closeout, /Update\s+1/i)
  assert.match(closeout, /No change\s+3/i)
  assert.match(closeout, /Retire\s+1/i)
  assert.match(closeout, /content:import/i)

  assert.match(closeout, /Representative admin maintenance walkthrough/i)
  assert.match(closeout, /languages/i)
  assert.match(closeout, /tools/i)
  assert.match(closeout, /feature option groups/i)
  assert.match(closeout, /equipment items/i)
  assert.match(closeout, /starting equipment packages/i)
  assert.match(closeout, /Preview before save/i)
})

test('batch 6 closeout assigns residuals with owner date and reason', () => {
  const closeout = read('output/batch-6-closeout-audit.md')

  assert.match(closeout, /Batch 5 carry-ins/i)
  assert.match(closeout, /Closed/i)
  assert.match(closeout, /Deferred/i)
  assert.match(closeout, /Owner/i)
  assert.match(closeout, /Target date/i)
  assert.match(closeout, /Reason/i)
  assert.match(closeout, /multi-source skill provenance audit table/i)
  assert.match(closeout, /Batch 7/i)
  assert.match(closeout, /2026-05-15/i)
})

test('roadmap marks batch 6 closed and gives concrete batch 7 entry notes', () => {
  const roadmap = read('output/character-creator-roadmap.md')

  assert.match(roadmap, /Batch 6 is now effectively complete and closed out by Slice `6i` on 2026-04-29/i)
  assert.match(roadmap, /output\/batch-6-closeout-audit\.md/)
  assert.match(roadmap, /Batch 7 entry notes/i)
  assert.match(roadmap, /authenticated visual QA/i)
  assert.match(roadmap, /admin create\/edit\/retire flows/i)
  assert.match(roadmap, /setup documentation/i)
  assert.doesNotMatch(roadmap, /hidden content-data cleanup/i)
})
