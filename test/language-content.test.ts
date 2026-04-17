import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLanguageKeyByNameMap, normalizeLanguageName } from '@/lib/content/language-content'
import { STANDARD_LANGUAGE_OPTIONS } from '@/lib/characters/language-tool-provenance'

test('normalizeLanguageName matches display labels case-insensitively', () => {
  assert.equal(normalizeLanguageName('  Deep   Speech '), 'deep speech')
  assert.equal(normalizeLanguageName('COMMON'), 'common')
})

test('buildLanguageKeyByNameMap covers the seeded standard language names', () => {
  const keyByName = buildLanguageKeyByNameMap([
    { key: 'common', name: 'Common' },
    { key: 'dwarvish', name: 'Dwarvish' },
    { key: 'elvish', name: 'Elvish' },
    { key: 'giant', name: 'Giant' },
    { key: 'gnomish', name: 'Gnomish' },
    { key: 'goblin', name: 'Goblin' },
    { key: 'halfling', name: 'Halfling' },
    { key: 'orc', name: 'Orc' },
    { key: 'abyssal', name: 'Abyssal' },
    { key: 'celestial', name: 'Celestial' },
    { key: 'draconic', name: 'Draconic' },
    { key: 'deep_speech', name: 'Deep Speech' },
    { key: 'infernal', name: 'Infernal' },
    { key: 'primordial', name: 'Primordial' },
    { key: 'sylvan', name: 'Sylvan' },
    { key: 'undercommon', name: 'Undercommon' },
  ])

  for (const language of STANDARD_LANGUAGE_OPTIONS) {
    assert.ok(keyByName.get(normalizeLanguageName(language)), `missing catalog key for ${language}`)
  }
})
