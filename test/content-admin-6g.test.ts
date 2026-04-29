import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  armorCreateSchema,
  armorDeleteSchema,
  armorUpdateSchema,
  equipmentItemDeleteSchema,
  shieldCreateSchema,
  shieldDeleteSchema,
  shieldUpdateSchema,
  startingEquipmentPackageCreateSchema,
  startingEquipmentPackageDeleteSchema,
  startingEquipmentPackageUpdateSchema,
  weaponCreateSchema,
  weaponDeleteSchema,
  weaponUpdateSchema,
} from '@/lib/content/admin-schemas'
import {
  resolveStartingEquipmentPackageRows,
  type StartingEquipmentPackageEntry,
} from '@/lib/content/equipment-content'
import {
  deriveAbilityScores,
  deriveArmorClass,
} from '@/lib/characters/derived'

const read = (path: string) => readFileSync(path, 'utf8')
const uuid = '11111111-1111-4111-8111-111111111111'

test('slice 6g schemas validate equipment family CRUD payloads', () => {
  assert.equal(weaponCreateSchema.safeParse({
    item_id: uuid,
    weapon_category: 'martial',
    weapon_kind: 'melee',
    damage_dice: '1d8',
    damage_type: 'slashing',
    properties: ['versatile'],
    normal_range: null,
    long_range: null,
    versatile_damage: '1d10',
  }).success, true)
  assert.equal(armorCreateSchema.safeParse({
    item_id: uuid,
    armor_category: 'heavy',
    base_ac: 16,
    dex_bonus_cap: 0,
    minimum_strength: 13,
    stealth_disadvantage: true,
  }).success, true)
  assert.equal(shieldCreateSchema.safeParse({
    item_id: uuid,
    armor_class_bonus: 2,
  }).success, true)
  assert.equal(startingEquipmentPackageCreateSchema.safeParse({
    key: 'class:fighter:phb',
    name: 'Fighter Starting Equipment',
    description: 'A sturdy loadout.',
    source: 'PHB',
    items: [{
      item_id: uuid,
      quantity: 1,
      item_order: 10,
      choice_group: 'martial_weapon',
      notes: null,
    }],
  }).success, true)

  assert.equal(weaponUpdateSchema.safeParse({ item_id: uuid, damage_dice: '1d10' }).success, true)
  assert.equal(armorUpdateSchema.safeParse({ item_id: uuid, base_ac: 17 }).success, true)
  assert.equal(shieldUpdateSchema.safeParse({ item_id: uuid, armor_class_bonus: 3 }).success, true)
  assert.equal(startingEquipmentPackageUpdateSchema.safeParse({ id: uuid, name: 'Updated', items: [] }).success, true)
  assert.equal(equipmentItemDeleteSchema.safeParse({ id: uuid }).success, true)
  assert.equal(weaponDeleteSchema.safeParse({ item_id: uuid }).success, true)
  assert.equal(armorDeleteSchema.safeParse({ item_id: uuid }).success, true)
  assert.equal(shieldDeleteSchema.safeParse({ item_id: uuid }).success, true)
  assert.equal(startingEquipmentPackageDeleteSchema.safeParse({ id: uuid }).success, true)

  assert.equal(weaponCreateSchema.safeParse({
    item_id: uuid,
    weapon_category: 'martial',
    weapon_kind: 'melee',
    damage_dice: 'big',
    damage_type: 'slashing',
    extra: true,
  }).success, false)
  assert.equal(armorCreateSchema.safeParse({
    item_id: uuid,
    armor_category: 'heavy',
    base_ac: 0,
    stealth_disadvantage: false,
  }).success, false)
  assert.equal(startingEquipmentPackageCreateSchema.safeParse({
    key: 'Class Fighter',
    name: 'Fighter Starting Equipment',
    source: 'PHB',
    items: [{ item_id: uuid, quantity: 0 }],
  }).success, false)
})

test('slice 6g content routes use admin schemas for audited equipment CRUD', () => {
  const routeSchemas = new Map([
    ['src/app/api/content/equipment-items/route.ts', ['equipmentItemCreateSchema', 'equipmentItemUpdateSchema', 'equipmentItemDeleteSchema']],
    ['src/app/api/content/weapons/route.ts', ['weaponCreateSchema', 'weaponUpdateSchema', 'weaponDeleteSchema']],
    ['src/app/api/content/armor/route.ts', ['armorCreateSchema', 'armorUpdateSchema', 'armorDeleteSchema']],
    ['src/app/api/content/shields/route.ts', ['shieldCreateSchema', 'shieldUpdateSchema', 'shieldDeleteSchema']],
    ['src/app/api/content/starting-equipment-packages/route.ts', ['startingEquipmentPackageCreateSchema', 'startingEquipmentPackageUpdateSchema', 'startingEquipmentPackageDeleteSchema']],
  ])

  for (const [route, schemaNames] of routeSchemas) {
    const source = read(route)

    assert.match(source, /requireAdmin/)
    assert.match(source, /writeAuditLog/)
    assert.match(source, /safeParse/)
    for (const schemaName of schemaNames) {
      assert.match(source, new RegExp(schemaName))
    }
  }
})

test('slice 6g resolves starting package rows into compact concrete equipment rows', () => {
  const packageItems: StartingEquipmentPackageEntry['items'] = [
    {
      id: 'row-2',
      package_id: 'pkg',
      item_id: 'shield-id',
      item_key: 'shield',
      item_name: 'Shield',
      item_category: 'shield',
      quantity: 1,
      item_order: 20,
      choice_group: 'defense',
      notes: null,
    },
    {
      id: 'row-1',
      package_id: 'pkg',
      item_id: 'chain-mail-id',
      item_key: 'chain_mail',
      item_name: 'Chain Mail',
      item_category: 'armor',
      quantity: 1,
      item_order: 10,
      choice_group: '',
      notes: 'Requires Strength 13.',
    },
  ]

  assert.deepEqual(resolveStartingEquipmentPackageRows(packageItems), [
    {
      key: 'chain_mail',
      label: '1 x Chain Mail',
      category: 'armor',
      quantity: 1,
      choiceGroup: null,
      notes: 'Requires Strength 13.',
    },
    {
      key: 'shield',
      label: '1 x Shield',
      category: 'shield',
      quantity: 1,
      choiceGroup: 'defense',
      notes: null,
    },
  ])
})

test('slice 6g armor and shield payload shape still derives AC correctly', () => {
  const armor = armorCreateSchema.parse({
    item_id: '22222222-2222-4222-8222-222222222222',
    armor_category: 'heavy',
    base_ac: 18,
    dex_bonus_cap: 0,
    minimum_strength: 15,
    stealth_disadvantage: true,
  })
  const shield = shieldCreateSchema.parse({
    item_id: '33333333-3333-4333-8333-333333333333',
    armor_class_bonus: 2,
  })
  const abilities = deriveAbilityScores(
    { str: 15, dex: 18, con: 13, int: 10, wis: 12, cha: 8 },
    {}
  )

  const ac = deriveArmorClass({
    abilities,
    classNames: ['Fighter'],
    speciesName: null,
    speciesSource: null,
    equippedItems: [
      { itemId: armor.item_id, equipped: true },
      { itemId: shield.item_id, equipped: true },
    ],
    armorCatalog: [{
      itemId: armor.item_id,
      name: 'Plate',
      armorCategory: armor.armor_category,
      baseAc: armor.base_ac,
      dexBonusCap: armor.dex_bonus_cap,
    }],
    shieldCatalog: [{
      itemId: shield.item_id,
      name: 'Shield',
      armorClassBonus: shield.armor_class_bonus,
    }],
  })

  assert.equal(ac.value, 20)
  assert.equal(ac.formula, '18 (Plate) +2 (Shield)')
})

test('slice 6g admin UI previews equipment validation without heavy nested package cards', () => {
  const source = read('src/components/dm/ContentAdmin.tsx')

  for (const tab of [
    'equipment-items',
    'weapons',
    'armor',
    'shields',
    'starting-equipment-packages',
  ]) {
    assert.match(source, new RegExp(`tab === '${tab}'`))
  }

  assert.match(source, /buildValidationBundle\(activeTab, payload, featureOptionGroups, equipmentItems\)/)
  assert.match(source, /item_key/)
  assert.match(source, /Package preview/)
  assert.match(source, /resolvePackagePreviewRows/)
  assert.doesNotMatch(source, /rounded-2xl border border-white\/10 p-3 space-y-3/)
  assert.doesNotMatch(source, /implementation copy|internal validator|SQL/i)
})
