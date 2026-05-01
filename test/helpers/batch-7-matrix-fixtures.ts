import type {
  BuildClassSummary,
  CharacterBuildContext,
} from '@/lib/characters/build-context'
import {
  BATTLE_MASTER_MANEUVER_GROUP_KEY,
  FEATURE_OPTION_VALUE_KEY,
} from '@/lib/characters/feature-grants'
import {
  resolveStartingEquipment,
  type ResolvedStartingEquipment,
  type StartingEquipmentSelections,
} from '@/lib/characters/starting-equipment'
import type { StartingEquipmentPackageEntry, WeaponCatalogEntry } from '@/lib/content/equipment-content'
import type { EquipmentItem, UserRole } from '@/lib/types/database'
import { createRouteTestContext, type RouteTestCharacter } from './route-test-context'

export type Batch7MatrixKey =
  | 'single-class-wizard'
  | 'pact-and-non-pact-caster'
  | 'martial-asi-feat-feature-option'
  | 'dragonmarked-lineage'
  | 'language-tool-heavy'
  | 'starting-equipment-package'
  | 'review-state'

export type Batch7MatrixEntry = {
  key: Batch7MatrixKey
  label: string
  characterId: string
  context: CharacterBuildContext
  persistence?: Batch7PersistenceFixture
  startingEquipment?: ResolvedStartingEquipment
}

export type Batch7ReviewStateTrace = {
  statuses: string[]
  notes: Array<string | null>
  snapshotEvents: string[]
}

type Batch7PersistenceFixture = {
  languageCatalog?: Array<{ key: string; name: string }>
  toolCatalog?: Array<{ key: string; name: string }>
  languageChoices?: Array<Record<string, unknown>>
  toolChoices?: Array<Record<string, unknown>>
  skillProficiencies?: Array<Record<string, unknown>>
  abilityBonusChoices?: Array<Record<string, unknown>>
  asiChoices?: Array<Record<string, unknown>>
  featureOptionChoices?: Array<Record<string, unknown>>
  equipmentItems?: Array<Record<string, unknown>>
  spellSelections?: Array<Record<string, unknown>>
  spellRows?: Array<Record<string, unknown>>
  featChoices?: Array<Record<string, unknown>>
}

type QueryResponse = { data: unknown; error: { message: string } | null }

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

const standardArray = { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 } as const

function proficiencyBonusForLevel(level: number) {
  if (level >= 17) return 6
  if (level >= 13) return 5
  if (level >= 9) return 4
  if (level >= 5) return 3
  return 2
}

function progression(level: number, featureNames: string[] = []) {
  return {
    level,
    asiAvailable: level % 4 === 0,
    proficiencyBonus: proficiencyBonusForLevel(level),
    featureNames,
  }
}

function progressionRows(level: number, featuresByLevel: Record<number, string[]> = {}) {
  return Array.from({ length: level }, (_, index) => {
    const currentLevel = index + 1
    return progression(currentLevel, featuresByLevel[currentLevel] ?? [])
  })
}

function makeClass(
  overrides: Partial<BuildClassSummary> & Pick<BuildClassSummary, 'classId' | 'name'>
): BuildClassSummary {
  return {
    level: 1,
    hitDie: 8,
    hpRoll: null,
    source: 'PHB',
    spellcastingType: 'none',
    spellcastingProgression: { mode: 'none' },
    subclassChoiceLevel: 3,
    multiclassPrereqs: [],
    skillChoices: {
      count: 2,
      from: ['arcana', 'athletics', 'history', 'insight', 'investigation', 'perception', 'persuasion', 'stealth', 'survival'],
    },
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

function spell(
  id: string,
  name: string,
  level: number,
  classes: string[],
  source = 'PHB',
  overrides: Partial<CharacterBuildContext['selectedSpells'][number]> = {}
): CharacterBuildContext['selectedSpells'][number] {
  return {
    id,
    name,
    level,
    classes,
    source,
    grantedBySubclassIds: [],
    countsAgainstSelectionLimit: true,
    sourceFeatureKey: null,
    ...overrides,
  }
}

function featureChoice(
  groupKey: string,
  optionKey: string,
  selectedKey: string,
  order: number,
  sourceFeatureKey = groupKey
): CharacterBuildContext['selectedFeatureOptions'][number] {
  return {
    id: `choice-${groupKey}-${optionKey}`,
    character_id: 'batch-7-character',
    character_level_id: null,
    option_group_key: groupKey,
    option_key: optionKey,
    selected_value: { [FEATURE_OPTION_VALUE_KEY]: selectedKey },
    choice_order: order,
    source_category: 'class_feature',
    source_entity_id: null,
    source_feature_key: sourceFeatureKey,
    created_at: '',
  }
}

function baseContext(overrides: Partial<CharacterBuildContext> = {}): CharacterBuildContext {
  return {
    allowedSources: ['PHB', 'ERftLW', 'SRD'],
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
    speciesSource: 'PHB',
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
      classSources: ['PHB'],
      subclassSources: [],
      spellSources: [],
      featSources: [],
    },
    grantedSpellIds: [],
    expandedSpellIds: [],
    freePreparedSpellIds: [],
    multiclassSpellSlotsByCasterLevel: {
      1: [2],
      2: [3],
      3: [4, 2],
      4: [4, 3],
      5: [4, 3, 2],
      6: [4, 3, 3],
      7: [4, 3, 3, 1],
      8: [4, 3, 3, 2],
    },
    ...overrides,
  }
}

function singleClassWizard(): Batch7MatrixEntry {
  const context = baseContext({
    persistedHpMax: 32,
    speciesAbilityBonuses: { int: 1 },
    selectedAsiBonuses: { int: 2 },
    asiChoiceSlots: [{ slotIndex: 0, bonuses: { int: 2 } }],
    selectedAsiChoices: [{
      id: 'wizard-asi-int-1',
      slotIndex: 0,
      ability: 'int',
      bonus: 2,
      characterLevelId: 'wizard-level-4',
      sourceFeatureKey: 'asi:wizard:4',
    }],
    skillProficiencies: ['arcana', 'history'],
    classes: [makeClass({
      classId: 'wizard',
      name: 'Wizard',
      level: 5,
      hitDie: 6,
      hpRoll: 4,
      spellcastingType: 'full',
      spellcastingProgression: {
        mode: 'spellbook',
        spellcasting_ability: 'int',
        cantrips_known_by_level: [3, 3, 3, 4, 4],
        spellbook_spells_by_level: [6, 8, 10, 12, 14],
        prepared_formula: 'class_level',
        prepared_add_ability_mod: true,
        prepared_min: 1,
      },
      subclassChoiceLevel: 2,
      multiclassPrereqs: [{ ability: 'int', min: 13 }],
      skillChoices: { count: 2, from: ['arcana', 'history', 'insight', 'investigation'] },
      savingThrowProficiencies: ['int', 'wis'],
      weaponProficiencies: ['dagger'],
      subclass: { id: 'evoker', name: 'Evoker', source: 'PHB', choiceLevel: 2 },
      progression: progressionRows(5, {
        1: ['Spellcasting', 'Arcane Recovery'],
        2: ['Arcane Tradition'],
      }),
      spellSlots: [4, 3, 2],
    })],
    selectedSpells: [
      spell('fire-bolt', 'Fire Bolt', 0, ['wizard']),
      spell('mage-hand', 'Mage Hand', 0, ['wizard']),
      spell('magic-missile', 'Magic Missile', 1, ['wizard']),
      spell('shield', 'Shield', 1, ['wizard']),
      spell('misty-step', 'Misty Step', 2, ['wizard']),
      spell('fireball', 'Fireball', 3, ['wizard']),
    ],
    classLevelAnchors: [{
      id: 'wizard-level-4',
      classId: 'wizard',
      className: 'Wizard',
      levelNumber: 4,
      takenAt: '2026-05-01T09:00:00.000Z',
    }],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: ['PHB'],
      spellSources: ['PHB'],
      featSources: [],
    },
  })

  return {
    key: 'single-class-wizard',
    label: 'Single-class wizard with spellbook, prepared spells, and subclass timing',
    characterId: 'batch-7-wizard',
    context,
  }
}

function pactAndNonPactCaster(): Batch7MatrixEntry {
  const context = baseContext({
    persistedHpMax: 39,
    baseStats: { str: 8, dex: 13, con: 14, int: 10, wis: 12, cha: 15 },
    speciesAbilityBonuses: { cha: 1 },
    skillProficiencies: ['persuasion', 'arcana'],
    classes: [
      makeClass({
        classId: 'bard',
        name: 'Bard',
        level: 3,
        hitDie: 8,
        hpRoll: 5,
        spellcastingType: 'full',
        spellcastingProgression: {
          mode: 'known',
          spellcasting_ability: 'cha',
          cantrips_known_by_level: [2, 2, 2],
          spells_known_by_level: [4, 5, 6],
        },
        subclassChoiceLevel: 3,
        subclass: { id: 'college-of-lore', name: 'College of Lore', source: 'PHB', choiceLevel: 3 },
        savingThrowProficiencies: ['dex', 'cha'],
        skillChoices: { count: 3, from: ['arcana', 'history', 'insight', 'perception', 'persuasion', 'stealth'] },
        progression: progressionRows(3, {
          1: ['Spellcasting', 'Bardic Inspiration'],
          2: ['Jack of All Trades', 'Song of Rest'],
          3: ['Bard College'],
        }),
        spellSlots: [4, 2],
      }),
      makeClass({
        classId: 'warlock',
        name: 'Warlock',
        level: 3,
        hitDie: 8,
        hpRoll: 5,
        spellcastingType: 'pact',
        spellcastingProgression: {
          mode: 'known',
          spellcasting_ability: 'cha',
          cantrips_known_by_level: [2, 2, 2],
          spells_known_by_level: [2, 3, 4],
        },
        subclassChoiceLevel: 1,
        multiclassPrereqs: [{ ability: 'cha', min: 13 }],
        subclass: { id: 'fiend-patron', name: 'The Fiend', source: 'PHB', choiceLevel: 1 },
        savingThrowProficiencies: ['wis', 'cha'],
        skillChoices: { count: 2, from: ['arcana', 'deception', 'history', 'intimidation', 'investigation'] },
        progression: progressionRows(3, {
          1: ['Otherworldly Patron', 'Pact Magic'],
          2: ['Eldritch Invocations'],
          3: ['Pact Boon'],
        }),
        spellSlots: [0, 2],
      }),
    ],
    selectedSpells: [
      spell('vicious-mockery', 'Vicious Mockery', 0, ['bard']),
      spell('dissonant-whispers', 'Dissonant Whispers', 1, ['bard']),
      spell('healing-word', 'Healing Word', 1, ['bard']),
      spell('eldritch-blast', 'Eldritch Blast', 0, ['warlock']),
      spell('hex', 'Hex', 1, ['warlock']),
      spell('misty-step-warlock', 'Misty Step', 2, ['warlock']),
    ],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: ['PHB'],
      spellSources: ['PHB'],
      featSources: [],
    },
  })

  return {
    key: 'pact-and-non-pact-caster',
    label: 'Multiclass pact/non-pact caster with separate slot tracks',
    characterId: 'batch-7-pact-caster',
    context,
  }
}

function martialAsiFeatFeatureOption(): Batch7MatrixEntry {
  const maneuvers = ['precision_attack', 'riposte', 'parry', 'trip_attack', 'menacing_attack']
  const selectedFeatureOptions = [
    featureChoice('fighting_style:fighter:2014', 'fighter:fighting_style', 'defense', 0, 'class_feature:fighter:fighting_style'),
    ...maneuvers.map((maneuver, index) =>
      featureChoice(BATTLE_MASTER_MANEUVER_GROUP_KEY, `maneuver_${index + 1}`, maneuver, index + 1, 'subclass_feature:battle_master:maneuvers')
    ),
  ]
  const featureOptions = [
    { group_key: 'fighting_style:fighter:2014', key: 'defense', name: 'Defense', description: '+1 AC while wearing armor.', prerequisites: {}, effects: {} },
    ...maneuvers.map((maneuver) => ({
      group_key: BATTLE_MASTER_MANEUVER_GROUP_KEY,
      key: maneuver,
      name: maneuver.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '),
      description: `${maneuver.replace(/_/g, ' ')} maneuver.`,
      prerequisites: {},
      effects: {},
    })),
  ]
  const context = baseContext({
    persistedHpMax: 68,
    baseStats: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
    speciesName: 'Variant Human',
    speciesAbilityBonuses: {},
    selectedAbilityBonuses: { str: 1, dex: 1 },
    selectedAsiBonuses: { str: 2 },
    asiChoiceSlots: [{ slotIndex: 1, bonuses: { str: 2 } }],
    selectedAsiChoices: [{
      id: 'fighter-asi-str',
      slotIndex: 1,
      ability: 'str',
      bonus: 2,
      characterLevelId: 'fighter-level-8',
      sourceFeatureKey: 'asi:fighter:8',
    }],
    selectedFeats: [{ id: 'alert', name: 'Alert', source: 'PHB', prerequisites: [] }],
    selectedFeatChoices: [{
      id: 'fighter-alert',
      featId: 'alert',
      featName: 'Alert',
      choiceKind: 'asi_or_feat',
      characterLevelId: 'fighter-level-4',
      sourceFeatureKey: null,
    }],
    skillProficiencies: ['athletics', 'perception'],
    classes: [makeClass({
      classId: 'fighter',
      name: 'Fighter',
      level: 8,
      hitDie: 10,
      hpRoll: 7,
      subclassChoiceLevel: 3,
      subclass: { id: 'battle-master', name: 'Battle Master', source: 'PHB', choiceLevel: 3 },
      savingThrowProficiencies: ['str', 'con'],
      armorProficiencies: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'],
      weaponProficiencies: ['Simple Weapons', 'Martial Weapons'],
      skillChoices: { count: 2, from: ['acrobatics', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'] },
      progression: progressionRows(8, {
        1: ['Fighting Style', 'Second Wind'],
        2: ['Action Surge'],
        3: ['Martial Archetype', 'Combat Superiority'],
      }),
    })],
    selectedFeatureOptions,
    featureOptions,
    equipmentItems: [{ itemId: 'chain-mail', equipped: true }],
    armorCatalog: [{ itemId: 'chain-mail', name: 'Chain Mail', armorCategory: 'heavy', baseAc: 16, dexBonusCap: 0 }],
    classLevelAnchors: [
      { id: 'fighter-level-4', classId: 'fighter', className: 'Fighter', levelNumber: 4, takenAt: '2026-05-01T09:00:00.000Z' },
      { id: 'fighter-level-8', classId: 'fighter', className: 'Fighter', levelNumber: 8, takenAt: '2026-05-01T10:00:00.000Z' },
    ],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: ['PHB'],
      spellSources: [],
      featSources: ['PHB'],
    },
  })

  return {
    key: 'martial-asi-feat-feature-option',
    label: 'Martial build with ASI allocation, feat choice, and feature options',
    characterId: 'batch-7-martial',
    context,
    persistence: {
      asiChoices: context.selectedAsiChoices.map((choice) => ({
        character_id: 'batch-7-martial',
        ability: choice.ability,
        bonus: choice.bonus,
        slot_index: choice.slotIndex,
        character_level_id: choice.characterLevelId,
        source_feature_key: choice.sourceFeatureKey,
        created_at: '',
      })),
      featureOptionChoices: context.selectedFeatureOptions,
      featChoices: [{
        character_id: 'batch-7-martial',
        feat_id: 'alert',
        choice_kind: 'asi_or_feat',
        character_level_id: 'fighter-level-4',
        source_feature_key: null,
        created_at: '',
      }],
    },
  }
}

function dragonmarkedLineage(): Batch7MatrixEntry {
  const context = baseContext({
    persistedHpMax: 20,
    speciesName: 'Human (Mark of Making)',
    speciesLineage: 'human',
    speciesSource: 'ERftLW',
    speciesAbilityBonuses: { int: 1 },
    selectedAbilityBonuses: { int: 1 },
    speciesTraits: [
      { id: 'spellsmith', name: 'Spellsmith', description: 'You know Mending and can cast Magic Weapon through your mark.', source: 'ERftLW' },
      { id: 'spells-of-the-mark', name: 'Spells of the Mark', description: 'Additional spells are added to your spellcasting class list.', source: 'ERftLW' },
    ],
    classes: [makeClass({
      classId: 'wizard',
      name: 'Wizard',
      level: 3,
      hitDie: 6,
      hpRoll: 4,
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
      subclass: { id: 'evoker', name: 'Evoker', source: 'PHB', choiceLevel: 2 },
      savingThrowProficiencies: ['int', 'wis'],
      progression: progressionRows(3, {
        1: ['Spellcasting'],
        2: ['Arcane Tradition'],
      }),
      spellSlots: [4, 2],
    })],
    selectedSpells: [
      spell('mending', 'Mending', 0, [], 'ERftLW', {
        countsAgainstSelectionLimit: false,
        sourceFeatureKey: 'species_trait:spellsmith:mending',
      }),
      spell('magic-weapon', 'Magic Weapon', 2, [], 'ERftLW', {
        countsAgainstSelectionLimit: false,
        sourceFeatureKey: 'species_trait:spellsmith:magic_weapon',
      }),
    ],
    grantedSpellIds: ['mending', 'magic-weapon'],
    freePreparedSpellIds: ['mending', 'magic-weapon'],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: ['PHB'],
      spellSources: ['ERftLW'],
      featSources: [],
    },
  })

  return {
    key: 'dragonmarked-lineage',
    label: 'Eberron dragonmarked lineage with feature-granted spells',
    characterId: 'batch-7-dragonmarked',
    context,
  }
}

function languageToolHeavy(): Batch7MatrixEntry {
  const context = baseContext({
    persistedHpMax: 10,
    baseStats: { str: 8, dex: 15, con: 13, int: 14, wis: 12, cha: 10 },
    selectedLanguages: ['Draconic', 'Gnomish'],
    selectedTools: ["Smith's tools", "Thieves' tools"],
    skillProficiencies: ['investigation', 'persuasion'],
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
    classes: [makeClass({
      classId: 'rogue',
      name: 'Rogue',
      level: 1,
      hitDie: 8,
      hpRoll: null,
      savingThrowProficiencies: ['dex', 'int'],
      weaponProficiencies: ['Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
      toolProficiencies: ["Thieves' tools"],
      skillChoices: { count: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'investigation', 'perception', 'persuasion', 'sleight of hand', 'stealth'] },
      progression: progressionRows(1, { 1: ['Expertise', 'Sneak Attack', "Thieves' Cant"] }),
    })],
    sourceCollections: {
      classSources: ['PHB'],
      subclassSources: [],
      spellSources: [],
      featSources: [],
    },
  })

  return {
    key: 'language-tool-heavy',
    label: 'Language/tool-heavy build with catalog labels and provenance rows',
    characterId: 'batch-7-language-tools',
    context,
    persistence: {
      languageCatalog: [
        { key: 'draconic', name: 'Draconic' },
        { key: 'gnomish', name: 'Gnomish' },
      ],
      toolCatalog: [
        { key: 'smiths-tools', name: "Smith's tools" },
        { key: 'thieves-tools', name: "Thieves' tools" },
      ],
      languageChoices: [
        {
          character_id: 'batch-7-language-tools',
          language: 'Old Draconic label',
          language_key: 'draconic',
          character_level_id: null,
          source_category: 'background',
          source_entity_id: 'house-agent',
          source_feature_key: null,
          created_at: '',
        },
        {
          character_id: 'batch-7-language-tools',
          language: 'Old Gnomish label',
          language_key: 'gnomish',
          character_level_id: null,
          source_category: 'class',
          source_entity_id: 'rogue',
          source_feature_key: null,
          created_at: '',
        },
      ],
      toolChoices: [
        {
          character_id: 'batch-7-language-tools',
          tool: 'Old Smith label',
          tool_key: 'smiths-tools',
          character_level_id: null,
          source_category: 'background',
          source_entity_id: 'house-agent',
          source_feature_key: null,
          created_at: '',
        },
        {
          character_id: 'batch-7-language-tools',
          tool: 'Old Thieves label',
          tool_key: 'thieves-tools',
          character_level_id: null,
          source_category: 'class',
          source_entity_id: 'rogue',
          source_feature_key: null,
          created_at: '',
        },
      ],
      skillProficiencies: context.skillProficiencies.map((skill) => ({
        character_id: 'batch-7-language-tools',
        skill,
        source_category: skill === 'investigation' ? 'background' : 'class',
        source_entity_id: skill === 'investigation' ? 'house-agent' : 'rogue',
        source_feature_key: null,
        expertise: false,
        created_at: '',
      })),
    },
  }
}

const equipmentItems: EquipmentItem[] = [
  {
    id: 'chain-mail-id',
    key: 'chain_mail',
    name: 'Chain Mail',
    item_category: 'armor',
    cost_quantity: 75,
    cost_unit: 'gp',
    weight_lb: 55,
    source: 'PHB',
    amended: false,
    amendment_note: null,
  },
  {
    id: 'shield-id',
    key: 'shield',
    name: 'Shield',
    item_category: 'shield',
    cost_quantity: 10,
    cost_unit: 'gp',
    weight_lb: 6,
    source: 'PHB',
    amended: false,
    amendment_note: null,
  },
  {
    id: 'longsword-id',
    key: 'longsword',
    name: 'Longsword',
    item_category: 'weapon',
    cost_quantity: 15,
    cost_unit: 'gp',
    weight_lb: 3,
    source: 'PHB',
    amended: false,
    amendment_note: null,
  },
  {
    id: 'explorers-pack-id',
    key: 'explorers_pack',
    name: 'Explorer\'s Pack',
    item_category: 'gear',
    cost_quantity: 10,
    cost_unit: 'gp',
    weight_lb: 59,
    source: 'PHB',
    amended: false,
    amendment_note: null,
  },
]

const weapons: WeaponCatalogEntry[] = [{
  item_id: 'longsword-id',
  weapon_category: 'martial',
  weapon_kind: 'melee',
  damage_dice: '1d8',
  damage_type: 'slashing',
  properties: ['versatile'],
  normal_range: null,
  long_range: null,
  versatile_damage: '1d10',
  key: 'longsword',
  name: 'Longsword',
  item_category: 'weapon',
  cost_quantity: 15,
  cost_unit: 'gp',
  weight_lb: 3,
  source: 'PHB',
  amended: false,
  amendment_note: null,
}]

function startingEquipmentPackage(): Batch7MatrixEntry {
  const packages: StartingEquipmentPackageEntry[] = [{
    id: 'fighter-package-id',
    key: 'class:cleric:phb',
    name: 'Cleric Starting Equipment',
    description: 'PHB cleric package',
    source: 'PHB',
    amended: false,
    amendment_note: null,
    items: [
      {
        id: 'armor-chain-mail',
        package_id: 'fighter-package-id',
        item_id: 'chain-mail-id',
        quantity: 1,
        item_order: 10,
        choice_group: 'armor',
        notes: null,
        item_key: 'chain_mail',
        item_name: 'Chain Mail',
        item_category: 'armor',
      },
      {
        id: 'primary-weapon-set',
        package_id: 'fighter-package-id',
        item_id: 'martial_weapon_and_shield_set-id',
        quantity: 1,
        item_order: 20,
        choice_group: 'weapon',
        notes: null,
        item_key: 'martial_weapon_and_shield_set',
        item_name: 'Martial Weapon and Shield',
        item_category: 'gear',
      },
      {
        id: 'pack-explorer',
        package_id: 'fighter-package-id',
        item_id: 'explorers-pack-id',
        quantity: 1,
        item_order: 30,
        choice_group: 'pack',
        notes: null,
        item_key: 'explorers_pack',
        item_name: 'Explorer\'s Pack',
        item_category: 'gear',
      },
    ],
  }]
  const selections: StartingEquipmentSelections = {
    'fighter-package-id': {
      selectedPackageItemIdsByGroup: {
        armor: 'armor-chain-mail',
        weapon: 'primary-weapon-set',
        pack: 'pack-explorer',
      },
      helperSelectionsByPackageItemId: {
        'primary-weapon-set': ['longsword-id'],
      },
    },
  }
  const startingEquipment = resolveStartingEquipment(packages, selections, equipmentItems, weapons)
  const context = baseContext({
    persistedHpMax: 14,
    baseStats: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
    skillProficiencies: ['medicine', 'religion'],
    classes: [makeClass({
      classId: 'cleric',
      name: 'Cleric',
      level: 1,
      hitDie: 8,
      hpRoll: null,
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
      subclass: { id: 'life-domain', name: 'Life Domain', source: 'PHB', choiceLevel: 1 },
      savingThrowProficiencies: ['wis', 'cha'],
      armorProficiencies: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'],
      weaponProficiencies: ['Simple Weapons'],
      skillChoices: { count: 2, from: ['history', 'insight', 'medicine', 'persuasion', 'religion'] },
      progression: progressionRows(1, { 1: ['Spellcasting', 'Divine Domain'] }),
      spellSlots: [2],
    })],
    equipmentItems: startingEquipment.items.map((item) => ({
      itemId: item.item_id,
      equipped: item.equipped ?? false,
    })),
    armorCatalog: [{ itemId: 'chain-mail-id', name: 'Chain Mail', armorCategory: 'heavy', baseAc: 16, dexBonusCap: 0 }],
    shieldCatalog: [{ itemId: 'shield-id', name: 'Shield', armorClassBonus: 2 }],
  })

  return {
    key: 'starting-equipment-package',
    label: 'Starting-equipment package with resolved concrete rows',
    characterId: 'batch-7-starting-equipment',
    context,
    startingEquipment,
    persistence: {
      equipmentItems: startingEquipment.items.map((item) => ({
        character_id: 'batch-7-starting-equipment',
        item_id: item.item_id,
        quantity: item.quantity,
        equipped: item.equipped ?? false,
        source_category: item.source_category,
        source_entity_id: item.source_entity_id,
        created_at: '',
      })),
    },
  }
}

function reviewState(): Batch7MatrixEntry {
  return {
    key: 'review-state',
    label: 'Review-state build that crosses draft, submitted, changes requested, and approved surfaces',
    characterId: 'batch-7-review-state',
    context: baseContext({
      persistedHpMax: 8,
      classes: [makeClass({
        classId: 'cleric',
        name: 'Cleric',
        level: 1,
        hitDie: 8,
        hpRoll: null,
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
        subclass: { id: 'life-domain', name: 'Life Domain', source: 'PHB', choiceLevel: 1 },
        savingThrowProficiencies: ['wis', 'cha'],
        progression: progressionRows(1, { 1: ['Spellcasting', 'Divine Domain'] }),
        spellSlots: [2],
      })],
      sourceCollections: {
        classSources: ['PHB'],
        subclassSources: ['PHB'],
        spellSources: [],
        featSources: [],
      },
    }),
  }
}

export function buildBatch7RegressionMatrix(): Batch7MatrixEntry[] {
  return [
    singleClassWizard(),
    pactAndNonPactCaster(),
    martialAsiFeatFeatureOption(),
    dragonmarkedLineage(),
    languageToolHeavy(),
    startingEquipmentPackage(),
    reviewState(),
  ]
}

function characterRow(entry: Batch7MatrixEntry) {
  return {
    id: entry.characterId,
    user_id: 'player-7c',
    campaign_id: 'campaign-7c',
    name: entry.label,
    species_id: null,
    background_id: null,
    alignment: null,
    experience_points: 0,
    status: 'draft',
    stat_method: entry.context.statMethod,
    base_str: entry.context.baseStats.str,
    base_dex: entry.context.baseStats.dex,
    base_con: entry.context.baseStats.con,
    base_int: entry.context.baseStats.int,
    base_wis: entry.context.baseStats.wis,
    base_cha: entry.context.baseStats.cha,
    hp_max: entry.context.persistedHpMax,
    character_type: 'pc',
    dm_notes: null,
    created_at: '',
    updated_at: '',
  }
}

function classLevelRows(entry: Batch7MatrixEntry) {
  return entry.context.classes.flatMap((cls) =>
    Array.from({ length: cls.level }, (_, index) => {
      const level = index + 1
      return {
        id: `${entry.characterId}-${cls.classId}-${level}`,
        character_id: entry.characterId,
        class_id: cls.classId,
        level_number: level,
        subclass_id: cls.subclass && level >= cls.subclass.choiceLevel ? cls.subclass.id : null,
        hp_roll: level === 1 ? null : cls.hpRoll,
        taken_at: `2026-05-01T0${Math.min(level, 9)}:00:00.000Z`,
      }
    })
  )
}

function createSupabaseMock(responses: Record<string, QueryResponse>) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq(_column: string, value: string) {
              const key = `${table}:eq:${value}`
              const response = responses[key] ?? { data: [], error: null }
              return Object.assign({}, response, {
                single: async () => response,
                maybeSingle: async () => response,
              })
            },
            in(_column: string, _values: string[]) {
              const key = `${table}:in`
              return Promise.resolve(responses[key] ?? { data: [], error: null })
            },
          }
        },
      }
    },
  } as never
}

export function createBatch7LoadStateSupabaseMock(entry: Batch7MatrixEntry) {
  const persistence = entry.persistence ?? {}
  return createSupabaseMock({
    [`characters:eq:${entry.characterId}`]: { data: characterRow(entry), error: null },
    [`character_class_levels:eq:${entry.characterId}`]: { data: classLevelRows(entry), error: null },
    [`character_skill_proficiencies:eq:${entry.characterId}`]: { data: persistence.skillProficiencies ?? [], error: null },
    [`character_ability_bonus_choices:eq:${entry.characterId}`]: { data: persistence.abilityBonusChoices ?? [], error: null },
    [`character_asi_choices:eq:${entry.characterId}`]: { data: persistence.asiChoices ?? [], error: null },
    [`character_language_choices:eq:${entry.characterId}`]: { data: persistence.languageChoices ?? [], error: null },
    [`character_tool_choices:eq:${entry.characterId}`]: { data: persistence.toolChoices ?? [], error: null },
    [`character_feature_option_choices:eq:${entry.characterId}`]: { data: persistence.featureOptionChoices ?? [], error: null },
    [`character_equipment_items:eq:${entry.characterId}`]: { data: persistence.equipmentItems ?? [], error: null },
    [`character_spell_selections:eq:${entry.characterId}`]: { data: persistence.spellSelections ?? [], error: null },
    [`character_feat_choices:eq:${entry.characterId}`]: { data: persistence.featChoices ?? [], error: null },
    [`character_stat_rolls:eq:${entry.characterId}`]: { data: [], error: null },
    'languages:in': { data: persistence.languageCatalog ?? [], error: null },
    'tools:in': { data: persistence.toolCatalog ?? [], error: null },
    'spells:in': { data: persistence.spellRows ?? [], error: null },
  })
}

function routeCharacter(body: unknown): RouteTestCharacter {
  return body as RouteTestCharacter
}

function routeCharacterEnvelope(body: unknown): { character: RouteTestCharacter } {
  return body as { character: RouteTestCharacter }
}

export async function runBatch7ReviewStateScenario(): Promise<Batch7ReviewStateTrace> {
  const ctx = createRouteTestContext()
  const player = ctx.addUser({ id: 'player-7c', role: 'player' as UserRole })
  const dm = ctx.addUser({ id: 'dm-7c', role: 'dm' as UserRole })
  ctx.addCampaign({ id: 'campaign-7c', dmId: dm.id, allowlist: ['PHB'] })
  ctx.addCampaignMember('campaign-7c', player.id)

  const created = await ctx.createCharacter({
    profile: player,
    body: {
      campaign_id: 'campaign-7c',
      name: 'Review Guard',
      stat_method: 'standard_array',
    },
  })
  if (created.status !== 201 || !('id' in created.body)) {
    throw new Error('Failed to create review-state character')
  }

  const statuses: string[] = [created.body.status]
  const notes: Array<string | null> = [created.body.dm_notes]
  ctx.setLegality(created.body.id, {
    blocksSubmit: false,
    result: { passed: true, checks: [] },
  })

  await ctx.saveCharacter({
    profile: player,
    characterId: created.body.id,
    body: {
      expected_updated_at: created.body.updated_at,
      levels: [{ class_id: 'cleric', level: 1, subclass_id: 'life-domain', hp_roll: null }],
    },
  })
  const savedDraft = ctx.reloadCharacter(created.body.id).character
  statuses.push(savedDraft.status)
  notes.push(savedDraft.dm_notes)

  const submitted = await ctx.submitCharacter({ profile: player, characterId: created.body.id })
  const submittedBody = routeCharacterEnvelope(submitted.body)
  if (submitted.status !== 200 || !submittedBody.character) {
    throw new Error('Failed to submit review-state character')
  }
  statuses.push(submittedBody.character.status)
  notes.push(submittedBody.character.dm_notes)

  const changes = await ctx.requestChanges({
    profile: dm,
    characterId: created.body.id,
    notes: 'Tighten prepared spell notes.',
  })
  const changesBody = routeCharacter(changes.body)
  if (changes.status !== 200 || !changesBody.status) {
    throw new Error('Failed to request review-state changes')
  }
  statuses.push(changesBody.status)
  notes.push(changesBody.dm_notes)

  await ctx.saveCharacter({
    profile: player,
    characterId: created.body.id,
    body: {
      expected_updated_at: changesBody.updated_at,
      name: 'Review Guard Revised',
      levels: [{ class_id: 'cleric', level: 1, subclass_id: 'life-domain', hp_roll: null }],
    },
  })
  const revised = ctx.reloadCharacter(created.body.id).character
  statuses.push(revised.status)
  notes.push(revised.dm_notes)

  const resubmitted = await ctx.submitCharacter({ profile: player, characterId: created.body.id })
  const resubmittedBody = routeCharacterEnvelope(resubmitted.body)
  if (resubmitted.status !== 200 || !resubmittedBody.character) {
    throw new Error('Failed to resubmit review-state character')
  }
  statuses.push(resubmittedBody.character.status)
  notes.push(resubmittedBody.character.dm_notes)

  const approved = await ctx.approveCharacter({ profile: dm, characterId: created.body.id })
  const approvedBody = routeCharacter(approved.body)
  if (approved.status !== 200 || !approvedBody.status) {
    throw new Error('Failed to approve review-state character')
  }
  statuses.push(approvedBody.status)
  notes.push(approvedBody.dm_notes)

  const snapshotEvents = ctx
    .reloadCharacter(created.body.id)
    .snapshots
    .map((row) => (row.snapshot as { event?: string }).event ?? 'unknown')

  return { statuses, notes, snapshotEvents }
}
