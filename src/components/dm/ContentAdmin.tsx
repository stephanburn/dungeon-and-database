'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  validateContentImport,
  type ContentImportBundle,
  type ContentImportValidationResult,
} from '../../../scripts/content-import/validator'
import {
  CONTENT_IMPORT_STATUS_LABELS,
  planContentImport,
  type ContentImportPlan,
  type ContentImportSnapshot,
} from '../../../scripts/content-import/import-workflow'

// ── Types ──────────────────────────────────────────────────

type ContentItem = Record<string, unknown>
type PackageItemFormRow = {
  item_id: string
  quantity: number
  item_order: number
  choice_group: string
  notes: string
}
type FormValue = string | number | boolean | string[] | PackageItemFormRow[]
type FormState = Record<string, FormValue>
type PackagePreviewRow = {
  item_key: string
  item_name: string
  item_category: string
  quantity: number
  choice_group: string | null
}

interface ClassRow { id: string; name: string; subclass_choice_level: number }
interface SourceRow { key: string; full_name: string; is_srd: boolean; rule_set: '2014' | '2024' }
interface FeatRow { id: string; name: string }
interface EquipmentItemRow { id: string; key: string; name: string; item_category: string; source: string }
interface StartingEquipmentPackageRow { id: string; key: string; name: string; source: string }
interface SpeciesRow { id: string; name: string; lineage_key?: string; variant_type?: string }
interface FeatureOptionGroupRow { key: string; name: string; option_family: string; source: string }

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const STAT_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}
const LEVEL_LABELS: Record<number, string> = {
  0: 'Cantrip', 1: '1st', 2: '2nd', 3: '3rd', 4: '4th',
  5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th',
}
const HIT_DICE = [6, 8, 10, 12] as const
const SPELLCASTING_TYPES = ['', 'full', 'half', 'third', 'pact', 'none'] as const
const ITEM_CATEGORIES = ['weapon', 'armor', 'shield', 'gear'] as const
const READ_ONLY_TABS = new Set<string>()

function tabLabel(tab: string) {
  if (tab === 'equipment-items') return 'equipment item'
  if (tab === 'starting-equipment-packages') return 'starting equipment package'
  if (tab === 'feature-option-groups') return 'feature option group'
  if (tab === 'feature-options') return 'feature option'
  return tab === 'classes' ? 'class' : tab.slice(0, -1)
}

function getItemIdentifier(tab: string, item: ContentItem) {
  if (tab === 'sources' || tab === 'languages' || tab === 'tools' || tab === 'feature-option-groups') return item.key as string
  if (tab === 'weapons' || tab === 'armor' || tab === 'shields') return item.item_id as string
  return item.id as string
}

function getDeleteParam(tab: string, itemKey: string) {
  if (tab === 'sources' || tab === 'languages' || tab === 'tools' || tab === 'feature-option-groups') return `key=${itemKey}`
  if (tab === 'weapons' || tab === 'armor' || tab === 'shields') return `item_id=${itemKey}`
  return `id=${itemKey}`
}

// ── Defaults & conversions ─────────────────────────────────

function defaultForm(tab: string, classes: ClassRow[]): FormState {
  if (tab === 'backgrounds') return { name: '', skill_proficiencies: '', skill_choice_count: 0, skill_choice_from: '', tool_proficiencies: '', languages: '', feature: '', background_feat_id: '', starting_equipment_package_id: '', source: '' }
  if (tab === 'species') return {
    name: '',
    parent_species_id: '',
    lineage_key: '',
    variant_type: 'base',
    variant_order: 0,
    size: 'medium',
    speed: 30,
    asb_str: 0,
    asb_dex: 0,
    asb_con: 0,
    asb_int: 0,
    asb_wis: 0,
    asb_cha: 0,
    darkvision_range: 0,
    languages: '',
    source: '',
  }
  if (tab === 'classes') return {
    name: '', hit_die: 8, primary_ability: '',
    save_str: false, save_dex: false, save_con: false, save_int: false, save_wis: false, save_cha: false,
    armor_proficiencies: '', weapon_proficiencies: '', tool_proficiencies: '',
    multiclass_prereqs: '',
    skill_choice_count: 2, skill_choice_from: '',
    spellcasting_type: '', spellcasting_progression: '{"mode":"none"}', subclass_choice_level: 3, starting_equipment_package_id: '', source: '',
  }
  if (tab === 'subclasses') return { name: '', class_id: classes[0]?.id ?? '', source: '' }
  if (tab === 'spells') return { name: '', level: 0, school: '', casting_time: '1 action', range: '', comp_verbal: false, comp_somatic: false, comp_material: false, comp_materials: '', duration: 'Instantaneous', concentration: false, ritual: false, description: '', classes: [] as string[], source: '' }
  if (tab === 'feats') return { name: '', description: '', source: '' }
  if (tab === 'sources') return { key: '', full_name: '', rule_set: '2014' }
  if (tab === 'languages') return { key: '', name: '', sort_order: 0, source: '' }
  if (tab === 'tools') return { key: '', name: '', sort_order: 0, source: '' }
  if (tab === 'feature-option-groups') return { key: '', name: '', option_family: '', description: '', selection_limit: 1, allows_duplicate_selections: false, metadata: '{}', source: '' }
  if (tab === 'feature-options') return { group_key: '', key: '', name: '', description: '', option_order: 0, prerequisites: '{}', effects: '{}', source: '' }
  if (tab === 'equipment-items') return { key: '', name: '', item_category: 'gear', cost_quantity: 0, cost_unit: 'gp', weight_lb: 0, source: '' }
  if (tab === 'weapons') return { item_id: '', weapon_category: 'simple', weapon_kind: 'melee', damage_dice: '1d6', damage_type: 'slashing', properties: '', normal_range: 0, long_range: 0, versatile_damage: '' }
  if (tab === 'armor') return { item_id: '', armor_category: 'light', base_ac: 11, dex_bonus_cap: 0, minimum_strength: 0, stealth_disadvantage: false }
  if (tab === 'shields') return { item_id: '', armor_class_bonus: 2 }
  if (tab === 'starting-equipment-packages') return { key: '', name: '', description: '', source: '', package_items: [] as PackageItemFormRow[] }
  return {}
}

function itemToForm(tab: string, item: ContentItem): FormState {
  if (tab === 'backgrounds') {
    return {
      name: item.name as string,
      skill_proficiencies: ((item.skill_proficiencies as string[]) ?? []).join(', '),
      skill_choice_count: (item.skill_choice_count as number) ?? 0,
      skill_choice_from: ((item.skill_choice_from as string[]) ?? []).join(', '),
      tool_proficiencies: ((item.tool_proficiencies as string[]) ?? []).join(', '),
      languages: ((item.languages as string[]) ?? []).join(', '),
      feature: (item.feature as string) ?? '',
      background_feat_id: (item.background_feat_id as string) ?? '',
      starting_equipment_package_id: (item.starting_equipment_package_id as string) ?? '',
      source: item.source as string,
    }
  }
  if (tab === 'species') {
    const asbs = (item.ability_score_bonuses as { ability: string; bonus: number }[]) ?? []
    const senses = (item.senses as { type: string; range_ft: number }[]) ?? []
    const darkvision = senses.find(s => s.type === 'darkvision')?.range_ft ?? 0
    const asbMap = Object.fromEntries(asbs.map(a => [a.ability, a.bonus]))
    return {
      name: item.name as string,
      parent_species_id: (item.parent_species_id as string | null) ?? '',
      lineage_key: (item.lineage_key as string) ?? '',
      variant_type: (item.variant_type as string) ?? 'base',
      variant_order: (item.variant_order as number) ?? 0,
      size: item.size as string,
      speed: item.speed as number,
      asb_str: asbMap['str'] ?? 0, asb_dex: asbMap['dex'] ?? 0, asb_con: asbMap['con'] ?? 0,
      asb_int: asbMap['int'] ?? 0, asb_wis: asbMap['wis'] ?? 0, asb_cha: asbMap['cha'] ?? 0,
      darkvision_range: darkvision,
      languages: ((item.languages as string[]) ?? []).join(', '),
      source: item.source as string,
    }
  }
  if (tab === 'classes') {
    const saves = (item.saving_throw_proficiencies as string[]) ?? []
    const sc = (item.skill_choices as { count: number; from: string[] }) ?? { count: 2, from: [] }
    const prereqs = (item.multiclass_prereqs as { ability: string; min: number }[]) ?? []
    return {
      name: item.name as string,
      hit_die: item.hit_die as number,
      primary_ability: ((item.primary_ability as string[]) ?? []).join(', '),
      save_str: saves.includes('str'), save_dex: saves.includes('dex'), save_con: saves.includes('con'),
      save_int: saves.includes('int'), save_wis: saves.includes('wis'), save_cha: saves.includes('cha'),
      armor_proficiencies: ((item.armor_proficiencies as string[]) ?? []).join(', '),
      weapon_proficiencies: ((item.weapon_proficiencies as string[]) ?? []).join(', '),
      tool_proficiencies: Array.isArray(item.tool_proficiencies)
        ? (item.tool_proficiencies as string[]).join(', ')
        : Object.keys(item.tool_proficiencies as Record<string, unknown>).join(', '),
      multiclass_prereqs: prereqs.map((p) => `${p.ability.toUpperCase()} ${p.min}`).join(', '),
      skill_choice_count: sc.count,
      skill_choice_from: sc.from.join(', '),
      spellcasting_type: (item.spellcasting_type as string) ?? '',
      spellcasting_progression: JSON.stringify((item.spellcasting_progression as Record<string, unknown> | null) ?? { mode: 'none' }, null, 2),
      subclass_choice_level: (item.subclass_choice_level as number) ?? 3,
      starting_equipment_package_id: (item.starting_equipment_package_id as string) ?? '',
      source: item.source as string,
    }
  }
  if (tab === 'subclasses') {
    return {
      name: item.name as string,
      class_id: item.class_id as string,
      source: item.source as string,
    }
  }
  if (tab === 'spells') {
    const comps = (item.components as Record<string, unknown>) ?? {}
    return {
      name: item.name as string,
      level: item.level as number,
      school: item.school as string,
      casting_time: item.casting_time as string,
      range: item.range as string,
      comp_verbal: (comps.verbal as boolean) ?? false,
      comp_somatic: (comps.somatic as boolean) ?? false,
      comp_material: (comps.material as boolean) ?? false,
      comp_materials: ((comps.materials_needed as string[] | undefined) ?? []).join(', '),
      duration: item.duration as string,
      concentration: item.concentration as boolean,
      ritual: item.ritual as boolean,
      description: item.description as string,
      classes: (item.classes as string[]) ?? [],
      source: item.source as string,
    }
  }
  if (tab === 'feats') {
    return {
      name: item.name as string,
      description: item.description as string,
      source: item.source as string,
    }
  }
  if (tab === 'sources') {
    return {
      key: item.key as string,
      full_name: item.full_name as string,
      rule_set: (item.rule_set as '2014' | '2024') ?? '2014',
    }
  }
  if (tab === 'languages' || tab === 'tools') {
    return {
      key: item.key as string,
      name: item.name as string,
      sort_order: (item.sort_order as number) ?? 0,
      source: item.source as string,
    }
  }
  if (tab === 'feature-option-groups') {
    return {
      key: item.key as string,
      name: item.name as string,
      option_family: item.option_family as string,
      description: (item.description as string) ?? '',
      selection_limit: (item.selection_limit as number) ?? 1,
      allows_duplicate_selections: (item.allows_duplicate_selections as boolean) ?? false,
      metadata: JSON.stringify((item.metadata as Record<string, unknown>) ?? {}, null, 2),
      source: item.source as string,
    }
  }
  if (tab === 'feature-options') {
    return {
      group_key: item.group_key as string,
      key: item.key as string,
      name: item.name as string,
      description: (item.description as string) ?? '',
      option_order: (item.option_order as number) ?? 0,
      prerequisites: JSON.stringify((item.prerequisites as Record<string, unknown>) ?? {}, null, 2),
      effects: JSON.stringify((item.effects as Record<string, unknown>) ?? {}, null, 2),
      source: item.source as string,
    }
  }
  if (tab === 'equipment-items') {
    return {
      key: item.key as string,
      name: item.name as string,
      item_category: item.item_category as string,
      cost_quantity: (item.cost_quantity as number) ?? 0,
      cost_unit: (item.cost_unit as string) ?? 'gp',
      weight_lb: (item.weight_lb as number | null) ?? 0,
      source: item.source as string,
    }
  }
  if (tab === 'weapons') {
    return {
      item_id: item.item_id as string,
      weapon_category: item.weapon_category as string,
      weapon_kind: item.weapon_kind as string,
      damage_dice: item.damage_dice as string,
      damage_type: item.damage_type as string,
      properties: ((item.properties as string[]) ?? []).join(', '),
      normal_range: (item.normal_range as number | null) ?? 0,
      long_range: (item.long_range as number | null) ?? 0,
      versatile_damage: (item.versatile_damage as string | null) ?? '',
    }
  }
  if (tab === 'armor') {
    return {
      item_id: item.item_id as string,
      armor_category: item.armor_category as string,
      base_ac: item.base_ac as number,
      dex_bonus_cap: (item.dex_bonus_cap as number | null) ?? 0,
      minimum_strength: (item.minimum_strength as number | null) ?? 0,
      stealth_disadvantage: (item.stealth_disadvantage as boolean) ?? false,
    }
  }
  if (tab === 'shields') {
    return {
      item_id: item.item_id as string,
      armor_class_bonus: (item.armor_class_bonus as number) ?? 2,
    }
  }
  if (tab === 'starting-equipment-packages') {
    return {
      key: item.key as string,
      name: item.name as string,
      description: (item.description as string) ?? '',
      source: item.source as string,
      package_items: (((item.items as Array<Record<string, unknown>>) ?? []).map((entry) => ({
        item_id: entry.item_id as string,
        quantity: (entry.quantity as number) ?? 1,
        item_order: (entry.item_order as number) ?? 0,
        choice_group: (entry.choice_group as string) ?? '',
        notes: (entry.notes as string) ?? '',
      }))) as PackageItemFormRow[],
    }
  }
  return {}
}

function splitComma(val: string): string[] {
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

function formToPayload(tab: string, form: FormState, classes: ClassRow[] = []): ContentItem {
  if (tab === 'backgrounds') {
    return {
      name: form.name,
      skill_proficiencies: splitComma(form.skill_proficiencies as string),
      skill_choice_count: Number(form.skill_choice_count),
      skill_choice_from: splitComma(form.skill_choice_from as string),
      tool_proficiencies: splitComma(form.tool_proficiencies as string),
      languages: splitComma(form.languages as string),
      starting_equipment: [],
      starting_equipment_package_id: (form.starting_equipment_package_id as string) || null,
      feature: form.feature,
      background_feat_id: (form.background_feat_id as string) || null,
      source: form.source,
    }
  }
  if (tab === 'species') {
    const asbs = STAT_KEYS
      .map(k => ({ ability: k, bonus: Number(form[`asb_${k}`]) }))
      .filter(a => a.bonus !== 0)
    const senses = []
    if (Number(form.darkvision_range) > 0) {
      senses.push({ type: 'darkvision', range_ft: Number(form.darkvision_range) })
    }
    return {
      name: form.name,
      parent_species_id: (form.parent_species_id as string) || null,
      lineage_key: (form.lineage_key as string) || '',
      variant_type: form.variant_type,
      variant_order: Number(form.variant_order) || 0,
      size: form.size,
      speed: Number(form.speed),
      ability_score_bonuses: asbs,
      languages: splitComma(form.languages as string),
      senses,
      source: form.source,
    }
  }
  if (tab === 'classes') {
    const saves = STAT_KEYS.filter(k => form[`save_${k}`] as boolean)
    const prereqs = splitComma(form.multiclass_prereqs as string)
      .map(s => { const [ability, min] = s.trim().split(/\s+/); return { ability: ability?.toLowerCase() ?? '', min: Number(min) || 13 } })
      .filter(p => p.ability)
    const spellcastingProgressionRaw = (form.spellcasting_progression as string).trim()
    const spellcastingProgression = spellcastingProgressionRaw
      ? JSON.parse(spellcastingProgressionRaw)
      : { mode: 'none' }
    return {
      name: form.name,
      hit_die: Number(form.hit_die),
      primary_ability: splitComma(form.primary_ability as string),
      saving_throw_proficiencies: saves,
      armor_proficiencies: splitComma(form.armor_proficiencies as string),
      weapon_proficiencies: splitComma(form.weapon_proficiencies as string),
      tool_proficiencies: splitComma(form.tool_proficiencies as string),
      skill_choices: { count: Number(form.skill_choice_count), from: splitComma(form.skill_choice_from as string) },
      multiclass_prereqs: prereqs,
      multiclass_proficiencies: {},
      starting_equipment_package_id: (form.starting_equipment_package_id as string) || null,
      spellcasting_type: (form.spellcasting_type as string) || null,
      spellcasting_progression: spellcastingProgression,
      subclass_choice_level: Number(form.subclass_choice_level),
      source: form.source,
    }
  }
  if (tab === 'subclasses') {
    const parentClass = classes.find(c => c.id === form.class_id)
    return {
      name: form.name,
      class_id: form.class_id,
      choice_level: parentClass?.subclass_choice_level ?? 3,
      source: form.source,
    }
  }
  if (tab === 'spells') {
    return {
      name: form.name,
      level: Number(form.level),
      school: form.school,
      casting_time: form.casting_time,
      range: form.range,
      components: {
        verbal: form.comp_verbal,
        somatic: form.comp_somatic,
        material: form.comp_material,
        materials_needed: splitComma(form.comp_materials as string),
      },
      duration: form.duration,
      concentration: form.concentration,
      ritual: form.ritual,
      description: form.description,
      classes: form.classes,
      source: form.source,
    }
  }
  if (tab === 'feats') {
    return { name: form.name, description: form.description, source: form.source }
  }
  if (tab === 'sources') {
    return { key: form.key, full_name: form.full_name, rule_set: form.rule_set }
  }
  if (tab === 'languages' || tab === 'tools') {
    return {
      key: form.key,
      name: form.name,
      sort_order: Number(form.sort_order),
      source: form.source,
    }
  }
  if (tab === 'feature-option-groups') {
    return {
      key: form.key,
      name: form.name,
      option_family: form.option_family,
      description: form.description,
      selection_limit: Number(form.selection_limit),
      allows_duplicate_selections: Boolean(form.allows_duplicate_selections),
      metadata: JSON.parse((form.metadata as string) || '{}'),
      source: form.source,
    }
  }
  if (tab === 'feature-options') {
    return {
      group_key: form.group_key,
      key: form.key,
      name: form.name,
      description: form.description,
      option_order: Number(form.option_order),
      prerequisites: JSON.parse((form.prerequisites as string) || '{}'),
      effects: JSON.parse((form.effects as string) || '{}'),
      source: form.source,
    }
  }
  if (tab === 'equipment-items') {
    return {
      key: form.key,
      name: form.name,
      item_category: form.item_category,
      cost_quantity: Number(form.cost_quantity),
      cost_unit: form.cost_unit,
      weight_lb: Number(form.weight_lb),
      source: form.source,
    }
  }
  if (tab === 'weapons') {
    return {
      item_id: form.item_id,
      weapon_category: form.weapon_category,
      weapon_kind: form.weapon_kind,
      damage_dice: form.damage_dice,
      damage_type: form.damage_type,
      properties: splitComma(form.properties as string),
      normal_range: Number(form.normal_range) || null,
      long_range: Number(form.long_range) || null,
      versatile_damage: (form.versatile_damage as string) || null,
    }
  }
  if (tab === 'armor') {
    return {
      item_id: form.item_id,
      armor_category: form.armor_category,
      base_ac: Number(form.base_ac),
      dex_bonus_cap: Number(form.dex_bonus_cap) || null,
      minimum_strength: Number(form.minimum_strength) || null,
      stealth_disadvantage: Boolean(form.stealth_disadvantage),
    }
  }
  if (tab === 'shields') {
    return {
      item_id: form.item_id,
      armor_class_bonus: Number(form.armor_class_bonus),
    }
  }
  if (tab === 'starting-equipment-packages') {
    return {
      key: form.key,
      name: form.name,
      description: form.description,
      source: form.source,
      items: (form.package_items as PackageItemFormRow[]).map((entry) => ({
        item_id: entry.item_id,
        quantity: Number(entry.quantity),
        item_order: Number(entry.item_order),
        choice_group: entry.choice_group,
        notes: entry.notes || null,
      })),
    }
  }
  return {}
}

function resolvePackagePreviewRows(
  packageItems: PackageItemFormRow[],
  equipmentItems: EquipmentItemRow[]
): PackagePreviewRow[] {
  return [...packageItems]
    .sort((left, right) => Number(left.item_order) - Number(right.item_order))
    .map((entry) => {
      const item = equipmentItems.find((candidate) => candidate.id === entry.item_id)
      return {
        item_key: item?.key ?? entry.item_id,
        item_name: item?.name ?? 'Unresolved item',
        item_category: item?.item_category ?? 'missing',
        quantity: Number(entry.quantity) || 0,
        choice_group: entry.choice_group || null,
      }
    })
}

// ── Table column helpers ───────────────────────────────────

function renderTableHead(tab: string) {
  if (tab === 'backgrounds') return <><TableHead>Name</TableHead><TableHead>Skills</TableHead><TableHead>Source</TableHead></>
  if (tab === 'species') return <><TableHead>Name</TableHead><TableHead>Variant</TableHead><TableHead>Lineage</TableHead><TableHead>Source</TableHead></>
  if (tab === 'classes') return <><TableHead>Name</TableHead><TableHead>Hit Die</TableHead><TableHead>Spellcaster</TableHead><TableHead>Source</TableHead></>
  if (tab === 'subclasses') return <><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Level</TableHead><TableHead>Source</TableHead></>
  if (tab === 'spells') return <><TableHead>Name</TableHead><TableHead>Level</TableHead><TableHead>School</TableHead><TableHead>Source</TableHead></>
  if (tab === 'feats') return <><TableHead>Name</TableHead><TableHead>Source</TableHead></>
  if (tab === 'sources') return <><TableHead>Key</TableHead><TableHead>Full Name</TableHead><TableHead>Rule Set</TableHead></>
  if (tab === 'languages' || tab === 'tools') return <><TableHead>Name</TableHead><TableHead>Key</TableHead><TableHead>Order</TableHead><TableHead>Source</TableHead></>
  if (tab === 'feature-option-groups') return <><TableHead>Name</TableHead><TableHead>Family</TableHead><TableHead>Limit</TableHead><TableHead>Source</TableHead></>
  if (tab === 'feature-options') return <><TableHead>Name</TableHead><TableHead>Group</TableHead><TableHead>Order</TableHead><TableHead>Source</TableHead></>
  if (tab === 'equipment-items') return <><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Cost</TableHead><TableHead>Source</TableHead></>
  if (tab === 'weapons') return <><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Damage</TableHead><TableHead>Properties</TableHead></>
  if (tab === 'armor') return <><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>AC</TableHead><TableHead>Source</TableHead></>
  if (tab === 'shields') return <><TableHead>Name</TableHead><TableHead>AC Bonus</TableHead><TableHead>Weight</TableHead><TableHead>Source</TableHead></>
  if (tab === 'starting-equipment-packages') return <><TableHead>Name</TableHead><TableHead>Items</TableHead><TableHead>Source</TableHead></>
  return null
}

function renderTableCells(tab: string, item: ContentItem, classes: ClassRow[]) {
  if (tab === 'backgrounds') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{((item.skill_proficiencies as string[]) ?? []).join(', ') || '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'species') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm capitalize">{((item.variant_type as string) || 'base').replaceAll('_', ' ')}</TableCell><TableCell className="text-neutral-400 text-sm">{(item.lineage_key as string) || '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'classes') { const st = item.spellcasting_type as string | null; return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">d{item.hit_die as number}</TableCell><TableCell className="text-neutral-400 text-sm">{st && st !== 'none' ? st : '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></> }
  if (tab === 'subclasses') {
    const cls = classes.find(c => c.id === item.class_id)
    return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{cls?.name ?? '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{cls?.subclass_choice_level ?? '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  }
  if (tab === 'spells') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{LEVEL_LABELS[item.level as number]}</TableCell><TableCell className="text-neutral-400 text-sm">{item.school as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'feats') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'sources') return <><TableCell className="font-medium font-mono">{item.key as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.full_name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.rule_set as string}</TableCell></>
  if (tab === 'languages' || tab === 'tools') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm font-mono">{item.key as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.sort_order as number}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'feature-option-groups') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.option_family as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.selection_limit as number}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'feature-options') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm font-mono">{item.group_key as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.option_order as number}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'equipment-items') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm capitalize">{String(item.item_category ?? '—')}</TableCell><TableCell className="text-neutral-400 text-sm">{item.cost_quantity as number} {item.cost_unit as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'weapons') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm capitalize">{item.weapon_category as string} {item.weapon_kind as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.damage_dice as string} {(item.damage_type as string) === 'none' ? '' : item.damage_type as string}</TableCell><TableCell className="text-neutral-400 text-sm">{((item.properties as string[]) ?? []).join(', ') || '—'}</TableCell></>
  if (tab === 'armor') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm capitalize">{item.armor_category as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.base_ac as number}{item.dex_bonus_cap == null ? ' + DEX' : item.dex_bonus_cap === 0 ? '' : ` + DEX (max ${item.dex_bonus_cap as number})`}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'shields') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">+{item.armor_class_bonus as number}</TableCell><TableCell className="text-neutral-400 text-sm">{item.weight_lb as number} lb</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'starting-equipment-packages') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{((item.items as Array<{ item_name: string; quantity: number }> | undefined) ?? []).map((entry) => `${entry.quantity}x ${entry.item_name}`).join(', ') || '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  return null
}

// ── Form renderer ──────────────────────────────────────────

interface FormProps {
  tab: string
  form: FormState
  setField: (key: string, value: FormValue) => void
  classes: ClassRow[]
  sources: SourceRow[]
  feats: FeatRow[]
  equipmentItems: EquipmentItemRow[]
  startingPackages: StartingEquipmentPackageRow[]
  speciesRows: SpeciesRow[]
  featureOptionGroups: FeatureOptionGroupRow[]
  autoFocusFirst?: boolean
}

function ContentForm({ tab, form, setField, classes, sources, feats, equipmentItems, startingPackages, speciesRows, featureOptionGroups, autoFocusFirst }: FormProps) {
  let firstFieldRendered = false

  const field = (label: string, key: string, type: 'text' | 'number' = 'text', placeholder?: string) => {
    const isFirst = !firstFieldRendered
    if (isFirst) firstFieldRendered = true
    return (
      <div>
        <Label className="mb-1 block text-xs text-neutral-400">{label}</Label>
        <Input
          type={type}
          value={form[key] as string | number}
          onChange={e => setField(key, type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          autoFocus={isFirst && autoFocusFirst}
        />
      </div>
    )
  }

  const check = (label: string, key: string) => (
    <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
      <Checkbox
        checked={form[key] as boolean}
        onChange={e => setField(key, e.target.checked)}
      />
      {label}
    </label>
  )

  const sourceSelect = (
    <div>
      <Label className="mb-1 block text-xs text-neutral-400">Source</Label>
      <Select value={(form.source as string) || 'none'} onValueChange={value => setField('source', value === 'none' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-neutral-400">Select source</SelectItem>
          {sources.map(s => (
            <SelectItem key={s.key} value={s.key} className="text-neutral-200">
              {s.full_name} ({s.key})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const weaponItems = equipmentItems.filter((item) => item.item_category === 'weapon')
  const armorItems = equipmentItems.filter((item) => item.item_category === 'armor')
  const shieldItems = equipmentItems.filter((item) => item.item_category === 'shield')
  const packageItems = (form.package_items as PackageItemFormRow[] | undefined) ?? []
  const packagePreviewRows = resolvePackagePreviewRows(packageItems, equipmentItems)

  function updatePackageItem(index: number, fieldName: keyof PackageItemFormRow, value: string | number) {
    const next = packageItems.map((entry, itemIndex) => (
      itemIndex === index ? { ...entry, [fieldName]: value } : entry
    ))
    setField('package_items', next)
  }

  function addPackageItem() {
    setField('package_items', [
      ...packageItems,
      {
        item_id: equipmentItems[0]?.id ?? '',
        quantity: 1,
        item_order: (packageItems.length + 1) * 10,
        choice_group: '',
        notes: '',
      },
    ])
  }

  function removePackageItem(index: number) {
    setField('package_items', packageItems.filter((_, itemIndex) => itemIndex !== index))
  }

  if (tab === 'backgrounds') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name')}
        {sourceSelect}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Fixed Skill Proficiencies (comma-separated)', 'skill_proficiencies', 'text', 'Insight, Religion')}
        {field('Tool Proficiencies (comma-separated)', 'tool_proficiencies', 'text', "Thieves' Tools")}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('Skill Choices (count)', 'skill_choice_count', 'number')}
        <div className="col-span-2">
          {field('Choose From (comma-separated)', 'skill_choice_from', 'text', 'Athletics, Insight, Stealth')}
        </div>
      </div>
      {field('Languages (comma-separated)', 'languages', 'text', 'Any two languages')}
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Starting Equipment Package (optional)</Label>
        <Select
          value={(form.starting_equipment_package_id as string) || 'none'}
          onValueChange={value => setField('starting_equipment_package_id', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-neutral-400">No package</SelectItem>
            {startingPackages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id} className="text-neutral-200">
                {pkg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Feature</Label>
        <Textarea
          value={form.feature as string}
          onChange={e => setField('feature', e.target.value)}
          rows={2}
          placeholder="Shelter of the Faithful"
        />
      </div>
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Background Feat (optional)</Label>
        <Select
          value={(form.background_feat_id as string) || 'none'}
          onValueChange={value => setField('background_feat_id', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No background feat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-neutral-400">No background feat</SelectItem>
            {feats.map(f => (
              <SelectItem key={f.id} value={f.id} className="text-neutral-200">
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  if (tab === 'species') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name')}
        {sourceSelect}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Lineage Key', 'lineage_key', 'text', 'elf')}
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Variant Type</Label>
          <Select value={form.variant_type as string} onValueChange={value => setField('variant_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['base', 'subrace', 'variant'].map((type) => (
                <SelectItem key={type} value={type} className="capitalize text-neutral-200">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Parent Species</Label>
          <Select
            value={(form.parent_species_id as string) || 'none'}
            onValueChange={value => setField('parent_species_id', value === 'none' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-neutral-400">None</SelectItem>
              {speciesRows.map((species) => (
                <SelectItem key={species.id} value={species.id} className="text-neutral-200">
                  {species.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field('Variant Order', 'variant_order', 'number')}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Size</Label>
          <Select value={form.size as string} onValueChange={value => setField('size', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['tiny', 'small', 'medium', 'large'].map(s => (
                <SelectItem key={s} value={s} className="capitalize text-neutral-200">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field('Speed (ft)', 'speed', 'number')}
        {field('Darkvision (ft, 0 = none)', 'darkvision_range', 'number')}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Ability Score Bonuses</Label>
        <div className="grid grid-cols-6 gap-2">
          {STAT_KEYS.map(k => (
            <div key={k}>
              <Label className="text-neutral-500 text-xs block text-center mb-1">{STAT_LABELS[k]}</Label>
              <Input
                type="number"
                value={form[`asb_${k}`] as number}
                onChange={e => setField(`asb_${k}`, Number(e.target.value))}
                className="text-center"
              />
            </div>
          ))}
        </div>
      </div>
      {field('Languages (comma-separated)', 'languages', 'text', 'Common, Elvish')}
    </div>
  )

  if (tab === 'classes') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name')}
        {sourceSelect}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Hit Die</Label>
          <Select value={String(form.hit_die as number)} onValueChange={value => setField('hit_die', Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HIT_DICE.map(d => (
                <SelectItem key={d} value={String(d)} className="text-neutral-200">
                  d{d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field('Primary Ability (comma-separated)', 'primary_ability', 'text', 'INT')}
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Spellcasting Type</Label>
          <Select
            value={(form.spellcasting_type as string) || 'none'}
            onValueChange={value => setField('spellcasting_type', value === 'none' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-neutral-400">None</SelectItem>
              {SPELLCASTING_TYPES.filter(Boolean).map(t => (
                <SelectItem key={t} value={t} className="capitalize text-neutral-200">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field('Subclass Choice Level', 'subclass_choice_level', 'number')}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-2 block">Saving Throw Proficiencies</Label>
        <div className="flex gap-4">
          {STAT_KEYS.map(k => check(STAT_LABELS[k], `save_${k}`))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('Armor Proficiencies', 'armor_proficiencies', 'text', 'Light, Medium, Shields')}
        {field('Weapon Proficiencies', 'weapon_proficiencies', 'text', 'Simple, Martial')}
        {field('Tool Proficiencies', 'tool_proficiencies', 'text', "Thieves' Tools")}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('Skill Choices (count)', 'skill_choice_count', 'number')}
        {field('Choose From (comma-separated)', 'skill_choice_from', 'text', 'Arcana, History, Insight')}
        {field('Multiclass Prereqs', 'multiclass_prereqs', 'text', 'STR 13')}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Starting Equipment Package (optional)</Label>
        <Select
          value={(form.starting_equipment_package_id as string) || 'none'}
          onValueChange={value => setField('starting_equipment_package_id', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-neutral-400">No package</SelectItem>
            {startingPackages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id} className="text-neutral-200">
                {pkg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Spellcasting Progression (JSON)</Label>
        <Textarea
          value={String(form.spellcasting_progression ?? '{"mode":"none"}')}
          onChange={event => setField('spellcasting_progression', event.target.value)}
          rows={8}
          placeholder={'{\n  "mode": "prepared",\n  "spellcasting_ability": "int",\n  "cantrips_known_by_level": [2,2,2,2,2,2,2,2,2,3],\n  "prepared_formula": "half_level_down",\n  "prepared_add_ability_mod": true,\n  "prepared_min": 1\n}'}
        />
        <p className="mt-2 text-xs text-neutral-500">
          Example for Artificer: prepared caster using INT, half level rounded down, minimum 1, with cantrip counts by level.
        </p>
      </div>
    </div>
  )

  if (tab === 'subclasses') return (
    <div className="grid grid-cols-2 gap-4">
      {field('Name', 'name')}
      {sourceSelect}
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Class</Label>
        <Select value={form.class_id as string} onValueChange={value => setField('class_id', value)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id} className="text-neutral-200">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Choice Level</Label>
        <p className="text-neutral-400 text-sm py-2">
          {classes.find(c => c.id === form.class_id)?.subclass_choice_level ?? '—'}
          <span className="text-neutral-600 ml-2">(set on the class)</span>
        </p>
      </div>
    </div>
  )

  if (tab === 'spells') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name')}
        {sourceSelect}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Level</Label>
          <Select value={String(form.level as number)} onValueChange={value => setField('level', Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEVEL_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v} className="text-neutral-200">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field('School', 'school', 'text', 'Evocation')}
        {field('Casting Time', 'casting_time', 'text', '1 action')}
        {field('Range', 'range', 'text', '60 feet')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Duration', 'duration', 'text', 'Instantaneous')}
        <div className="flex items-end gap-4 pb-1">
          {check('Concentration', 'concentration')}
          {check('Ritual', 'ritual')}
        </div>
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-2 block">Components</Label>
        <div className="flex gap-4 mb-2">
          {check('Verbal (V)', 'comp_verbal')}
          {check('Somatic (S)', 'comp_somatic')}
          {check('Material (M)', 'comp_material')}
        </div>
        {form.comp_material && field('Materials needed (comma-separated)', 'comp_materials', 'text', 'a pinch of sulfur')}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Description</Label>
        <Textarea
          value={form.description as string}
          onChange={e => setField('description', e.target.value)}
          rows={4}
        />
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-2 block">Available to Classes</Label>
        <div className="flex flex-wrap gap-3">
          {classes.map(cls => {
            const selected = (form.classes as string[]).includes(cls.id)
            return (
              <label key={cls.id} className="flex items-center gap-1.5 text-sm text-neutral-300 cursor-pointer">
                <Checkbox
                  checked={selected}
                  onChange={e => {
                    const current = form.classes as string[]
                    setField('classes', e.target.checked ? [...current, cls.id] : current.filter(id => id !== cls.id))
                  }}
                />
                {cls.name}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )

  if (tab === 'feats') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name')}
        {sourceSelect}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Description</Label>
        <Textarea
          value={form.description as string}
          onChange={e => setField('description', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )

  if (tab === 'sources') return (
    <div className="grid grid-cols-3 gap-4">
      {field('Key (abbreviation)', 'key', 'text', 'XGtE')}
      {field('Full Name', 'full_name', 'text', "Xanathar's Guide to Everything")}
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Rule Set</Label>
        <Select value={form.rule_set as string} onValueChange={value => setField('rule_set', value)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="2014" className="text-neutral-200">2014</SelectItem>
            <SelectItem value="2024" className="text-neutral-200">2024</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  if (tab === 'languages' || tab === 'tools') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Key', 'key', 'text', tab === 'languages' ? 'giant_eagle' : 'glassblowers_tools')}
        {sourceSelect}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name', 'text', tab === 'languages' ? 'Giant Eagle' : "Glassblower's Tools")}
        {field('Sort Order', 'sort_order', 'number')}
      </div>
    </div>
  )

  if (tab === 'feature-option-groups') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Key', 'key', 'text', 'fighter:fighting_style')}
        {sourceSelect}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('Name', 'name', 'text', 'Fighting Style')}
        {field('Family', 'option_family', 'text', 'class_feature')}
        {field('Selection Limit', 'selection_limit', 'number')}
      </div>
      <div className="flex items-end pb-1">
        {check('Allow duplicate selections', 'allows_duplicate_selections')}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Description</Label>
        <Textarea
          value={form.description as string}
          onChange={event => setField('description', event.target.value)}
          rows={3}
        />
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Metadata (JSON)</Label>
        <Textarea
          value={form.metadata as string}
          onChange={event => setField('metadata', event.target.value)}
          rows={5}
        />
      </div>
    </div>
  )

  if (tab === 'feature-options') return (
    <div className="space-y-4">
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Group</Label>
        <Select value={(form.group_key as string) || 'none'} onValueChange={value => setField('group_key', value === 'none' ? '' : value)}>
          <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-neutral-400">Select group</SelectItem>
            {featureOptionGroups.map((group) => (
              <SelectItem key={group.key} value={group.key} className="text-neutral-200">
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('Key', 'key', 'text', 'defense')}
        {field('Name', 'name', 'text', 'Defense')}
        {field('Order', 'option_order', 'number')}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Description</Label>
        <Textarea
          value={form.description as string}
          onChange={event => setField('description', event.target.value)}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Prerequisites (JSON)</Label>
          <Textarea
            value={form.prerequisites as string}
            onChange={event => setField('prerequisites', event.target.value)}
            rows={5}
          />
        </div>
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Effects (JSON)</Label>
          <Textarea
            value={form.effects as string}
            onChange={event => setField('effects', event.target.value)}
            rows={5}
          />
        </div>
      </div>
      {sourceSelect}
    </div>
  )

  if (tab === 'equipment-items') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Key', 'key', 'text', 'holy_symbol')}
        {sourceSelect}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name', 'text', 'Holy Symbol')}
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Category</Label>
          <Select value={form.item_category as string} onValueChange={value => setField('item_category', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ITEM_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category} className="capitalize text-neutral-200">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('Cost Quantity', 'cost_quantity', 'number')}
        {field('Cost Unit', 'cost_unit', 'text', 'gp')}
        {field('Weight (lb)', 'weight_lb', 'number')}
      </div>
    </div>
  )

  if (tab === 'weapons') return (
    <div className="space-y-4">
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Equipment Item</Label>
        <Select value={(form.item_id as string) || 'none'} onValueChange={value => setField('item_id', value === 'none' ? '' : value)}>
          <SelectTrigger><SelectValue placeholder="Select weapon item" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-neutral-400">Select weapon item</SelectItem>
            {weaponItems.map((item) => (
              <SelectItem key={item.id} value={item.id} className="text-neutral-200">
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Weapon Category</Label>
          <Select value={form.weapon_category as string} onValueChange={value => setField('weapon_category', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['simple', 'martial'].map((value) => (
                <SelectItem key={value} value={value} className="capitalize text-neutral-200">{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Weapon Kind</Label>
          <Select value={form.weapon_kind as string} onValueChange={value => setField('weapon_kind', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['melee', 'ranged'].map((value) => (
                <SelectItem key={value} value={value} className="capitalize text-neutral-200">{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Damage Dice', 'damage_dice', 'text', '1d8')}
        {field('Damage Type', 'damage_type', 'text', 'slashing')}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('Normal Range', 'normal_range', 'number')}
        {field('Long Range', 'long_range', 'number')}
        {field('Versatile Damage', 'versatile_damage', 'text', '1d10')}
      </div>
      {field('Properties (comma-separated)', 'properties', 'text', 'finesse, light')}
    </div>
  )

  if (tab === 'armor') return (
    <div className="space-y-4">
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Equipment Item</Label>
        <Select value={(form.item_id as string) || 'none'} onValueChange={value => setField('item_id', value === 'none' ? '' : value)}>
          <SelectTrigger><SelectValue placeholder="Select armor item" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-neutral-400">Select armor item</SelectItem>
            {armorItems.map((item) => (
              <SelectItem key={item.id} value={item.id} className="text-neutral-200">
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Armor Category</Label>
          <Select value={form.armor_category as string} onValueChange={value => setField('armor_category', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['light', 'medium', 'heavy'].map((value) => (
                <SelectItem key={value} value={value} className="capitalize text-neutral-200">{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field('Base AC', 'base_ac', 'number')}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('DEX Bonus Cap (0 = none)', 'dex_bonus_cap', 'number')}
        {field('Minimum Strength (0 = none)', 'minimum_strength', 'number')}
        <div className="flex items-end pb-1">{check('Stealth Disadvantage', 'stealth_disadvantage')}</div>
      </div>
    </div>
  )

  if (tab === 'shields') return (
    <div className="space-y-4">
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Equipment Item</Label>
        <Select value={(form.item_id as string) || 'none'} onValueChange={value => setField('item_id', value === 'none' ? '' : value)}>
          <SelectTrigger><SelectValue placeholder="Select shield item" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-neutral-400">Select shield item</SelectItem>
            {shieldItems.map((item) => (
              <SelectItem key={item.id} value={item.id} className="text-neutral-200">
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {field('Armor Class Bonus', 'armor_class_bonus', 'number')}
    </div>
  )

  if (tab === 'starting-equipment-packages') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Key', 'key', 'text', 'class:cleric:phb')}
        {sourceSelect}
      </div>
      <div className="grid grid-cols-1 gap-4">
        {field('Name', 'name', 'text', 'Cleric Starting Equipment')}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Description</Label>
        <Textarea
          value={form.description as string}
          onChange={e => setField('description', e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-neutral-400 text-xs">Package Items</Label>
          <Button type="button" size="sm" variant="outline" onClick={addPackageItem}>
            Add Item
          </Button>
        </div>
        {packageItems.length === 0 ? (
          <p className="text-sm text-neutral-500">No items yet.</p>
        ) : packageItems.map((entry, index) => (
          <div key={`${entry.item_id}-${index}`} className="surface-row p-3 space-y-3">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-neutral-400 text-xs mb-1 block">Item</Label>
                <Select value={entry.item_id || 'none'} onValueChange={value => updatePackageItem(index, 'item_id', value === 'none' ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-neutral-400">Select item</SelectItem>
                    {equipmentItems.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-neutral-200">
                        {item.name} ({item.item_category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-neutral-400 text-xs mb-1 block">Quantity</Label>
                <Input type="number" value={entry.quantity} onChange={e => updatePackageItem(index, 'quantity', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-neutral-400 text-xs mb-1 block">Order</Label>
                <Input type="number" value={entry.item_order} onChange={e => updatePackageItem(index, 'item_order', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-neutral-400 text-xs mb-1 block">Choice Group</Label>
                <Input value={entry.choice_group} onChange={e => updatePackageItem(index, 'choice_group', e.target.value)} placeholder="optional" />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <Label className="text-neutral-400 text-xs mb-1 block">Notes</Label>
                <Input value={entry.notes} onChange={e => updatePackageItem(index, 'notes', e.target.value)} placeholder="optional" />
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => removePackageItem(index)} className="text-red-400 hover:text-red-300">
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      {packagePreviewRows.length > 0 && (
        <details className="surface-section">
          <summary className="cursor-pointer text-sm font-medium text-neutral-200">
            Package preview
          </summary>
          <div className="mt-3 space-y-2">
            {packagePreviewRows.map((entry, index) => (
              <div key={`${entry.item_key}-${index}`} className="surface-row flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-medium text-neutral-100">{entry.quantity} x {entry.item_name}</p>
                  <p className="text-xs text-neutral-500">{entry.item_key} / {entry.item_category}</p>
                </div>
                {entry.choice_group && (
                  <span className="text-xs text-neutral-400">{entry.choice_group}</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )

  return null
}

// ── Main component ─────────────────────────────────────────

const TABS = ['backgrounds', 'species', 'classes', 'subclasses', 'spells', 'feats', 'sources', 'languages', 'tools', 'feature-option-groups', 'feature-options', 'equipment-items', 'weapons', 'armor', 'shields', 'starting-equipment-packages'] as const
type Tab = typeof TABS[number]

function buildValidationBundle(
  tab: Tab,
  payload: ContentItem,
  featureOptionGroups: FeatureOptionGroupRow[],
  equipmentItems: EquipmentItemRow[]
): ContentImportBundle {
  const equipmentBundleRows = equipmentItems.map((item) => ({
    key: item.key,
    name: item.name,
    source: item.source,
    item_category: item.item_category,
  }))

  if (tab === 'languages') {
    return {
      languages: [{
        key: payload.key as string,
        name: payload.name as string,
        source: payload.source as string,
      }],
    }
  }

  if (tab === 'tools') {
    return {
      tools: [{
        key: payload.key as string,
        name: payload.name as string,
        source: payload.source as string,
      }],
    }
  }

  if (tab === 'feature-option-groups') {
    return {
      classes: [{ key: '__admin_preview__', name: 'Admin Preview', source: payload.source as string, progression: [{ level: 1, proficiency_bonus: 2 }] }],
      featureOptionGroups: [{
        key: payload.key as string,
        label: payload.name as string,
        source: payload.source as string,
        owner_table: 'classes',
        owner_key: '__admin_preview__',
      }],
    }
  }

  if (tab === 'feature-options') {
    const source = (payload.source as string) || 'PHB'
    return {
      classes: [{ key: '__admin_preview__', name: 'Admin Preview', source, progression: [{ level: 1, proficiency_bonus: 2 }] }],
      featureOptionGroups: [
        ...featureOptionGroups.map((group) => ({
          key: group.key,
          label: group.name,
          source: group.source,
          owner_table: 'classes' as const,
          owner_key: '__admin_preview__',
        })),
        {
          key: payload.group_key as string,
          label: String(payload.group_key ?? ''),
          source,
          owner_table: 'classes' as const,
          owner_key: '__admin_preview__',
        },
      ],
      featureOptions: [{
        key: payload.key as string,
        group_key: payload.group_key as string,
        label: payload.name as string,
        source,
      }],
    }
  }

  if (tab === 'equipment-items') {
    return {
      equipmentItems: [{
        key: payload.key as string,
        name: payload.name as string,
        source: payload.source as string,
        item_category: payload.item_category as string,
      }],
    }
  }

  if (tab === 'weapons' || tab === 'armor' || tab === 'shields') {
    const item = equipmentItems.find((candidate) => candidate.id === payload.item_id)
    return {
      equipmentItems: item ? [{
        key: item.key,
        name: item.name,
        source: item.source,
        item_category: item.item_category,
      }] : [],
    }
  }

  if (tab === 'starting-equipment-packages') {
    const items = ((payload.items as Array<{ item_id: string; quantity: number }> | undefined) ?? []).map((entry) => {
      const item = equipmentItems.find((candidate) => candidate.id === entry.item_id)
      return {
        item_key: item?.key ?? entry.item_id,
        quantity: Number(entry.quantity) || 0,
      }
    })

    return {
      equipmentItems: equipmentBundleRows,
      startingEquipmentPackages: [{
        key: payload.key as string,
        name: payload.name as string,
        source: payload.source as string,
        items,
      }],
    }
  }

  return {}
}

function buildContentImportSnapshot(
  activeTab: Tab,
  items: ContentItem[],
  sources: SourceRow[],
  equipmentItems: EquipmentItemRow[],
  featureOptionGroups: FeatureOptionGroupRow[]
): ContentImportSnapshot {
  return {
    sources: sources.map((source) => ({
      key: source.key,
      name: source.full_name,
      full_name: source.full_name,
    })),
    languages: activeTab === 'languages' ? items as ContentImportSnapshot['languages'] : [],
    tools: activeTab === 'tools' ? items as ContentImportSnapshot['tools'] : [],
    equipment_items: equipmentItems.map((item) => ({
      key: item.key,
      name: item.name,
      item_category: item.item_category,
      source: item.source,
    })),
    feature_option_groups: featureOptionGroups.map((group) => ({
      key: group.key,
      name: group.name,
      option_family: group.option_family,
      source: group.source,
    })),
    feature_options: activeTab === 'feature-options' ? items as ContentImportSnapshot['feature_options'] : [],
    starting_equipment_packages: activeTab === 'starting-equipment-packages' ? items as ContentImportSnapshot['starting_equipment_packages'] : [],
  }
}

export default function ContentAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('backgrounds')
  const [items, setItems] = useState<ContentItem[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sources, setSources] = useState<SourceRow[]>([])
  const [feats, setFeats] = useState<FeatRow[]>([])
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItemRow[]>([])
  const [startingPackages, setStartingPackages] = useState<StartingEquipmentPackageRow[]>([])
  const [featureOptionGroups, setFeatureOptionGroups] = useState<FeatureOptionGroupRow[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationPreview, setValidationPreview] = useState<ContentImportValidationResult | null>(null)
  const [contentImportText, setContentImportText] = useState('')
  const [contentImportPreview, setContentImportPreview] = useState<ContentImportPlan | null>(null)
  const [contentImportError, setContentImportError] = useState<string | null>(null)

  const apiUrl = useCallback((tab: Tab) =>
    tab === 'subclasses' ? '/api/content/subclasses' : `/api/content/${tab}`
  , [])

  const speciesRows = (activeTab === 'species' ? items : []) as unknown as SpeciesRow[]

  const fetchItems = useCallback(async (tab: Tab) => {
    const res = await fetch(apiUrl(tab))
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
  }, [apiUrl])

  const fetchClasses = useCallback(() => {
    fetch('/api/content/classes').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : []))
  }, [])

  const fetchSources = useCallback(() => {
    fetch('/api/content/sources').then(r => r.json()).then(d => setSources(Array.isArray(d) ? d : []))
  }, [])

  const fetchFeats = useCallback(() => {
    fetch('/api/content/feats').then(r => r.json()).then(d => setFeats(Array.isArray(d) ? d : []))
  }, [])

  const fetchEquipmentItems = useCallback(() => {
    fetch('/api/content/equipment-items').then(r => r.json()).then(d => setEquipmentItems(Array.isArray(d) ? d : []))
  }, [])

  const fetchStartingPackages = useCallback(() => {
    fetch('/api/content/starting-equipment-packages')
      .then(r => r.json())
      .then(d => setStartingPackages(Array.isArray(d) ? d : []))
  }, [])

  const fetchFeatureOptionGroups = useCallback(() => {
    fetch('/api/content/feature-option-groups').then(r => r.json()).then(d => setFeatureOptionGroups(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    fetchClasses()
    fetchSources()
    fetchFeats()
    fetchEquipmentItems()
    fetchStartingPackages()
    fetchFeatureOptionGroups()
  }, [fetchClasses, fetchSources, fetchFeats, fetchEquipmentItems, fetchStartingPackages, fetchFeatureOptionGroups])

  useEffect(() => {
    fetchItems(activeTab)
    setShowForm(false)
    setEditingId(null)
    setError(null)
    setValidationPreview(null)
  }, [activeTab, fetchItems])

  function setField(key: string, value: FormValue) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function startAdd() {
    setEditingId(null)
    setForm(defaultForm(activeTab, classes))
    setShowForm(true)
    setError(null)
    setValidationPreview(null)
  }

  function startEdit(item: ContentItem) {
    setEditingId(getItemIdentifier(activeTab, item))
    setForm(itemToForm(activeTab, item))
    setShowForm(true)
    setError(null)
    setValidationPreview(null)
  }

  function cancel() {
    setShowForm(false)
    setEditingId(null)
    setError(null)
    setValidationPreview(null)
  }

  function previewValidation(payload = formToPayload(activeTab, form, classes)) {
    const preview = validateContentImport(buildValidationBundle(activeTab, payload, featureOptionGroups, equipmentItems))
    setValidationPreview(preview)
    return preview
  }

  function previewContentImport() {
    setContentImportError(null)
    try {
      const bundle = JSON.parse(contentImportText || '{}') as ContentImportBundle
      const preview = planContentImport(
        bundle,
        buildContentImportSnapshot(activeTab, items, sources, equipmentItems, featureOptionGroups),
        { retireMissing: true }
      )
      setContentImportPreview(preview)
      return preview
    } catch (e) {
      setContentImportPreview(null)
      setContentImportError(e instanceof Error ? e.message : 'Import fixture could not be read.')
      return null
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const payload = formToPayload(activeTab, form, classes)
      const preview = previewValidation(payload)
      if (!preview.ok) throw new Error('Resolve validation findings before saving.')
      const url = apiUrl(activeTab)
      if (editingId) {
        if (activeTab === 'sources') {
          payload.original_key = editingId
        } else if (activeTab === 'weapons' || activeTab === 'armor' || activeTab === 'shields') {
          payload.item_id = editingId
        } else {
          payload.id = editingId
        }
        const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      } else {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      }
      await fetchItems(activeTab)
      if (activeTab === 'classes') fetchClasses()
      if (activeTab === 'sources') fetchSources()
      if (activeTab === 'feats') fetchFeats()
      if (activeTab === 'equipment-items') fetchEquipmentItems()
      if (activeTab === 'starting-equipment-packages') fetchStartingPackages()
      if (activeTab === 'feature-option-groups') fetchFeatureOptionGroups()
      cancel()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(itemKey: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    const param = getDeleteParam(activeTab, itemKey)
    const res = await fetch(`${apiUrl(activeTab)}?${param}`, { method: 'DELETE' })
    if (res.ok) {
      await fetchItems(activeTab)
      if (activeTab === 'classes') fetchClasses()
      if (activeTab === 'sources') fetchSources()
      if (activeTab === 'feats') fetchFeats()
      if (activeTab === 'equipment-items') fetchEquipmentItems()
      if (activeTab === 'starting-equipment-packages') fetchStartingPackages()
      if (editingId === itemKey) cancel()
    } else {
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Delete failed')
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Tab)}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="section-heading">Library Sections</h2>
          <p className="mt-1 text-sm text-neutral-500">Choose a content type to review or edit.</p>
        </div>
        {!READ_ONLY_TABS.has(activeTab) && (
          <Button size="sm" onClick={startAdd} disabled={showForm && editingId === null}>
            Add {tabLabel(activeTab)}
          </Button>
        )}
      </div>

      <div className="mb-4 overflow-x-auto">
        <TabsList className="h-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {TABS.map(t => (
            <TabsTrigger key={t} value={t} className="capitalize text-neutral-400 data-[state=active]:bg-white/[0.08] data-[state=active]:text-neutral-100">
              {t.replaceAll('-', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <details className="surface-section mb-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-200">
          Import diff
        </summary>
        <div className="mt-3 space-y-3">
          <Textarea
            aria-label="Import fixture"
            value={contentImportText}
            onChange={e => setContentImportText(e.target.value)}
            rows={5}
          />
          {contentImportError && <p className="text-sm text-red-400">{contentImportError}</p>}
          {contentImportPreview && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400 sm:grid-cols-4">
                <span>Create {contentImportPreview.summary.create}</span>
                <span>Update {contentImportPreview.summary.update}</span>
                <span>No change {contentImportPreview.summary.noOp}</span>
                <span>Retire {contentImportPreview.summary.retire}</span>
              </div>
              {!contentImportPreview.ok ? (
                <details className="surface-section">
                  <summary className="cursor-pointer text-sm font-medium text-neutral-200">
                    Validation findings
                  </summary>
                  <div className="mt-3 space-y-2">
                    {contentImportPreview.validation.errors.map((finding) => (
                      <div key={`${finding.table}-${finding.entityKey}-${finding.code}`} className="surface-row p-3">
                        <p className="text-sm font-medium text-neutral-100">{finding.table}: {finding.entityKey}</p>
                        <p className="text-xs text-neutral-400">{finding.message}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <div className="space-y-2">
                  {contentImportPreview.rows.map((row) => (
                    <div key={`${row.table}-${row.key}-${row.status}`} className="surface-row flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-100">{row.label}</p>
                        <p className="text-xs text-neutral-500">{row.table} / {row.key} / {row.source ?? 'source'}</p>
                      </div>
                      <span className="text-xs text-neutral-300">{CONTENT_IMPORT_STATUS_LABELS[row.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button size="sm" variant="outline" type="button" onClick={previewContentImport}>
            Preview
          </Button>
        </div>
      </details>

      {TABS.map(tab => (
        <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
          {showForm && activeTab === tab && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
              <h3 className="text-base font-semibold text-neutral-100">
                {editingId ? 'Edit' : 'Add'} {tabLabel(tab)}
              </h3>
              <ContentForm
                tab={tab}
                form={form}
                setField={setField}
                classes={classes}
                sources={sources}
                feats={feats}
                equipmentItems={equipmentItems}
                startingPackages={startingPackages}
                speciesRows={speciesRows}
                featureOptionGroups={featureOptionGroups}
                autoFocusFirst={!editingId}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              {validationPreview && (
                <details className="surface-section">
                  <summary className="cursor-pointer text-sm font-medium text-neutral-200">
                    Validation preview
                  </summary>
                  {validationPreview.ok ? (
                    <p className="mt-3 text-sm text-emerald-300">Ready to save.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {validationPreview.errors.map((finding) => (
                        <div key={`${finding.table}-${finding.entityKey}-${finding.code}`} className="surface-row p-3">
                          <p className="text-sm font-medium text-neutral-100">{finding.table}: {finding.entityKey}</p>
                          <p className="text-xs text-neutral-400">{finding.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </details>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => previewValidation()} disabled={saving}>
                  Preview
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={cancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-neutral-500 text-sm">No {tab} yet.</p>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {renderTableHead(tab)}
                    {!READ_ONLY_TABS.has(tab) && <TableHead className="w-24" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => {
                    const itemKey = getItemIdentifier(tab, item)
                    return (
                      <TableRow key={itemKey}>
                        {renderTableCells(tab, item, classes)}
                        {!READ_ONLY_TABS.has(tab) && (
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => startEdit(item)} className="h-7 px-2 text-xs">
                                Edit
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteItem(itemKey)} className="h-7 px-2 text-xs text-red-400 hover:text-red-300">
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
