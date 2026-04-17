import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Armor,
  Database,
  EquipmentItem,
  StartingEquipmentPackage,
  StartingEquipmentPackageItem,
  Shield,
  Weapon,
} from '@/lib/types/database'
import { getAllowedSources } from '@/lib/content-helpers'

type EquipmentQuery = {
  campaignId?: string | null
}

export type WeaponCatalogEntry = Weapon & {
  key: string
  name: string
  item_category: string
  cost_quantity: number
  cost_unit: string
  weight_lb: number | null
  source: string
  amended: boolean
  amendment_note: string | null
}

export type ArmorCatalogEntry = Armor & {
  key: string
  name: string
  item_category: string
  cost_quantity: number
  cost_unit: string
  weight_lb: number | null
  source: string
  amended: boolean
  amendment_note: string | null
}

export type ShieldCatalogEntry = Shield & {
  key: string
  name: string
  item_category: string
  cost_quantity: number
  cost_unit: string
  weight_lb: number | null
  source: string
  amended: boolean
  amendment_note: string | null
}

export type StartingEquipmentPackageEntry = StartingEquipmentPackage & {
  items: Array<StartingEquipmentPackageItem & {
    item_key: string
    item_name: string
    item_category: string
  }>
}

export async function listEquipmentItems(
  supabase: SupabaseClient<Database>,
  query: EquipmentQuery = {}
) {
  const allowedSources = await getAllowedSources(supabase, query.campaignId ?? null)

  let builder = supabase
    .from('equipment_items')
    .select('*')
    .order('item_category')
    .order('name')
  if (allowedSources) builder = builder.in('source', Array.from(allowedSources))

  const { data, error } = await builder
  return {
    data: (data ?? []) as EquipmentItem[],
    error,
  }
}

async function getEquipmentItemMap(
  supabase: SupabaseClient<Database>,
  query: EquipmentQuery = {}
) {
  const itemResult = await listEquipmentItems(supabase, query)
  return {
    error: itemResult.error,
    itemsById: new Map(itemResult.data.map((item) => [item.id, item])),
  }
}

export async function listWeapons(
  supabase: SupabaseClient<Database>,
  query: EquipmentQuery = {}
) {
  const [{ itemsById, error: itemError }, weaponResult] = await Promise.all([
    getEquipmentItemMap(supabase, query),
    supabase.from('weapons').select('*'),
  ])
  if (itemError) return { data: [] as WeaponCatalogEntry[], error: itemError }
  if (weaponResult.error) return { data: [] as WeaponCatalogEntry[], error: weaponResult.error }

  const data = ((weaponResult.data ?? []) as Weapon[])
    .flatMap((weapon) => {
      const item = itemsById.get(weapon.item_id)
      if (!item) return []
      return [{ ...weapon, ...item } satisfies WeaponCatalogEntry]
    })
    .sort((left, right) => {
      if (left.weapon_category !== right.weapon_category) {
        return left.weapon_category.localeCompare(right.weapon_category)
      }
      return left.name.localeCompare(right.name)
    })

  return { data, error: null }
}

export async function listArmor(
  supabase: SupabaseClient<Database>,
  query: EquipmentQuery = {}
) {
  const [{ itemsById, error: itemError }, armorResult] = await Promise.all([
    getEquipmentItemMap(supabase, query),
    supabase.from('armor').select('*'),
  ])
  if (itemError) return { data: [] as ArmorCatalogEntry[], error: itemError }
  if (armorResult.error) return { data: [] as ArmorCatalogEntry[], error: armorResult.error }

  const data = ((armorResult.data ?? []) as Armor[])
    .flatMap((entry) => {
      const item = itemsById.get(entry.item_id)
      if (!item) return []
      return [{ ...entry, ...item } satisfies ArmorCatalogEntry]
    })
    .sort((left, right) => {
      if (left.armor_category !== right.armor_category) {
        return left.armor_category.localeCompare(right.armor_category)
      }
      return left.name.localeCompare(right.name)
    })

  return { data, error: null }
}

export async function listShields(
  supabase: SupabaseClient<Database>,
  query: EquipmentQuery = {}
) {
  const [{ itemsById, error: itemError }, shieldResult] = await Promise.all([
    getEquipmentItemMap(supabase, query),
    supabase.from('shields').select('*'),
  ])
  if (itemError) return { data: [] as ShieldCatalogEntry[], error: itemError }
  if (shieldResult.error) return { data: [] as ShieldCatalogEntry[], error: shieldResult.error }

  const data = ((shieldResult.data ?? []) as Shield[])
    .flatMap((entry) => {
      const item = itemsById.get(entry.item_id)
      if (!item) return []
      return [{ ...entry, ...item } satisfies ShieldCatalogEntry]
    })
    .sort((left, right) => left.name.localeCompare(right.name))

  return { data, error: null }
}

export async function listStartingEquipmentPackages(
  supabase: SupabaseClient<Database>,
  query: EquipmentQuery = {}
) {
  const allowedSources = await getAllowedSources(supabase, query.campaignId ?? null)
  const [packageResult, packageItemsResult, itemResult] = await Promise.all([
    (async () => {
      let builder = supabase.from('starting_equipment_packages').select('*').order('name')
      if (allowedSources) builder = builder.in('source', Array.from(allowedSources))
      return builder
    })(),
    supabase.from('starting_equipment_package_items').select('*').order('item_order'),
    listEquipmentItems(supabase, query),
  ])
  if (packageResult.error) return { data: [] as StartingEquipmentPackageEntry[], error: packageResult.error }
  if (packageItemsResult.error) return { data: [] as StartingEquipmentPackageEntry[], error: packageItemsResult.error }
  if (itemResult.error) return { data: [] as StartingEquipmentPackageEntry[], error: itemResult.error }

  const itemsById = new Map(itemResult.data.map((item) => [item.id, item]))
  const packageItemsByPackageId = new Map<string, StartingEquipmentPackageEntry['items']>()

  for (const entry of (packageItemsResult.data ?? []) as StartingEquipmentPackageItem[]) {
    const item = itemsById.get(entry.item_id)
    if (!item) continue
    const existing = packageItemsByPackageId.get(entry.package_id) ?? []
    existing.push({
      ...entry,
      item_key: item.key,
      item_name: item.name,
      item_category: item.item_category,
    })
    packageItemsByPackageId.set(entry.package_id, existing)
  }

  const data = ((packageResult.data ?? []) as StartingEquipmentPackage[]).map((pkg) => ({
    ...pkg,
    items: packageItemsByPackageId.get(pkg.id) ?? [],
  }))

  return { data, error: null }
}
