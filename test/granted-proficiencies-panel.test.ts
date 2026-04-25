import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveGrantedNonSkillProficiencies } from '@/lib/characters/derived'

test('granted non-skill proficiencies preserve multiclass and typed-source provenance', () => {
  const proficiencies = deriveGrantedNonSkillProficiencies({
    classes: [
      {
        classId: 'fighter-id',
        className: 'Fighter',
        armorProficiencies: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'],
        weaponProficiencies: ['Simple Weapons', 'Martial Weapons'],
      },
      {
        classId: 'wizard-id',
        className: 'Wizard',
        armorProficiencies: [],
        weaponProficiencies: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'],
      },
    ],
    background: {
      name: 'Criminal',
      toolProficiencies: ["Thieves' Tools"],
      fixedLanguages: [],
    },
    species: {
      name: 'Variant Human',
      source: 'PHB',
      languages: ['Common'],
    },
    subclasses: [{
      id: 'knowledge-id',
      name: 'Knowledge Domain',
      source: 'PHB',
    }],
    languageChoiceRows: [
      {
        language: 'Elvish',
        source_category: 'species_choice',
        source_entity_id: 'species-id',
      },
      {
        language: 'Draconic',
        source_category: 'subclass_choice',
        source_entity_id: 'knowledge-id',
      },
    ],
  })

  assert.deepEqual(proficiencies.armor.map((entry) => entry.label), [
    'Heavy Armor',
    'Light Armor',
    'Medium Armor',
    'Shields',
  ])
  assert.deepEqual(proficiencies.weapons.map((entry) => entry.label), [
    'Daggers',
    'Darts',
    'Light Crossbows',
    'Martial Weapons',
    'Quarterstaffs',
    'Simple Weapons',
    'Slings',
  ])
  assert.deepEqual(proficiencies.armor.find((entry) => entry.label === 'Heavy Armor')?.sources, [
    { label: 'Fighter', category: 'class' },
  ])
  assert.deepEqual(proficiencies.weapons.find((entry) => entry.label === 'Martial Weapons')?.sources, [
    { label: 'Fighter', category: 'class' },
  ])
  assert.deepEqual(proficiencies.weapons.find((entry) => entry.label === 'Daggers')?.sources, [
    { label: 'Wizard', category: 'class' },
  ])
  assert.deepEqual(proficiencies.tools.find((entry) => entry.label === "Thieves' Tools")?.sources, [
    { label: 'Criminal', category: 'background' },
  ])
  assert.deepEqual(proficiencies.languages.find((entry) => entry.label === 'Common')?.sources, [
    { label: 'Variant Human', category: 'species' },
  ])
  assert.deepEqual(proficiencies.languages.find((entry) => entry.label === 'Elvish')?.sources, [
    { label: 'Variant Human', category: 'species' },
  ])
  assert.deepEqual(proficiencies.languages.find((entry) => entry.label === 'Draconic')?.sources, [
    { label: 'Knowledge Domain', category: 'subclass' },
  ])
})

test('feat-based static proficiency grants are surfaced in the derived panel helper', () => {
  const proficiencies = deriveGrantedNonSkillProficiencies({
    feats: [{
      id: 'feat-heavily-armored',
      name: 'Heavily Armored',
      source: 'PHB',
      benefits: {},
    }],
  })

  assert.deepEqual(proficiencies.armor, [{
    key: 'heavy armor',
    label: 'Heavy Armor',
    sources: [{ label: 'Heavily Armored', category: 'feat' }],
  }])
})

test('granted proficiencies card stays wired to the shared derivation seam', () => {
  const card = readFileSync('src/components/character-sheet/GrantedProficienciesCard.tsx', 'utf8')
  const sheet = readFileSync('src/components/character-sheet/CharacterSheet.tsx', 'utf8')

  assert.match(card, /Granted Proficiencies/)
  assert.match(card, /source\.label/)
  assert.match(sheet, /GrantedProficienciesCard/)
  assert.match(sheet, /deriveGrantedNonSkillProficiencies/)
  assert.match(sheet, /initialTypedLanguageChoices/)
  assert.match(sheet, /initialTypedToolChoices/)
})
