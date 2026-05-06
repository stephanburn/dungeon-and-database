import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const legalityModules = [
  'src/lib/legality/types.ts',
  'src/lib/legality/source-checks.ts',
  'src/lib/legality/ability-checks.ts',
  'src/lib/legality/proficiency-checks.ts',
  'src/lib/legality/feat-checks.ts',
  'src/lib/legality/spell-checks.ts',
  'src/lib/legality/feature-option-checks.ts',
]

test('Slice 7g keeps legality engine as a focused orchestration module', () => {
  const engine = readFileSync('src/lib/legality/engine.ts', 'utf8')
  const lineCount = engine.split('\n').length

  for (const path of legalityModules) {
    assert.equal(existsSync(path), true, `${path} should exist after the Slice 7g split`)
  }

  assert.ok(lineCount < 100, `legality/engine.ts should stay small after the split; saw ${lineCount} lines`)
  assert.match(engine, /from '\.\/source-checks'/)
  assert.match(engine, /from '\.\/ability-checks'/)
  assert.match(engine, /from '\.\/proficiency-checks'/)
  assert.match(engine, /from '\.\/feat-checks'/)
  assert.match(engine, /from '\.\/spell-checks'/)
  assert.match(engine, /from '\.\/feature-option-checks'/)
  assert.match(engine, /export type \{ LegalityCheck, LegalityInput, LegalityResult \} from '\.\/types'/)
  assert.doesNotMatch(engine, /function checkSpellLegality/)
  assert.doesNotMatch(engine, /function checkSkillProficiencies/)
  assert.doesNotMatch(engine, /function checkSubclassFeatureOptionSelections/)
})

test('Slice 7g roadmap records the delivered legality engine split', () => {
  const roadmap = readFileSync('output/character-creator-roadmap.md', 'utf8')

  assert.match(roadmap, /Slice 7g legality engine split delivered/)
  assert.match(roadmap, /split `src\/lib\/legality\/engine\.ts`/)
  assert.match(roadmap, /remaining 7g module splits stay queued/)
})
