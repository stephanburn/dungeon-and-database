import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const routeSource = fs.readFileSync(
  path.join(process.cwd(), 'src/app/api/characters/[id]/route.ts'),
  'utf8'
)

test('character PUT route requires and checks expected_updated_at before saving', () => {
  assert.match(routeSource, /expected_updated_at: z\.string\(\)\.min\(1\)\.optional\(\)/)
  assert.match(routeSource, /existing\.updated_at !== expected_updated_at/)
  assert.match(routeSource, /code: 'optimistic_lock_required'/)
  assert.match(routeSource, /code: 'stale_character'/)
  assert.match(routeSource, /Object\.assign\(characterFields, \{ expected_updated_at \}\)/)
})

test('character PUT route maps known level-up save failures to stable structured codes', () => {
  assert.match(routeSource, /function mapCharacterSaveError/)
  assert.match(routeSource, /code: 'stale_level_up'/)
  assert.match(routeSource, /code: 'invalid_level_up_increment'/)
  assert.match(routeSource, /code: 'duplicate_level_up_choice'/)
  assert.match(routeSource, /status: 409/)
})

test('character edit clients send the current updated_at token on PUT', () => {
  const sheetSource = fs.readFileSync(
    path.join(process.cwd(), 'src/components/character-sheet/CharacterSheet.tsx'),
    'utf8'
  )
  const levelUpSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/characters/[id]/LevelUpWizard.tsx'),
    'utf8'
  )
  const newFormSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/characters/new/CharacterNewForm.tsx'),
    'utf8'
  )

  assert.match(sheetSource, /expected_updated_at: updatedAt/)
  assert.match(levelUpSource, /expected_updated_at: character\.updated_at/)
  assert.match(newFormSource, /expected_updated_at: characterUpdatedAt/)
})
