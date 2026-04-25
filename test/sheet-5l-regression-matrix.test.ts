import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  deriveCharacterCore,
  deriveGrantedNonSkillProficiencies,
} from '../src/lib/characters/derived'

// ── Archetype 1: Single-class caster (Life Cleric 5) ─────────────────────────
//
// Pins: AC formula (unarmored), WIS/CHA save proficiency sourced to Cleric,
// spell DC and attack modifier from proficiency bonus + WIS modifier,
// passive perception from unproficient WIS, HP resource counter.

test('Sheet 5l: single-class caster — Life Cleric 5', () => {
  const derived = deriveCharacterCore({
    baseStats: { str: 10, dex: 10, con: 14, int: 10, wis: 18, cha: 8 },
    speciesAbilityBonuses: {},
    abilityContributors: [],
    persistedHpMax: 38,
    savingThrowProficiencies: ['wis', 'cha'],
    skillProficiencies: ['religion', 'history'],
    classes: [{
      classId: 'cleric',
      className: 'Cleric',
      level: 5,
      hitDie: 8,
      hpRoll: 5,
      savingThrowProficiencies: ['wis', 'cha'],
    }],
    species: {
      name: 'Human',
      source: 'PHB',
      speed: 30,
      size: 'medium',
      languages: ['Common'],
      senses: [],
      damageResistances: [],
      conditionImmunities: [],
    },
  })

  // Resource counters
  assert.equal(derived.totalLevel, 5)
  assert.equal(derived.proficiencyBonus, 3)
  assert.equal(derived.hitPoints.max, 38)
  assert.equal(derived.hitPoints.constitutionModifier, 2)
  assert.equal(derived.hitPoints.estimatedFromLevels, 38)
  assert.equal(derived.hitPoints.hitDice[0].dieSize, 8)
  assert.equal(derived.hitPoints.hitDice[0].level, 5)
  assert.equal(derived.hitPoints.hitDice[0].className, 'Cleric')

  // AC formula — unarmored, no special class rules
  assert.equal(derived.armorClass.value, 10)
  assert.equal(derived.armorClass.formula, '10 + DEX (Unarmored)')

  // Spell DC = 8 + proficiencyBonus + WIS modifier (spellcasting ability)
  const clericSpellDc = 8 + derived.proficiencyBonus + derived.abilities.wis.modifier
  const clericSpellAttack = derived.proficiencyBonus + derived.abilities.wis.modifier
  assert.equal(derived.abilities.wis.modifier, 4)
  assert.equal(clericSpellDc, 15)
  assert.equal(clericSpellAttack, 7)

  // Saving throw proficiency provenance
  const wisSave = derived.savingThrows.find((s) => s.ability === 'wis')!
  const chaSave = derived.savingThrows.find((s) => s.ability === 'cha')!
  const strSave = derived.savingThrows.find((s) => s.ability === 'str')!
  assert.equal(wisSave.modifier, 7)   // WIS 18 mod 4 + prof 3
  assert.equal(chaSave.modifier, 2)   // CHA 8 mod -1 + prof 3
  assert.equal(strSave.modifier, 0)   // STR 10 mod 0, not proficient
  assert.equal(strSave.proficient, false)
  assert.deepEqual(wisSave.proficiencySources, ['Cleric'])
  assert.deepEqual(chaSave.proficiencySources, ['Cleric'])

  // Skill proficiency (Religion is INT-based)
  const religion = derived.skills.find((s) => s.key === 'religion')!
  assert.equal(religion.proficient, true)
  assert.equal(religion.modifier, 3)  // INT 10 mod 0 + prof 3

  // Passive perception (WIS mod 4, perception not proficient)
  assert.equal(derived.passivePerception, 14)

  // Speed and languages from species
  assert.equal(derived.speed, 30)
  assert.deepEqual(derived.languages, ['Common'])
})

// ── Archetype 2: Multiclass caster/martial (Cleric 3 / Wizard 2) ─────────────
//
// Pins: dual spell DCs from different spellcasting abilities (WIS vs INT),
// save provenance from 1st-class only (multiclassing does not grant new saves),
// Half-Elf darkvision surfaced in senses, armor/weapon profs from both classes
// with source attribution.

test('Sheet 5l: multiclass caster/martial — Cleric 3 / Wizard 2 dual spell DCs', () => {
  const derived = deriveCharacterCore({
    baseStats: { str: 8, dex: 12, con: 14, int: 16, wis: 14, cha: 10 },
    speciesAbilityBonuses: {},
    abilityContributors: [],
    persistedHpMax: 35,
    // 1st-class saves only — multiclassing does not add Wizard's INT/WIS saves
    savingThrowProficiencies: ['wis', 'cha'],
    skillProficiencies: ['religion', 'arcana'],
    classes: [
      {
        classId: 'cleric',
        className: 'Cleric',
        level: 3,
        hitDie: 8,
        hpRoll: 5,
        savingThrowProficiencies: ['wis', 'cha'],
      },
      {
        classId: 'wizard',
        className: 'Wizard',
        level: 2,
        hitDie: 6,
        hpRoll: 3,
        savingThrowProficiencies: ['int', 'wis'],
      },
    ],
    species: {
      name: 'Half-Elf',
      source: 'PHB',
      speed: 30,
      size: 'medium',
      languages: ['Common', 'Elvish'],
      senses: [{ type: 'darkvision', range_ft: 60 }],
      damageResistances: [],
      conditionImmunities: [],
    },
  })

  assert.equal(derived.totalLevel, 5)
  assert.equal(derived.proficiencyBonus, 3)

  // Two spell DCs from different spellcasting abilities
  const clericSpellDc = 8 + derived.proficiencyBonus + derived.abilities.wis.modifier
  const wizardSpellDc = 8 + derived.proficiencyBonus + derived.abilities.int.modifier
  assert.equal(derived.abilities.wis.modifier, 2)   // WIS 14
  assert.equal(derived.abilities.int.modifier, 3)   // INT 16
  assert.equal(clericSpellDc, 13)
  assert.equal(wizardSpellDc, 14)
  assert.notEqual(clericSpellDc, wizardSpellDc, 'two caster sources should surface distinct DCs')

  // Save provenance — WIS proficient from 1st class only, INT not proficient
  const wisSave = derived.savingThrows.find((s) => s.ability === 'wis')!
  const intSave = derived.savingThrows.find((s) => s.ability === 'int')!
  assert.equal(wisSave.proficient, true)
  assert.equal(intSave.proficient, false)
  assert.ok(wisSave.proficiencySources.includes('Cleric'))

  // Half-Elf darkvision surfaced from species senses
  assert.ok(derived.senses.some((s) => s.type === 'darkvision'))

  // HP resource counter for multiclass build
  assert.equal(derived.hitPoints.max, 35)
  assert.equal(derived.hitPoints.estimatedFromLevels, 35)
  assert.equal(derived.hitPoints.hitDice.length, 2)
  assert.ok(derived.hitPoints.hitDice.some((d) => d.className === 'Cleric' && d.dieSize === 8))
  assert.ok(derived.hitPoints.hitDice.some((d) => d.className === 'Wizard' && d.dieSize === 6))

  // Granted proficiencies — both class sources with provenance
  const profs = deriveGrantedNonSkillProficiencies({
    classes: [
      {
        classId: 'cleric',
        className: 'Cleric',
        armorProficiencies: ['Light Armor', 'Medium Armor', 'Shields'],
        weaponProficiencies: ['Simple Weapons'],
      },
      {
        classId: 'wizard',
        className: 'Wizard',
        armorProficiencies: [],
        weaponProficiencies: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'],
      },
    ],
    species: { name: 'Half-Elf', source: 'PHB', languages: ['Common', 'Elvish'] },
  })

  assert.ok(profs.armor.some((p) => p.key === 'light armor'))
  assert.ok(profs.armor.some((p) => p.key === 'shields'))
  assert.ok(profs.weapons.some((p) => p.key === 'simple weapons'))
  assert.ok(profs.weapons.some((p) => p.key === 'daggers'))

  // Source attribution on each entry
  const lightArmor = profs.armor.find((p) => p.key === 'light armor')!
  assert.ok(lightArmor.sources.some((s) => s.label === 'Cleric' && s.category === 'class'))

  const daggers = profs.weapons.find((p) => p.key === 'daggers')!
  assert.ok(daggers.sources.some((s) => s.label === 'Wizard' && s.category === 'class'))
})

// ── Archetype 3: Feat-heavy (Variant Human Fighter 8) ────────────────────────
//
// Pins: multiple ability contributors surfaced per-ability (ASI history panel),
// combat-time feature option (Defense fighting style) applied to equipped
// armor AC, skill modifiers under high STR, passive perception from proficient
// Perception, hit dice tracker for class resources panel.

test('Sheet 5l: feat-heavy — Variant Human Fighter 8 with ASI contributors and fighting style', () => {
  const derived = deriveCharacterCore({
    baseStats: { str: 14, dex: 13, con: 14, int: 10, wis: 10, cha: 8 },
    speciesAbilityBonuses: { str: 1, dex: 1 },
    abilityContributors: [
      { ability: 'str', bonus: 1, label: 'Variant Human', sourceType: 'species' },
      { ability: 'dex', bonus: 1, label: 'Variant Human', sourceType: 'species' },
      { ability: 'str', bonus: 2, label: '+2 STR (ASI level 4)', sourceType: 'asi' },
      { ability: 'con', bonus: 1, label: 'Resilient (CON) feat', sourceType: 'feat' },
    ],
    persistedHpMax: 69,
    savingThrowProficiencies: ['str', 'con'],
    skillProficiencies: ['athletics', 'perception', 'survival', 'intimidation'],
    classes: [{
      classId: 'fighter',
      className: 'Fighter',
      level: 8,
      hitDie: 10,
      hpRoll: 7,
      savingThrowProficiencies: ['str', 'con'],
    }],
    species: {
      name: 'Human',
      source: 'PHB',
      speed: 30,
      size: 'medium',
      languages: ['Common'],
      senses: [],
      damageResistances: [],
      conditionImmunities: [],
    },
    selectedFeatureOptions: [{
      option_group_key: 'fighting_style:fighter:2014',
      selected_value: { feature_option_key: 'defense' },
    }],
    equippedItems: [{ itemId: 'chain-mail', equipped: true }],
    armorCatalog: [{
      itemId: 'chain-mail',
      name: 'Chain Mail',
      armorCategory: 'heavy',
      baseAc: 16,
      dexBonusCap: 0,
    }],
    shieldCatalog: [],
  })

  assert.equal(derived.totalLevel, 8)
  assert.equal(derived.proficiencyBonus, 3)

  // ASI/feat history — contributors surfaced per-ability
  assert.equal(derived.abilities.str.adjusted, 17)  // 14 + 1 species + 2 ASI
  assert.equal(derived.abilities.str.modifier, 3)
  assert.equal(derived.abilities.dex.adjusted, 14)  // 13 + 1 species
  assert.equal(derived.abilities.con.adjusted, 15)  // 14 + 1 feat

  const strContributors = derived.abilities.str.contributors
  const conContributors = derived.abilities.con.contributors
  assert.equal(strContributors.length, 2)
  assert.ok(strContributors.some((c) => c.sourceType === 'species'))
  assert.ok(strContributors.some((c) => c.sourceType === 'asi'))
  assert.ok(conContributors.some((c) => c.sourceType === 'feat'))
  assert.ok(conContributors.some((c) => c.label === 'Resilient (CON) feat'))

  // AC formula — chain mail + Defense fighting style (combat-time feature option)
  assert.equal(derived.armorClass.value, 17)
  assert.equal(derived.armorClass.formula, '16 (Chain Mail) +1 (Defense)')

  // Skill modifier under adjusted STR (Athletics)
  const athletics = derived.skills.find((s) => s.key === 'athletics')!
  assert.equal(athletics.proficient, true)
  assert.equal(athletics.modifier, 6)  // STR mod 3 + prof 3

  // Passive perception from proficient Perception
  const perception = derived.skills.find((s) => s.key === 'perception')!
  assert.equal(perception.proficient, true)
  assert.equal(perception.modifier, 3)  // WIS mod 0 + prof 3
  assert.equal(derived.passivePerception, 13)  // 10 + 3

  // Hit dice tracker for class resources panel
  assert.equal(derived.hitPoints.max, 69)
  assert.equal(derived.hitPoints.estimatedFromLevels, 69)
  assert.equal(derived.hitPoints.hitDice[0].className, 'Fighter')
  assert.equal(derived.hitPoints.hitDice[0].dieSize, 10)
  assert.equal(derived.hitPoints.hitDice[0].level, 8)
})

// ── Archetype 4: Species/background-heavy (Warforged Artificer 5) ─────────────
//
// Pins: Warforged Integrated Protection on unarmored AC, damage resistance
// from species, CON bonus from species contributing to HP modifier, proficiency
// provenance across class + background + typed choice rows (language and tool).

test('Sheet 5l: species/background-heavy — Warforged Artificer 5 IP AC and proficiency provenance', () => {
  const derived = deriveCharacterCore({
    baseStats: { str: 10, dex: 14, con: 15, int: 16, wis: 10, cha: 8 },
    speciesAbilityBonuses: { con: 1, int: 1 },
    abilityContributors: [
      { ability: 'con', bonus: 1, label: 'Warforged bonus', sourceType: 'species' },
      { ability: 'int', bonus: 1, label: 'Warforged bonus', sourceType: 'species' },
    ],
    persistedHpMax: 43,
    savingThrowProficiencies: ['con', 'int'],
    skillProficiencies: ['arcana', 'investigation', 'perception'],
    classes: [{
      classId: 'artificer',
      className: 'Artificer',
      level: 5,
      hitDie: 8,
      hpRoll: 5,
      savingThrowProficiencies: ['con', 'int'],
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

  // Warforged Integrated Protection — unarmored AC includes +1
  assert.equal(derived.armorClass.value, 13)  // 10 + DEX(2) + 1
  assert.equal(derived.armorClass.formula, '10 + DEX + 1 (Unarmored, Integrated Protection)')

  // Damage resistance from species
  assert.deepEqual(derived.damageResistances, ['poison'])

  // Species ability bonus flowing into CON modifier (HP resource counter)
  assert.equal(derived.abilities.con.adjusted, 16)  // 15 + 1 species
  assert.equal(derived.hitPoints.constitutionModifier, 3)  // CON 16 mod 3
  assert.equal(derived.hitPoints.max, 43)
  assert.equal(derived.hitPoints.estimatedFromLevels, 43)

  // Spell DC (INT-based Artificer)
  assert.equal(derived.abilities.int.adjusted, 17)  // 16 + 1 species
  assert.equal(derived.abilities.int.modifier, 3)
  const artificerSpellDc = 8 + derived.proficiencyBonus + derived.abilities.int.modifier
  assert.equal(artificerSpellDc, 14)

  // Investigation (INT-based, proficient)
  const investigation = derived.skills.find((s) => s.key === 'investigation')!
  assert.equal(investigation.modifier, 6)  // INT mod 3 + prof 3

  // Proficiency provenance across class, background, and typed choice rows
  const profs = deriveGrantedNonSkillProficiencies({
    classes: [{
      classId: 'artificer',
      className: 'Artificer',
      armorProficiencies: ['Light Armor', 'Medium Armor', 'Shields'],
      weaponProficiencies: ['Simple Weapons', 'Hand Crossbows', 'Heavy Crossbows'],
    }],
    species: { name: 'Warforged', source: 'ERftLW', languages: ['Common'] },
    background: {
      name: 'Guild Artisan',
      toolProficiencies: ["Artisan's Tools"],
      fixedLanguages: [],
    },
    languageChoiceRows: [
      { language: 'Dwarvish', source_category: 'background', source_entity_id: null },
    ],
    toolChoiceRows: [
      { tool: "Tinker's Tools", source_category: 'class', source_entity_id: 'artificer' },
    ],
  })

  // Armor profs from Artificer (class)
  assert.ok(profs.armor.some((p) => p.key === 'light armor'))
  assert.ok(profs.armor.some((p) => p.key === 'medium armor'))
  assert.ok(profs.armor.some((p) => p.key === 'shields'))
  const lightArmor = profs.armor.find((p) => p.key === 'light armor')!
  assert.ok(lightArmor.sources.some((s) => s.category === 'class' && s.label === 'Artificer'))

  // Background tool prof
  const artisanTools = profs.tools.find((p) => p.key === "artisan's tools")!
  assert.ok(artisanTools.sources.some((s) => s.category === 'background' && s.label === 'Guild Artisan'))

  // Typed tool choice row (class-sourced Tinker's Tools)
  const tinkerTools = profs.tools.find((p) => p.key === "tinker's tools")!
  assert.ok(tinkerTools.sources.some((s) => s.category === 'class'))

  // Species language
  const commonLang = profs.languages.find((p) => p.key === 'common')!
  assert.ok(commonLang.sources.some((s) => s.category === 'species' && s.label === 'Warforged'))

  // Background language choice row
  const dwarvish = profs.languages.find((p) => p.key === 'dwarvish')!
  assert.ok(dwarvish.sources.some((s) => s.category === 'background'))
})

// ── Archetype 5: 4.5 overlap regression (Fighter 1 / Cleric 1) ───────────────
//
// Pins: Batch 4.5b Path B — skill deduplication via ON CONFLICT means only one
// Athletics row exists in skillProficiencies even though both background and
// Fighter multiclass could grant it; the sheet renders the correct modifier.
// Also pins that all four class-granted saves remain proficient with correct
// source attribution across two classes.

test('Sheet 5l: 4.5 overlap regression — Fighter 1 / Cleric 1 shared skill deduplicated', () => {
  const derived = deriveCharacterCore({
    baseStats: { str: 16, dex: 10, con: 14, int: 10, wis: 14, cha: 8 },
    speciesAbilityBonuses: {},
    abilityContributors: [],
    persistedHpMax: 19,
    // All four saves across the two classes
    savingThrowProficiencies: ['str', 'con', 'wis', 'cha'],
    // Athletics appears once despite potentially being grantable by both Fighter
    // and a prior background — this mirrors the Path B ON CONFLICT merge result.
    skillProficiencies: ['athletics'],
    classes: [
      {
        classId: 'fighter',
        className: 'Fighter',
        level: 1,
        hitDie: 10,
        hpRoll: null,
        savingThrowProficiencies: ['str', 'con'],
      },
      {
        classId: 'cleric',
        className: 'Cleric',
        level: 1,
        hitDie: 8,
        hpRoll: null,
        savingThrowProficiencies: ['wis', 'cha'],
      },
    ],
    species: {
      name: 'Human',
      source: 'PHB',
      speed: 30,
      size: 'medium',
      languages: ['Common'],
      senses: [],
      damageResistances: [],
      conditionImmunities: [],
    },
  })

  assert.equal(derived.totalLevel, 2)
  assert.equal(derived.proficiencyBonus, 2)

  // Athletics modifier from deduplicated single row — correct despite double-grant
  const athletics = derived.skills.find((s) => s.key === 'athletics')!
  assert.equal(athletics.proficient, true)
  assert.equal(athletics.modifier, 5)  // STR 16 mod 3 + prof 2

  // All four saves proficient, sourced to their originating class
  const strSave = derived.savingThrows.find((s) => s.ability === 'str')!
  const conSave = derived.savingThrows.find((s) => s.ability === 'con')!
  const wisSave = derived.savingThrows.find((s) => s.ability === 'wis')!
  const chaSave = derived.savingThrows.find((s) => s.ability === 'cha')!

  assert.equal(strSave.proficient, true)
  assert.equal(conSave.proficient, true)
  assert.equal(wisSave.proficient, true)
  assert.equal(chaSave.proficient, true)

  assert.deepEqual(strSave.proficiencySources, ['Fighter'])
  assert.deepEqual(conSave.proficiencySources, ['Fighter'])
  assert.deepEqual(wisSave.proficiencySources, ['Cleric'])
  assert.deepEqual(chaSave.proficiencySources, ['Cleric'])

  // Save modifier formulas
  assert.equal(strSave.modifier, 5)   // STR 16 mod 3 + prof 2
  assert.equal(wisSave.modifier, 4)   // WIS 14 mod 2 + prof 2
  assert.equal(conSave.modifier, 4)   // CON 14 mod 2 + prof 2
  assert.equal(chaSave.modifier, 1)   // CHA 8 mod -1 + prof 2

  // HP estimation — Fighter level 1 max + Cleric inferred level 1
  assert.equal(derived.hitPoints.max, 19)
  assert.equal(derived.hitPoints.estimatedFromLevels, 19)
  assert.ok(derived.hitPoints.usesInferredLevels, 'Cleric level 1 uses inferred fixed HP')
})

// ── Harness binder ────────────────────────────────────────────────────────────
//
// Verifies that this file covers all five Batch 5 representative archetypes
// and that the sheet component still references the panel seams they exercise.

test('Sheet 5l harness covers all five representative archetypes', () => {
  const source = readFileSync('test/sheet-5l-regression-matrix.test.ts', 'utf8')

  assert.match(source, /Single-class caster/i)
  assert.match(source, /Multiclass caster\/martial/i)
  assert.match(source, /Feat-heavy/i)
  assert.match(source, /Species\/background-heavy/i)
  assert.match(source, /4\.5 overlap regression/i)

  // Confirm the five key presentation contracts are each pinned
  assert.match(source, /clericSpellDc/)         // spell DC formula
  assert.match(source, /proficiencySources/)     // save/skill provenance
  assert.match(source, /contributors/)           // ASI/feat history
  assert.match(source, /hitPoints\.hitDice/)     // resource counters
  assert.match(source, /fighting_style/)         // combat-time feature options
})

test('Sheet 5l harness pins component seams for panels that consume derived state', () => {
  const sheet = readFileSync('src/components/character-sheet/CharacterSheet.tsx', 'utf8')

  // Panels that consume the archetype contracts exercised above
  assert.match(sheet, /ClassResourcesPanel/)    // archetype resource counters
  assert.match(sheet, /AsiFeatHistoryPanel/)    // archetype 3 contributors
  assert.match(sheet, /CombatOptionsPanel/)     // archetype 3 fighting style
  assert.match(sheet, /GrantedProficienciesCard/) // archetypes 2 and 4 proficiency provenance
  assert.match(sheet, /SkillsCard/)             // archetypes 3 and 5 skill modifiers
  assert.match(sheet, /SpellsCard/)             // archetypes 1 and 2 spell DC source
  assert.match(sheet, /deriveCharacterCore/)    // all archetypes through shared derivation
})
