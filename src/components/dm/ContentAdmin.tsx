'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ── Types ──────────────────────────────────────────────────

type ContentItem = Record<string, unknown>
type FormState = Record<string, string | number | boolean | string[]>

interface ClassRow { id: string; name: string }

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const STAT_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}
const LEVEL_LABELS: Record<number, string> = {
  0: 'Cantrip', 1: '1st', 2: '2nd', 3: '3rd', 4: '4th',
  5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th',
}

// ── Defaults & conversions ─────────────────────────────────

function defaultForm(tab: string, classes: ClassRow[]): FormState {
  if (tab === 'backgrounds') return { name: '', skill_proficiencies: '', tool_proficiencies: '', languages: '', source: '' }
  if (tab === 'species') return { name: '', size: 'medium', speed: 30, asb_str: 0, asb_dex: 0, asb_con: 0, asb_int: 0, asb_wis: 0, asb_cha: 0, darkvision_range: 0, languages: '', source: '' }
  if (tab === 'subclasses') return { name: '', class_id: classes[0]?.id ?? '', choice_level: 3, source: '' }
  if (tab === 'spells') return { name: '', level: 0, school: '', casting_time: '1 action', range: '', comp_verbal: false, comp_somatic: false, comp_material: false, comp_materials: '', duration: 'Instantaneous', concentration: false, ritual: false, description: '', classes: [] as string[], source: '' }
  if (tab === 'feats') return { name: '', description: '', source: '' }
  return {}
}

function itemToForm(tab: string, item: ContentItem): FormState {
  if (tab === 'backgrounds') {
    return {
      name: item.name as string,
      skill_proficiencies: ((item.skill_proficiencies as string[]) ?? []).join(', '),
      tool_proficiencies: ((item.tool_proficiencies as string[]) ?? []).join(', '),
      languages: ((item.languages as string[]) ?? []).join(', '),
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
  if (tab === 'subclasses') {
    return {
      name: item.name as string,
      class_id: item.class_id as string,
      choice_level: item.choice_level as number,
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
  return {}
}

function splitComma(val: string): string[] {
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

function formToPayload(tab: string, form: FormState): ContentItem {
  if (tab === 'backgrounds') {
    return {
      name: form.name,
      skill_proficiencies: splitComma(form.skill_proficiencies as string),
      tool_proficiencies: splitComma(form.tool_proficiencies as string),
      languages: splitComma(form.languages as string),
      starting_equipment: [],
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
  if (tab === 'subclasses') {
    return {
      name: form.name,
      class_id: form.class_id,
      choice_level: Number(form.choice_level),
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
  return {}
}

// ── Table column helpers ───────────────────────────────────

function renderTableHead(tab: string) {
  if (tab === 'backgrounds') return <><TableHead>Name</TableHead><TableHead>Skills</TableHead><TableHead>Source</TableHead></>
  if (tab === 'species') return <><TableHead>Name</TableHead><TableHead>Size</TableHead><TableHead>Speed</TableHead><TableHead>Source</TableHead></>
  if (tab === 'subclasses') return <><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Level</TableHead><TableHead>Source</TableHead></>
  if (tab === 'spells') return <><TableHead>Name</TableHead><TableHead>Level</TableHead><TableHead>School</TableHead><TableHead>Source</TableHead></>
  if (tab === 'feats') return <><TableHead>Name</TableHead><TableHead>Source</TableHead></>
  return null
}

function renderTableCells(tab: string, item: ContentItem, classes: ClassRow[]) {
  if (tab === 'backgrounds') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{((item.skill_proficiencies as string[]) ?? []).join(', ') || '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'species') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm capitalize">{item.size as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.speed as number} ft</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'subclasses') {
    const cls = classes.find(c => c.id === item.class_id)
    return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{cls?.name ?? '—'}</TableCell><TableCell className="text-neutral-400 text-sm">{item.choice_level as number}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  }
  if (tab === 'spells') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{LEVEL_LABELS[item.level as number]}</TableCell><TableCell className="text-neutral-400 text-sm">{item.school as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  if (tab === 'feats') return <><TableCell className="font-medium">{item.name as string}</TableCell><TableCell className="text-neutral-400 text-sm">{item.source as string}</TableCell></>
  return null
}

// ── Form renderer ──────────────────────────────────────────

interface FormProps {
  tab: string
  form: FormState
  setField: (key: string, value: string | number | boolean | string[]) => void
  classes: ClassRow[]
}

function ContentForm({ tab, form, setField, classes }: FormProps) {
  const field = (label: string, key: string, type: 'text' | 'number' = 'text', placeholder?: string) => (
    <div>
      <Label className="text-neutral-400 text-xs mb-1 block">{label}</Label>
      <Input
        type={type}
        value={form[key] as string | number}
        onChange={e => setField(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="bg-neutral-800 border-neutral-700 text-neutral-100"
      />
    </div>
  )

  const check = (label: string, key: string) => (
    <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
      <input
        type="checkbox"
        checked={form[key] as boolean}
        onChange={e => setField(key, e.target.checked)}
        className="accent-blue-500"
      />
      {label}
    </label>
  )

  const sourceField = field('Source (e.g. PHB, XGtE, homebrew)', 'source', 'text', 'PHB')

  if (tab === 'backgrounds') return (
    <div className="grid grid-cols-2 gap-4">
      {field('Name', 'name')}
      {sourceField}
      {field('Skill Proficiencies (comma-separated)', 'skill_proficiencies', 'text', 'Insight, Religion')}
      {field('Tool Proficiencies (comma-separated)', 'tool_proficiencies', 'text', 'Thieves\' Tools')}
      {field('Languages (comma-separated)', 'languages', 'text', 'Any two languages')}
    </div>
  )

  if (tab === 'species') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name')}
        {sourceField}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Size</Label>
          <select
            value={form.size as string}
            onChange={e => setField('size', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm"
          >
            {['tiny','small','medium','large'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
                className="bg-neutral-800 border-neutral-700 text-neutral-100 text-center"
              />
            </div>
          ))}
        </div>
      </div>
      {field('Languages (comma-separated)', 'languages', 'text', 'Common, Elvish')}
    </div>
  )

  if (tab === 'subclasses') return (
    <div className="grid grid-cols-2 gap-4">
      {field('Name', 'name')}
      {sourceField}
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Class</Label>
        <select
          value={form.class_id as string}
          onChange={e => setField('class_id', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm"
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {field('Choice Level', 'choice_level', 'number')}
    </div>
  )

  if (tab === 'spells') return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Name', 'name')}
        {sourceField}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs mb-1 block">Level</Label>
          <select
            value={form.level as number}
            onChange={e => setField('level', Number(e.target.value))}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 text-sm"
          >
            {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
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
          className="bg-neutral-800 border-neutral-700 text-neutral-100"
        />
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-2 block">Available to Classes</Label>
        <div className="flex flex-wrap gap-3">
          {classes.map(cls => {
            const selected = (form.classes as string[]).includes(cls.id)
            return (
              <label key={cls.id} className="flex items-center gap-1.5 text-sm text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={e => {
                    const current = form.classes as string[]
                    setField('classes', e.target.checked ? [...current, cls.id] : current.filter(id => id !== cls.id))
                  }}
                  className="accent-blue-500"
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
        {sourceField}
      </div>
      <div>
        <Label className="text-neutral-400 text-xs mb-1 block">Description</Label>
        <Textarea
          value={form.description as string}
          onChange={e => setField('description', e.target.value)}
          rows={3}
          className="bg-neutral-800 border-neutral-700 text-neutral-100"
        />
      </div>
    </div>
  )

  return null
}

// ── Main component ─────────────────────────────────────────

const TABS = ['backgrounds', 'species', 'subclasses', 'spells', 'feats'] as const
type Tab = typeof TABS[number]

export default function ContentAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('backgrounds')
  const [items, setItems] = useState<ContentItem[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
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

  useEffect(() => {
    fetch('/api/content/classes').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : []))
  }, [])

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
    setEditingId(item.id as string)
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
      const payload = formToPayload(activeTab, form)
      const url = apiUrl(activeTab)
      if (editingId) {
        payload.id = editingId
        const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      } else {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      }
      await fetchItems(activeTab)
      cancel()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    const res = await fetch(`${apiUrl(activeTab)}?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      await fetchItems(activeTab)
      if (editingId === id) cancel()
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Tab)}>
      <div className="flex items-center justify-between mb-4">
        <TabsList className="bg-neutral-900 border border-neutral-800">
          {TABS.map(t => (
            <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-100 text-neutral-400">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button size="sm" onClick={startAdd} disabled={showForm && editingId === null}>
          + Add
        </Button>
      </div>

      {TABS.map(tab => (
        <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
          {/* Form */}
          {showForm && activeTab === tab && (
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-300">
                {editingId ? 'Edit' : 'Add'} {tab.slice(0, -1)}
              </h3>
              <ContentForm tab={tab} form={form} setField={setField} classes={classes} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={cancel} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {items.length === 0 ? (
            <p className="text-neutral-500 text-sm">No {tab} yet.</p>
          ) : (
            <div className="rounded-lg border border-neutral-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 hover:bg-transparent">
                    {renderTableHead(tab)}
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id as string} className="border-neutral-800 hover:bg-neutral-900/50">
                      {renderTableCells(tab, item, classes)}
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(item)} className="text-neutral-400 hover:text-neutral-100 h-7 px-2 text-xs">
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id as string)} className="text-red-500 hover:text-red-400 h-7 px-2 text-xs">
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
