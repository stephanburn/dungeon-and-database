import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

test('batch 8 closeout audit records delivered slices and verification coverage', () => {
  assert.equal(existsSync('output/batch-8-closeout-audit.md'), true)
  const closeout = read('output/batch-8-closeout-audit.md')

  assert.match(closeout, /# Batch 8 Closeout Audit/i)
  assert.match(closeout, /Date: 2026-05-25/i)

  for (const slice of ['8a', '8b', '8c', '8d', '8ef', '8gh', '8i', '8j']) {
    assert.match(closeout, new RegExp(`\\| ${slice} \\|[\\s\\S]*Delivered`, 'i'))
  }

  assert.match(closeout, /Verification Summary/i)
  assert.match(closeout, /npm test/i)
  assert.match(closeout, /npm run build/i)
  assert.match(closeout, /npm run doctor/i)
  assert.match(closeout, /npm run smoke:auth/i)
  assert.match(closeout, /output\/batch-8d-authenticated-smoke\.md/)
  assert.match(closeout, /Doctor check passed/i)
})

test('batch 8 closeout assigns residuals with owner, target date, and reason', () => {
  const closeout = read('output/batch-8-closeout-audit.md')

  assert.match(closeout, /Residuals/i)
  assert.match(closeout, /Owner/i)
  assert.match(closeout, /Target date/i)
  assert.match(closeout, /Reason/i)
  assert.match(closeout, /CharacterNewForm\.tsx/)
  assert.match(closeout, /LevelUpWizard\.tsx/)
  assert.match(closeout, /ContentAdmin\.tsx/)
  assert.match(closeout, /hosted Supabase email templates/i)
})

test('batch 7 closeout audit no longer points at the old character-creation path', () => {
  const closeout = read('output/batch-7-closeout-audit.md')

  assert.doesNotMatch(closeout, /src\/lib\/character-creation/)
  assert.match(closeout, /src\/lib\/characters\/build-context\.ts/)
  assert.match(closeout, /src\/lib\/characters\/feature-grants\.ts/)
  assert.match(closeout, /src\/lib\/characters\/legality\/engine\.ts/)
  assert.match(closeout, /src\/lib\/characters\/derived\.ts/)
})

test('roadmap marks batch 8 closed and opens batch 9 from concrete handoff notes', () => {
  const roadmap = read('output/character-creator-roadmap.md')

  assert.match(roadmap, /Batch 8 is now effectively complete and closed out by Slice `8j` on 2026-05-25/i)
  assert.match(roadmap, /output\/batch-8-closeout-audit\.md/)
  assert.match(roadmap, /Batch 9 opens/i)
  assert.match(roadmap, /Slice 9a/i)
  assert.match(roadmap, /output\/batch-9-direction-decision\.md/)
  assert.doesNotMatch(roadmap, /The Batch 8 closeout audit may add to this list/i)
})
