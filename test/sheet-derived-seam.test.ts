import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  deriveArmorClass,
  deriveAbilityScores,
  deriveCharacterCore,
  deriveSheetPassivePerception,
  deriveSheetSavingThrows,
  deriveSheetSkills,
  deriveUnarmoredArmorClass,
  formatModifier,
} from '../src/lib/characters/derived'

test('derived core exposes every current sheet fallback number', () => {
  const derived = deriveCharacterCore({
    baseStats: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
    speciesAbilityBonuses: { con: 1, wis: 1 },
    abilityContributors: [
      { ability: 'con', bonus: 1, label: 'Warforged ability bonus', sourceType: 'species' },
      { ability: 'wis', bonus: 1, label: 'ASI 1', sourceType: 'asi' },
    ],
    persistedHpMax: 21,
    savingThrowProficiencies: ['str', 'con'],
    skillProficiencies: ['perception', 'athletics'],
    classes: [{
      classId: 'fighter',
      className: 'Fighter',
      level: 3,
      hitDie: 10,
      hpRoll: 6,
      savingThrowProficiencies: ['str', 'con'],
    }],
    species: {
      name: 'Warforged',
      source: 'ERftLW',
      speed: 30,
      size: 'medium',
      languages: ['Common'],
      senses: [],
      damageResistances: ['poison'],
      conditionImmunities: [],
    },
  })

  assert.equal(derived.totalLevel, 3)
  assert.equal(derived.proficiencyBonus, 2)
  assert.equal(derived.initiative, 2)
  assert.equal(derived.passivePerception, 13)
  assert.equal(derived.armorClass.value, 13)
  assert.equal(derived.armorClass.formula, '10 + DEX + 1 (Unarmored, Integrated Protection)')
  assert.equal(derived.savingThrows.find((save) => save.ability === 'str')?.modifier, 4)
  assert.equal(derived.savingThrows.find((save) => save.ability === 'str')?.abilityModifier, 2)
  assert.equal(derived.savingThrows.find((save) => save.ability === 'str')?.proficiencyBonus, 2)
  assert.deepEqual(derived.savingThrows.find((save) => save.ability === 'str')?.proficiencySources, ['Fighter'])
  assert.equal(derived.skills.find((skill) => skill.key === 'athletics')?.modifier, 4)
  assert.equal(derived.abilities.con.bonus, 1)
  assert.deepEqual(derived.abilities.wis.contributors.map((entry) => entry.label), ['ASI 1'])
  assert.equal(derived.speed, 30)
  assert.deepEqual(derived.languages, ['Common'])
  assert.deepEqual(derived.damageResistances, ['poison'])
})

test('sheet helper functions preserve the prior UI math at the derived seam', () => {
  const abilities = deriveAbilityScores(
    { str: 8, dex: 16, con: 14, int: 10, wis: 15, cha: 12 },
    {}
  )
  const skills = deriveSheetSkills({
    abilities,
    proficiencyBonus: 3,
    proficientSkills: ['perception', 'stealth'],
    expertiseSkills: ['stealth'],
  })
  const saves = deriveSheetSavingThrows({
    abilities,
    proficiencyBonus: 3,
    proficientAbilities: ['dex', 'wis'],
    proficiencySources: { dex: ['Rogue'], wis: ['Rogue'] },
  })
  const ac = deriveUnarmoredArmorClass({
    abilities,
    classNames: ['Monk'],
    speciesName: null,
    speciesSource: null,
  })

  assert.equal(formatModifier(-1), '-1')
  assert.equal(formatModifier(3), '+3')
  assert.equal(deriveSheetPassivePerception({ skills, wisdomModifier: abilities.wis.modifier }), 15)
  assert.equal(skills.find((skill) => skill.key === 'stealth')?.modifier, 9)
  assert.equal(saves.find((save) => save.ability === 'dex')?.modifier, 6)
  assert.deepEqual(saves.find((save) => save.ability === 'dex')?.proficiencySources, ['Rogue'])
  assert.equal(ac.value, 15)
  assert.equal(ac.formula, '10 + DEX + WIS (Unarmored Defense)')
})

test('armor class derivation handles equipped armor, shields, fighting style, and conditional mage armor', () => {
  const abilities = deriveAbilityScores(
    { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
    {}
  )

  const armored = deriveArmorClass({
    abilities,
    classNames: ['Fighter'],
    subclassNames: [],
    speciesName: null,
    speciesSource: null,
    selectedFeatureOptions: [{
      option_group_key: 'fighting_style:fighter:2014',
      selected_value: { feature_option_key: 'defense' },
    }],
    equippedItems: [
      { itemId: 'plate', equipped: true },
      { itemId: 'shield', equipped: true },
    ],
    armorCatalog: [{
      itemId: 'plate',
      name: 'Plate',
      armorCategory: 'heavy',
      baseAc: 18,
      dexBonusCap: 0,
    }],
    shieldCatalog: [{
      itemId: 'shield',
      name: 'Shield',
      armorClassBonus: 2,
    }],
  })

  const mageArmor = deriveArmorClass({
    abilities,
    classNames: ['Wizard'],
    subclassNames: ['Draconic Bloodline'],
    speciesName: null,
    speciesSource: null,
    selectedSpellNames: ['Mage Armor'],
    equippedItems: [],
    armorCatalog: [],
    shieldCatalog: [],
  })
  const shieldOnly = deriveArmorClass({
    abilities,
    classNames: ['Fighter'],
    subclassNames: [],
    speciesName: null,
    speciesSource: null,
    equippedItems: [{ itemId: 'shield', equipped: true }],
    armorCatalog: [],
    shieldCatalog: [{
      itemId: 'shield',
      name: 'Shield',
      armorClassBonus: 2,
    }],
  })

  assert.equal(armored.value, 21)
  assert.equal(armored.formula, '18 (Plate) +2 (Shield) +1 (Defense)')
  assert.equal(mageArmor.value, 15)
  assert.equal(mageArmor.formula, '13 +2 DEX')
  assert.equal(shieldOnly.value, 14)
  assert.equal(shieldOnly.formula, '10 +2 DEX +2 (Shield)')
  assert.deepEqual(mageArmor.alternatives, [{
    label: 'Mage Armor',
    value: 15,
    formula: '13 +2 DEX',
  }])
})

test('sheet components consume derived helpers instead of local mechanical math', () => {
  const derived = readFileSync('src/lib/characters/derived.ts', 'utf8')
  const buildContext = readFileSync('src/lib/characters/build-context.ts', 'utf8')
  const statBlock = readFileSync('src/components/character-sheet/StatBlock.tsx', 'utf8')
  const skillsCard = readFileSync('src/components/character-sheet/SkillsCard.tsx', 'utf8')
  const statBlockView = readFileSync('src/components/character-sheet/StatBlockView.tsx', 'utf8')
  const characterSheet = readFileSync('src/components/character-sheet/CharacterSheet.tsx', 'utf8')
  const spellsCard = readFileSync('src/components/character-sheet/SpellsCard.tsx', 'utf8')

  assert.match(derived, /export interface DerivedSpellcastingSummary/)
  assert.match(derived, /export function deriveSpellcastingSummary/)
  assert.doesNotMatch(buildContext, /export interface DerivedSpellcastingSummary/)
  assert.doesNotMatch(buildContext, /const spellcastingSources:/)
  assert.match(spellsCard, /import type \{ DerivedCharacter \} from '@\/lib\/characters\/derived'/)
  assert.doesNotMatch(spellsCard, /import type \{ DerivedCharacter \} from '@\/lib\/characters\/build-context'/)
  assert.match(statBlock, /abilityModifier/)
  assert.match(statBlock, /derivedAbilities/)
  assert.match(statBlock, /contributors/)
  assert.doesNotMatch(statBlock, /Math\.floor\(\(score - 10\) \/ 2\)/)
  assert.match(skillsCard, /deriveSheetSavingThrows/)
  assert.match(skillsCard, /deriveSheetSkills/)
  assert.match(skillsCard, /proficiencySources/)
  assert.doesNotMatch(skillsCard, /abilityModifier\(stats/)
  assert.match(statBlockView, /armorClass\.alternatives/)
  assert.doesNotMatch(statBlockView, /computeUnarmoredAc/)
  assert.doesNotMatch(statBlockView, /abilityModifier/)
  assert.match(characterSheet, /sheetIsDirty \? localDerivedCharacter : serverDerivedCharacter/)
  assert.match(characterSheet, /sheetDerived = derivedCharacter \?\? derivedCore/)
  assert.doesNotMatch(characterSheet, /sheetDerived = serverDerivedCharacter \?\? derivedCore/)
  assert.match(characterSheet, /FeatureList/)
  assert.match(characterSheet, /ClassResourcesPanel/)
  assert.match(characterSheet, /classResources/)
  assert.match(characterSheet, /AsiFeatHistoryPanel/)
  assert.match(characterSheet, /asiFeatHistory/)
  assert.match(characterSheet, /CombatOptionsPanel/)
  assert.match(characterSheet, /combatActions/)
  assert.match(characterSheet, /DmAuditPanel/)
  assert.match(characterSheet, /dmAuditProvenanceGroups/)
  assert.match(characterSheet, /initialSpellSelections/)
  assert.match(characterSheet, /initialTypedFeatChoices/)
  assert.doesNotMatch(characterSheet, /10 \+ derivedCore\.abilities\.wis\.modifier/)
})
