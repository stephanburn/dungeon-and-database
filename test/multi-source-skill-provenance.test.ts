import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { buildSkillDisplaySummaries } from '@/lib/characters/skill-provenance'

test('Slice 7h keeps Path B when existing skill display explains overlap and expertise provenance', () => {
  const summaries = buildSkillDisplaySummaries({
    rows: [
      {
        skill: 'athletics',
        expertise: false,
        source_category: 'class_choice',
        source_entity_id: 'fighter-id',
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
    background: {
      id: 'soldier-id',
      name: 'Soldier',
      source: 'PHB',
      skill_proficiencies: ['Athletics', 'Intimidation'],
      skill_choice_count: 0,
      skill_choice_from: [],
      tool_proficiencies: [],
      languages: [],
      starting_equipment: [],
      feature: '',
      background_feat_id: null,
      amended: false,
      amendment_note: null,
    },
    species: null,
    classes: [{ id: 'fighter-id', name: 'Fighter' }],
    subclasses: [{ id: 'knowledge-id', name: 'Knowledge Domain' }],
  })

  assert.deepEqual(summaries.get('athletics'), {
    expertise: false,
    sources: [
      { label: 'Soldier', category: 'background_auto', expertise: false },
      { label: 'Fighter', category: 'class_choice', expertise: false },
    ],
  })
  assert.deepEqual(summaries.get('history'), {
    expertise: true,
    sources: [
      { label: 'Knowledge Domain', category: 'subclass_choice', expertise: true },
    ],
  })
})

test('Slice 7h records that the audit-table trigger was not met', () => {
  assert.equal(existsSync('output/batch-7-closeout-audit.md'), true)
  const closeout = readFileSync('output/batch-7-closeout-audit.md', 'utf8')
  const roadmap = readFileSync('output/character-creator-roadmap.md', 'utf8')
  const skillSourceMigrations = readdirSync('supabase/migrations')
    .filter((file) => /character_skill_proficiency_sources/i.test(file))

  assert.deepEqual(skillSourceMigrations, [])
  assert.match(closeout, /Slice 7h/i)
  assert.match(closeout, /not triggered/i)
  assert.match(closeout, /Path B/i)
  assert.match(closeout, /no authenticated DM review finding/i)
  assert.match(closeout, /character_skill_proficiency_sources/i)
  assert.match(roadmap, /Slice 7h no-schema decision delivered/)
})
