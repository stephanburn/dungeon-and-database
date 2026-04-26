import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const closeoutPath = join(process.cwd(), 'output', 'batch-eberron-closeout-audit.md')
const roadmapPath = join(process.cwd(), 'output', 'character-creator-roadmap.md')

function read(path: string) {
  return readFileSync(path, 'utf8')
}

test('Slice E7 writes the Batch Eberron closeout audit with delivered slice status', () => {
  assert.equal(existsSync(closeoutPath), true, 'expected output/batch-eberron-closeout-audit.md')

  const closeout = read(closeoutPath)
  assert.match(closeout, /Batch Eberron Closeout Audit/i)
  assert.match(closeout, /Date: 2026-04-26/i)
  for (const slice of ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7']) {
    assert.match(closeout, new RegExp(`\\| ${slice} \\|[\\s\\S]*?\\| Delivered \\|`, 'i'))
  }
  assert.match(closeout, /test\/eberron-content-audit\.test\.ts/i)
  assert.match(closeout, /test\/eberron-regression-matrix\.test\.ts/i)
})

test('Slice E7 closeout documents remaining ERftLW gaps as outside the current app domain', () => {
  const closeout = read(closeoutPath)

  assert.match(closeout, /Remaining ERftLW gaps outside the current app domain/i)
  for (const gap of [
    /Last War history/i,
    /vehicles/i,
    /adventure/i,
    /NPC and monster stat blocks/i,
    /full magic item catalog/i,
    /DM tooling/i,
  ]) {
    assert.match(closeout, gap)
  }
  assert.match(closeout, /House Agent mixed tool-or-language choice/i)
  assert.match(closeout, /Revenant Blade combat riders/i)
  assert.match(closeout, /per-infusion combat automation/i)
})

test('Slice E7 updates the roadmap so Batch 6 inherits a clean Eberron baseline', () => {
  const roadmap = read(roadmapPath)

  assert.match(roadmap, /Batch Eberron is now effectively complete and closed out by Slice `E7` on 2026-04-26/i)
  assert.match(roadmap, /E7: Batch Eberron closeout\. \(complete\)/i)
  assert.match(roadmap, /Batch 6 begins with a known-complete ERftLW player-options baseline/i)
  assert.match(roadmap, /output\/batch-eberron-closeout-audit\.md/i)
  assert.match(roadmap, /should not re-open sourcebook-completion work/i)
})
