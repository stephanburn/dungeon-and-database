import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildSkillDisplaySummaries } from '@/lib/characters/skill-provenance'

test('skill display summaries show overlap as one skill row with multiple sources', () => {
  const displays = buildSkillDisplaySummaries({
    rows: [{
      skill: 'athletics',
      expertise: false,
      source_category: 'class_choice',
      source_entity_id: 'fighter-id',
      source_feature_key: null,
    }],
    background: {
      id: 'soldier-id',
      name: 'Soldier',
      source: 'PHB',
      skill_proficiencies: ['Athletics', 'Intimidation'],
      skill_choice_count: 0,
      skill_choice_from: [],
      tool_proficiencies: [],
      languages: [],
      equipment: [],
      feature: '',
      traits: [],
      background_feat_id: null,
      amended: false,
      amendment_note: null,
      rule_set: '2014',
    },
    species: null,
    classes: [{ id: 'fighter-id', name: 'Fighter' }],
  })

  assert.deepEqual(displays.get('athletics'), {
    expertise: false,
    sources: [
      { label: 'Soldier', category: 'background_auto', expertise: false },
      { label: 'Fighter', category: 'class_choice', expertise: false },
    ],
  })
})

test('skill display summaries surface expertise-granting subclass sources', () => {
  const displays = buildSkillDisplaySummaries({
    rows: [
      {
        skill: 'history',
        expertise: false,
        source_category: 'class_choice',
        source_entity_id: 'rogue-id',
        source_feature_key: null,
      },
      {
        skill: 'history',
        expertise: true,
        source_category: 'subclass_choice',
        source_entity_id: 'knowledge-id',
        source_feature_key: 'subclass_feature:knowledge_domain:blessings_of_knowledge',
      },
    ],
    background: null,
    species: null,
    classes: [{ id: 'rogue-id', name: 'Rogue' }],
    subclasses: [{ id: 'knowledge-id', name: 'Knowledge Domain' }],
  })

  assert.equal(displays.get('history')?.expertise, true)
  assert.deepEqual(displays.get('history')?.sources, [
    { label: 'Rogue', category: 'class_choice', expertise: false },
    { label: 'Knowledge Domain', category: 'subclass_choice', expertise: true },
  ])
})

test('skills card rendering contract includes provenance chips and expertise formula text', () => {
  const skillsCard = readFileSync('src/components/character-sheet/SkillsCard.tsx', 'utf8')

  assert.match(skillsCard, /buildSkillDisplaySummaries/)
  assert.match(skillsCard, /Expertise/)
  assert.match(skillsCard, /source\.label/)
  assert.match(skillsCard, /expertise \? ' expertise' : ' prof'/)
})
