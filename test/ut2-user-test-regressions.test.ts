import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('UT2: HP-only level-up submit does not resend existing feature or feat choices', () => {
  const levelUpSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/characters/[id]/LevelUpWizard.tsx'),
    'utf8'
  )

  assert.match(levelUpSource, /feature_option_choices: newLevelFeatureOptionChoices/)
  assert.match(levelUpSource, /feat_choices: newLevelFeatChoices/)
  assert.doesNotMatch(levelUpSource, /feature_option_choices: afterStateFeatureOptionChoices/)
  assert.doesNotMatch(levelUpSource, /feat_choices: afterStateFeatChoices/)
})

test('UT2: player sheet cannot bypass guided level-up through raw class-level edits', () => {
  const sheetSource = fs.readFileSync(
    path.join(process.cwd(), 'src/components/character-sheet/CharacterSheet.tsx'),
    'utf8'
  )

  assert.match(sheetSource, /const canEditClassProgression = canEdit && isDm/)
  assert.match(sheetSource, /\{canEditClassProgression && \(/)
  assert.match(sheetSource, /canEditClassProgression \? \(/)
})
