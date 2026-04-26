import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

test('shared polish utilities define surfaces, rows, metadata, and focus treatment', () => {
  const css = read('src/app/globals.css')

  for (const utility of [
    '.surface-primary',
    '.surface-section',
    '.surface-row',
    '.text-metadata',
    '.focus-ring',
  ]) {
    assert.match(css, new RegExp(utility.replace('.', '\\.')))
  }
})

test('base form controls and buttons use the shared focus-ring convention', () => {
  const button = read('src/components/ui/button.tsx')
  const input = read('src/components/ui/input.tsx')
  const textarea = read('src/components/ui/textarea.tsx')
  const checkbox = read('src/components/ui/checkbox.tsx')
  const select = read('src/components/ui/select.tsx')
  const tabs = read('src/components/ui/tabs.tsx')
  const dialog = read('src/components/ui/dialog.tsx')

  assert.match(button, /focus-ring/)
  assert.match(input, /focus-ring/)
  assert.match(textarea, /focus-ring/)
  assert.match(checkbox, /focus-ring/)
  assert.match(select, /focus-ring/)
  assert.match(tabs, /focus-ring/)
  assert.match(dialog, /focus-ring/)
})

test('dense reusable surfaces avoid oversized radius by default', () => {
  const card = read('src/components/ui/card.tsx')
  const alert = read('src/components/ui/alert.tsx')
  const wizardChoiceList = read('src/components/wizard/GuidedChoiceList.tsx')

  assert.doesNotMatch(card, /rounded-2xl/)
  assert.doesNotMatch(alert, /rounded-2xl/)
  assert.doesNotMatch(wizardChoiceList, /rounded-2xl/)
})

test('player-facing copy avoids internal implementation language', () => {
  const files = [
    'src/app/page.tsx',
    'src/app/login/page.tsx',
    'src/app/characters/new/CharacterNewForm.tsx',
    'src/components/character-sheet/CharacterSheetHeader.tsx',
    'src/components/character-sheet/LanguagesToolsCard.tsx',
  ]

  const forbidden = [
    'mechanical core',
    'ruleset validation',
    'owned choices',
    'Background-owned',
    'class-owned',
    'persist with provenance',
    'persisted separately',
    'raw sheet',
    'derived character',
    'shared derived character state',
    'owns it',
  ]

  for (const file of files) {
    const source = read(file)
    for (const phrase of forbidden) {
      assert.doesNotMatch(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${file} contains "${phrase}"`)
    }
  }
})

test('primary action labels stay concise on high-traffic player surfaces', () => {
  const source = [
    read('src/app/page.tsx'),
    read('src/app/login/page.tsx'),
    read('src/app/characters/new/CharacterNewForm.tsx'),
    read('src/components/character-sheet/CharacterSheetHeader.tsx'),
  ].join('\n')

  for (const verboseLabel of [
    'Create your first character',
    'Use password instead',
    'Use magic link instead',
    'Reset or set password',
    'Open full character sheet',
    'Submit for review',
  ]) {
    assert.doesNotMatch(source, new RegExp(verboseLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('wizard summaries use quiet selected-state disclosure instead of nested cards or empty alerts', () => {
  const frame = read('src/components/wizard/WizardStepFrame.tsx')

  assert.doesNotMatch(frame, /@\/components\/ui\/card/)
  assert.doesNotMatch(frame, /@\/components\/ui\/alert/)
  assert.doesNotMatch(frame, /Nothing selected for this step yet/)
  assert.match(frame, /summaryItems\.length > 0/)
  assert.match(frame, /<details/)
  assert.match(frame, /surface-row/)
})

test('guided choices use compact rows for simple options and roomier cards only for rich options', () => {
  const choices = read('src/components/wizard/GuidedChoiceList.tsx')

  assert.match(choices, /hasRichDetail/)
  assert.match(choices, /py-2\.5/)
  assert.match(choices, /py-4/)
  assert.match(choices, /surface-row/)
  assert.doesNotMatch(choices, /ChevronRight/)
})

test('login feedback is reassuring without alert-heavy success states', () => {
  const login = read('src/app/login/page.tsx')

  assert.doesNotMatch(login, /text-\[2rem\]/)
  assert.match(login, /aria-live="polite"/)
  assert.match(login, /role="status"/)
  assert.match(login, /variant="ghost"/)
  assert.match(login, /surface-section/)
})

test('dashboard character selection keeps the whole row as the affordance', () => {
  const dashboard = read('src/app/page.tsx')

  assert.doesNotMatch(dashboard, />Open</)
  assert.match(dashboard, /surface-row/)
  assert.match(dashboard, /aria-label=\{`Open \$\{char\.name\}`\}/)
})

test('creation wizard uses quiet progress states instead of a boxed ten-button grid', () => {
  const wizard = read('src/app/characters/new/CharacterNewForm.tsx')

  assert.doesNotMatch(wizard, /sm:grid-cols-3 lg:grid-cols-10/)
  assert.match(wizard, /aria-label="Creation progress"/)
  assert.match(wizard, /aria-current=\{index === stepIndex \? 'step' : undefined\}/)
  assert.match(wizard, /stepStateLabel/)
  assert.match(wizard, /Locked/)
  assert.match(wizard, /Done/)
})

test('creation wizard keeps navigation and incomplete-step guidance inside the current step frame', () => {
  const wizard = read('src/app/characters/new/CharacterNewForm.tsx')
  const frame = read('src/components/wizard/WizardStepFrame.tsx')

  assert.match(wizard, /CardFooter/)
  assert.match(wizard, /currentStepGuidance/)
  assert.doesNotMatch(wizard, /title: 'Cannot continue'/)
  assert.match(frame, /guidance/)
  assert.match(frame, /Next:/)
  assert.match(frame, /surface-row/)
})

test('character sheet header stays compact and prioritizes title, actions, and inline stats', () => {
  const header = read('src/components/character-sheet/CharacterSheetHeader.tsx')

  assert.doesNotMatch(header, /rounded-3xl/)
  assert.doesNotMatch(header, /grid grid-cols-2 gap-3 sm:grid-cols-4/)
  assert.doesNotMatch(header, /text-3xl/)
  assert.match(header, /surface-primary/)
  assert.match(header, /sheetStatSummary/)
  assert.match(header, /aria-label="Character quick stats"/)
})

test('character sheet section headers use icon affordances instead of hide-show text pills', () => {
  const sheet = read('src/components/character-sheet/CharacterSheet.tsx')

  assert.doesNotMatch(sheet, />Hide</)
  assert.doesNotMatch(sheet, />Show</)
  assert.match(sheet, /ChevronDown/)
  assert.match(sheet, /aria-expanded=\{open\}/)
  assert.match(sheet, /surface-section/)
})

test('legality feedback distinguishes blockers and warnings with icons and repair-oriented labels', () => {
  const badge = read('src/components/character-sheet/LegalityBadge.tsx')
  const sheet = read('src/components/character-sheet/CharacterSheet.tsx')

  assert.match(badge, /AlertTriangle/)
  assert.match(badge, /Info/)
  assert.match(badge, /Fix needed/)
  assert.match(badge, /Review/)
  assert.doesNotMatch(badge, /font-mono/)
  assert.match(sheet, /Repair checklist/)
})

test('dm audit and stale provenance use quiet disclosure instead of heavy always-open panels', () => {
  const sheet = read('src/components/character-sheet/CharacterSheet.tsx')
  const stale = read('src/components/dm/StaleProvenancePanel.tsx')
  const review = read('src/components/dm/DmReviewPanel.tsx')

  assert.doesNotMatch(sheet, /open=\{group\.entries\.length > 0\}/)
  assert.match(sheet, /details className="surface-row/)
  assert.match(sheet, /focus\(\{ preventScroll: true \}\)/)
  assert.match(stale, /<details/)
  assert.match(stale, /surface-section/)
  assert.match(review, /surface-section/)
})

test('batch 5.5 closeout records visual QA, accessibility notes, and the batch 6 handoff', () => {
  const roadmap = read('output/character-creator-roadmap.md')
  const closeout = read('output/batch-5-5-ui-polish-closeout.md')

  assert.match(roadmap, /Batch 5\.5 is now effectively complete/)
  assert.match(roadmap, /Slice `5\.5h` closed the polish pass/)
  assert.match(roadmap, /Batch 5\.5 handoff/)
  assert.match(roadmap, /Batch 6 admin\/content surfaces should be built as restrained work tools/)
  assert.match(roadmap, /UI convention guard/)
  assert.match(roadmap, /authenticated visual QA pass deferred from Slice 5\.5h/)

  for (const phrase of [
    'Login',
    'Dashboard',
    'Guided creation',
    'Character sheet',
    'DM review',
    'Keyboard focus',
    'Batch 6 handoff',
    'Batch 7 polish debt',
  ]) {
    assert.match(closeout, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})
