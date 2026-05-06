import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

test('7f.5 creation wizard explains first-time choices without rules shorthand', () => {
  const creation = read('src/app/characters/new/CharacterNewForm.tsx')
  const creationFlow = read('src/lib/characters/creation-flow.ts')
  const guidedChoices = read('src/components/wizard/GuidedChoiceList.tsx')

  assert.match(creation, /The campaign decides which rules and sources are available\./)
  assert.match(creation, /Your class is the character's main adventuring role\./)
  assert.match(creation, /Ability scores are the six core numbers/)
  assert.match(creation, /Ability boosts improve ability scores/)
  assert.match(creation, /No species are available in this campaign yet\. Ask the DM to check campaign sources\./)
  assert.match(creation, /No classes are available in this campaign yet\. Ask the DM to check campaign sources\./)
  assert.match(creation, /rules check/)
  assert.doesNotMatch(creation, /campaign allowlist/i)
  assert.doesNotMatch(creation, /shared legality result/i)
  assert.doesNotMatch(creation, /has no fixed skill grants modeled in this source/i)
  assert.doesNotMatch(creation, /feat\/ASI slots/)
  assert.match(creationFlow, /Ability scores are the six core numbers/)
  assert.match(creationFlow, /Unavailable in this campaign/)
  assert.match(guidedChoices, /Chosen/)
  assert.match(guidedChoices, /Unavailable right now/)
})

test('7f.5 level-up copy offers novice defaults and expands ASI language', () => {
  const levelUp = read('src/app/characters/[id]/LevelUpWizard.tsx')

  assert.match(levelUp, /Ability boost or feat/)
  assert.match(levelUp, /ability score increase/)
  assert.match(levelUp, /Recommended: fixed gain/)
  assert.match(levelUp, /Good default if your table uses average HP/)
  assert.match(levelUp, /Rules check before returning to the sheet/)
  assert.match(levelUp, /not a full rules audit/)
  assert.doesNotMatch(levelUp, /ASI \/ Feat/)
  assert.doesNotMatch(levelUp, /new ASI \/ feat decision/)
  assert.doesNotMatch(levelUp, /legality pass/)
  assert.doesNotMatch(levelUp, /in this data set/)
  assert.doesNotMatch(levelUp, /feat \/ ASI slot/)
})

test('7f.5 sheet and shared choice cards avoid implementation-gap language', () => {
  const sheet = read('src/components/character-sheet/CharacterSheet.tsx')
  const feats = read('src/components/character-sheet/FeatsCard.tsx')
  const spells = read('src/components/character-sheet/SpellsCard.tsx')
  const sourceTag = read('src/components/shared/SourceTag.tsx')

  assert.match(sheet, /Ability Boost and Feat History/)
  assert.match(sheet, /No ability boost or feat choices have been recorded yet\./)
  assert.match(sheet, /Sources, rules check, and choice history for review\./)
  assert.match(feats, /Ability boost/)
  assert.match(feats, /Take ability boost or choose feat/)
  assert.match(spells, /This character does not need to choose spells here for the current class and campaign\./)
  assert.match(sourceTag, /This entry has a table note for this campaign\./)
  assert.doesNotMatch(sheet, /No ASI or feat choices/)
  assert.doesNotMatch(sheet, /Sources, legality/)
  assert.doesNotMatch(feats, /ASI slot/)
  assert.doesNotMatch(feats, /Take ASI/)
  assert.doesNotMatch(spells, /No castable spells are available/)
})

test('roadmap records the delivered 7f.5 comprehension pass in the completed Batch 7 sequence', () => {
  const roadmap = read('output/character-creator-roadmap.md')
  const qa = read('output/batch-7-visual-qa.md')
  const review = read('output/batch-7-user-review.md')

  assert.match(roadmap, /Slice `7f\.5` delivered the novice-player comprehension pass/)
  assert.match(roadmap, /Slice 7f\.5 — Novice player comprehension pass\*\* \(delivered 2026-05-06\)/)
  assert.match(roadmap, /7g: behavior-preserving module splitting\. \(Done\)/)
  assert.match(roadmap, /7h: conditional multi-source skill provenance audit, only if triggered by DM-review evidence\. \(Done\)/)
  assert.match(roadmap, /7i: closeout gate\. \(Done\)/)
  assert.match(qa, /7f\.5 Completion Note/)
  assert.match(review, /7f\.5 Outcome/)
})
