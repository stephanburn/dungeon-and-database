import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

test('slice 7g splits build-context into focused helper modules with stable re-exports', () => {
  const root = 'src/lib/characters'
  const files = [
    `${root}/build-context-types.ts`,
    `${root}/build-context-summaries.ts`,
    `${root}/build-context-ability.ts`,
    `${root}/build-context-progression.ts`,
    `${root}/build-context-resources.ts`,
    `${root}/build-context-combat.ts`,
    `${root}/build-context-history.ts`,
  ]

  for (const file of files) {
    assert.equal(existsSync(file), true, `${file} should exist`)
  }

  const source = read(`${root}/build-context.ts`)
  const lines = source.split('\n').length

  assert.ok(lines < 650, `build-context.ts should be an orchestration module, got ${lines} lines`)
  assert.match(source, /export type \{[\s\S]*CharacterBuildContext[\s\S]*BuildClassSummary[\s\S]*\} from '\.\/build-context-types'/)
  assert.match(source, /from '\.\/build-context-ability'/)
  assert.match(source, /from '\.\/build-context-progression'/)
  assert.match(source, /from '\.\/build-context-resources'/)
  assert.match(source, /from '\.\/build-context-combat'/)
  assert.match(source, /from '\.\/build-context-history'/)
  assert.doesNotMatch(source, /export interface BuildClassSummary/)
  assert.doesNotMatch(source, /function deriveClassResources/)
  assert.doesNotMatch(source, /function deriveCombatActions/)
})

test('slice 7g records the build-context split and keeps remaining module splits queued', () => {
  const roadmap = read('output/character-creator-roadmap.md')

  assert.match(roadmap, /Slice 7g build-context split delivered/)
  assert.match(roadmap, /split `src\/lib\/characters\/build-context\.ts`/)
  assert.match(roadmap, /remaining 7g module splits stay queued/)
})
