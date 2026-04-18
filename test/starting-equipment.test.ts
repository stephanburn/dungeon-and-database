import test from 'node:test'
import assert from 'node:assert/strict'
import type {
  StartingEquipmentPackageEntry,
  WeaponCatalogEntry,
} from '@/lib/content/equipment-content'
import type { EquipmentItem } from '@/lib/types/database'
import {
  resolveStartingEquipment,
  type StartingEquipmentSelections,
} from '@/lib/characters/starting-equipment'

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
    id: 'leather-armor-id',
    key: 'leather_armor',
    name: 'Leather Armor',
    item_category: 'armor',
    cost_quantity: 10,
    cost_unit: 'gp',
    weight_lb: 10,
    source: 'PHB',
    amended: false,
    amendment_note: null,
  },
  {
    id: 'longbow-id',
    key: 'longbow',
    name: 'Longbow',
    item_category: 'weapon',
    cost_quantity: 50,
    cost_unit: 'gp',
    weight_lb: 2,
    source: 'PHB',
    amended: false,
    amendment_note: null,
  },
  {
    id: 'arrows-id',
    key: 'arrows',
    name: 'Arrows',
    item_category: 'gear',
    cost_quantity: 1,
    cost_unit: 'gp',
    weight_lb: 1,
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
  {
    id: 'lute-id',
    key: 'lute',
    name: 'Lute',
    item_category: 'gear',
    cost_quantity: 35,
    cost_unit: 'gp',
    weight_lb: 2,
    source: 'PHB',
    amended: false,
    amendment_note: null,
  },
]

const weapons: WeaponCatalogEntry[] = [
  {
    item_id: 'longbow-id',
    weapon_category: 'martial',
    weapon_kind: 'ranged',
    damage_dice: '1d8',
    damage_type: 'piercing',
    properties: ['heavy', 'two-handed'],
    normal_range: 150,
    long_range: 600,
    versatile_damage: null,
    key: 'longbow',
    name: 'Longbow',
    item_category: 'weapon',
    cost_quantity: 50,
    cost_unit: 'gp',
    weight_lb: 2,
    source: 'PHB',
    amended: false,
    amendment_note: null,
  },
  {
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
  },
]

test('resolveStartingEquipment expands helper bundles and choice groups into concrete equipment rows', () => {
  const packages: StartingEquipmentPackageEntry[] = [{
    id: 'fighter-package-id',
    key: 'class:fighter:phb',
    name: 'Fighter Starting Equipment',
    description: 'PHB fighter package',
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
        choice_group: 'armor_loadout',
        notes: null,
        item_key: 'chain_mail',
        item_name: 'Chain Mail',
        item_category: 'armor',
      },
      {
        id: 'armor-archer-loadout',
        package_id: 'fighter-package-id',
        item_id: 'archer-fighter-loadout-id',
        quantity: 1,
        item_order: 20,
        choice_group: 'armor_loadout',
        notes: null,
        item_key: 'archer_fighter_loadout',
        item_name: 'Leather Armor, Longbow, and 20 Arrows',
        item_category: 'gear',
      },
      {
        id: 'primary-weapon-set',
        package_id: 'fighter-package-id',
        item_id: 'martial-weapon-shield-id',
        quantity: 1,
        item_order: 30,
        choice_group: 'primary_weapon',
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
        item_order: 40,
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
        armor_loadout: 'armor-archer-loadout',
        primary_weapon: 'primary-weapon-set',
        pack: 'pack-explorer',
      },
      helperSelectionsByPackageItemId: {
        'primary-weapon-set': ['longsword-id'],
      },
    },
  }

  const resolved = resolveStartingEquipment(packages, selections, equipmentItems, weapons)

  assert.deepEqual(resolved.issues, [])
  assert.deepEqual(
    resolved.lines.map((line) => `${line.quantity}x ${line.itemName}`),
    [
      '1x Leather Armor',
      '1x Longbow',
      '20x Arrows',
      '1x Longsword',
      '1x Shield',
      '1x Explorer\'s Pack',
    ]
  )
  assert.equal(resolved.items.length, 6)
  assert.equal(resolved.items[0]?.source_category, 'starting_equipment')
})

test('resolveStartingEquipment reports missing helper selections', () => {
  const packages: StartingEquipmentPackageEntry[] = [{
    id: 'entertainer-package-id',
    key: 'background:entertainer:phb',
    name: 'Entertainer Starting Equipment',
    description: 'PHB entertainer package',
    source: 'PHB',
    amended: false,
    amendment_note: null,
    items: [
      {
        id: 'instrument-choice',
        package_id: 'entertainer-package-id',
        item_id: 'instrument-placeholder-id',
        quantity: 1,
        item_order: 10,
        choice_group: '',
        notes: null,
        item_key: 'musical_instrument_choice',
        item_name: 'Musical Instrument Choice',
        item_category: 'gear',
      },
    ],
  }]

  const selections: StartingEquipmentSelections = {}
  const resolved = resolveStartingEquipment(packages, selections, equipmentItems, weapons)

  assert.deepEqual(resolved.items, [])
  assert.match(resolved.issues[0] ?? '', /Choose musical instrument/i)
})
