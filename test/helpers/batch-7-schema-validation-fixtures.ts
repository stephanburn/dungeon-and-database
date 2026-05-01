import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ContentImportSnapshot } from '../../scripts/content-import/import-workflow'
import type { ContentImportBundle } from '../../scripts/content-import/validator'

type RequiredContentImportBundle = ContentImportBundle & {
  sources: NonNullable<ContentImportBundle['sources']>
  classes: NonNullable<ContentImportBundle['classes']>
  subclasses: NonNullable<ContentImportBundle['subclasses']>
  spells: NonNullable<ContentImportBundle['spells']>
  languages: NonNullable<ContentImportBundle['languages']>
  tools: NonNullable<ContentImportBundle['tools']>
  equipmentItems: NonNullable<ContentImportBundle['equipmentItems']>
  featureOptionGroups: NonNullable<ContentImportBundle['featureOptionGroups']>
  featureOptions: NonNullable<ContentImportBundle['featureOptions']>
  featureSpellGrants: NonNullable<ContentImportBundle['featureSpellGrants']>
  startingEquipmentPackages: NonNullable<ContentImportBundle['startingEquipmentPackages']>
}

export type Batch7SchemaContractGroup = {
  key: string
  migrations: string[]
  requiredPatterns: Array<{
    migration: string
    pattern: RegExp
    label: string
  }>
}

const migrationDir = join(process.cwd(), 'supabase', 'migrations')

export function readMigration(name: string) {
  return readFileSync(join(migrationDir, name), 'utf8')
}

export function listMigrationFiles() {
  return readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
}

export function buildBatch7ContentBundle(): RequiredContentImportBundle {
  return {
    sources: [{ key: 'PHB', name: 'Player Handbook' }],
    classes: [
      {
        key: 'fighter',
        name: 'Fighter',
        source: 'PHB',
        language_keys: ['common'],
        tool_keys: ['smiths_tools'],
        progression: [
          { level: 1, proficiency_bonus: 2 },
          { level: 2, proficiency_bonus: 2 },
          { level: 3, proficiency_bonus: 2 },
          { level: 4, proficiency_bonus: 2, asi_available: true },
        ],
      },
      {
        key: 'wizard',
        name: 'Wizard',
        source: 'PHB',
        progression: [{ level: 1, proficiency_bonus: 2 }],
      },
    ],
    subclasses: [
      { key: 'battle_master', name: 'Battle Master', class_key: 'fighter', source: 'PHB', choice_level: 3 },
    ],
    spells: [
      { key: 'fire_bolt', name: 'Fire Bolt', level: 0, source: 'PHB', class_keys: ['wizard'] },
      { key: 'shield', name: 'Shield', level: 1, source: 'PHB', class_keys: ['wizard'] },
    ],
    languages: [
      { key: 'common', name: 'Common', source: 'PHB' },
      { key: 'draconic', name: 'Draconic', source: 'PHB' },
    ],
    tools: [
      { key: 'smiths_tools', name: "Smith's Tools", source: 'PHB' },
    ],
    equipmentItems: [
      { key: 'longsword', name: 'Longsword', source: 'PHB', item_category: 'weapon' },
      { key: 'chain_mail', name: 'Chain Mail', source: 'PHB', item_category: 'armor' },
    ],
    featureOptionGroups: [
      {
        key: 'fighter:fighting_style:2014',
        label: 'Fighting Style',
        source: 'PHB',
        owner_table: 'classes',
        owner_key: 'fighter',
      },
    ],
    featureOptions: [
      {
        key: 'defense',
        group_key: 'fighter:fighting_style:2014',
        label: 'Defense',
        source: 'PHB',
      },
    ],
    featureSpellGrants: [
      { feature_key: 'wizard:spellcasting:fire_bolt', spell_key: 'fire_bolt', source: 'PHB' },
    ],
    startingEquipmentPackages: [
      {
        key: 'class:fighter:phb',
        name: 'Fighter Starting Equipment',
        source: 'PHB',
        items: [
          { item_key: 'longsword', quantity: 1 },
          { item_key: 'chain_mail', quantity: 1 },
        ],
      },
    ],
  }
}

export function buildBatch7ExistingSnapshot(): ContentImportSnapshot {
  return {
    sources: [{ key: 'PHB', name: 'Player Handbook' }],
    languages: [
      { key: 'common', name: 'Common', source: 'PHB' },
      { key: 'draconic', name: 'Old Draconic', source: 'PHB', amended: false, amendment_note: null },
      { key: 'giant', name: 'Giant', source: 'PHB', amended: false, amendment_note: null },
    ],
    tools: [
      { key: 'smiths_tools', name: "Smith's Tools", source: 'PHB' },
    ],
    equipment_items: [
      { key: 'longsword', name: 'Longsword', source: 'PHB', item_category: 'weapon' },
      { key: 'chain_mail', name: 'Old Chain Mail', source: 'PHB', item_category: 'armor' },
      { key: 'rope_hempen', name: 'Hempen Rope', source: 'PHB', item_category: 'gear' },
    ],
    feature_option_groups: [
      { key: 'fighter:fighting_style:2014', name: 'Fighting Style', label: 'Fighting Style', source: 'PHB', owner_table: 'classes', owner_key: 'fighter' },
    ],
    feature_options: [
      { key: 'defense', name: 'Defense', label: 'Defense', source: 'PHB', group_key: 'fighter:fighting_style:2014' },
      { key: 'dueling', name: 'Dueling', label: 'Dueling', source: 'PHB', group_key: 'fighter:fighting_style:2014' },
    ],
    starting_equipment_packages: [
      { key: 'class:fighter:phb', name: 'Old Fighter Starting Equipment', source: 'PHB', items: [{ item_key: 'longsword', quantity: 1 }] },
    ],
  }
}

export function buildBatch7InvalidContentBundle(): RequiredContentImportBundle {
  const bundle = buildBatch7ContentBundle()
  return {
    ...bundle,
    sources: [
      ...bundle.sources,
      { key: 'PHB', name: 'Duplicate Player Handbook' },
    ],
    languages: [
      ...bundle.languages,
      { ...bundle.languages[0], name: 'Duplicate Common' },
    ],
    featureOptionGroups: [{
      ...bundle.featureOptionGroups[0],
      owner_table: 'subclasses',
      owner_key: 'missing_subclass',
    }],
    featureOptions: [{
      ...bundle.featureOptions[0],
      group_key: 'missing:group',
    }],
    startingEquipmentPackages: [{
      ...bundle.startingEquipmentPackages[0],
      items: [{ item_key: 'missing_item', quantity: 1 }],
    }],
  }
}

export function buildBatch7SchemaValidationFixtures() {
  const contractGroups: Batch7SchemaContractGroup[] = [
    {
      key: 'normalized-character-persistence',
      migrations: [
        '025_character_choice_normalization_phase1.sql',
        '026_skill_proficiency_provenance.sql',
        '029_species_ability_bonus_choice_persistence.sql',
        '037_character_asi_choices.sql',
        '063_character_class_levels_cutover.sql',
      ],
      requiredPatterns: [
        {
          migration: '025_character_choice_normalization_phase1.sql',
          label: 'spell selections keep class/subclass ownership unique',
          pattern: /UNIQUE \(character_id, spell_id, owning_class_id, granting_subclass_id, acquisition_mode\)/,
        },
        {
          migration: '026_skill_proficiency_provenance.sql',
          label: 'skill provenance columns are present',
          pattern: /ADD COLUMN IF NOT EXISTS source_feature_key text NULL/,
        },
        {
          migration: '029_species_ability_bonus_choice_persistence.sql',
          label: 'ability bonus choices are source-scoped',
          pattern: /UNIQUE \(character_id, ability, source_category, source_entity_id, source_feature_key\)/,
        },
        {
          migration: '037_character_asi_choices.sql',
          label: 'ASI rows are unique per slot and ability',
          pattern: /UNIQUE \(character_id, slot_index, ability\)/,
        },
        {
          migration: '063_character_class_levels_cutover.sql',
          label: 'class level history is unique per class level number',
          pattern: /UNIQUE \(character_id, class_id, level_number\)/,
        },
      ],
    },
    {
      key: 'language-tool-key-cutover',
      migrations: [
        '028_language_and_tool_choice_persistence.sql',
        '043_language_content_catalog.sql',
        '044_tool_content_catalog.sql',
        '076_language_tool_key_cutover.sql',
      ],
      requiredPatterns: [
        {
          migration: '076_language_tool_key_cutover.sql',
          label: 'language keys are authoritative primary keys',
          pattern: /ADD CONSTRAINT character_language_choices_pkey PRIMARY KEY \(character_id, language_key\)/,
        },
        {
          migration: '076_language_tool_key_cutover.sql',
          label: 'tool keys are authoritative primary keys',
          pattern: /ADD CONSTRAINT character_tool_choices_pkey PRIMARY KEY \(character_id, tool_key\)/,
        },
      ],
    },
    {
      key: 'equipment-and-starting-equipment',
      migrations: [
        '045_equipment_catalog_phase1.sql',
        '046_starting_equipment_packages_and_character_equipment.sql',
        '060_starting_equipment_resolution_catalog.sql',
      ],
      requiredPatterns: [
        {
          migration: '045_equipment_catalog_phase1.sql',
          label: 'equipment items have stable unique keys',
          pattern: /key text NOT NULL UNIQUE/,
        },
        {
          migration: '046_starting_equipment_packages_and_character_equipment.sql',
          label: 'starting package entries are unique per choice group',
          pattern: /UNIQUE \(package_id, item_id, choice_group\)/,
        },
        {
          migration: '046_starting_equipment_packages_and_character_equipment.sql',
          label: 'character equipment stores provenance',
          pattern: /source_package_item_id uuid REFERENCES public\.starting_equipment_package_items/,
        },
      ],
    },
    {
      key: 'feature-options',
      migrations: [
        '032_character_feature_option_choices.sql',
        '042_feature_option_content.sql',
        '059_phb_class_option_systems.sql',
      ],
      requiredPatterns: [
        {
          migration: '032_character_feature_option_choices.sql',
          label: 'character feature choices are scoped by group option order and source',
          pattern: /UNIQUE \(character_id, option_group_key, option_key, choice_order, source_feature_key\)/,
        },
        {
          migration: '042_feature_option_content.sql',
          label: 'content option groups exist',
          pattern: /CREATE TABLE IF NOT EXISTS public\.feature_option_groups/,
        },
      ],
    },
    {
      key: 'feature-spell-grants',
      migrations: ['075_feature_spell_grants.sql'],
      requiredPatterns: [
        {
          migration: '075_feature_spell_grants.sql',
          label: 'feature grants target spell ids',
          pattern: /spell_id uuid NOT NULL REFERENCES public\.spells\(id\) ON DELETE CASCADE/,
        },
        {
          migration: '075_feature_spell_grants.sql',
          label: 'feature grants are unique per source feature',
          pattern: /UNIQUE \(source_category, source_entity_id, source_feature_key\)/,
        },
      ],
    },
    {
      key: 'legacy-spell-attribution',
      migrations: ['077_legacy_spell_selection_attribution.sql'],
      requiredPatterns: [
        {
          migration: '077_legacy_spell_selection_attribution.sql',
          label: 'legacy unattributed spells receive an audit marker',
          pattern: /legacy:pre_batch_4_spell_selection/,
        },
        {
          migration: '077_legacy_spell_selection_attribution.sql',
          label: 'only null owning-class spell selections are marked',
          pattern: /WHERE owning_class_id IS NULL/,
        },
      ],
    },
  ]

  return {
    contractGroups,
    requiredMigrationFiles: Array.from(new Set(contractGroups.flatMap((group) => group.migrations))).sort(),
  }
}
