import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const characterNewForm = fs.readFileSync(
  path.join(process.cwd(), 'src/app/characters/new/CharacterNewForm.tsx'),
  'utf8'
)
const levelUpWizard = fs.readFileSync(
  path.join(process.cwd(), 'src/app/characters/[id]/LevelUpWizard.tsx'),
  'utf8'
)
const characterRoute = fs.readFileSync(
  path.join(process.cwd(), 'src/app/api/characters/[id]/route.ts'),
  'utf8'
)

test('creation saves still route through the shared atomic save payload builder on the server', () => {
  assert.match(characterRoute, /buildCharacterAtomicSavePayload/)
  assert.match(characterRoute, /buildCharacterLevelUpSavePayload/)
})

test('creation form clears stale species, background, class, and subclass scoped state', () => {
  assert.match(characterNewForm, /function handleSpeciesChange/)
  assert.match(characterNewForm, /setAbilityBonusChoices\(\[\]\)/)
  assert.match(characterNewForm, /setSpeciesSkillChoices\(\[\]\)/)
  assert.match(characterNewForm, /setSpeciesLanguageChoices\(\[\]\)/)
  assert.match(characterNewForm, /setSpeciesToolChoices\(\[\]\)/)
  assert.match(characterNewForm, /function handleBackgroundChange/)
  assert.match(characterNewForm, /setBackgroundSkillChoices\(\[\]\)/)
  assert.match(characterNewForm, /setBackgroundLanguageChoices\(\[\]\)/)
  assert.match(characterNewForm, /setClassSkillChoices\(\[\]\)/)
  assert.match(characterNewForm, /setClassToolChoices\(\[\]\)/)
  assert.match(characterNewForm, /setSubclassSkillChoices\(\[\]\)/)
  assert.match(characterNewForm, /setSubclassLanguageChoices\(\[\]\)/)
})

test('creation form gates step jumps and protects save submits', () => {
  assert.match(characterNewForm, /const maxReachableStepIndex/)
  assert.match(characterNewForm, /disabled=\{locked \|\| working\}/)
  assert.match(characterNewForm, /nextIndex >= 0 && nextIndex <= maxReachableStepIndex/)
  assert.match(characterNewForm, /const saveAbortControllerRef = useRef<AbortController \| null>\(null\)/)
  assert.match(characterNewForm, /if \(working\) return/)
  assert.match(characterNewForm, /signal,\s+body: JSON\.stringify/)
})

test('level-up final save is working-gated and abortable', () => {
  assert.match(levelUpWizard, /const saveAbortControllerRef = useRef<AbortController \| null>\(null\)/)
  assert.match(levelUpWizard, /async function finishLevelUp\(\) \{\s+if \(working\) return/)
  assert.match(levelUpWizard, /signal: controller\.signal/)
})
