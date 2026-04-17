import test from 'node:test'
import assert from 'node:assert/strict'
import type { Armor, EquipmentItem, Shield, Weapon } from '@/lib/types/database'
import type {
  ArmorCatalogEntry,
  ShieldCatalogEntry,
  WeaponCatalogEntry,
} from '@/lib/content/equipment-content'

function mergeWeapons(
  items: EquipmentItem[],
  weapons: Weapon[]
): WeaponCatalogEntry[] {
  const itemsById = new Map(items.map((item) => [item.id, item]))
  return weapons.flatMap((weapon) => {
    const item = itemsById.get(weapon.item_id)
    return item ? [{ ...weapon, ...item }] : []
  })
}

function mergeArmor(
  items: EquipmentItem[],
  armorRows: Armor[]
): ArmorCatalogEntry[] {
  const itemsById = new Map(items.map((item) => [item.id, item]))
  return armorRows.flatMap((armor) => {
    const item = itemsById.get(armor.item_id)
    return item ? [{ ...armor, ...item }] : []
  })
}

function mergeShields(
  items: EquipmentItem[],
  shields: Shield[]
): ShieldCatalogEntry[] {
  const itemsById = new Map(items.map((item) => [item.id, item]))
  return shields.flatMap((shield) => {
    const item = itemsById.get(shield.item_id)
    return item ? [{ ...shield, ...item }] : []
  })
}

test('equipment catalog subtype rows merge with base equipment items by item id', () => {
  const items: EquipmentItem[] = [
    {
      id: 'weapon-item',
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
      id: 'armor-item',
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
      id: 'shield-item',
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
  ]

  const mergedWeapons = mergeWeapons(items, [{
    item_id: 'weapon-item',
    weapon_category: 'martial',
    weapon_kind: 'melee',
    damage_dice: '1d8',
    damage_type: 'slashing',
    properties: ['versatile'],
    normal_range: null,
    long_range: null,
    versatile_damage: '1d10',
  }])
  const mergedArmor = mergeArmor(items, [{
    item_id: 'armor-item',
    armor_category: 'heavy',
    base_ac: 16,
    dex_bonus_cap: 0,
    minimum_strength: 13,
    stealth_disadvantage: true,
  }])
  const mergedShields = mergeShields(items, [{
    item_id: 'shield-item',
    armor_class_bonus: 2,
  }])

  assert.equal(mergedWeapons[0]?.name, 'Longsword')
  assert.equal(mergedWeapons[0]?.versatile_damage, '1d10')
  assert.equal(mergedArmor[0]?.name, 'Chain Mail')
  assert.equal(mergedArmor[0]?.base_ac, 16)
  assert.equal(mergedShields[0]?.name, 'Shield')
  assert.equal(mergedShields[0]?.armor_class_bonus, 2)
})
