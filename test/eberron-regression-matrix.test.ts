import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CharacterBuildContext, BuildClassSummary } from '@/lib/characters/build-context'
import { ARTIFICER_INFUSION_GROUP_KEY } from '@/lib/characters/infusions'
import { FEATURE_OPTION_VALUE_KEY } from '@/lib/characters/feature-grants'
import { runLegalityChecks, shouldBlockCharacterSubmit } from '@/lib/legality/engine'

const campaignSettings = {
  stat_method: 'standard_array',
  max_level: 20,
  milestone_levelling: false,
} as const

const allSourceRuleSets = {
  ERftLW: '2014',
  PHB: '2014',
  SRD: '2014',
} as const

const standardArray = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 } as const

function progression(level: number, featureNames: string[] = []) {
  return { level, asiAvailable: level % 4 === 0, proficiencyBonus: level >= 5 ? 3 : 2, featureNames }
}

function makeClass(overrides: Partial<BuildClassSummary> & Pick<BuildClassSummary, 'classId' | 'name'>): BuildClassSummary {
  return {
    level: 1,
    hitDie: 8,
    hpRoll: null,
    source: 'SRD',
    spellcastingType: 'none',
    spellcastingProgression: { mode: 'none' },
    subclassChoiceLevel: 3,
    multiclassPrereqs: [],
    skillChoices: { count: 2, from: ['athletics', 'arcana', 'history', 'investigation', 'perception', 'persuasion', 'stealth', 'survival'] },
    savingThrowProficiencies: ['str', 'con'],
    armorProficiencies: [],
    weaponProficiencies: [],
    toolProficiencies: [],
    subclass: null,
    progression: [progression(1)],
    spellSlots: [],
    ...overrides,
  }
}

function baseContext(overrides: Partial<CharacterBuildContext>): CharacterBuildContext {
  return {
    allowedSources: ['SRD', 'PHB', 'ERftLW'],
    campaignSettings,
    campaignRuleSet: '2014',
    allSourceRuleSets,
    statMethod: 'standard_array',
    persistedHpMax: 12,
    baseStats: standardArray,
    statRolls: [],
    skillProficiencies: [],
    skillExpertise: [],
    selectedLanguages: [],
    selectedTools: [],
    selectedAbilityBonuses: {},
    selectedAsiBonuses: {},
    selectedAsiChoices: [],
    selectedFeatureOptions: [],
    featureOptions: [],
    equipmentItems: [],
    armorCatalog: [],
    shieldCatalog: [],
    asiChoiceSlots: [],
    speciesName: 'Human',
    speciesLineage: 'human',
    speciesSource: 'SRD',
    speciesAbilityBonuses: {},
    speciesSpeed: 30,
    speciesSize: 'medium',
    speciesLanguages: ['Common'],
    speciesTraits: [],
    speciesSenses: [],
    speciesDamageResistances: [],
    speciesConditionImmunities: [],
    background: null,
    backgroundFeat: null,
    classes: [makeClass({ classId: 'fighter', name: 'Fighter' })],
    selectedSpells: [],
    selectedFeats: [],
    selectedFeatChoices: [],
    classLevelAnchors: [],
    sourceCollections: {
      classSources: ['SRD'],
      subclassSources: [],
      spellSources: [],
      featSources: [],
    },
    grantedSpellIds: [],
    expandedSpellIds: [],
    freePreparedSpellIds: [],
    multiclassSpellSlotsByCasterLevel: {},
    ...overrides,
  }
}

function assertReadyForDmReview(name: string, context: CharacterBuildContext) {
  const result = runLegalityChecks(context)
  assert.equal(result.passed, true, `${name} should pass all blocking legality checks`)
  assert.equal(shouldBlockCharacterSubmit(result), false, `${name} should be submittable for DM review`)
  assert.deepEqual(result.derived?.blockingIssues, [], `${name} should not surface derived blocking issues`)
  assert.deepEqual(result.derived?.warnings, [], `${name} should not surface derived warnings`)
  assert.equal(result.checks.find((check) => check.key === 'source_allowlist')?.passed, true)
  return result.derived!
}

function infusionChoice(optionKey: string, selectedKey: string, order: number) {
  return {
    id: `choice-${optionKey}`,
    character_id: 'matrix-character',
    character_level_id: 'artificer-2',
    option_group_key: ARTIFICER_INFUSION_GROUP_KEY,
    option_key: optionKey,
    selected_value: { [FEATURE_OPTION_VALUE_KEY]: selectedKey },
    choice_order: order,
    source_category: 'class_feature',
    source_entity_id: 'artificer',
    source_feature_key: 'class_feature:artificer:infuse_item',
    created_at: '',
  }
}

const artificerInfusionOptions = [
  ['enhanced_defense', 'Enhanced Defense'],
  ['enhanced_weapon', 'Enhanced Weapon'],
  ['homunculus_servant', 'Homunculus Servant'],
  ['replicate_magic_item', 'Replicate Magic Item'],
].map(([key, name], index) => ({
  group_key: ARTIFICER_INFUSION_GROUP_KEY,
  key,
  name,
  description: key === 'replicate_magic_item'
    ? 'Choose a supported replicated item descriptively; broad magic-item catalog automation is out of scope for this slice.'
    : `${name} infusion.`,
  prerequisites: { minimum_class_level: 2 },
  effects: {},
  option_order: index + 1,
}))

test('Slice E6: Warforged Artificer with infusions passes legality and separates automation from descriptions', () => {
  const context = baseContext({
    persistedHpMax: 15,
    speciesName: 'Warforged',
    speciesLineage: 'warforged',
    speciesSource: 'ERftLW',
    speciesLanguages: ['Common'],
    speciesTraits: [
      { id: 'constructed-resilience', name: 'Constructed Resilience', description: 'Advantage on saves against poison and resistance to poison damage.', source: 'ERftLW' },
      { id: 'sentrys-rest', name: "Sentry's Rest", description: 'Remain aware while resting.', source: 'ERftLW' },
      { id: 'integrated-protection', name: 'Integrated Protection', description: 'Gain a +1 bonus to Armor Class.', source: 'ERftLW' },
      { id: 'specialized-design', name: 'Specialized Design', description: 'Gain one skill and one tool proficiency of your choice.', source: 'ERftLW' },
    ],
    speciesDamageResistances: ['poison'],
    classes: [makeClass({
      classId: 'artificer',
      name: 'Artificer',
      level: 2,
      hitDie: 8,
      source: 'ERftLW',
      spellcastingType: 'half',
      spellcastingProgression: {
        mode: 'prepared',
        spellcasting_ability: 'int',
        cantrips_known_by_level: [2, 2],
        prepared_formula: 'half_level_down',
        prepared_add_ability_mod: true,
        prepared_min: 1,
      },
      subclassChoiceLevel: 3,
      multiclassPrereqs: [{ ability: 'int', min: 13 }],
      savingThrowProficiencies: ['con', 'int'],
      toolProficiencies: ['thieves tools', 'tinker tools'],
      progression: [progression(1, ['Magical Tinkering', 'Spellcasting']), progression(2, ['Infuse Item'])],
      spellSlots: [2],
    })],
    selectedFeatureOptions: [
      infusionChoice('artificer:infusion_1', 'enhanced_defense', 0),
      infusionChoice('artificer:infusion_2', 'enhanced_weapon', 1),
      infusionChoice('artificer:infusion_3', 'homunculus_servant', 2),
      infusionChoice('artificer:infusion_4', 'replicate_magic_item', 3),
    ],
    featureOptions: artificerInfusionOptions,
    sourceCollections: { classSources: ['ERftLW'], subclassSources: [], spellSources: [], featSources: [] },
  })

  const derived = assertReadyForDmReview('Warforged Artificer', context)

  assert.equal(derived.armorClass.value, 13)
  assert.match(derived.armorClass.formula, /Integrated Protection/)
  assert.ok(derived.damageResistances.includes('poison'))
  assert.equal(derived.combatActions.some((action) => action.name === "Sentry's Rest"), false)
  assert.equal(
    runLegalityChecks(context).checks.find((check) => check.key === 'artificer_infusion_selections')?.message,
    'Artificer infusion selections are valid (4/4).'
  )
  assert.match(artificerInfusionOptions.find((option) => option.key === 'replicate_magic_item')?.description ?? '', /descriptively/i)
})

test('Slice E6: Kalashtar caster surfaces sheet mechanics while keeping Mind Link descriptive', () => {
  const context = baseContext({
    speciesName: 'Kalashtar',
    speciesLineage: 'kalashtar',
    speciesSource: 'ERftLW',
    speciesLanguages: ['Common', 'Quori'],
    speciesTraits: [
      { id: 'dual-mind', name: 'Dual Mind', description: 'Advantage on Wisdom saving throws.', source: 'ERftLW' },
      { id: 'mental-discipline', name: 'Mental Discipline', description: 'You have resistance to psychic damage.', source: 'ERftLW' },
      { id: 'mind-link', name: 'Mind Link', description: 'Telepathically speak to a creature you can see.', source: 'ERftLW' },
    ],
    speciesDamageResistances: ['psychic'],
    classes: [makeClass({
      classId: 'cleric',
      name: 'Cleric',
      level: 1,
      hitDie: 8,
      spellcastingType: 'full',
      spellcastingProgression: {
        mode: 'prepared',
        spellcasting_ability: 'wis',
        cantrips_known_by_level: [3],
        prepared_formula: 'class_level',
        prepared_add_ability_mod: true,
        prepared_min: 1,
      },
      subclassChoiceLevel: 1,
      subclass: { id: 'life-domain', name: 'Life Domain', source: 'SRD', choiceLevel: 1 },
      savingThrowProficiencies: ['wis', 'cha'],
      progression: [progression(1, ['Spellcasting', 'Divine Domain'])],
      spellSlots: [2],
    })],
    sourceCollections: { classSources: ['SRD'], subclassSources: ['SRD'], spellSources: [], featSources: [] },
  })

  const derived = assertReadyForDmReview('Kalashtar caster', context)

  assert.equal(derived.spellcasting.className, 'Cleric')
  assert.ok(derived.languages.includes('Quori'))
  assert.ok(derived.damageResistances.includes('psychic'))
  assert.ok(derived.speciesTraits.some((trait) => trait.name === 'Mind Link'))
  assert.equal(derived.combatActions.some((action) => action.name === 'Mind Link'), false)
})

test('Slice E6: Shifter martial build keeps shifting descriptive and passes the sheet baseline', () => {
  const context = baseContext({
    persistedHpMax: 15,
    speciesName: 'Wildhunt Shifter',
    speciesLineage: 'shifter',
    speciesSource: 'ERftLW',
    speciesLanguages: ['Common'],
    speciesTraits: [
      { id: 'shifting', name: 'Shifting', description: 'Shift as a bonus action for temporary hit points.', source: 'ERftLW' },
      { id: 'wildhunt-shifting-feature', name: 'Wildhunt Shifting Feature', description: 'While shifted, enemies cannot gain advantage against targets other than you.', source: 'ERftLW' },
      { id: 'mark-the-scent', name: 'Mark the Scent', description: 'You are proficient in Survival.', source: 'ERftLW' },
    ],
    classes: [makeClass({
      classId: 'barbarian',
      name: 'Barbarian',
      level: 2,
      hitDie: 12,
      subclassChoiceLevel: 3,
      savingThrowProficiencies: ['str', 'con'],
      progression: [progression(1, ['Rage', 'Unarmored Defense']), progression(2, ['Reckless Attack', 'Danger Sense'])],
    })],
    sourceCollections: { classSources: ['SRD'], subclassSources: [], spellSources: [], featSources: [] },
  })

  const derived = assertReadyForDmReview('Shifter martial', context)

  assert.equal(derived.armorClass.value, 13)
  assert.ok(derived.classResources.some((resource) => resource.label === 'Rage'))
  assert.ok(derived.speciesTraits.some((trait) => trait.name === 'Shifting'))
  assert.equal(derived.combatActions.some((action) => action.name.includes('Shifting')), false)
})

test('Slice E6: Dragonmarked spellcaster receives free trait spells without counting them against picks', () => {
  const context = baseContext({
    speciesName: 'Human (Mark of Making)',
    speciesLineage: 'human',
    speciesSource: 'ERftLW',
    speciesLanguages: ['Common'],
    speciesTraits: [
      { id: 'spellsmith', name: 'Spellsmith', description: 'You know Mending and can cast Magic Weapon through your mark.', source: 'ERftLW' },
      { id: 'spells-of-the-mark', name: 'Spells of the Mark', description: 'Additional spells are added to your spellcasting class list.', source: 'ERftLW' },
    ],
    classes: [makeClass({
      classId: 'wizard',
      name: 'Wizard',
      level: 3,
      hitDie: 6,
      spellcastingType: 'full',
      spellcastingProgression: {
        mode: 'spellbook',
        spellcasting_ability: 'int',
        cantrips_known_by_level: [3, 3, 3],
        spellbook_spells_by_level: [6, 8, 10],
        prepared_formula: 'class_level',
        prepared_add_ability_mod: true,
        prepared_min: 1,
      },
      subclassChoiceLevel: 2,
      subclass: { id: 'evoker', name: 'Evoker', source: 'SRD', choiceLevel: 2 },
      savingThrowProficiencies: ['int', 'wis'],
      progression: [progression(1, ['Spellcasting']), progression(2, ['Arcane Tradition']), progression(3)],
      spellSlots: [4, 2],
    })],
    selectedSpells: [
      { id: 'mending', name: 'Mending', level: 0, classes: [], source: 'ERftLW', grantedBySubclassIds: [], countsAgainstSelectionLimit: false, sourceFeatureKey: 'species_trait:spellsmith:mending' },
      { id: 'magic-weapon', name: 'Magic Weapon', level: 2, classes: [], source: 'ERftLW', grantedBySubclassIds: [], countsAgainstSelectionLimit: false, sourceFeatureKey: 'species_trait:spellsmith:magic_weapon' },
    ],
    grantedSpellIds: ['mending', 'magic-weapon'],
    freePreparedSpellIds: ['mending', 'magic-weapon'],
    sourceCollections: { classSources: ['SRD'], subclassSources: ['SRD'], spellSources: ['ERftLW'], featSources: [] },
  })

  const derived = assertReadyForDmReview('Dragonmarked spellcaster', context)

  assert.deepEqual(
    derived.spellcasting.grantedSpells.map((spell) => spell.name).sort(),
    ['Magic Weapon', 'Mending']
  )
  assert.deepEqual(derived.spellcasting.selectedSpellCountsByLevel, {})
  assert.ok(derived.speciesTraits.some((trait) => trait.name === 'Spells of the Mark'))
})

test('Slice E6: House Agent character passes with granted skills and mixed language/tool choices', () => {
  const context = baseContext({
    speciesName: 'Human',
    speciesLineage: 'human',
    speciesSource: 'SRD',
    speciesLanguages: ['Common'],
    background: {
      id: 'house-agent',
      name: 'House Agent',
      source: 'ERftLW',
      skillProficiencies: ['investigation', 'persuasion'],
      skillChoiceCount: 0,
      skillChoiceFrom: [],
      toolProficiencies: [],
      fixedLanguages: [],
      backgroundFeatId: null,
    },
    selectedLanguages: ['Draconic'],
    selectedTools: ['calligrapher supplies'],
    skillProficiencies: ['investigation', 'persuasion'],
    classes: [makeClass({
      classId: 'rogue',
      name: 'Rogue',
      level: 1,
      hitDie: 8,
      skillChoices: { count: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'investigation', 'perception', 'persuasion', 'sleight of hand', 'stealth'] },
      savingThrowProficiencies: ['dex', 'int'],
      progression: [progression(1, ['Expertise', 'Sneak Attack', "Thieves' Cant"])],
    })],
    sourceCollections: { classSources: ['SRD'], subclassSources: [], spellSources: [], featSources: [] },
  })

  const derived = assertReadyForDmReview('House Agent character', context)

  assert.ok(derived.proficiencies.skills.includes('investigation'))
  assert.ok(derived.proficiencies.skills.includes('persuasion'))
  assert.ok(derived.languages.includes('Draconic'))
  assert.ok(derived.proficiencies.tools.includes('calligrapher supplies'))
})

test('Slice E6: Revenant Blade eligible build satisfies elf-lineage prerequisite and remains descriptive for combat riders', () => {
  const context = baseContext({
    speciesName: 'High Elf',
    speciesLineage: 'elf',
    speciesSource: 'PHB',
    speciesLanguages: ['Common', 'Elvish'],
    classes: [makeClass({
      classId: 'wizard',
      name: 'Wizard',
      level: 4,
      hitDie: 6,
      spellcastingType: 'full',
      spellcastingProgression: {
        mode: 'spellbook',
        spellcasting_ability: 'int',
        cantrips_known_by_level: [3, 3, 3, 4],
        spellbook_spells_by_level: [6, 8, 10, 12],
        prepared_formula: 'class_level',
        prepared_add_ability_mod: true,
        prepared_min: 1,
      },
      subclassChoiceLevel: 2,
      subclass: { id: 'evoker', name: 'Evoker', source: 'SRD', choiceLevel: 2 },
      savingThrowProficiencies: ['int', 'wis'],
      progression: [progression(1, ['Spellcasting']), progression(2, ['Arcane Tradition']), progression(3), progression(4)],
      spellSlots: [4, 3],
    })],
    selectedFeats: [{
      id: 'revenant-blade',
      name: 'Revenant Blade',
      source: 'ERftLW',
      prerequisites: [{ type: 'species', lineage: 'elf' }],
    }],
    selectedFeatChoices: [{
      id: 'feat-revenant-blade',
      featId: 'revenant-blade',
      featName: 'Revenant Blade',
      choiceKind: 'asi_or_feat',
      characterLevelId: null,
      sourceFeatureKey: null,
    }],
    sourceCollections: { classSources: ['SRD'], subclassSources: ['SRD'], spellSources: [], featSources: ['ERftLW'] },
  })

  const derived = assertReadyForDmReview('Revenant Blade eligible build', context)

  assert.equal(runLegalityChecks(context).checks.find((check) => check.key === 'feat_prerequisites')?.passed, true)
  assert.ok(derived.asiFeatHistory.some((entry) => entry.label === 'Revenant Blade'))
  assert.equal(derived.combatActions.some((action) => action.name === 'Revenant Blade'), false)
})

test('Slice E6: ERftLW matrix content is blocked when the campaign allowlist omits Eberron', () => {
  const context = baseContext({
    allowedSources: ['SRD'],
    speciesName: 'Warforged',
    speciesLineage: 'warforged',
    speciesSource: 'ERftLW',
    classes: [makeClass({ classId: 'artificer', name: 'Artificer', source: 'ERftLW' })],
    sourceCollections: { classSources: ['ERftLW'], subclassSources: [], spellSources: [], featSources: [] },
  })
  const result = runLegalityChecks(context)

  assert.equal(result.passed, false)
  assert.equal(result.checks.find((check) => check.key === 'source_allowlist')?.passed, false)
  assert.match(result.checks.find((check) => check.key === 'source_allowlist')?.message ?? '', /species \(ERftLW\).*class \(ERftLW\)/)
})

test('Slice E6: roadmap marks the Eberron regression matrix as complete before E7 closeout', () => {
  const roadmap = readFileSync(join(process.cwd(), 'output', 'character-creator-roadmap.md'), 'utf8')

  assert.match(roadmap, /E6: Eberron regression matrix\. \(complete\)/)
  assert.match(roadmap, /Slice E6 added an automated ERftLW regression matrix/i)
})
