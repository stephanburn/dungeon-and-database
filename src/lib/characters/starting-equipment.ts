import type {
  StartingEquipmentPackageEntry,
  WeaponCatalogEntry,
} from '@/lib/content/equipment-content'
import type { CharacterEquipmentItem, EquipmentItem } from '@/lib/types/database'
import type { EquipmentItemChoiceInput } from '@/lib/characters/choice-persistence'

export type StartingEquipmentSelections = Record<string, {
  selectedPackageItemIdsByGroup: Record<string, string>
  helperSelectionsByPackageItemId: Record<string, string[]>
}>

export type StartingEquipmentOption = {
  itemId: string
  key: string
  label: string
}

export type StartingEquipmentHelperRequirement = {
  key: string
  label: string
  options: StartingEquipmentOption[]
}

export type StartingEquipmentChoiceGroup = {
  key: string
  label: string
  options: StartingEquipmentPackageEntry['items']
}

export type ResolvedStartingEquipmentLine = {
  packageId: string
  packageName: string
  itemId: string
  itemName: string
  quantity: number
}

export type ResolvedStartingEquipment = {
  items: EquipmentItemChoiceInput[]
  lines: ResolvedStartingEquipmentLine[]
  issues: string[]
}

type ResolvedPackageItem = {
  itemId: string
  quantity: number
}

const ARCANE_FOCUS_KEYS = [
  'crystal_arcane_focus',
  'orb_arcane_focus',
  'rod_arcane_focus',
  'staff_arcane_focus',
  'wand_arcane_focus',
]

const DRUIDIC_FOCUS_KEYS = [
  'sprig_of_mistletoe',
  'totem_druidic_focus',
  'wooden_staff_druidic_focus',
  'yew_wand_druidic_focus',
]

const MUSICAL_INSTRUMENT_KEYS = [
  'bagpipes',
  'drum',
  'dulcimer',
  'flute',
  'horn',
  'lute',
  'lyre',
  'pan_flute',
  'shawm',
  'viol',
]

const ARTISAN_TOOL_KEYS = [
  'alchemists_supplies',
  'brewers_supplies',
  'calligraphers_supplies',
  'carpenters_tools',
  'cobblers_tools',
  'cooks_utensils',
  'glassblowers_tools',
  'jewelers_tools',
  'leatherworkers_tools',
  'masons_tools',
  'painters_supplies',
  'potters_tools',
  'smiths_tools',
  'tinkers_tools',
  'weavers_tools',
  'woodcarvers_tools',
]

const GAMING_SET_KEYS = [
  'dice_set',
  'playing_card_set',
]

const CHARLATAN_CON_KEYS = [
  'weighted_dice',
  'marked_cards',
  'fake_signet_ring',
]

function humanizeChoiceGroup(choiceGroup: string) {
  return choiceGroup.replace(/_/g, ' ')
}

function buildEquipmentMaps(equipmentItems: EquipmentItem[]) {
  return {
    equipmentItemsById: new Map(equipmentItems.map((item) => [item.id, item])),
    equipmentItemsByKey: new Map(equipmentItems.map((item) => [item.key, item])),
  }
}

function buildOptionsForKeys(
  keys: string[],
  equipmentItemsByKey: Map<string, EquipmentItem>
): StartingEquipmentOption[] {
  return keys.flatMap((key) => {
    const item = equipmentItemsByKey.get(key)
    if (!item) return []
    return [{
      itemId: item.id,
      key: item.key,
      label: item.name,
    }]
  })
}

function buildWeaponOptions(
  weapons: WeaponCatalogEntry[],
  predicate: (weapon: WeaponCatalogEntry) => boolean
): StartingEquipmentOption[] {
  return weapons
    .filter(predicate)
    .map((weapon) => ({
      itemId: weapon.item_id,
      key: weapon.key,
      label: weapon.name,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function getPackageChoiceGroups(
  pkg: StartingEquipmentPackageEntry
): StartingEquipmentChoiceGroup[] {
  const groups = new Map<string, StartingEquipmentPackageEntry['items']>()

  for (const item of pkg.items) {
    if (!item.choice_group) continue
    const existing = groups.get(item.choice_group) ?? []
    existing.push(item)
    groups.set(item.choice_group, existing)
  }

  return Array.from(groups.entries())
    .map(([key, options]) => ({
      key,
      label: humanizeChoiceGroup(key),
      options: options.slice().sort((left, right) => left.item_order - right.item_order),
    }))
    .sort((left, right) => left.options[0].item_order - right.options[0].item_order)
}

function getDefaultPackageSelectionState(
  selections: StartingEquipmentSelections,
  packageId: string
) {
  return selections[packageId] ?? {
    selectedPackageItemIdsByGroup: {},
    helperSelectionsByPackageItemId: {},
  }
}

export function getHelperRequirements(
  packageItem: StartingEquipmentPackageEntry['items'][number],
  equipmentItems: EquipmentItem[],
  weapons: WeaponCatalogEntry[]
): StartingEquipmentHelperRequirement[] {
  const { equipmentItemsByKey } = buildEquipmentMaps(equipmentItems)

  switch (packageItem.item_key) {
    case 'simple_weapon_choice':
      return [{
        key: 'weapon_1',
        label: 'Simple weapon',
        options: buildWeaponOptions(weapons, (weapon) => weapon.weapon_category === 'simple'),
      }]
    case 'simple_melee_weapon_choice':
      return [{
        key: 'weapon_1',
        label: 'Simple melee weapon',
        options: buildWeaponOptions(weapons, (weapon) => (
          weapon.weapon_category === 'simple' && weapon.weapon_kind === 'melee'
        )),
      }]
    case 'martial_melee_weapon_choice':
      return [{
        key: 'weapon_1',
        label: 'Martial melee weapon',
        options: buildWeaponOptions(weapons, (weapon) => (
          weapon.weapon_category === 'martial' && weapon.weapon_kind === 'melee'
        )),
      }]
    case 'two_simple_melee_weapons_set':
      return [
        {
          key: 'weapon_1',
          label: 'Simple melee weapon 1',
          options: buildWeaponOptions(weapons, (weapon) => (
            weapon.weapon_category === 'simple' && weapon.weapon_kind === 'melee'
          )),
        },
        {
          key: 'weapon_2',
          label: 'Simple melee weapon 2',
          options: buildWeaponOptions(weapons, (weapon) => (
            weapon.weapon_category === 'simple' && weapon.weapon_kind === 'melee'
          )),
        },
      ]
    case 'martial_weapon_and_shield_set':
      return [{
        key: 'weapon_1',
        label: 'Martial weapon',
        options: buildWeaponOptions(weapons, (weapon) => weapon.weapon_category === 'martial'),
      }]
    case 'two_martial_weapons_set':
      return [
        {
          key: 'weapon_1',
          label: 'Martial weapon 1',
          options: buildWeaponOptions(weapons, (weapon) => weapon.weapon_category === 'martial'),
        },
        {
          key: 'weapon_2',
          label: 'Martial weapon 2',
          options: buildWeaponOptions(weapons, (weapon) => weapon.weapon_category === 'martial'),
        },
      ]
    case 'arcane_focus_choice':
      return [{
        key: 'focus_1',
        label: 'Arcane focus',
        options: buildOptionsForKeys(ARCANE_FOCUS_KEYS, equipmentItemsByKey),
      }]
    case 'druidic_focus_choice':
      return [{
        key: 'focus_1',
        label: 'Druidic focus',
        options: buildOptionsForKeys(DRUIDIC_FOCUS_KEYS, equipmentItemsByKey),
      }]
    case 'musical_instrument_choice':
      return [{
        key: 'instrument_1',
        label: 'Musical instrument',
        options: buildOptionsForKeys(MUSICAL_INSTRUMENT_KEYS, equipmentItemsByKey),
      }]
    case 'artisan_tools_choice':
      return [{
        key: 'tool_1',
        label: 'Artisan tool',
        options: buildOptionsForKeys(ARTISAN_TOOL_KEYS, equipmentItemsByKey),
      }]
    case 'gaming_set_choice':
      return [{
        key: 'set_1',
        label: 'Gaming set',
        options: buildOptionsForKeys(GAMING_SET_KEYS, equipmentItemsByKey),
      }]
    case 'charlatan_con_tools':
      return [{
        key: 'con_1',
        label: 'Tool of the con',
        options: buildOptionsForKeys(CHARLATAN_CON_KEYS, equipmentItemsByKey),
      }]
    default:
      return []
  }
}

function aggregateResolvedItems(items: ResolvedPackageItem[]) {
  const quantitiesByItemId = new Map<string, number>()

  for (const item of items) {
    quantitiesByItemId.set(item.itemId, (quantitiesByItemId.get(item.itemId) ?? 0) + item.quantity)
  }

  return Array.from(quantitiesByItemId.entries()).map(([itemId, quantity]) => ({
    itemId,
    quantity,
  }))
}

function resolvePackageItem(
  packageItem: StartingEquipmentPackageEntry['items'][number],
  helperSelections: string[],
  equipmentItemsByKey: Map<string, EquipmentItem>
): ResolvedPackageItem[] {
  switch (packageItem.item_key) {
    case 'light_crossbow_and_20_bolts_set':
      return aggregateResolvedItems([
        { itemId: equipmentItemsByKey.get('light_crossbow')?.id ?? '', quantity: 1 },
        { itemId: equipmentItemsByKey.get('crossbow_bolts')?.id ?? '', quantity: 20 },
      ].filter((item) => item.itemId))
    case 'longbow_and_20_arrows_set':
      return aggregateResolvedItems([
        { itemId: equipmentItemsByKey.get('longbow')?.id ?? '', quantity: 1 },
        { itemId: equipmentItemsByKey.get('arrows')?.id ?? '', quantity: 20 },
      ].filter((item) => item.itemId))
    case 'shortbow_and_20_arrows_set':
      return aggregateResolvedItems([
        { itemId: equipmentItemsByKey.get('shortbow')?.id ?? '', quantity: 1 },
        { itemId: equipmentItemsByKey.get('arrows')?.id ?? '', quantity: 20 },
      ].filter((item) => item.itemId))
    case 'archer_fighter_loadout':
      return aggregateResolvedItems([
        { itemId: equipmentItemsByKey.get('leather_armor')?.id ?? '', quantity: 1 },
        { itemId: equipmentItemsByKey.get('longbow')?.id ?? '', quantity: 1 },
        { itemId: equipmentItemsByKey.get('arrows')?.id ?? '', quantity: 20 },
      ].filter((item) => item.itemId))
    case 'martial_weapon_and_shield_set':
      return aggregateResolvedItems([
        { itemId: helperSelections[0] ?? '', quantity: 1 },
        { itemId: equipmentItemsByKey.get('shield')?.id ?? '', quantity: 1 },
      ].filter((item) => item.itemId))
    case 'two_martial_weapons_set':
    case 'two_simple_melee_weapons_set':
      return aggregateResolvedItems(
        helperSelections
          .filter((itemId) => itemId.length > 0)
          .map((itemId) => ({ itemId, quantity: 1 }))
      )
    case 'simple_weapon_choice':
    case 'simple_melee_weapon_choice':
    case 'martial_melee_weapon_choice':
    case 'arcane_focus_choice':
    case 'druidic_focus_choice':
    case 'musical_instrument_choice':
    case 'artisan_tools_choice':
    case 'gaming_set_choice':
    case 'charlatan_con_tools':
      return helperSelections[0]
        ? [{ itemId: helperSelections[0], quantity: packageItem.quantity }]
        : []
    default:
      return [{ itemId: packageItem.item_id, quantity: packageItem.quantity }]
  }
}

export function resolveStartingEquipment(
  packages: StartingEquipmentPackageEntry[],
  selections: StartingEquipmentSelections,
  equipmentItems: EquipmentItem[],
  weapons: WeaponCatalogEntry[]
): ResolvedStartingEquipment {
  const { equipmentItemsById, equipmentItemsByKey } = buildEquipmentMaps(equipmentItems)
  const resolvedRows: EquipmentItemChoiceInput[] = []
  const lines: ResolvedStartingEquipmentLine[] = []
  const issues: string[] = []

  for (const pkg of packages) {
    const selectionState = getDefaultPackageSelectionState(selections, pkg.id)
    const fixedItems = pkg.items
      .filter((item) => !item.choice_group)
      .sort((left, right) => left.item_order - right.item_order)
    const selectedItems = [...fixedItems]

    for (const group of getPackageChoiceGroups(pkg)) {
      const selectedItemId = selectionState.selectedPackageItemIdsByGroup[group.key]
      if (!selectedItemId) {
        issues.push(`Choose ${group.label} for ${pkg.name}.`)
        continue
      }
      const selectedItem = group.options.find((option) => option.id === selectedItemId)
      if (!selectedItem) {
        issues.push(`Choose a valid ${group.label} option for ${pkg.name}.`)
        continue
      }
      selectedItems.push(selectedItem)
    }

    for (const packageItem of selectedItems) {
      const helperRequirements = getHelperRequirements(packageItem, equipmentItems, weapons)
      const selectedHelperItems = selectionState.helperSelectionsByPackageItemId[packageItem.id] ?? []

      for (let index = 0; index < helperRequirements.length; index += 1) {
        const requirement = helperRequirements[index]
        if (!selectedHelperItems[index]) {
          issues.push(`Choose ${requirement.label.toLowerCase()} for ${pkg.name}.`)
        }
      }

      if (helperRequirements.length > 0 && helperRequirements.some((_, index) => !selectedHelperItems[index])) {
        continue
      }

      const resolvedItems = resolvePackageItem(packageItem, selectedHelperItems, equipmentItemsByKey)
      for (const resolvedItem of resolvedItems) {
        const item = equipmentItemsById.get(resolvedItem.itemId)
        if (!item) {
          issues.push(`Starting equipment for ${pkg.name} references missing catalog item ${resolvedItem.itemId}.`)
          continue
        }

        resolvedRows.push({
          item_id: item.id,
          quantity: resolvedItem.quantity,
          equipped: item.item_category === 'armor' || item.item_category === 'shield',
          source_package_item_id: packageItem.id,
          source_category: 'starting_equipment',
          source_entity_id: pkg.id,
          notes: packageItem.notes ?? null,
        })

        lines.push({
          packageId: pkg.id,
          packageName: pkg.name,
          itemId: item.id,
          itemName: item.name,
          quantity: resolvedItem.quantity,
        })
      }
    }
  }

  return {
    items: resolvedRows,
    lines,
    issues: Array.from(new Set(issues)),
  }
}

export function restoreStartingEquipmentSelections(args: {
  packages: StartingEquipmentPackageEntry[]
  savedItems: CharacterEquipmentItem[]
  equipmentItems: EquipmentItem[]
  weapons: WeaponCatalogEntry[]
}): StartingEquipmentSelections {
  const { packages, savedItems, equipmentItems, weapons } = args
  const restored: StartingEquipmentSelections = {}

  for (const pkg of packages) {
    const packageRows = savedItems.filter((row) => (
      row.source_category === 'starting_equipment'
      && row.source_entity_id === pkg.id
      && row.source_package_item_id
    ))
    if (packageRows.length === 0) continue

    const selectedPackageItemIdsByGroup: Record<string, string> = {}
    for (const group of getPackageChoiceGroups(pkg)) {
      const selectedOption = group.options.find((option) => (
        packageRows.some((row) => row.source_package_item_id === option.id)
      ))
      if (selectedOption) {
        selectedPackageItemIdsByGroup[group.key] = selectedOption.id
      }
    }

    const helperSelectionsByPackageItemId: Record<string, string[]> = {}
    for (const packageItem of pkg.items) {
      const requirements = getHelperRequirements(packageItem, equipmentItems, weapons)
      if (requirements.length === 0) continue

      const availableRows = packageRows.filter((row) => row.source_package_item_id === packageItem.id)
      if (availableRows.length === 0) continue

      const usedIndexes = new Set<number>()
      const restoredSelections = requirements.map((requirement) => {
        const optionIds = new Set(requirement.options.map((option) => option.itemId))
        const matchIndex = availableRows.findIndex((row, index) => (
          !usedIndexes.has(index) && optionIds.has(row.item_id)
        ))
        if (matchIndex < 0) return ''
        usedIndexes.add(matchIndex)
        return availableRows[matchIndex]?.item_id ?? ''
      })

      if (restoredSelections.some(Boolean)) {
        helperSelectionsByPackageItemId[packageItem.id] = restoredSelections
      }
    }

    if (
      Object.keys(selectedPackageItemIdsByGroup).length > 0
      || Object.keys(helperSelectionsByPackageItemId).length > 0
    ) {
      restored[pkg.id] = {
        selectedPackageItemIdsByGroup,
        helperSelectionsByPackageItemId,
      }
    }
  }

  return restored
}
