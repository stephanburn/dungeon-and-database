'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
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
import { GrantedProficienciesCard } from './GrantedProficienciesCard'
import { LanguagesToolsCard } from './LanguagesToolsCard'
import { SpeciesAbilityBonusCard } from './SpeciesAbilityBonusCard'
import { SpellsCard } from './SpellsCard'
import { FeatsCard } from './FeatsCard'
import { FeatSpellChoicesCard } from './FeatSpellChoicesCard'
import { FeatureOptionChoicesCard } from './FeatureOptionChoicesCard'
import { FeatureSpellChoicesCard } from './FeatureSpellChoicesCard'
import { CharacterSheetHeader } from './CharacterSheetHeader'
import { LegalityBadge } from './LegalityBadge'
import { SourceTag } from '@/components/shared/SourceTag'
import { useToast } from '@/hooks/use-toast'
import {
  buildLocalCharacterContext,
  buildTypedAsiChoices,
  buildTypedSpellChoices,
  buildTypedFeatChoices,
  buildTypedAbilityBonusChoices,
  buildTypedLanguageChoices,
  buildTypedSkillProficiencies,
  buildTypedToolChoices,
  deriveLocalCharacter,
} from '@/lib/characters/wizard-helpers'
import { getFixedBackgroundLanguages } from '@/lib/characters/language-tool-provenance'
import {
  abilityBonusMapToContributors,
  deriveGrantedNonSkillProficiencies,
  deriveCharacterCore,
  formatModifier,
  sumAbilityContributors,
  type DerivedAbilityScoreContributor,
  type DerivedCharacterCore,
} from '@/lib/characters/derived'
import {
  buildFeatureOptionChoicesFromDefinitionMap,
  buildMaverickFeatureOptionChoices,
  buildTypedFeatureSpellChoices,
  getFeatureOptionChoiceValue,
  getFightingStyleFeatureOptionDefinition,
  getMaverickArcaneBreakthroughOptionDefinitions,
  getMaverickFeatureSpellChoiceDefinitions,
  getSubclassFeatureOptionDefinitions,
  getSpeciesFeatureOptionDefinitions,
  getSpeciesFeatureSpellChoiceDefinitions,
  getSelectedMaverickBreakthroughClassIds,
  filterFeatureOptionChoicesByActiveDefinitions,
  isInteractiveFeatureSpellSourceFeatureKey,
  MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY,
} from '@/lib/characters/feature-grants'
import { buildTypedFeatSpellChoices, getFeatSpellChoiceDefinitions } from '@/lib/characters/feat-spell-options'
import {
  ARTIFICER_CLASS_NAME,
  ARTIFICER_INFUSION_GROUP_KEY,
  getArtificerInfusionOptionDefinitions,
} from '@/lib/characters/infusions'
import { buildSpeciesAbilityBonusMap, type AbilityKey as SpeciesChoiceAbilityKey } from '@/lib/characters/species-ability-bonus-provenance'
import type { AsiSelection } from '@/lib/characters/asi-provenance'
import type { CharacterWithRelations } from '@/lib/characters/load-character'
import type { FeatureOptionChoiceInput } from '@/lib/characters/choice-persistence'
import type {
  Species, Background,
  CharacterFeatureOptionChoice,
  CharacterFeatChoice,
  CharacterEquipmentItem,
  CharacterLanguageChoice,
  CharacterSkillProficiency,
  CharacterSpellSelection,
  CharacterToolChoice,
  Class, Subclass, Feat, Alignment, StatMethod, AbilityScoreBonus,
  Campaign,
  FeatureOption,
  Language,
  Tool,
} from '@/lib/types/database'
import type { ArmorCatalogEntry, ShieldCatalogEntry } from '@/lib/content/equipment-content'
import type { LegalityResult } from '@/lib/legality/engine'
import type { SpellOption } from '@/lib/characters/wizard-helpers'

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

interface CharacterSheetProps {
  character: CharacterWithRelations
  campaignId: string
  initialSkillProficiencies?: string[]
  initialTypedSkillProficiencies?: CharacterSkillProficiency[]
  initialAbilityBonusChoices?: SpeciesChoiceAbilityKey[]
  initialAsiChoices?: AsiSelection[]
  initialLanguageChoices?: string[]
  initialTypedLanguageChoices?: CharacterLanguageChoice[]
  initialToolChoices?: string[]
  initialTypedToolChoices?: CharacterToolChoice[]
  initialSpellChoices?: string[]
  initialSpellSelections?: CharacterSpellSelection[]
  initialSelectedSpells?: SpellOption[]
  initialFeatChoices?: string[]
  initialTypedFeatChoices?: CharacterFeatChoice[]
  initialFeatureOptionChoices?: CharacterFeatureOptionChoice[]
  initialEquipmentItems?: CharacterEquipmentItem[]
  initialLegalityResult?: LegalityResult | null
  readOnly?: boolean
  isDm?: boolean
}

type SectionId = 'identity-class' | 'stats-skills' | 'spells-feats' | 'hp-notes'

type DmAuditContentSource = {
  id: string
  kind: string
  label: string
  source: string | null
  amended: boolean
  amendmentNote: string | null
}

type DmAuditProvenanceEntry = {
  id: string
  label: string
  source: string
  anchor: string
  detail: string | null
}

type DmAuditProvenanceGroup = {
  id: string
  label: string
  entries: DmAuditProvenanceEntry[]
}

function addAuditContentSource(
  sources: DmAuditContentSource[],
  entry: Omit<DmAuditContentSource, 'id'>
) {
  const id = `${entry.kind}:${entry.label}:${entry.source ?? 'unknown'}`
  if (sources.some((source) => source.id === id)) return
  sources.push({ ...entry, id })
}

function auditSourceLabel(category: string | null | undefined, entityId: string | null | undefined) {
  const source = category && category.trim().length > 0 ? category.replace(/_/g, ' ') : 'unknown source'
  return entityId ? `${source} ${entityId}` : source
}

function auditAnchorLabel(
  characterLevelId: string | null | undefined,
  anchors: Array<{ id: string; class_id: string; level_number: number }>,
  classNamesById: Map<string, string>
) {
  if (!characterLevelId) return 'Unanchored'
  const anchor = anchors.find((row) => row.id === characterLevelId)
  if (!anchor) return `Missing anchor ${characterLevelId}`
  return `${classNamesById.get(anchor.class_id) ?? anchor.class_id} ${anchor.level_number}`
}

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
      className={`surface-section transition-all ${
        highlighted
          ? 'border-blue-400/30 ring-2 ring-blue-400/20'
          : 'border-white/10'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-neutral-400">{subtitle}</p>}
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="space-y-4 border-t border-white/8 bg-neutral-950/40 p-4 sm:p-5">{children}</div>}
    </section>
  )
}

function canonicalizeFeatureOptionsForDerived(
  choices: FeatureOptionChoiceInput[]
) {
  return choices.map((choice) => ({
    option_group_key: choice.option_group_key,
    selected_value: choice.selected_value ?? {},
  }))
}

function abilityLabel(ability: string | null) {
  return ability ? ability.toUpperCase() : 'None'
}

function spellLevelLabel(level: number) {
  return level === 0 ? 'Cantrip' : `Level ${level}`
}

function SpellPillList({
  spells,
  empty,
  granted = false,
}: {
  spells: Array<{
    id: string
    name: string
    level: number
    source: string
    grantLabel: string | null
  }>
  empty: string
  granted?: boolean
}) {
  if (spells.length === 0) {
    return <p className="text-sm text-neutral-500">{empty}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {spells.map((spell) => (
        <span
          key={`${spell.id}-${spell.grantLabel ?? 'selected'}`}
          className={`rounded-full border px-3 py-1 text-xs ${
            granted
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
              : 'border-white/10 bg-white/[0.03] text-neutral-300'
          }`}
        >
          {spell.name} ({spellLevelLabel(spell.level)})
          {granted && spell.grantLabel ? ` · ${spell.grantLabel}` : ''}
        </span>
      ))}
    </div>
  )
}

function FeatureList({
  features,
}: {
  features: Array<{
    classId: string
    className: string
    level: number
    name: string
    sourceLabel: string
    sourceType: 'class' | 'subclass'
    description: string | null
  }>
}) {
  if (features.length === 0) {
    return <p className="text-sm text-neutral-500">No class features unlocked yet.</p>
  }

  const grouped = features.reduce<Record<string, typeof features>>((acc, feature) => {
    const key = `${feature.classId}:${feature.level}`
    acc[key] = [...(acc[key] ?? []), feature]
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([key, entries]) => {
        const first = entries[0]
        if (!first) return null
        return (
          <div key={key} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              {first.className} {first.level}
            </p>
            <div className="mt-2 space-y-3">
              {entries.map((feature) => (
                <div key={`${feature.classId}-${feature.level}-${feature.name}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-neutral-100">{feature.name}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-neutral-400">
                      {feature.sourceLabel}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-neutral-400">
                      {feature.sourceType}
                    </span>
                  </div>
                  {feature.description && (
                    <p className="mt-1 text-sm leading-6 text-neutral-400">{feature.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ClassResourcesPanel({
  resources,
}: {
  resources: Array<{
    id: string
    label: string
    value: string
    detail: string
    recharge: string | null
    sourceLabel: string
  }>
}) {
  if (resources.length === 0) {
    return <p className="text-sm text-neutral-500">No class resources are currently tracked.</p>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resources.map((resource) => (
        <div key={resource.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-100">{resource.label}</p>
              <p className="mt-1 text-xs text-neutral-500">{resource.sourceLabel}</p>
            </div>
            <p className="text-right text-sm font-semibold text-neutral-100">{resource.value}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-400">{resource.detail}</p>
          {resource.recharge && (
            <p className="mt-2 text-xs text-neutral-500">Refresh: {resource.recharge}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function AsiFeatHistoryPanel({
  entries,
}: {
  entries: Array<{
    id: string
    type: 'asi' | 'feat'
    label: string
    detail: string
    className: string | null
    levelNumber: number | null
  }>
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-500">No ASI or feat choices have been recorded yet.</p>
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-neutral-100">{entry.label}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${
                entry.type === 'feat'
                  ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
                  : 'border-blue-300/20 bg-blue-300/10 text-blue-100'
              }`}>
                {entry.type === 'feat' ? 'Feat' : 'ASI'}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">{entry.detail}</p>
          </div>
          <p className="shrink-0 text-left text-xs text-neutral-500 sm:text-right">
            {entry.className && entry.levelNumber !== null
              ? `${entry.className} ${entry.levelNumber}`
              : 'Unanchored'}
          </p>
        </div>
      ))}
    </div>
  )
}

function CombatOptionsPanel({
  actions,
}: {
  actions: Array<{
    id: string
    name: string
    category: 'maneuver' | 'hunter' | 'discipline' | 'trait'
    sourceLabel: string
    trigger: string | null
    effect: string
    cost: string | null
    saveDc: number | null
  }>
}) {
  if (actions.length === 0) {
    return <p className="text-sm text-neutral-500">No combat options are currently surfaced from selected features.</p>
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {actions.map((action) => (
        <div key={action.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-neutral-100">{action.name}</p>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-neutral-400">
              {action.sourceLabel}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-400">{action.effect}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {action.trigger && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-neutral-300">
                Trigger: {action.trigger}
              </span>
            )}
            {action.cost && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-neutral-300">
                Cost: {action.cost}
              </span>
            )}
            {action.saveDc !== null && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-neutral-300">
                Save DC {action.saveDc}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function DmAuditPanel({
  sources,
  checks,
  groups,
  onJumpToCheck,
}: {
  sources: DmAuditContentSource[]
  checks: LegalityResult['checks']
  groups: DmAuditProvenanceGroup[]
  onJumpToCheck: (key: string) => void
}) {
  const failedChecks = checks.filter((check) => !check.passed)

  return (
    <details className="surface-section px-4 py-3">
      <summary className="cursor-pointer list-none marker:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-100">DM Audit</p>
            <p className="mt-1 text-sm text-neutral-400">
              Sources, legality, and choice history for review.
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs ${
            failedChecks.some((check) => check.severity === 'error')
              ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
              : failedChecks.length > 0
                ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
                : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
          }`}>
            {failedChecks.length === 0 ? 'No active issues' : `${failedChecks.length} to review`}
          </span>
        </div>
      </summary>
      <CardHeader>
        <CardTitle className="text-sm text-neutral-100">Review detail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Selected Sources</p>
          {sources.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">No selected content sources are loaded yet.</p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {sources.map((source) => (
                <div key={source.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-neutral-100">{source.label}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-neutral-400">
                      {source.kind}
                    </span>
                    {source.source && (
                      <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-2 py-0.5 text-[10px] text-blue-100">
                        {source.source}
                      </span>
                    )}
                    {source.amended && (
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-100">
                        Amended
                      </span>
                    )}
                  </div>
                  {source.amendmentNote && (
                    <p className="mt-2 text-xs leading-5 text-amber-100/80">{source.amendmentNote}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Legality and Open Issues</p>
          {failedChecks.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">No unresolved legality warnings or blockers.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {failedChecks.map((check) => (
                <button
                  key={check.key}
                  type="button"
                  onClick={() => onJumpToCheck(check.key)}
                  className="block w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-blue-300/30 hover:bg-blue-300/10"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      check.severity === 'error'
                        ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
                        : 'border-amber-300/20 bg-amber-300/10 text-amber-100'
                    }`}>
                      {check.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">{check.message}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Provenance Tree</p>
          <div className="mt-2 space-y-2">
            {groups.map((group) => (
              <details className="surface-row px-3 py-2.5" key={group.id}>
                <summary className="cursor-pointer text-sm font-medium text-neutral-100">
                  {group.label} ({group.entries.length})
                </summary>
                {group.entries.length === 0 ? (
                  <p className="mt-2 text-sm text-neutral-500">No persisted rows.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {group.entries.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-white/10 bg-neutral-950/40 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm text-neutral-100">{entry.label}</p>
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-neutral-400">
                            {entry.anchor}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">{entry.source}</p>
                        {entry.detail && <p className="mt-1 text-xs leading-5 text-neutral-400">{entry.detail}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </details>
            ))}
          </div>
        </div>
      </CardContent>
    </details>
  )
}

// ── Component ─────────────────────────────────────────────

export function CharacterSheet({
  character: initial,
  campaignId,
  initialSkillProficiencies = [],
  initialTypedSkillProficiencies = [],
  initialAbilityBonusChoices = [],
  initialAsiChoices = [],
  initialLanguageChoices = [],
  initialTypedLanguageChoices = [],
  initialToolChoices = [],
  initialTypedToolChoices = [],
  initialSelectedSpells = [],
  initialSpellSelections = [],
  initialFeatChoices = [],
  initialTypedFeatChoices = [],
  initialFeatureOptionChoices = [],
  initialEquipmentItems = [],
  initialLegalityResult = null,
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
  const [levels, setLevels] = useState<Array<{ class_id: string; level: number; subclass_id: string | null; hp_roll: number | null }>>
    (initial.character_levels.map((l) => ({
      class_id: l.class_id,
      level: l.level,
      subclass_id: l.subclass_id,
      hp_roll: l.hp_roll,
    })))

  // Content options
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [backgroundList, setBackgroundList] = useState<Background[]>([])
  const [classList, setClassList] = useState<Class[]>([])
  const [subclassMap, setSubclassMap] = useState<Record<string, Subclass[]>>({})
  const [featList, setFeatList] = useState<Feat[]>([])
  const [languageList, setLanguageList] = useState<Language[]>([])
  const [toolList, setToolList] = useState<Tool[]>([])
  const [armorCatalog, setArmorCatalog] = useState<ArmorCatalogEntry[]>([])
  const [shieldCatalog, setShieldCatalog] = useState<ShieldCatalogEntry[]>([])
  const [featureOptionRows, setFeatureOptionRows] = useState<FeatureOption[]>([])
  const [spellOptions, setSpellOptions] = useState<SpellOption[]>(initialSelectedSpells)

  const [skillProficiencies, setSkillProficiencies] = useState<string[]>(initialSkillProficiencies)
  const [abilityBonusChoices, setAbilityBonusChoices] = useState<SpeciesChoiceAbilityKey[]>(initialAbilityBonusChoices)
  const [asiChoices, setAsiChoices] = useState<AsiSelection[]>(initialAsiChoices)
  const [languageChoices, setLanguageChoices] = useState<string[]>(initialLanguageChoices)
  const [toolChoices, setToolChoices] = useState<string[]>(initialToolChoices)
  const [spellChoices, setSpellChoices] = useState<string[]>(
    initialSelectedSpells
      .filter((spell) => !isInteractiveFeatureSpellSourceFeatureKey(spell.source_feature_key))
      .map((spell) => spell.id)
  )
  const [featChoices, setFeatChoices] = useState<string[]>(initialFeatChoices)
  const [featureOptionChoices, setFeatureOptionChoices] = useState<FeatureOptionChoiceInput[]>(
    initialFeatureOptionChoices.map((choice) => ({
      option_group_key: choice.option_group_key,
      option_key: choice.option_key,
      selected_value: choice.selected_value,
      choice_order: choice.choice_order,
      character_level_id: choice.character_level_id,
      source_category: choice.source_category,
      source_entity_id: choice.source_entity_id,
      source_feature_key: choice.source_feature_key,
    }))
  )
  const [featSpellChoices, setFeatSpellChoices] = useState<Record<string, string>>(
    Object.fromEntries(
      initialSelectedSpells.flatMap((spell) => {
        if (!spell.source_feature_key?.startsWith('feat_spell:')) return []
        return [[spell.source_feature_key, spell.id] as const]
      })
    )
  )
  const [featureSpellChoices, setFeatureSpellChoices] = useState<Record<string, string>>(
    Object.fromEntries(
      initialSelectedSpells.flatMap((spell) => {
        if (!spell.source_feature_key?.startsWith('feature_spell:')) return []
        return [[spell.source_feature_key, spell.id] as const]
      })
    )
  )

  // UI state
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [legalityResult, setLegalityResult] = useState<LegalityResult | null>(initialLegalityResult)
  const [status, setStatus] = useState(initial.status)
  const [updatedAt, setUpdatedAt] = useState(initial.updated_at)
  const [dmNotes, setDmNotes] = useState(initial.dm_notes ?? '')
  const [highlightedSection, setHighlightedSection] = useState<SectionId | null>(null)
  const highlightTimerRef = useRef<number | null>(null)
  const initialFightingStyleKeys = useMemo(
    () => new Set(
      initialFeatureOptionChoices
        .filter((choice) => choice.option_group_key.startsWith('fighting_style:'))
        .map((choice) => `${choice.option_group_key}:${choice.option_key}`)
    ),
    [initialFeatureOptionChoices]
  )
  const initialSubclassFeatureOptionKeys = useMemo(
    () => new Set(
      initialFeatureOptionChoices
        .filter((choice) => (
          choice.option_group_key === 'maneuver:battle_master:2014'
          || choice.option_group_key.startsWith('hunter:')
          || choice.option_group_key === 'circle_of_land:terrain:2014'
          || choice.option_group_key === 'elemental_discipline:four_elements:2014'
        ))
        .map((choice) => `${choice.option_group_key}:${choice.option_key}`)
    ),
    [initialFeatureOptionChoices]
  )

  // Load content options filtered by campaign allowlist
  useEffect(() => {
    const qs = `?campaign_id=${campaignId}`
    Promise.all([
      fetch(`/api/content/species${qs}`).then((r) => r.json()),
      fetch(`/api/content/backgrounds${qs}`).then((r) => r.json()),
      fetch(`/api/content/classes${qs}`).then((r) => r.json()),
      fetch(`/api/content/feats${qs}`).then((r) => r.json()),
      fetch(`/api/content/languages${qs}`).then((r) => r.json()),
      fetch(`/api/content/tools${qs}`).then((r) => r.json()),
      fetch(`/api/content/armor${qs}`).then((r) => r.json()),
      fetch(`/api/content/shields${qs}`).then((r) => r.json()),
      fetch(`/api/content/feature-options${qs}`).then((r) => r.json()),
    ]).then(([s, b, c, f, languages, tools, armor, shields, featureOptions]) => {
      setSpeciesList(s)
      setBackgroundList(b)
      setClassList(c)
      setFeatList(Array.isArray(f) ? f : [])
      setLanguageList(Array.isArray(languages) ? languages : [])
      setToolList(Array.isArray(tools) ? tools : [])
      setArmorCatalog(Array.isArray(armor) ? armor : [])
      setShieldCatalog(Array.isArray(shields) ? shields : [])
      setFeatureOptionRows(Array.isArray(featureOptions) ? featureOptions : [])
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

  const firstClassId = levels[0]?.class_id
  const firstClassLevel = levels[0]?.level ?? 0
  const firstClassSubclassIds = useMemo(
    () => levels
      .filter((level) => level.class_id === firstClassId && level.subclass_id)
      .map((level) => level.subclass_id as string),
    [firstClassId, levels]
  )
  const maverickBreakthroughClassIds = useMemo(
    () => getSelectedMaverickBreakthroughClassIds(featureOptionChoices),
    [featureOptionChoices]
  )

  useEffect(() => {
    const primaryClass = classList.find((cls) => cls.id === firstClassId) ?? null
    if (!campaignId || !firstClassId || !primaryClass?.spellcasting_type || primaryClass.spellcasting_type === 'none') {
      setSpellOptions(initialSelectedSpells)
      return
    }

    const params = new URLSearchParams({
      class_id: firstClassId,
      campaign_id: campaignId,
      class_level: String(firstClassLevel),
    })
    if (speciesId) params.set('species_id', speciesId)
    for (const subclassId of firstClassSubclassIds) params.append('subclass_id', subclassId)
    for (const expandedClassId of maverickBreakthroughClassIds.filter(Boolean)) {
      params.append('expanded_class_id', expandedClassId)
    }

    fetch(`/api/content/spells?${params.toString()}`)
      .then((response) => response.json())
      .then((data: SpellOption[]) => {
        const mergedById = new Map<string, SpellOption>()
        for (const spell of initialSelectedSpells) mergedById.set(spell.id, spell)
        for (const spell of Array.isArray(data) ? data : []) mergedById.set(spell.id, spell)
        setSpellOptions((current) => {
          const next = Array.from(mergedById.values())
          if (
            current.length === next.length
            && current.every((spell, index) => spell.id === next[index]?.id)
          ) {
            return current
          }
          return next
        })
      })
  }, [
    campaignId,
    classList,
    firstClassId,
    firstClassLevel,
    firstClassSubclassIds,
    initialSelectedSpells,
    maverickBreakthroughClassIds,
    speciesId,
  ])

  function handleStatChange(stat: string, value: number) {
    setStats((prev) => ({ ...prev, [stat]: value }))
  }

  function addLevel() {
    if (classList.length === 0) return
    setLevels((prev) => [...prev, { class_id: classList[0].id, level: 1, subclass_id: null, hp_roll: null }])
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
      const canonicalFeatureOptionChoices = [
        ...featureOptionChoices.filter((choice) => (
          !choice.option_group_key.startsWith('species:')
          && choice.option_group_key !== 'maneuver:battle_master:2014'
          && !choice.option_group_key.startsWith('hunter:')
          && choice.option_group_key !== 'circle_of_land:terrain:2014'
          && choice.option_group_key !== 'elemental_discipline:four_elements:2014'
          && choice.option_group_key !== MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY
          && !choice.option_group_key.startsWith('maverick:breakthrough:')
        )),
        ...buildFeatureOptionChoicesFromDefinitionMap({
          definitions: speciesOptionDefinitions,
          selectedValues: Object.fromEntries(
            speciesOptionDefinitions.map((definition) => [
              definition.optionKey,
              getFeatureOptionChoiceValue(
                featureOptionChoices,
                definition.optionGroupKey,
                definition.optionKey,
                definition.valueKey ?? 'class_id'
              ) ?? '',
            ])
          ),
        }),
        ...buildFeatureOptionChoicesFromDefinitionMap({
          definitions: subclassFeatureOptionDefinitions,
          selectedValues: Object.fromEntries(
            subclassFeatureOptionDefinitions.map((definition) => [
              definition.optionKey,
              getFeatureOptionChoiceValue(
                featureOptionChoices,
                definition.optionGroupKey,
                definition.optionKey,
                definition.valueKey ?? 'class_id'
              ) ?? '',
            ])
          ),
        }),
        ...buildMaverickFeatureOptionChoices({
          selectedClassIds: maverickBreakthroughClassIds,
          definitions: maverickOptionDefinitions,
        }),
      ]

      const res = await fetch(`/api/characters/${initial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_updated_at: updatedAt,
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
          skill_proficiencies: buildTypedSkillProficiencies({
            skillProficiencies,
            background: selectedBackground,
            selectedClass,
            species: selectedSpecies,
          }),
          ability_bonus_choices: buildTypedAbilityBonusChoices(
            selectedSpecies,
            abilityBonusChoices
          ),
          asi_choices: buildTypedAsiChoices(
            asiChoices,
            derivedProgression?.featSlots,
            featChoices
          ),
          language_choices: buildTypedLanguageChoices({
            languageChoices,
            background: selectedBackground,
            species: selectedSpecies,
          }),
          tool_choices: buildTypedToolChoices({
            toolChoices,
            selectedClass,
            species: selectedSpecies,
          }),
          feature_option_choices: canonicalFeatureOptionChoices,
          spell_choices: [
            ...buildTypedSpellChoices({
              spellChoices,
              spellOptions,
              owningClassId: firstClassId ?? null,
              activeSubclassIds: firstClassSubclassIds,
              derived: derivedCharacter,
            }),
            ...buildTypedFeatSpellChoices({
              featSpellChoices,
              definitions: featSpellDefinitions,
            }),
            ...buildTypedFeatureSpellChoices({
              selectedChoices: featureSpellChoices,
              definitions: featureSpellDefinitions,
            }),
          ],
          feat_choices: buildTypedFeatChoices(featChoices, derivedProgression?.featSlots),
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
      setUpdatedAt(json.character.updated_at)
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

  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.draft

  // Racial bonuses from the currently selected species
  const selectedSpecies =
    speciesList.find((s) => s.id === speciesId) ??
    (initial.species?.id === speciesId ? initial.species : null)
  const selectedBackground =
    backgroundList.find((b) => b.id === backgroundId) ??
    (initial.background?.id === backgroundId ? initial.background : null)
  const racialBonuses: Partial<Record<string, number>> = {}
  if (selectedSpecies?.ability_score_bonuses) {
    ;(selectedSpecies.ability_score_bonuses as AbilityScoreBonus[]).forEach(({ ability, bonus }) => {
      racialBonuses[ability] = (racialBonuses[ability] ?? 0) + bonus
    })
  }
  const chosenSpeciesBonuses = buildSpeciesAbilityBonusMap(selectedSpecies, abilityBonusChoices)
  ;(Object.entries(chosenSpeciesBonuses) as Array<[string, number]>).forEach(([ability, bonus]) => {
    racialBonuses[ability] = (racialBonuses[ability] ?? 0) + bonus
  })
  const chosenAsiBonuses = asiChoices.reduce<Record<string, number>>((acc, selection, slotIndex) => {
    if ((featChoices[slotIndex] ?? '').length > 0) return acc
    for (const ability of selection) {
      acc[ability] = (acc[ability] ?? 0) + 1
    }
    return acc
  }, {})
  ;(Object.entries(chosenAsiBonuses) as Array<[string, number]>).forEach(([ability, bonus]) => {
    racialBonuses[ability] = (racialBonuses[ability] ?? 0) + bonus
  })
  const abilityContributors: DerivedAbilityScoreContributor[] = [
    ...abilityBonusMapToContributors(
      (selectedSpecies?.ability_score_bonuses ?? []).reduce<Partial<Record<SpeciesChoiceAbilityKey, number>>>((acc, entry) => {
        acc[entry.ability] = (acc[entry.ability] ?? 0) + entry.bonus
        return acc
      }, {}),
      selectedSpecies ? `${selectedSpecies.name} ability bonus` : 'Species ability bonus',
      'species'
    ),
    ...abilityBonusMapToContributors(
      chosenSpeciesBonuses,
      selectedSpecies ? `${selectedSpecies.name} flexible bonus` : 'Species flexible bonus',
      'species_choice'
    ),
    ...asiChoices.flatMap((selection, slotIndex) => {
      if ((featChoices[slotIndex] ?? '').length > 0) return []
      const bonusByAbility = selection.reduce<Partial<Record<SpeciesChoiceAbilityKey, number>>>((acc, ability) => {
        acc[ability] = (acc[ability] ?? 0) + 1
        return acc
      }, {})
      const slotLabel = `slot ${slotIndex + 1}`
      return abilityBonusMapToContributors(bonusByAbility, `ASI ${slotIndex + 1} (${slotLabel})`, 'asi')
    }),
  ]
  // First class (used for skill choices and saving throws)
  const selectedClass = classList.find((c) => c.id === firstClassId) ?? null
  const selectedBackgroundFeat = selectedBackground?.background_feat_id
    ? (featList.find((feat) => feat.id === selectedBackground.background_feat_id) ?? null)
    : null
  const activeSubclasses = useMemo(
    () => levels.flatMap((level) => {
      if (!level.subclass_id) return []
      const subclass = (subclassMap[level.class_id] ?? []).find((entry) => entry.id === level.subclass_id) ?? null
      return subclass ? [subclass] : []
    }),
    [levels, subclassMap]
  )
  const activeFeats = useMemo(() => {
    const selectedFeatRows = featChoices
      .map((featId) => featList.find((feat) => feat.id === featId))
      .filter((feat): feat is Feat => Boolean(feat))
    return Array.from(new Map(
      [...selectedFeatRows, ...(selectedBackgroundFeat ? [selectedBackgroundFeat] : [])].map((feat) => [feat.id, feat])
    ).values())
  }, [featChoices, featList, selectedBackgroundFeat])
  const featSpellDefinitions = useMemo(
    () => getFeatSpellChoiceDefinitions(activeFeats),
    [activeFeats]
  )
  const fightingStyleDefinitions = useMemo(() => {
    const maxLevelByClassId = new Map<string, number>()
    for (const level of levels) {
      maxLevelByClassId.set(level.class_id, Math.max(maxLevelByClassId.get(level.class_id) ?? 0, level.level))
    }

    return Array.from(maxLevelByClassId.entries()).flatMap(([classId, classLevel]) => {
      const classDetail = classList.find((entry) => entry.id === classId) ?? null
      return getFightingStyleFeatureOptionDefinition({
        classId,
        className: classDetail?.name ?? null,
        classLevel,
        optionRows: featureOptionRows,
      }).map((definition) => ({
        ...definition,
        optionKey: `${classId}:style`,
      }))
    })
  }, [classList, featureOptionRows, levels])
  const maverickOptionDefinitions = useMemo(
    () => getMaverickArcaneBreakthroughOptionDefinitions({
      classLevel: firstClassLevel,
      subclassId: firstClassSubclassIds[0] ?? null,
      optionRows: featureOptionRows,
    }),
    [featureOptionRows, firstClassLevel, firstClassSubclassIds]
  )
  const subclassFeatureOptionDefinitions = useMemo(
    () => levels.flatMap((level) => {
      const subclass = level.subclass_id
        ? (subclassMap[level.class_id] ?? []).find((entry) => entry.id === level.subclass_id) ?? null
        : null
      return getSubclassFeatureOptionDefinitions({
        classId: level.class_id,
        classLevel: level.level,
        subclassId: subclass?.id ?? null,
        subclassName: subclass?.name ?? null,
        subclassSource: subclass?.source ?? null,
        optionRows: featureOptionRows,
      })
    }),
    [featureOptionRows, levels, subclassMap]
  )
  const artificerInfusionDefinitions = useMemo(
    () => {
      const maxLevelByClassId = new Map<string, number>()
      for (const level of levels) {
        maxLevelByClassId.set(level.class_id, Math.max(maxLevelByClassId.get(level.class_id) ?? 0, level.level))
      }
      return Array.from(maxLevelByClassId.entries()).flatMap(([classId, classLevel]) => {
        const classDetail = classList.find((entry) => entry.id === classId) ?? null
        if (classDetail?.name !== ARTIFICER_CLASS_NAME) return []
        return getArtificerInfusionOptionDefinitions({
          classId,
          artificerLevel: classLevel,
          optionRows: featureOptionRows,
        })
      })
    },
    [classList, featureOptionRows, levels]
  )
  const maverickFeatureSpellDefinitions = useMemo(
    () => getMaverickFeatureSpellChoiceDefinitions({
      classLevel: firstClassLevel,
      artificerClassId: firstClassId ?? null,
      selectedBreakthroughClassIds: maverickBreakthroughClassIds,
      classList,
    }),
    [classList, firstClassId, firstClassLevel, maverickBreakthroughClassIds]
  )
  const speciesOptionDefinitions = useMemo(
    () => getSpeciesFeatureOptionDefinitions({ species: selectedSpecies }),
    [selectedSpecies]
  )
  const speciesFeatureSpellDefinitions = useMemo(
    () => getSpeciesFeatureSpellChoiceDefinitions({ species: selectedSpecies }),
    [selectedSpecies]
  )
  const featureSpellDefinitions = useMemo(
    () => [...speciesFeatureSpellDefinitions, ...maverickFeatureSpellDefinitions],
    [maverickFeatureSpellDefinitions, speciesFeatureSpellDefinitions]
  )

  useEffect(() => {
    const activeKeys = new Set(
      fightingStyleDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !choice.option_group_key.startsWith('fighting_style:')
      || initialFightingStyleKeys.has(`${choice.option_group_key}:${choice.option_key}`)
      || activeKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [fightingStyleDefinitions, initialFightingStyleKeys])

  useEffect(() => {
    const activeKeys = new Set(
      speciesOptionDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !choice.option_group_key.startsWith('species:')
      || activeKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [speciesOptionDefinitions])

  useEffect(() => {
    const activeKeys = new Set(
      subclassFeatureOptionDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !(
        choice.option_group_key === 'maneuver:battle_master:2014'
        || choice.option_group_key.startsWith('hunter:')
        || choice.option_group_key === 'circle_of_land:terrain:2014'
        || choice.option_group_key === 'elemental_discipline:four_elements:2014'
      )
      || initialSubclassFeatureOptionKeys.has(`${choice.option_group_key}:${choice.option_key}`)
      || activeKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [initialSubclassFeatureOptionKeys, subclassFeatureOptionDefinitions])

  useEffect(() => {
    setFeatureOptionChoices((prev) => filterFeatureOptionChoicesByActiveDefinitions({
      choices: prev,
      optionGroupKey: ARTIFICER_INFUSION_GROUP_KEY,
      definitions: artificerInfusionDefinitions,
    }))
  }, [artificerInfusionDefinitions])

  useEffect(() => {
    const hasCanonicalMaverickChoices = featureOptionChoices.some(
      (choice) => choice.option_group_key === MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY
    )
    const hasLegacyMaverickChoices = featureOptionChoices.some(
      (choice) => choice.option_group_key.startsWith('maverick:breakthrough:')
    )

    if (hasCanonicalMaverickChoices || !hasLegacyMaverickChoices || maverickOptionDefinitions.length === 0) {
      return
    }

    setFeatureOptionChoices((prev) => [
      ...prev.filter((choice) => !choice.option_group_key.startsWith('maverick:breakthrough:')),
      ...buildMaverickFeatureOptionChoices({
        selectedClassIds: maverickBreakthroughClassIds,
        definitions: maverickOptionDefinitions,
      }),
    ])
  }, [featureOptionChoices, maverickBreakthroughClassIds, maverickOptionDefinitions])

  useEffect(() => {
    const activeKeys = new Set(featureSpellDefinitions.map((definition) => definition.sourceFeatureKey))
    setFeatureSpellChoices((prev) => Object.fromEntries(
      Object.entries(prev).filter(([sourceFeatureKey]) => activeKeys.has(sourceFeatureKey))
    ))
  }, [featureSpellDefinitions])

  const failedChecks = legalityResult?.checks.filter((c) => !c.passed) ?? []
  const serverDerivedCharacter = legalityResult?.derived ?? null
  const serverDerivedProgression = legalityResult?.derived ?? null
  const localTypedSkillRows = useMemo(
    () => buildTypedSkillProficiencies({
      skillProficiencies,
      background: selectedBackground,
      selectedClass,
      species: selectedSpecies,
    }).flatMap((row) => typeof row === 'string' ? [] : [{
      character_id: initial.id,
      skill: row.skill,
      expertise: row.expertise ?? false,
      character_level_id: row.character_level_id ?? null,
      source_category: row.source_category ?? 'manual',
      source_entity_id: row.source_entity_id ?? null,
      source_feature_key: row.source_feature_key ?? null,
    }] satisfies CharacterSkillProficiency[]),
    [initial.id, selectedBackground, selectedClass, selectedSpecies, skillProficiencies]
  )
  const useInitialTypedSkillRows = skillProficiencies.length === initialSkillProficiencies.length
    && skillProficiencies.every((skill, index) => skill === initialSkillProficiencies[index])
  const skillSourceRows = useInitialTypedSkillRows ? initialTypedSkillProficiencies : localTypedSkillRows
  const localTypedLanguageRows = useMemo(
    () => buildTypedLanguageChoices({
      languageChoices,
      background: selectedBackground,
      species: selectedSpecies,
    }).flatMap((row) => typeof row === 'string' ? [] : [{
      character_id: initial.id,
      language: row.language,
      language_key: null,
      character_level_id: row.character_level_id ?? null,
      source_category: row.source_category ?? 'manual',
      source_entity_id: row.source_entity_id ?? null,
      source_feature_key: row.source_feature_key ?? null,
      created_at: '',
    }]),
    [initial.id, languageChoices, selectedBackground, selectedSpecies]
  )
  const useInitialTypedLanguageRows = languageChoices.length === initialLanguageChoices.length
    && languageChoices.every((language, index) => language === initialLanguageChoices[index])
  const languageSourceRows = useInitialTypedLanguageRows ? initialTypedLanguageChoices : localTypedLanguageRows
  const localTypedToolRows = useMemo(
    () => buildTypedToolChoices({
      toolChoices,
      selectedClass,
      species: selectedSpecies,
    }).flatMap((row) => typeof row === 'string' ? [] : [{
      character_id: initial.id,
      tool: row.tool,
      tool_key: null,
      character_level_id: row.character_level_id ?? null,
      source_category: row.source_category ?? 'manual',
      source_entity_id: row.source_entity_id ?? null,
      source_feature_key: row.source_feature_key ?? null,
      created_at: '',
    }]),
    [initial.id, selectedClass, selectedSpecies, toolChoices]
  )
  const useInitialTypedToolRows = toolChoices.length === initialToolChoices.length
    && toolChoices.every((tool, index) => tool === initialToolChoices[index])
  const toolSourceRows = useInitialTypedToolRows ? initialTypedToolChoices : localTypedToolRows
  const selectedSpellNames = useMemo(
    () => Array.from(new Set([
      ...initialSelectedSpells
        .filter((spell) => spellChoices.includes(spell.id) || spell.source_feature_key?.startsWith('feature_spell:') || spell.source_feature_key?.startsWith('feat_spell:'))
        .map((spell) => spell.name),
      ...spellOptions
        .filter((spell) => spellChoices.includes(spell.id))
        .map((spell) => spell.name),
    ])),
    [initialSelectedSpells, spellChoices, spellOptions]
  )
  const sheetIsDirty = useMemo(() => {
    const initialState = {
      stats: {
        str: initial.base_str,
        dex: initial.base_dex,
        con: initial.base_con,
        int: initial.base_int,
        wis: initial.base_wis,
        cha: initial.base_cha,
      },
      hpMax: initial.hp_max,
      speciesId: initial.species_id ?? '',
      backgroundId: initial.background_id ?? '',
      levels: initial.character_levels.map((level) => ({
        class_id: level.class_id,
        level: level.level,
        subclass_id: level.subclass_id,
        hp_roll: level.hp_roll,
      })),
      skillProficiencies: initialSkillProficiencies,
      abilityBonusChoices: initialAbilityBonusChoices,
      asiChoices: initialAsiChoices,
      languageChoices: initialLanguageChoices,
      toolChoices: initialToolChoices,
      spellChoices: initialSelectedSpells
        .filter((spell) => !isInteractiveFeatureSpellSourceFeatureKey(spell.source_feature_key))
        .map((spell) => spell.id),
      featChoices: initialFeatChoices,
      featureOptionChoices: initialFeatureOptionChoices.map((choice) => ({
        option_group_key: choice.option_group_key,
        option_key: choice.option_key,
        selected_value: choice.selected_value,
        choice_order: choice.choice_order,
        character_level_id: choice.character_level_id,
        source_category: choice.source_category,
        source_entity_id: choice.source_entity_id,
        source_feature_key: choice.source_feature_key,
      })),
    }
    const currentState = {
      stats,
      hpMax,
      speciesId,
      backgroundId,
      levels,
      skillProficiencies,
      abilityBonusChoices,
      asiChoices,
      languageChoices,
      toolChoices,
      spellChoices,
      featChoices,
      featureOptionChoices,
    }
    return JSON.stringify(currentState) !== JSON.stringify(initialState)
  }, [
    abilityBonusChoices,
    asiChoices,
    backgroundId,
    featChoices,
    featureOptionChoices,
    hpMax,
    initial.base_cha,
    initial.base_con,
    initial.base_dex,
    initial.base_int,
    initial.base_str,
    initial.base_wis,
    initial.background_id,
    initial.character_levels,
    initial.hp_max,
    initial.species_id,
    initialAbilityBonusChoices,
    initialAsiChoices,
    initialFeatChoices,
    initialFeatureOptionChoices,
    initialLanguageChoices,
    initialSelectedSpells,
    initialSkillProficiencies,
    initialToolChoices,
    languageChoices,
    levels,
    skillProficiencies,
    speciesId,
    spellChoices,
    stats,
    toolChoices,
  ])
  const localFeatureOptionChoices = useMemo<CharacterFeatureOptionChoice[]>(
    () => featureOptionChoices.map((choice) => ({
      id: `${choice.option_group_key}:${choice.option_key}`,
      character_id: initial.id,
      character_level_id: choice.character_level_id ?? null,
      option_group_key: choice.option_group_key,
      option_key: choice.option_key,
      selected_value: choice.selected_value ?? {},
      choice_order: choice.choice_order ?? 0,
      source_category: choice.source_category ?? 'feature',
      source_entity_id: choice.source_entity_id ?? null,
      source_feature_key: choice.source_feature_key ?? null,
      created_at: '',
    })),
    [featureOptionChoices, initial.id]
  )
  const localDerivedCharacter = useMemo(() => {
    const campaign: Campaign = {
      id: campaignId,
      name: 'Current campaign',
      dm_id: '',
      settings: {
        stat_method: statMethod,
        max_level: 20,
        milestone_levelling: false,
      },
      rule_set: '2014',
      created_at: '',
    }
    const classDetailMap = Object.fromEntries(
      classList.map((cls) => [cls.id, { ...cls, progression: [], spell_slots: [] }])
    )
    const context = buildLocalCharacterContext({
      campaign,
      allowedSources: [],
      allSourceRuleSets: {},
      statMethod,
      persistedHpMax: hpMax,
      stats,
      selectedSpecies,
      selectedBackground,
      levels,
      classDetailMap,
      subclassMap,
      spellOptions,
      spellChoices,
      featList,
      featChoices,
      asiChoices,
      skillProficiencies,
      typedSkillProficiencies: skillSourceRows,
      equipmentItems: initialEquipmentItems.map((item) => ({
        item_id: item.item_id,
        quantity: item.quantity,
        equipped: item.equipped,
        source_package_item_id: item.source_package_item_id,
        source_category: item.source_category,
        source_entity_id: item.source_entity_id,
        notes: item.notes,
      })),
      armorCatalog,
      shieldCatalog,
      abilityBonusChoices,
      languageChoices,
      toolChoices,
      featureOptionChoices: localFeatureOptionChoices,
      featureOptionRows,
    })
    return deriveLocalCharacter(context)
  }, [
    abilityBonusChoices,
    armorCatalog,
    asiChoices,
    campaignId,
    classList,
    featChoices,
    featList,
    featureOptionRows,
    hpMax,
    initialEquipmentItems,
    languageChoices,
    levels,
    localFeatureOptionChoices,
    selectedBackground,
    selectedSpecies,
    shieldCatalog,
    skillProficiencies,
    skillSourceRows,
    spellChoices,
    spellOptions,
    statMethod,
    stats,
    subclassMap,
    toolChoices,
  ])
  const derivedCharacter = sheetIsDirty ? localDerivedCharacter : serverDerivedCharacter
  const derivedProgression = sheetIsDirty ? localDerivedCharacter : serverDerivedProgression
  const grantedProficiencies = useMemo(
    () => deriveGrantedNonSkillProficiencies({
      classes: levels.map((level) => {
        const classDetail = classList.find((cls) => cls.id === level.class_id)
        return {
          classId: level.class_id,
          className: classDetail?.name ?? 'Class',
          armorProficiencies: classDetail?.armor_proficiencies ?? [],
          weaponProficiencies: classDetail?.weapon_proficiencies ?? [],
        }
      }),
      background: selectedBackground
        ? {
            name: selectedBackground.name,
            toolProficiencies: selectedBackground.tool_proficiencies,
            fixedLanguages: getFixedBackgroundLanguages(selectedBackground),
          }
        : null,
      species: selectedSpecies
        ? {
            name: selectedSpecies.name,
            source: selectedSpecies.source,
            languages: selectedSpecies.languages,
          }
        : null,
      subclasses: activeSubclasses.map((subclass) => ({
        id: subclass.id,
        name: subclass.name,
        source: subclass.source,
      })),
      feats: activeFeats,
      languageChoiceRows: languageSourceRows,
      toolChoiceRows: toolSourceRows,
    }),
    [activeFeats, activeSubclasses, classList, languageSourceRows, levels, selectedBackground, selectedSpecies, toolSourceRows]
  )
  const derivedCore: DerivedCharacterCore = deriveCharacterCore({
    baseStats: stats,
    speciesAbilityBonuses: sumAbilityContributors(abilityContributors),
    abilityContributors,
    persistedHpMax: hpMax,
    savingThrowProficiencies: selectedClass?.saving_throw_proficiencies ?? [],
    skillProficiencies: [
      ...(selectedBackground?.skill_proficiencies ?? []),
      ...skillProficiencies,
    ],
    selectedFeatureOptions: canonicalizeFeatureOptionsForDerived(featureOptionChoices),
    selectedSpellNames,
    equippedItems: initialEquipmentItems.map((item) => ({
      itemId: item.item_id,
      equipped: item.equipped,
    })),
    armorCatalog: armorCatalog.map((entry) => ({
      itemId: entry.item_id,
      name: entry.name,
      armorCategory: entry.armor_category,
      baseAc: entry.base_ac,
      dexBonusCap: entry.dex_bonus_cap,
    })),
    shieldCatalog: shieldCatalog.map((entry) => ({
      itemId: entry.item_id,
      name: entry.name,
      armorClassBonus: entry.armor_class_bonus,
    })),
    species: selectedSpecies
      ? {
          name: selectedSpecies.name,
          source: selectedSpecies.source,
          speed: selectedSpecies.speed,
          size: selectedSpecies.size,
          languages: selectedSpecies.languages,
          senses: selectedSpecies.senses,
          damageResistances: selectedSpecies.damage_resistances,
          conditionImmunities: selectedSpecies.condition_immunities,
        }
      : null,
    classes: levels.map((level) => {
      const classDetail = classList.find((cls) => cls.id === level.class_id)
      const subclassDetail = level.subclass_id
        ? (subclassMap[level.class_id] ?? []).find((entry) => entry.id === level.subclass_id) ?? null
        : null

      return {
        classId: level.class_id,
        className: classDetail?.name ?? 'Class',
        subclassName: subclassDetail?.name ?? null,
        level: level.level,
        hitDie: classDetail?.hit_die ?? null,
        hpRoll: level.hp_roll,
        savingThrowProficiencies: classDetail?.saving_throw_proficiencies ?? [],
      }
    }),
  })
  const canEdit = !readOnly && (status === 'draft' || status === 'changes_requested' || isDm)
  const canSubmit = !readOnly && (status === 'draft' || status === 'changes_requested')
  const errorCount = derivedCharacter?.blockingIssues.length ?? failedChecks.filter((c) => c.severity === 'error').length

  const sheetDerived = derivedCharacter ?? derivedCore
  const speed = sheetDerived.speed
  const classNamesById = useMemo(
    () => new Map(classList.map((cls) => [cls.id, cls.name])),
    [classList]
  )
  const dmAuditSources = useMemo(() => {
    const sources: DmAuditContentSource[] = []
    if (selectedSpecies) {
      addAuditContentSource(sources, {
        kind: 'Species',
        label: selectedSpecies.name,
        source: selectedSpecies.source,
        amended: selectedSpecies.amended,
        amendmentNote: selectedSpecies.amendment_note,
      })
    }
    if (selectedBackground) {
      addAuditContentSource(sources, {
        kind: 'Background',
        label: selectedBackground.name,
        source: selectedBackground.source,
        amended: selectedBackground.amended,
        amendmentNote: selectedBackground.amendment_note,
      })
    }
    for (const level of levels) {
      const cls = classList.find((entry) => entry.id === level.class_id)
      if (cls) {
        addAuditContentSource(sources, {
          kind: 'Class',
          label: cls.name,
          source: cls.source,
          amended: cls.amended,
          amendmentNote: cls.amendment_note,
        })
      }
    }
    for (const subclass of activeSubclasses) {
      addAuditContentSource(sources, {
        kind: 'Subclass',
        label: subclass.name,
        source: subclass.source,
        amended: subclass.amended,
        amendmentNote: subclass.amendment_note,
      })
    }
    for (const feat of activeFeats) {
      addAuditContentSource(sources, {
        kind: 'Feat',
        label: feat.name,
        source: feat.source,
        amended: feat.amended,
        amendmentNote: feat.amendment_note,
      })
    }
    for (const spell of initialSelectedSpells) {
      addAuditContentSource(sources, {
        kind: 'Spell',
        label: spell.name,
        source: spell.source,
        amended: spell.amended,
        amendmentNote: spell.amendment_note,
      })
    }
    for (const choice of featureOptionChoices) {
      const selectedKey = typeof choice.selected_value?.feature_option_key === 'string'
        ? choice.selected_value.feature_option_key
        : null
      const option = featureOptionRows.find((row) => row.group_key === choice.option_group_key && row.key === selectedKey)
      if (option) {
        addAuditContentSource(sources, {
          kind: 'Feature Option',
          label: option.name,
          source: option.source,
          amended: option.amended,
          amendmentNote: option.amendment_note,
        })
      }
    }
    return sources.sort((left, right) => `${left.kind}:${left.label}`.localeCompare(`${right.kind}:${right.label}`))
  }, [activeFeats, activeSubclasses, classList, featureOptionChoices, featureOptionRows, initialSelectedSpells, levels, selectedBackground, selectedSpecies])
  const dmAuditProvenanceGroups = useMemo<DmAuditProvenanceGroup[]>(() => {
    const anchorFor = (characterLevelId: string | null | undefined) =>
      auditAnchorLabel(characterLevelId, initial.character_class_levels, classNamesById)
    const spellNameById = new Map([
      ...initialSelectedSpells.map((spell) => [spell.id, spell.name] as const),
      ...spellOptions.map((spell) => [spell.id, spell.name] as const),
    ])
    const featNameById = new Map([
      ...activeFeats.map((feat) => [feat.id, feat.name] as const),
      ...featList.map((feat) => [feat.id, feat.name] as const),
    ])
    const featureOptionName = (choice: FeatureOptionChoiceInput) => {
      const selectedKey = typeof choice.selected_value?.feature_option_key === 'string'
        ? choice.selected_value.feature_option_key
        : null
      return featureOptionRows.find((row) => row.group_key === choice.option_group_key && row.key === selectedKey)?.name
        ?? selectedKey
        ?? choice.option_key
    }

    return [
      {
        id: 'skills',
        label: 'Skill Choices',
        entries: skillSourceRows.map((row, index) => ({
          id: `skill-${row.skill}-${index}`,
          label: `${row.skill}${row.expertise ? ' (expertise)' : ''}`,
          source: auditSourceLabel(row.source_category, row.source_entity_id),
          anchor: anchorFor(row.character_level_id),
          detail: row.source_feature_key ?? null,
        })),
      },
      {
        id: 'feats',
        label: 'Feat Choices',
        entries: initialTypedFeatChoices.map((row, index) => ({
          id: row.id ?? `feat-${row.feat_id}-${index}`,
          label: featNameById.get(row.feat_id) ?? row.feat_id,
          source: row.choice_kind,
          anchor: anchorFor(row.character_level_id),
          detail: row.source_feature_key ?? null,
        })),
      },
      {
        id: 'spells',
        label: 'Spell Choices',
        entries: initialSpellSelections.map((row, index) => ({
          id: row.id ?? `spell-${row.spell_id}-${index}`,
          label: spellNameById.get(row.spell_id) ?? row.spell_id,
          source: row.acquisition_mode,
          anchor: anchorFor(row.character_level_id),
          detail: [
            row.owning_class_id ? `class ${row.owning_class_id}` : null,
            row.granting_subclass_id ? `subclass ${row.granting_subclass_id}` : null,
            row.source_feature_key,
            row.counts_against_selection_limit ? null : 'free/granted',
          ].filter(Boolean).join(' · ') || null,
        })),
      },
      {
        id: 'feature-options',
        label: 'Feature Option Choices',
        entries: featureOptionChoices.map((choice, index) => ({
          id: `${choice.option_group_key}-${choice.option_key}-${index}`,
          label: `${choice.option_group_key}: ${featureOptionName(choice)}`,
          source: auditSourceLabel(choice.source_category, choice.source_entity_id),
          anchor: anchorFor(choice.character_level_id),
          detail: choice.source_feature_key ?? null,
        })),
      },
      {
        id: 'equipment',
        label: 'Equipment Choices',
        entries: initialEquipmentItems.map((item, index) => ({
          id: item.id ?? `equipment-${item.item_id}-${index}`,
          label: `${item.item_id} x${item.quantity}${item.equipped ? ' (equipped)' : ''}`,
          source: auditSourceLabel(item.source_category, item.source_entity_id),
          anchor: 'Starting equipment',
          detail: item.notes ?? null,
        })),
      },
    ]
  }, [
    activeFeats,
    classNamesById,
    featList,
    featureOptionChoices,
    featureOptionRows,
    initial.character_class_levels,
    initialEquipmentItems,
    initialSelectedSpells,
    initialSpellSelections,
    initialTypedFeatChoices,
    skillSourceRows,
    spellOptions,
  ])

  const checkSectionMap: Record<string, SectionId> = {
    source_allowlist: 'identity-class',
    rule_set_consistency: 'identity-class',
    stat_method_consistency: 'stats-skills',
    stat_method: 'stats-skills',
    level_cap: 'identity-class',
    multiclass_skill_validation: 'stats-skills',
    skill_proficiencies: 'stats-skills',
    species_ability_bonus_choices: 'stats-skills',
    asi_choices: 'spells-feats',
    multiclass_prerequisites: 'identity-class',
    subclass_timing: 'identity-class',
    feat_prerequisites: 'spells-feats',
    feat_slots: 'spells-feats',
    spell_legality: 'spells-feats',
    subclass_feature_option_selections: 'spells-feats',
    spell_selection_count: 'spells-feats',
  }

  function mergeSpellOptions(options: SpellOption[]) {
    setSpellOptions((current) => {
      const mergedById = new Map(current.map((spell) => [spell.id, spell]))
      for (const spell of options) mergedById.set(spell.id, spell)
      return Array.from(mergedById.values())
    })
  }

  function jumpToCheck(key: string) {
    const sectionId = checkSectionMap[key]
    if (!sectionId) return

    const element = document.getElementById(sectionId)
    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    element.setAttribute('tabindex', '-1')
    element.focus({ preventScroll: true })
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
        totalLevel={derivedCore.totalLevel}
        campaignId={campaignId}
        statusLabel={statusInfo.label}
        statusClassName={statusInfo.colour}
        legalityPassed={legalityResult?.passed ?? null}
        legalityErrorCount={errorCount}
        hpMax={derivedCore.hitPoints.max}
        initiative={formatModifier(sheetDerived.initiative)}
        speed={speed !== null ? `${speed} ft` : '—'}
        passivePerception={sheetDerived.passivePerception}
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
      {legalityResult && ((derivedCharacter?.blockingIssues.length ?? 0) > 0 || (derivedCharacter?.warnings.length ?? 0) > 0) && (
        <Card className="border-rose-500/20 bg-rose-500/10">
          <CardHeader className="pb-2">
          <CardTitle className="text-sm text-rose-100">Repair checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...(derivedCharacter?.blockingIssues ?? []), ...(derivedCharacter?.warnings ?? [])].map((issue) => {
            const check = legalityResult.checks.find((entry) => entry.key === issue.key)
            return (
              <button
                key={issue.key}
                type="button"
                onClick={() => jumpToCheck(issue.key)}
                className="block text-left"
              >
                <LegalityBadge check={check} />
              </button>
            )
          })}
        </CardContent>
      </Card>
      )}

      {isDm && legalityResult && (
        <DmAuditPanel
          sources={dmAuditSources}
          checks={legalityResult.checks}
          groups={dmAuditProvenanceGroups}
          onJumpToCheck={jumpToCheck}
        />
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
                        <SourceTag source={s.source} amended={s.amended} amendmentNote={s.amendment_note} />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-neutral-200">{initial.species?.name ?? '—'}</p>
                {initial.species && (
                  <SourceTag
                    source={initial.species.source}
                    amended={initial.species.amended}
                    amendmentNote={initial.species.amendment_note}
                  />
                )}
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
                        <SourceTag source={b.source} amended={b.amended} amendmentNote={b.amendment_note} />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-neutral-200">{initial.background?.name ?? '—'}</p>
                {initial.background && (
                  <SourceTag
                    source={initial.background.source}
                    amended={initial.background.amended}
                    amendmentNote={initial.background.amendment_note}
                  />
                )}
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

          {derivedCharacter && derivedCharacter.speciesTraits.length > 0 && (
            <div className="space-y-3 col-span-2">
              <Label className="text-neutral-300">Species Traits</Label>
              <div className="grid gap-3">
                {derivedCharacter.speciesTraits.map((trait) => (
                  <div
                    key={trait.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-neutral-200">{trait.name}</p>
                      <SourceTag source={trait.source} />
                    </div>
                    <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{trait.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          <div className="text-sm text-neutral-400 pt-1">Total level: {derivedCore.totalLevel}</div>
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
            derivedAbilities={sheetDerived.abilities}
          />
        </CardContent>
      </div>

      <SpeciesAbilityBonusCard
        species={selectedSpecies}
        selectedChoices={abilityBonusChoices}
        canEdit={canEdit}
        onChange={setAbilityBonusChoices}
      />

      {/* Skills & Proficiencies */}
      <SkillsCard
        stats={stats}
        totalLevel={derivedCore.totalLevel}
        selectedClass={selectedClass}
        classOptions={classList}
        species={selectedSpecies}
        background={backgroundList.find((b) => b.id === backgroundId) ?? initial.background}
        subclasses={activeSubclasses}
        feats={activeFeats}
        derived={{ savingThrows: sheetDerived.savingThrows, skills: sheetDerived.skills }}
        typedSkillRows={skillSourceRows}
        skillProficiencies={skillProficiencies}
        canEdit={canEdit}
        onChange={setSkillProficiencies}
      />

      <GrantedProficienciesCard proficiencies={grantedProficiencies} />

      <LanguagesToolsCard
        species={selectedSpecies}
        background={backgroundList.find((b) => b.id === backgroundId) ?? initial.background}
        availableLanguages={languageList}
        availableTools={toolList}
        languageChoices={languageChoices}
        toolChoices={toolChoices}
        canEdit={canEdit}
        onLanguageChange={setLanguageChoices}
        onToolChange={setToolChoices}
      />
      </CollapsibleSection>

      <CollapsibleSection
        id="spells-feats"
        title="Spells + Feats"
        subtitle="Spell list and feat progression for the current build."
        defaultOpen={selectedClass?.spellcasting_type != null && selectedClass.spellcasting_type !== 'none'}
        highlighted={highlightedSection === 'spells-feats'}
      >
        {derivedCharacter && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-neutral-200">Subclass State</p>
              <div className="mt-3 space-y-2 text-sm text-neutral-400">
                {derivedCharacter.subclassStates.map((entry) => (
                  <p key={entry.classId}>
                    <span className="text-neutral-200">{entry.className}</span>{' '}
                    {entry.status === 'selected' && entry.subclassName
                      ? `uses ${entry.subclassName}.`
                      : entry.status === 'available_unselected'
                        ? `needs a subclass at level ${entry.requiredAt}.`
                        : entry.status === 'selected_too_early'
                          ? `${entry.subclassName ?? 'A subclass'} is selected too early.`
                          : `unlocks a subclass at level ${entry.requiredAt}.`}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-200">Class Resources</p>
                {derivedCharacter.classResources.length > 0 && (
                  <span className="text-xs text-neutral-500">{derivedCharacter.classResources.length} tracked</span>
                )}
              </div>
              <div className="mt-3">
                <ClassResourcesPanel resources={derivedCharacter.classResources} />
              </div>
            </div>
          </div>
        )}

        {derivedCharacter && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-neutral-200">Unlocked Features</p>
            <div className="mt-3">
              <FeatureList features={derivedCharacter.features} />
            </div>
          </div>
        )}

        {derivedCharacter && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-200">Combat Options</p>
              {derivedCharacter.combatActions.length > 0 && (
                <span className="text-xs text-neutral-500">{derivedCharacter.combatActions.length} surfaced</span>
              )}
            </div>
            <div className="mt-3">
              <CombatOptionsPanel actions={derivedCharacter.combatActions} />
            </div>
          </div>
        )}

        {derivedProgression && (derivedProgression.spellSlots.length > 0 || derivedProgression.pactSpellSlots.length > 0) && (
          <Alert className="border-white/10 bg-white/[0.03]">
            <AlertDescription className="text-neutral-300">
              Standard spell slots: {derivedProgression.spellSlots.length > 0 ? derivedProgression.spellSlots.join(' / ') : 'none'}
              {derivedProgression.pactSpellSlots.map((entry) => ` · ${entry.className} pact: ${entry.slots.join(' / ') || 'none'}`).join('')}
            </AlertDescription>
          </Alert>
        )}

        {derivedCharacter && derivedCharacter.spellcasting.sources.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-neutral-200">Spellcasting</p>
            <div className="mt-3 space-y-3">
              {derivedCharacter.spellcasting.sources.map((source) => (
                <div key={source.classId} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-neutral-100">{source.className} {source.classLevel}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {abilityLabel(source.spellcastingAbility)} caster
                        {source.spellcastingAbilityModifier !== null ? ` · ${formatModifier(source.spellcastingAbilityModifier)} ability mod` : ''}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-right text-xs">
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                        <p className="text-neutral-500">Save DC</p>
                        <p className="text-base font-semibold text-neutral-100">{source.spellSaveDc ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                        <p className="text-neutral-500">Attack</p>
                        <p className="text-base font-semibold text-neutral-100">
                          {source.spellAttackModifier !== null ? formatModifier(source.spellAttackModifier) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {source.selectionSummary && (
                    <p className="mt-1 text-sm text-neutral-400">{source.selectionSummary}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(source.selectedSpellCountsByLevel).map(([level, count]) => (
                      <span
                        key={`${source.classId}-${level}`}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300"
                      >
                        {level === '0' ? `${count} cantrip${count === 1 ? '' : 's'}` : `${count} level ${level} spell${count === 1 ? '' : 's'}`}
                      </span>
                    ))}
                    {source.selectedSpellCountsByLevel[0] === undefined && source.selectedSpells.length === 0 && (
                      <span className="text-xs text-neutral-500">No currently selected spells from this source.</span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Prepared</p>
                      <SpellPillList spells={source.preparedSpells} empty="No prepared spells from this source." />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Known</p>
                      <SpellPillList spells={source.knownSpells} empty="No known spells from this source." />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Spellbook</p>
                      <SpellPillList spells={source.spellbookSpells} empty="No spellbook entries from this source." />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Granted</p>
                      <SpellPillList spells={source.grantedSpells} empty="No granted spells from this source." granted />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {derivedCharacter && derivedCharacter.spellcasting.grantedSpells.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-neutral-200">Granted Spells</p>
            <div className="mt-3">
              <SpellPillList
                spells={derivedCharacter.spellcasting.grantedSpells}
                empty="No granted spells."
                granted
              />
            </div>
          </div>
        )}

        {derivedCharacter && derivedCharacter.spellcasting.selectedSpells.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-neutral-200">Spell Counts</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(derivedCharacter.spellcasting.selectedSpellCountsByLevel).map(([level, count]) => (
                <span
                  key={level}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300"
                >
                  {level === '0' ? `${count} cantrip${count === 1 ? '' : 's'}` : `${count} level ${level} spell${count === 1 ? '' : 's'}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedClass?.spellcasting_type != null && selectedClass.spellcasting_type !== 'none' && (
          <SpellsCard
            classId={firstClassId}
            campaignId={campaignId}
            speciesId={speciesId || null}
            subclassIds={firstClassSubclassIds}
            expandedClassIds={maverickBreakthroughClassIds}
            classLevel={firstClassLevel}
            derivedSpellcasting={derivedCharacter?.spellcasting}
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

        <FeatureOptionChoicesCard
          title="Fighting Styles"
          definitions={fightingStyleDefinitions}
          choices={featureOptionChoices}
          canEdit={canEdit}
          onChange={setFeatureOptionChoices}
        />

        <FeatureOptionChoicesCard
          title="Species Options"
          definitions={speciesOptionDefinitions}
          choices={featureOptionChoices}
          canEdit={canEdit}
          onChange={setFeatureOptionChoices}
        />

        <FeatureOptionChoicesCard
          title="Subclass Options"
          definitions={subclassFeatureOptionDefinitions}
          choices={featureOptionChoices}
          canEdit={canEdit}
          onChange={setFeatureOptionChoices}
        />

        <FeatureOptionChoicesCard
          title="Artificer Infusions"
          definitions={artificerInfusionDefinitions}
          choices={featureOptionChoices}
          canEdit={canEdit}
          onChange={setFeatureOptionChoices}
        />

        <FeatureOptionChoicesCard
          title="Feature Option Choices"
          definitions={maverickOptionDefinitions}
          choices={featureOptionChoices}
          canEdit={canEdit}
          onChange={setFeatureOptionChoices}
        />

        <FeatureSpellChoicesCard
          title="Feature Spell Choices"
          definitions={featureSpellDefinitions}
          campaignId={campaignId}
          classList={classList}
          selectedChoices={featureSpellChoices}
          canEdit={canEdit}
          onChange={setFeatureSpellChoices}
          onOptionsLoaded={mergeSpellOptions}
        />

        <FeatSpellChoicesCard
          activeFeats={activeFeats}
          campaignId={campaignId}
          classList={classList}
          selectedChoices={featSpellChoices}
          canEdit={canEdit}
          onChange={setFeatSpellChoices}
          onOptionsLoaded={mergeSpellOptions}
        />

        {derivedCharacter && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-neutral-200">ASI and Feat History</p>
            <div className="mt-3">
              <AsiFeatHistoryPanel entries={derivedCharacter.asiFeatHistory} />
            </div>
          </div>
        )}

        <FeatsCard
          background={selectedBackground ?? null}
          backgroundFeat={selectedBackgroundFeat}
          availableFeats={featList}
          featChoices={featChoices}
          asiChoices={asiChoices}
          totalLevel={derivedCore.totalLevel}
          featSlots={derivedProgression?.featSlots}
          canEdit={canEdit}
          onChange={setFeatChoices}
          onAsiChange={setAsiChoices}
        />
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
        <CardContent className="space-y-4">
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

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Stored Max</p>
              <p className="mt-2 text-lg font-semibold text-neutral-100">{derivedCore.hitPoints.max}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Estimated From Levels</p>
              <p className="mt-2 text-lg font-semibold text-neutral-100">
                {derivedCore.hitPoints.estimatedFromLevels ?? '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Possible Range</p>
              <p className="mt-2 text-lg font-semibold text-neutral-100">
                {derivedCore.hitPoints.minimumPossible !== null && derivedCore.hitPoints.maximumPossible !== null
                  ? `${derivedCore.hitPoints.minimumPossible}-${derivedCore.hitPoints.maximumPossible}`
                  : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">CON Per Level</p>
              <p className="mt-2 text-lg font-semibold text-neutral-100">
                {formatModifier(derivedCore.hitPoints.constitutionModifier)}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-neutral-400">
            <p>
              Hit dice: {derivedCore.hitPoints.hitDice.length > 0
                ? derivedCore.hitPoints.hitDice
                    .map((entry) => `${entry.level}d${entry.dieSize ?? '?'} ${entry.className}`)
                    .join(' · ')
                : '—'}
            </p>
            {derivedCore.hitPoints.usesInferredLevels && (
              <p>
                HP estimate infers {derivedCore.hitPoints.inferredLevelCount} level
                {derivedCore.hitPoints.inferredLevelCount === 1 ? '' : 's'} using fixed average because the current schema only stores one HP roll per class.
              </p>
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
          derived={sheetDerived}
          character={{
            ...initial,
            name,
            alignment: alignment || null,
            base_str: stats.str, base_dex: stats.dex, base_con: stats.con,
            base_int: stats.int, base_wis: stats.wis, base_cha: stats.cha,
            hp_max: hpMax,
            species: speciesList.find((s) => s.id === speciesId) ?? initial.species,
            background: backgroundList.find((b) => b.id === backgroundId) ?? initial.background,
            character_levels: levels.map((l) => ({ ...l, id: '', character_id: initial.id, hp_roll: l.hp_roll, taken_at: '' })),
          }}
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
