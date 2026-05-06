import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const featureGrantModules = [
  'src/lib/characters/feature-grants-types.ts',
  'src/lib/characters/feature-grants-options.ts',
  'src/lib/characters/feature-grants-definitions.ts',
  'src/lib/characters/feature-grants-spells.ts',
]

test('Slice 7g keeps feature-grants public surface as a small compatibility module', () => {
  const barrel = readFileSync('src/lib/characters/feature-grants.ts', 'utf8')
  const lineCount = barrel.split('\n').length

  for (const path of featureGrantModules) {
    assert.equal(existsSync(path), true, `${path} should exist after the Slice 7g split`)
  }

  assert.ok(lineCount < 80, `feature-grants.ts should stay small after the split; saw ${lineCount} lines`)
  assert.match(barrel, /export \* from '\.\/feature-grants-types'/)
  assert.match(barrel, /export \* from '\.\/feature-grants-options'/)
  assert.match(barrel, /export \* from '\.\/feature-grants-definitions'/)
  assert.match(barrel, /export \* from '\.\/feature-grants-spells'/)
  assert.doesNotMatch(barrel, /export function getStaticSpeciesGrantedSpells/)
  assert.doesNotMatch(barrel, /export function getSubclassFeatureOptionDefinitions/)
  assert.doesNotMatch(barrel, /export interface FeatureSpellChoiceDefinition/)
})

test('Slice 7g roadmap records the delivered feature-grants split', () => {
  const roadmap = readFileSync('output/character-creator-roadmap.md', 'utf8')

  assert.match(roadmap, /Slice 7g feature-grants split delivered/)
  assert.match(roadmap, /split `src\/lib\/characters\/feature-grants\.ts`/)
  assert.match(roadmap, /remaining 7g module splits stay queued/)
})
