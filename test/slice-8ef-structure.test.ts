import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const ROOT = process.cwd()
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')

test('slice 8ef splits derived HP and ability helpers behind compatibility exports', () => {
  assert.ok(existsSync(join(ROOT, 'src/lib/characters/derived-abilities.ts')))
  assert.ok(existsSync(join(ROOT, 'src/lib/characters/derived-hit-points.ts')))

  const derived = read('src/lib/characters/derived.ts')
  const hp = read('src/lib/characters/derived-hit-points.ts')
  const abilities = read('src/lib/characters/derived-abilities.ts')

  assert.match(derived, /from '@\/lib\/characters\/derived-abilities'/)
  assert.match(derived, /from '@\/lib\/characters\/derived-hit-points'/)
  assert.doesNotMatch(derived, /stores at most one per-class HP roll/)
  assert.match(hp, /classLevels/)
  assert.match(hp, /isStartingLevel/)
  assert.match(abilities, /deriveAbilityScores/)
})

test('slice 8ef extracts CharacterSheet content loading and save payload seams', () => {
  assert.ok(existsSync(join(ROOT, 'src/components/character-sheet/useSheetContent.ts')))
  assert.ok(existsSync(join(ROOT, 'src/components/character-sheet/sheet-save-payload.ts')))

  const sheet = read('src/components/character-sheet/CharacterSheet.tsx')
  const contentHook = read('src/components/character-sheet/useSheetContent.ts')
  const savePayload = read('src/components/character-sheet/sheet-save-payload.ts')

  assert.match(sheet, /useSheetContent/)
  assert.match(sheet, /buildSheetSavePayload/)
  assert.doesNotMatch(sheet, /fetchContent<Species\[]>/)
  assert.doesNotMatch(sheet, /body: JSON\.stringify\(\{\s*name:/)
  assert.match(contentHook, /fetchContent/)
  assert.match(contentHook, /retryContentLoad/)
  assert.match(savePayload, /expected_updated_at/)
  assert.match(savePayload, /character_levels/)
})
