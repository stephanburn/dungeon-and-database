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

// ── Types ──────────────────────────────────────────────────

type ContentItem = Record<string, unknown>
type FormState = Record<string, string | number | boolean | string[]>

interface ClassRow { id: string; name: string; subclass_choice_level: number }
interface SourceRow { key: string; full_name: string; is_srd: boolean; rule_set: '2014' | '2024' }
interface FeatRow { id: string; name: string }

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

// ── Defaults & conversions ─────────────────────────────────

function defaultForm(tab: string, classes: ClassRow[]): FormState {
  if (tab === 'backgrounds') return { name: '', skill_proficiencies: '', skill_choice_count: 0, skill_choice_from: '', tool_proficiencies: '', languages: '', feature: '', background_feat_id: '', source: '' }
  if (tab === 'species') return { name: '', size: 'medium', speed: 30, asb_str: 0, asb_dex: 0, asb_con: 0, asb_int: 0, asb_wis: 0, asb_cha: 0, darkvision_range: 0, languages: '', source: '' }
  if (tab === 'classes') return {
    name: '', hit_die: 8, primary_ability: '',
    save_str: false, save_dex: false, save_con: false, save_int: false, save_wis: false, save_cha: false,
    armor_proficiencies: '', weapon_proficiencies: '', tool_proficiencies: '',
    multiclass_prereqs: '',
    skill_choice_count: 2, skill_choice_from: '',
    spellcasting_type: '', spellcasting_progression: '{"mode":"none"}', subclass_choice_level: 3, source: '',
  }
  if (tab === 'subclasses') return { name: '', class_id: classes[0]?.id ?? '', source: '' }
  if (tab === 'spells') return { name: '', level: 0, school: '', casting_time: '1 action', range: '', comp_verbal: false, comp_somatic: false, comp_material: false, comp_materials: '', duration: 'Instantaneous', concentration: false, ritual: false, description: '', classes: [] as string[], source: '' }
  if (tab === 'feats') return { name: '', description: '', source: '' }
  if (tab === 'sources') return { key: '', full_name: '', rule_set: '2014' }
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
  return {}
}

// ── Table column helpers ───────────────────────────────────

function renderTableHead(tab: string) {
  if (tab === 'backgrounds') return <><TableHead>Name</TableHead><TableHead>Skills</TableHead><TableHead>Source</TableHead></>
  if (tab === 'species') return <><TableHead>Name</TableHead><TableHead>Size</TableHead><TableHead>Speed</TableHead><TableHead>Source</TableHead></>
  if (tab === 'classes') return <><TableHead>Name</TableHead><TableHead>Hit Die</TableHead><TableHead>Spellcaster</TableHead><TableHead>Source</TableHead></>
  if (tab === 'subclasses') return <><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Level</TableHead><TableHead>Source</TableHead></>
  if (tab === 'spells') return <><TableHead>Name</TableHead><TableHead>Level</TableHead><TableHead>School</TableHead><TableHead>Source</TableHead></>
  if (tab === 'feats') return <><TableHead>Name</TableHead><TableHead>Source</TableHead></>
  if (tab === 'sources') return <><TableHead>Key</TableHead><TableHead>Full Name</TableHead><TableHead>Rule Set</TableHead></>
  return null
}

function renderTableCells(tab: string, item: ContentItem, classes: ClassRow[]) {
  if (tab === 'backgrounds') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{((item.skill_proficiencies as string[]) ?? []).join(', ') || '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'species') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm capitalize">{item.size as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.speed as number} ft</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'classes') { const st = item.spellcasting_type as string | null; return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">d{item.hit_die as number}</TableCell><TableCell className="text-neutral-400 text-sm">{st && st !== 'none' ? st : '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></> }
  if (tab === 'subclasses') {
    const cls = classes.find(c => c.id === item.class_id)
    return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{cls?.name ?? '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{cls?.subclass_choice_level ?? '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  }
  if (tab === 'spells') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{LEVEL_LABELS[item.level as number]}</TableCell><TableCell className="text-neutral-400 text-sm">{item.school as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'feats') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'sources') return <><TableCell className="font-medium font-mono">{item.key as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.full_name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.rule_set as string}</TableCell></>
  return null
}

// ── Form renderer ──────────────────────────────────────────

interface FormProps {
  tab: string
  form: FormState
  setField: (key: string, value: string | number | boolean | string[]) => void
  classes: ClassRow[]
  sources: SourceRow[]
  feats: FeatRow[]
  autoFocusFirst?: boolean
}

function ContentForm({ tab, form, setField, classes, sources, feats, autoFocusFirst }: FormProps) {
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

  return null
}

// ── Main component ─────────────────────────────────────────

const TABS = ['backgrounds', 'species', 'classes', 'subclasses', 'spells', 'feats', 'sources'] as const
type Tab = typeof TABS[number]

export default function ContentAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('backgrounds')
  const [items, setItems] = useState<ContentItem[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sources, setSources] = useState<SourceRow[]>([])
  const [feats, setFeats] = useState<FeatRow[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = useCallback((tab: Tab) =>
    tab === 'subclasses' ? '/api/content/subclasses' : `/api/content/${tab}`
  , [])

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

  useEffect(() => {
    fetchClasses()
    fetchSources()
    fetchFeats()
  }, [fetchClasses, fetchSources, fetchFeats])

  useEffect(() => {
    fetchItems(activeTab)
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }, [activeTab, fetchItems])

  function setField(key: string, value: string | number | boolean | string[]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function startAdd() {
    setEditingId(null)
    setForm(defaultForm(activeTab, classes))
    setShowForm(true)
    setError(null)
  }

  function startEdit(item: ContentItem) {
    setEditingId(activeTab === 'sources' ? item.key as string : item.id as string)
    setForm(itemToForm(activeTab, item))
    setShowForm(true)
    setError(null)
  }

  function cancel() {
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const payload = formToPayload(activeTab, form, classes)
      const url = apiUrl(activeTab)
      if (editingId) {
        if (activeTab === 'sources') {
          payload.original_key = editingId
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
      cancel()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(itemKey: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    const param = activeTab === 'sources' ? `key=${itemKey}` : `id=${itemKey}`
    const res = await fetch(`${apiUrl(activeTab)}?${param}`, { method: 'DELETE' })
    if (res.ok) {
      await fetchItems(activeTab)
      if (activeTab === 'classes') fetchClasses()
      if (activeTab === 'sources') fetchSources()
      if (activeTab === 'feats') fetchFeats()
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
        <Button size="sm" onClick={startAdd} disabled={showForm && editingId === null}>
          Add {activeTab === 'classes' ? 'class' : activeTab.slice(0, -1)}
        </Button>
      </div>

      <div className="mb-4 overflow-x-auto">
        <TabsList className="h-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {TABS.map(t => (
            <TabsTrigger key={t} value={t} className="capitalize text-neutral-400 data-[state=active]:bg-white/[0.08] data-[state=active]:text-neutral-100">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {TABS.map(tab => (
        <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
          {showForm && activeTab === tab && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
              <h3 className="text-base font-semibold text-neutral-100">
                {editingId ? 'Edit' : 'Add'} {tab === 'classes' ? 'class' : tab.slice(0, -1)}
              </h3>
              <ContentForm tab={tab} form={form} setField={setField} classes={classes} sources={sources} feats={feats} autoFocusFirst={!editingId} />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
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
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => {
                    const itemKey = tab === 'sources' ? item.key as string : item.id as string
                    return (
                      <TableRow key={itemKey}>
                        {renderTableCells(tab, item, classes)}
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
