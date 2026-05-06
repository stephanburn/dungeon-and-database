import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

test('content admin replaces native confirm with shared dialog and stable table keys', () => {
  const source = read('src/components/dm/ContentAdmin.tsx')

  assert.match(source, /ConfirmActionButton/)
  assert.doesNotMatch(source, /confirm\(/)
  assert.match(source, /Children\.toArray\(renderTableCells/)
  assert.match(source, /key=\{`\$\{itemKey\}:cell:\$\{cellIndex\}`\}/)
  assert.match(source, /title=\{`Delete \$\{tabLabel\(tab\)\}`\}/)
})

test('content admin tabs have explicit keyboard navigation and clearer admin copy', () => {
  const source = read('src/components/dm/ContentAdmin.tsx')

  assert.match(source, /handleTabListKeyDown/)
  assert.match(source, /ArrowRight/)
  assert.match(source, /data-content-admin-tab/)
  assert.match(source, /Import preview/)
  assert.match(source, /Equipment items hold shared names, costs, and weights/)
})

test('stat block clipboard failure uses toast feedback instead of native alert', () => {
  const source = read('src/components/character-sheet/StatBlockView.tsx')

  assert.match(source, /useToast/)
  assert.match(source, /toast\(\{[\s\S]*Clipboard unavailable/)
  assert.doesNotMatch(source, /alert\(/)
})

test('7f player-facing controls and review copy are less noisy', () => {
  const levelUp = read('src/app/characters/[id]/LevelUpWizard.tsx')
  const creation = read('src/app/characters/new/CharacterNewForm.tsx')
  const sourceTag = read('src/components/shared/SourceTag.tsx')
  const sheet = read('src/components/character-sheet/CharacterSheet.tsx')
  const skills = read('src/components/character-sheet/SkillsCard.tsx')
  const frame = read('src/components/wizard/WizardStepFrame.tsx')

  assert.match(levelUp, /aria-pressed=\{hpMode === 'fixed'\}/)
  assert.match(levelUp, /focus-ring rounded-2xl border px-4 py-4 text-left/)
  assert.match(levelUp, /Save level-up/)
  assert.doesNotMatch(levelUp, /Save level-up draft and return to sheet/)
  assert.match(levelUp, /hideWhenPassed/)
  assert.match(levelUp, /focus-ring rounded-xl border px-3 py-3 text-left/)
  assert.match(creation, /lastStepIdRef/)
  assert.match(creation, /scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/)
  assert.match(creation, /focus\(\{ preventScroll: true \}\)/)
  assert.match(creation, /<Select value=\{campaignId \|\| 'none'\}/)
  assert.doesNotMatch(creation, /title="Campaign"[\s\S]*options=\{campaignChoiceOptions\}/)
  assert.match(creation, /formatSkillChoiceLabel/)
  assert.doesNotMatch(creation, /label: skill\.replace\(/)
  assert.match(creation, /summaryTitle="Selected so far"/)
  assert.doesNotMatch(creation, /summaryTitle="Current picks"/)
  assert.match(creation, /hideWhenPassed/)
  assert.match(frame, /data-wizard-step-heading/)
  assert.match(sourceTag, /Adjusted\s*<\/Badge>/)
  assert.doesNotMatch(sourceTag, />amended</)
  assert.match(sheet, /focus-ring block w-full rounded-lg/)
  assert.match(sheet, /focus-ring block text-left/)
  assert.match(skills, /focus-ring flex w-full flex-col/)
})

test('campaign settings offers a bottom return path after long allowlist pages', () => {
  const source = read('src/app/dm/campaigns/[id]/settings/page.tsx')

  assert.match(source, /Back to dashboard/)
  assert.match(source, /CampaignAllowlist/)
})

test('roadmap records the delivered 7f usability pass and next slice', () => {
  const roadmap = read('output/character-creator-roadmap.md')
  const qa = read('output/batch-7-visual-qa.md')
  const review = read('output/batch-7-user-review.md')

  assert.match(roadmap, /Slice `7f` delivered bounded usability repairs/)
  assert.match(roadmap, /Slice 7f — Bounded usability repairs\*\* \(delivered 2026-05-06\)/)
  assert.match(roadmap, /7f\.5: novice player comprehension pass\. \(Done\)/)
  assert.match(roadmap, /7g: behavior-preserving module splitting\. \(Done\)/)
  assert.match(roadmap, /7i: closeout gate\. \(Done\)/)
  assert.match(qa, /7f Completion Note/)
  assert.match(review, /7f Outcome/)
})
