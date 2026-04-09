'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { StatBlock } from './StatBlock'
import { StatBlockView } from './StatBlockView'
import { SkillsCard } from './SkillsCard'
import { SpellsCard } from './SpellsCard'
import { FeatsCard } from './FeatsCard'
import { CharacterSheetHeader } from './CharacterSheetHeader'
import { LegalityBadge } from './LegalityBadge'
import { SourceTag } from '@/components/shared/SourceTag'
import { useToast } from '@/hooks/use-toast'
import type {
  Character, CharacterLevel, Species, Background,
  Class, Subclass, Feat, Alignment, StatMethod, AbilityScoreBonus,
} from '@/lib/types/database'
import type { LegalityResult } from '@/lib/legality/engine'

// ── Status display ─────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  draft:             { label: 'Draft',             colour: 'bg-neutral-700 text-neutral-300' },
  submitted:         { label: 'Submitted',         colour: 'bg-blue-800 text-blue-200' },
  approved:          { label: 'Approved',          colour: 'bg-green-800 text-green-200' },
  changes_requested: { label: 'Changes Requested', colour: 'bg-amber-800 text-amber-200' },
}

const ALIGNMENTS: Alignment[] = ['LG','NG','CG','LN','N','CN','LE','NE','CE']
const ALIGNMENT_LABELS: Record<Alignment, string> = {
  LG: 'Lawful Good',    NG: 'Neutral Good',    CG: 'Chaotic Good',
  LN: 'Lawful Neutral', N:  'True Neutral',     CN: 'Chaotic Neutral',
  LE: 'Lawful Evil',    NE: 'Neutral Evil',     CE: 'Chaotic Evil',
}

// ── Types ──────────────────────────────────────────────────

interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

interface CharacterSheetProps {
  character: CharacterWithRelations
  campaignId: string
  initialSkillProficiencies?: string[]
  initialSpellChoices?: string[]
  initialFeatChoices?: string[]
  readOnly?: boolean
  isDm?: boolean
}

type SectionId = 'identity-class' | 'stats-skills' | 'spells-feats' | 'hp-notes'

function CollapsibleSection({
  id,
  title,
  subtitle,
  defaultOpen = true,
  highlighted,
  children,
}: {
  id: SectionId
  title: string
  subtitle?: string
  defaultOpen?: boolean
  highlighted?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      id={id}
      className={`rounded-3xl border transition-all ${
        highlighted
          ? 'border-blue-400/30 ring-2 ring-blue-400/20'
          : 'border-white/10'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 rounded-3xl bg-white/[0.03] px-6 py-5 text-left"
      >
        <div>
          <h2 className="text-xl font-semibold text-neutral-100">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-neutral-400">{subtitle}</p>}
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-neutral-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="space-y-4 border-t border-white/8 bg-neutral-950/40 p-4 sm:p-5">{children}</div>}
    </section>
  )
}

// ── Component ─────────────────────────────────────────────

export function CharacterSheet({
  character: initial,
  campaignId,
  initialSkillProficiencies = [],
  initialSpellChoices = [],
  initialFeatChoices = [],
  readOnly = false,
  isDm = false,
}: CharacterSheetProps) {
  /**
   * CharacterSheet is the client-side orchestrator for the editable sheet.
   * It loads campaign-filtered content, keeps the multi-card form state in one
   * place, and coordinates the save/submit loop with legality feedback.
   */
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [name, setName] = useState(initial.name)
  const [alignment, setAlignment] = useState<Alignment | ''>(initial.alignment ?? '')
  const [experiencePoints, setExperiencePoints] = useState(initial.experience_points)
  const [statMethod, setStatMethod] = useState<StatMethod>(initial.stat_method)
  const [stats, setStats] = useState({
    str: initial.base_str, dex: initial.base_dex, con: initial.base_con,
    int: initial.base_int, wis: initial.base_wis, cha: initial.base_cha,
  })
  const [hpMax, setHpMax] = useState(initial.hp_max)
  const [speciesId, setSpeciesId] = useState<string>(initial.species_id ?? '')
  const [backgroundId, setBackgroundId] = useState<string>(initial.background_id ?? '')
  const [levels, setLevels] = useState<Array<{ class_id: string; level: number; subclass_id: string | null }>>
    (initial.character_levels.map((l) => ({ class_id: l.class_id, level: l.level, subclass_id: l.subclass_id })))

  // Content options
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [backgroundList, setBackgroundList] = useState<Background[]>([])
  const [classList, setClassList] = useState<Class[]>([])
  const [subclassMap, setSubclassMap] = useState<Record<string, Subclass[]>>({})
  const [featList, setFeatList] = useState<Feat[]>([])

  const [skillProficiencies, setSkillProficiencies] = useState<string[]>(initialSkillProficiencies)
  const [spellChoices, setSpellChoices] = useState<string[]>(initialSpellChoices)
  const [featChoices, setFeatChoices] = useState<string[]>(initialFeatChoices)

  // UI state
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [legalityResult, setLegalityResult] = useState<LegalityResult | null>(null)
  const [status, setStatus] = useState(initial.status)
  const [dmNotes, setDmNotes] = useState(initial.dm_notes ?? '')
  const [highlightedSection, setHighlightedSection] = useState<SectionId | null>(null)
  const highlightTimerRef = useRef<number | null>(null)

  // Load content options filtered by campaign allowlist
  useEffect(() => {
    const qs = `?campaign_id=${campaignId}`
    Promise.all([
      fetch(`/api/content/species${qs}`).then((r) => r.json()),
      fetch(`/api/content/backgrounds${qs}`).then((r) => r.json()),
      fetch(`/api/content/classes${qs}`).then((r) => r.json()),
      fetch(`/api/content/feats${qs}`).then((r) => r.json()),
    ]).then(([s, b, c, f]) => {
      setSpeciesList(s)
      setBackgroundList(b)
      setClassList(c)
      setFeatList(Array.isArray(f) ? f : [])
    })
  }, [campaignId])

  // Load subclasses when levels change
  useEffect(() => {
    const classIds = Array.from(new Set(levels.map((l) => l.class_id).filter(Boolean)))
    if (classIds.length === 0) return

    const needed = classIds.filter((id) => !subclassMap[id])
    if (needed.length === 0) return

    Promise.all(
      needed.map((id) =>
        fetch(`/api/content/classes/${id}/subclasses?campaign_id=${campaignId}`)
          .then((r) => r.json())
          .then((data: Subclass[]) => ({ id, data }))
      )
    ).then((results) => {
      setSubclassMap((prev) => {
        const next = { ...prev }
        results.forEach(({ id, data }) => { next[id] = data })
        return next
      })
    })
  }, [levels, campaignId, subclassMap])

  function handleStatChange(stat: string, value: number) {
    setStats((prev) => ({ ...prev, [stat]: value }))
  }

  function addLevel() {
    if (classList.length === 0) return
    setLevels((prev) => [...prev, { class_id: classList[0].id, level: 1, subclass_id: null }])
  }

  function removeLevel(index: number) {
    setLevels((prev) => prev.filter((_, i) => i !== index))
  }

  function updateLevel(index: number, field: string, value: string | number | null) {
    setLevels((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/characters/${initial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          alignment: alignment || null,
          experience_points: experiencePoints,
          stat_method: statMethod,
          base_str: stats.str, base_dex: stats.dex, base_con: stats.con,
          base_int: stats.int, base_wis: stats.wis, base_cha: stats.cha,
          hp_max: hpMax,
          species_id: speciesId || null,
          background_id: backgroundId || null,
          levels,
          skill_proficiencies: skillProficiencies,
          spell_choices: spellChoices,
          feat_choices: featChoices,
          ...(isDm ? { dm_notes: dmNotes } : {}),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Save failed', description: json.error, variant: 'destructive' })
        return
      }

      setLegalityResult(json.legality)
      setStatus(json.character.status)
      toast({ title: 'Character saved' })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/characters/${initial.id}/submit`, { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        setLegalityResult(json.legality ?? null)
        toast({ title: 'Cannot submit', description: json.error, variant: 'destructive' })
        return
      }

      setStatus('submitted')
      setLegalityResult(json.legality)
      toast({ title: 'Character submitted for DM review' })
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const totalLevel = levels.reduce((sum, l) => sum + l.level, 0)
  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.draft

  // Racial bonuses from the currently selected species
  const selectedSpecies =
    speciesList.find((s) => s.id === speciesId) ??
    (initial.species?.id === speciesId ? initial.species : null)
  const racialBonuses: Partial<Record<string, number>> = {}
  if (selectedSpecies?.ability_score_bonuses) {
    ;(selectedSpecies.ability_score_bonuses as AbilityScoreBonus[]).forEach(({ ability, bonus }) => {
      racialBonuses[ability] = (racialBonuses[ability] ?? 0) + bonus
    })
  }
  // First class (used for skill choices and saving throws)
  const firstClassId = levels[0]?.class_id
  const firstClassLevel = levels[0]?.level ?? 0
  const firstClassSubclassIds = levels
    .filter((level) => level.class_id === firstClassId && level.subclass_id)
    .map((level) => level.subclass_id as string)
  const selectedClass = classList.find((c) => c.id === firstClassId) ?? null

  const failedChecks = legalityResult?.checks.filter((c) => !c.passed) ?? []
  const derivedProgression = legalityResult?.derived ?? null
  const canEdit = !readOnly && (status === 'draft' || status === 'changes_requested' || isDm)
  const canSubmit = !readOnly && (status === 'draft' || status === 'changes_requested')
  const errorCount = failedChecks.filter((c) => c.severity === 'error').length

  const mod = (base: number, racial: number) => Math.floor((base + racial - 10) / 2)
  const profBonus = totalLevel > 0 ? Math.floor((totalLevel - 1) / 4) + 2 : 2
  const dexMod = mod(stats.dex, racialBonuses['dex'] ?? 0)
  const wisMod = mod(stats.wis, racialBonuses['wis'] ?? 0)
  const perceptionProf = skillProficiencies.includes('perception')
  const passivePerception = 10 + wisMod + (perceptionProf ? profBonus : 0)
  const speed = selectedSpecies?.speed ?? null
  const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

  const checkSectionMap: Record<string, SectionId> = {
    source_allowlist: 'identity-class',
    rule_set_consistency: 'identity-class',
    stat_method_consistency: 'stats-skills',
    stat_method: 'stats-skills',
    level_cap: 'identity-class',
    multiclass_skill_validation: 'stats-skills',
    skill_proficiencies: 'stats-skills',
    multiclass_prerequisites: 'identity-class',
    subclass_timing: 'identity-class',
    feat_prerequisites: 'spells-feats',
    feat_slots: 'spells-feats',
    spell_legality: 'spells-feats',
    spell_selection_count: 'spells-feats',
  }

  function jumpToCheck(key: string) {
    const sectionId = checkSectionMap[key]
    if (!sectionId) return

    const element = document.getElementById(sectionId)
    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlightedSection(sectionId)

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current)
    }

    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedSection(null)
      highlightTimerRef.current = null
    }, 2200)
  }

  return (
    <div className="space-y-6">
      <CharacterSheetHeader
        name={name}
        totalLevel={totalLevel}
        campaignId={campaignId}
        statusLabel={statusInfo.label}
        statusClassName={statusInfo.colour}
        legalityPassed={legalityResult?.passed ?? null}
        legalityErrorCount={errorCount}
        hpMax={hpMax}
        initiative={fmt(dexMod)}
        speed={speed !== null ? `${speed} ft` : '—'}
        passivePerception={passivePerception}
        canEdit={canEdit}
        canSubmit={canSubmit}
        saving={saving}
        submitting={submitting}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />

      {/* DM notes banner */}
      {status === 'changes_requested' && initial.dm_notes && (
        <Alert className="border-amber-400/20 bg-amber-400/10">
          <AlertDescription className="text-amber-200">
            <strong>DM notes:</strong> {initial.dm_notes}
          </AlertDescription>
        </Alert>
      )}

      {/* Legality errors */}
      {legalityResult && failedChecks.length > 0 && (
        <Card className="border-rose-500/20 bg-rose-500/10">
          <CardHeader className="pb-2">
          <CardTitle className="text-sm text-rose-100">What needs attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {failedChecks.map((check) => (
            <button
              key={check.key}
              type="button"
              onClick={() => jumpToCheck(check.key)}
              className="block text-left"
            >
              <LegalityBadge check={check} />
            </button>
          ))}
        </CardContent>
      </Card>
      )}

      <CollapsibleSection
        id="identity-class"
        title="Identity + Class"
        subtitle="Core identity, campaign-facing selections, and level structure."
        highlighted={highlightedSection === 'identity-class'}
      >
      <div className="panel-subtle">
        <CardHeader>
          <CardTitle className="text-neutral-200">Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-neutral-300">Name</Label>
            {canEdit ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <p className="text-neutral-200">{name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Alignment</Label>
            {canEdit ? (
              <Select value={alignment} onValueChange={(v) => setAlignment(v as Alignment)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose alignment" />
                </SelectTrigger>
                <SelectContent>
                  {ALIGNMENTS.map((a) => (
                    <SelectItem key={a} value={a} className="text-neutral-200">{ALIGNMENT_LABELS[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-neutral-200">{alignment ? ALIGNMENT_LABELS[alignment as Alignment] : '—'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Species</Label>
            {canEdit ? (
              <Select value={speciesId} onValueChange={setSpeciesId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose species" />
                </SelectTrigger>
                <SelectContent>
                  {speciesList.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-neutral-200">
                      <span className="flex items-center gap-2">
                        {s.name}
                        <SourceTag source={s.source} amended={s.amended} />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-neutral-200">{initial.species?.name ?? '—'}</p>
                {initial.species && <SourceTag source={initial.species.source} amended={initial.species.amended} />}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Background</Label>
            {canEdit ? (
              <Select value={backgroundId} onValueChange={setBackgroundId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose background" />
                </SelectTrigger>
                <SelectContent>
                  {backgroundList.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-neutral-200">
                      <span className="flex items-center gap-2">
                        {b.name}
                        <SourceTag source={b.source} amended={b.amended} />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-neutral-200">{initial.background?.name ?? '—'}</p>
                {initial.background && <SourceTag source={initial.background.source} amended={initial.background.amended} />}
              </div>
            )}
          </div>

          {/* Background feature */}
          {(() => {
            const selectedBg = backgroundList.find((b) => b.id === backgroundId) ?? initial.background
            if (!selectedBg?.feature) return null
            return (
              <div className="space-y-1 col-span-2">
                <Label className="text-neutral-300">Background Feature</Label>
                <p className="text-sm text-neutral-400 leading-relaxed">{selectedBg.feature}</p>
              </div>
            )
          })()}

          <div className="space-y-2">
            <Label className="text-neutral-300">Experience Points</Label>
            {canEdit ? (
              <Input
                type="number"
                min={0}
                value={experiencePoints}
                onChange={(e) => setExperiencePoints(parseInt(e.target.value, 10) || 0)}
              />
            ) : (
              <p className="text-neutral-200">{experiencePoints.toLocaleString()}</p>
            )}
          </div>
        </CardContent>
      </div>

      <div className="panel-subtle">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-neutral-200">Class &amp; Level</CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={addLevel}>
              + Add class
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {levels.length === 0 && (
            <p className="text-sm text-neutral-500">No class levels assigned.</p>
          )}
          {levels.map((l, i) => {
            const cls = classList.find((c) => c.id === l.class_id)
            const subclasses = subclassMap[l.class_id] ?? []
            return (
              <div key={i} className="flex items-center gap-3 flex-wrap">
                {canEdit ? (
                  <>
                    <Select value={l.class_id} onValueChange={(v) => updateLevel(i, 'class_id', v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {classList.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-neutral-200">
                            <span className="flex items-center gap-2">
                              {c.name}
                              <SourceTag source={c.source} />
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number" min={1} max={20} value={l.level}
                      onChange={(e) => updateLevel(i, 'level', parseInt(e.target.value, 10) || 1)}
                      className="w-16 text-center"
                    />

                    {subclasses.length > 0 && l.level >= (cls?.subclass_choice_level ?? subclasses[0].choice_level) && (
                      <Select
                        value={l.subclass_id ?? 'none'}
                        onValueChange={(v) => updateLevel(i, 'subclass_id', v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="Subclass (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-neutral-400">None</SelectItem>
                          {subclasses.map((sc) => (
                            <SelectItem key={sc.id} value={sc.id} className="text-neutral-200">
                              <span className="flex items-center gap-2">
                                {sc.name}
                                <SourceTag source={sc.source} />
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button size="sm" variant="ghost"
                      onClick={() => removeLevel(i)}
                      className="px-2 text-rose-300 hover:bg-rose-500/10 hover:text-rose-100">
                      ✕
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-200">{cls?.name ?? l.class_id}</span>
                    <span className="text-neutral-400">Lv {l.level}</span>
                    {cls && <SourceTag source={cls.source} />}
                  </div>
                )}
              </div>
            )
          })}
          <div className="text-sm text-neutral-400 pt-1">Total level: {totalLevel}</div>
        </CardContent>
      </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="stats-skills"
        title="Stats + Skills + Saves"
        subtitle="Ability scores, saving throws, and skill choices."
        highlighted={highlightedSection === 'stats-skills'}
      >
      <div className="panel-subtle">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-neutral-200">Ability Scores</CardTitle>
          {canEdit && (
            <Select value={statMethod} onValueChange={(v) => setStatMethod(v as StatMethod)}>
              <SelectTrigger className="w-40 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="point_buy" className="text-neutral-200">Point Buy</SelectItem>
                <SelectItem value="standard_array" className="text-neutral-200">Standard Array</SelectItem>
                <SelectItem value="rolled" className="text-neutral-200">Rolled</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardHeader>
        <CardContent>
          <StatBlock
            values={stats}
            onChange={canEdit ? handleStatChange : undefined}
            readOnly={!canEdit}
            statMethod={statMethod}
            racialBonuses={racialBonuses}
          />
        </CardContent>
      </div>

      {/* Skills & Proficiencies */}
      <SkillsCard
        stats={stats}
        totalLevel={totalLevel}
        selectedClass={selectedClass}
        background={backgroundList.find((b) => b.id === backgroundId) ?? initial.background}
        skillProficiencies={skillProficiencies}
        canEdit={canEdit}
        onChange={setSkillProficiencies}
      />
      </CollapsibleSection>

      <CollapsibleSection
        id="spells-feats"
        title="Spells + Feats"
        subtitle="Spell list and feat progression for the current build."
        defaultOpen={selectedClass?.spellcasting_type != null && selectedClass.spellcasting_type !== 'none'}
        highlighted={highlightedSection === 'spells-feats'}
      >
        {derivedProgression && (derivedProgression.spellSlots.length > 0 || derivedProgression.pactSpellSlots.length > 0) && (
          <Alert className="border-white/10 bg-white/[0.03]">
            <AlertDescription className="text-neutral-300">
              Standard spell slots: {derivedProgression.spellSlots.length > 0 ? derivedProgression.spellSlots.join(' / ') : 'none'}
              {derivedProgression.pactSpellSlots.map((entry) => ` · ${entry.className} pact: ${entry.slots.join(' / ') || 'none'}`).join('')}
            </AlertDescription>
          </Alert>
        )}

        {selectedClass?.spellcasting_type != null && selectedClass.spellcasting_type !== 'none' && (
          <SpellsCard
            classId={firstClassId}
            campaignId={campaignId}
            subclassIds={firstClassSubclassIds}
            classLevel={firstClassLevel}
            spellChoices={spellChoices}
            maxSpellLevel={derivedProgression?.maxSpellLevel}
            spellLevelCaps={derivedProgression?.spellLevelCaps}
            leveledSpellSelectionCap={derivedProgression?.leveledSpellSelectionCap}
            cantripSelectionCap={derivedProgression?.cantripSelectionCap}
            selectionSummary={derivedProgression?.spellSelectionSummary}
            canEdit={canEdit}
            onChange={setSpellChoices}
          />
        )}

        {(() => {
          const selectedBg = backgroundList.find((b) => b.id === backgroundId) ?? initial.background
          const backgroundFeat = selectedBg?.background_feat_id
            ? (featList.find((f) => f.id === selectedBg.background_feat_id) ?? null)
            : null
          return (
            <FeatsCard
              background={selectedBg ?? null}
              backgroundFeat={backgroundFeat}
              availableFeats={featList}
              featChoices={featChoices}
              totalLevel={totalLevel}
              featSlotLabels={derivedProgression?.featSlotLabels}
              canEdit={canEdit}
              onChange={setFeatChoices}
            />
          )
        })()}
      </CollapsibleSection>

      <CollapsibleSection
        id="hp-notes"
        title="HP + Notes"
        subtitle="Durability, DM notes, and stat block output."
        highlighted={highlightedSection === 'hp-notes'}
      >
      <div className="panel-subtle">
        <CardHeader>
          <CardTitle className="text-neutral-200">Hit Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label className="text-neutral-300 w-16">HP Max</Label>
            {canEdit ? (
              <Input
                type="number" min={0} value={hpMax}
                onChange={(e) => setHpMax(parseInt(e.target.value, 10) || 0)}
                className="w-24"
              />
            ) : (
              <span className="text-2xl font-bold text-neutral-100">{hpMax}</span>
            )}
          </div>
        </CardContent>
      </div>

      {/* DM Notes (read-only for players, editable display only) */}
      {isDm && (
        <div className="panel-subtle">
          <CardHeader>
            <CardTitle className="text-neutral-200">DM Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={dmNotes}
              onChange={(e) => setDmNotes(e.target.value)}
              className="min-h-[120px]"
              placeholder="Internal notes visible only to DM"
            />
          </CardContent>
        </div>
      )}

      {/* Stat Block — DM only, built from live form state */}
      {isDm && (
        <StatBlockView
          character={{
            ...initial,
            name,
            alignment: alignment || null,
            base_str: stats.str, base_dex: stats.dex, base_con: stats.con,
            base_int: stats.int, base_wis: stats.wis, base_cha: stats.cha,
            hp_max: hpMax,
            species: speciesList.find((s) => s.id === speciesId) ?? initial.species,
            background: backgroundList.find((b) => b.id === backgroundId) ?? initial.background,
            character_levels: levels.map((l) => ({ ...l, id: '', character_id: initial.id, hp_roll: null, taken_at: '' })),
          }}
          classNames={levels.map((l) => classList.find((c) => c.id === l.class_id)?.name ?? '')}
          selectedClass={selectedClass}
          skillProficiencies={skillProficiencies}
          feats={[
            ...featChoices.map((id) => featList.find((f) => f.id === id)).filter(Boolean) as Feat[],
            ...(() => {
              const bg = backgroundList.find((b) => b.id === backgroundId) ?? initial.background
              const bgFeat = bg?.background_feat_id ? featList.find((f) => f.id === bg.background_feat_id) : null
              return bgFeat ? [bgFeat] : []
            })(),
          ]}
        />
      )}
      </CollapsibleSection>

      <Separator className="bg-neutral-800" />
    </div>
  )
}
