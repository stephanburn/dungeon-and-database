'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { DerivedCharacter } from '@/lib/characters/derived'
import type { Spell } from '@/lib/types/database'

const LEVEL_LABELS: Record<number, string> = {
  0: 'Cantrips',
  1: '1st Level', 2: '2nd Level', 3: '3rd Level',
  4: '4th Level', 5: '5th Level', 6: '6th Level',
  7: '7th Level', 8: '8th Level', 9: '9th Level',
}

interface SpellsCardProps {
  classId: string
  campaignId: string
  speciesId?: string | null
  subclassIds?: string[]
  expandedClassIds?: string[]
  classLevel?: number
  derivedSpellcasting?: Pick<
    DerivedCharacter['spellcasting'],
    'selectedSpells' | 'selectedSpellCountsByLevel' | 'leveledSpellSelectionCap' | 'cantripSelectionCap' | 'selectionSummary' | 'sources'
  >
  spellChoices: string[]
  maxSpellLevel?: number
  spellLevelCaps?: Record<number, number>
  leveledSpellSelectionCap?: number
  cantripSelectionCap?: number | null
  selectionSummary?: string | null
  canEdit: boolean
  onChange: (spells: string[]) => void
}

type SpellOption = Spell & {
  granted_by_subclasses?: string[]
  counts_against_selection_limit?: boolean
  available_via_class_ids?: string[]
  source_feature_key?: string | null
}

export function SpellsCard({
  classId,
  campaignId,
  speciesId,
  subclassIds = [],
  expandedClassIds = [],
  classLevel = 0,
  derivedSpellcasting,
  spellChoices,
  maxSpellLevel,
  spellLevelCaps = {},
  leveledSpellSelectionCap,
  cantripSelectionCap,
  selectionSummary,
  canEdit,
  onChange,
}: SpellsCardProps) {
  const [spells, setSpells] = useState<SpellOption[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!classId) return
    const params = new URLSearchParams({
      class_id: classId,
      campaign_id: campaignId,
      class_level: String(classLevel),
    })
    if (speciesId) params.set('species_id', speciesId)
    for (const subclassId of subclassIds) params.append('subclass_id', subclassId)
    for (const expandedClassId of expandedClassIds) params.append('expanded_class_id', expandedClassId)
    for (const spellId of spellChoices) params.append('selected_spell_id', spellId)

    fetch(`/api/content/spells?${params.toString()}`)
      .then(r => r.json())
      .then(data => setSpells(Array.isArray(data) ? data : []))
  }, [classId, campaignId, classLevel, speciesId, subclassIds, expandedClassIds, spellChoices])

  const visibleSpells = spells.filter((spell) => spell.level === 0 || maxSpellLevel === undefined || spell.level <= maxSpellLevel)
  const filtered = search.trim()
    ? visibleSpells.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : visibleSpells

  const byLevel = filtered.reduce<Record<number, SpellOption[]>>((acc, spell) => {
    acc[spell.level] = [...(acc[spell.level] ?? []), spell]
    return acc
  }, {})

  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b)
  const selectedVisibleSpells = spellChoices
    .map((id) => visibleSpells.find((spell) => spell.id === id))
    .filter((spell): spell is SpellOption => spell !== undefined)
  const activeDerivedSource = derivedSpellcasting?.sources?.find((source) => source.classId === classId)
  const fallbackCappedSelections = selectedVisibleSpells.filter((spell) => spell.counts_against_selection_limit !== false)
  const effectiveSelectedSpellCountsByLevel = activeDerivedSource?.selectedSpellCountsByLevel ?? derivedSpellcasting?.selectedSpellCountsByLevel
  const leveledSelectionCount = effectiveSelectedSpellCountsByLevel
    ? Object.entries(effectiveSelectedSpellCountsByLevel)
        .filter(([level]) => Number(level) > 0)
        .reduce((sum, [, count]) => sum + count, 0)
    : fallbackCappedSelections.filter((spell) => spell.level > 0).length
  const cantripSelectionCount = effectiveSelectedSpellCountsByLevel?.[0] ?? fallbackCappedSelections.filter((spell) => spell.level === 0).length
  const effectiveLeveledSpellSelectionCap = activeDerivedSource?.leveledSpellSelectionCap ?? derivedSpellcasting?.leveledSpellSelectionCap ?? leveledSpellSelectionCap
  const effectiveCantripSelectionCap = activeDerivedSource?.cantripSelectionCap ?? derivedSpellcasting?.cantripSelectionCap ?? cantripSelectionCap
  const effectiveSelectionSummary = activeDerivedSource?.selectionSummary ?? derivedSpellcasting?.selectionSummary ?? selectionSummary
  const selectionInstruction = activeDerivedSource?.mode === 'spellbook'
    ? 'Choose the spells written in this spellbook right now.'
    : activeDerivedSource?.mode === 'prepared'
      ? 'Choose the spells this character has prepared right now.'
      : activeDerivedSource?.mode === 'known'
        ? 'Choose the spells this character knows right now.'
        : 'Choose the spells this character can actively use right now.'
  const derivedSelectedSpellMap = new Map(
    (derivedSpellcasting?.selectedSpells ?? []).map((spell) => [spell.id, spell])
  )

  function toggle(spellId: string) {
    if (!canEdit) return
    const spell = visibleSpells.find((entry) => entry.id === spellId)
    if (!spell) return

    if (spellChoices.includes(spellId)) {
      onChange(spellChoices.filter(id => id !== spellId))
    } else {
      if (spell.level === 0) {
        if (
          spell.counts_against_selection_limit !== false &&
          effectiveCantripSelectionCap !== null &&
          effectiveCantripSelectionCap !== undefined &&
          cantripSelectionCount >= effectiveCantripSelectionCap
        ) {
          return
        }
      }
      if (spell.level > 0 && spell.counts_against_selection_limit !== false) {
        const atTotalCap = effectiveLeveledSpellSelectionCap !== undefined && leveledSelectionCount >= effectiveLeveledSpellSelectionCap
        if (atTotalCap) return
      }
      onChange([...spellChoices, spellId])
    }
  }

  if (visibleSpells.length === 0 && !search) {
    return (
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader><CardTitle className="text-neutral-200">Spells</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">No castable spells are available for this class in this campaign yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-neutral-200">
          Spell List
          {spellChoices.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-400">({spellChoices.length} selected)</span>
          )}
        </CardTitle>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search spells…"
          className="h-10 w-full text-sm sm:w-56"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="space-y-1 text-xs text-neutral-500">
            <p>{selectionInstruction}</p>
            {effectiveSelectionSummary && <p>{effectiveSelectionSummary}</p>}
            {effectiveLeveledSpellSelectionCap !== undefined && (
              <p>Leveled spells: {leveledSelectionCount}/{effectiveLeveledSpellSelectionCap} selected. Cantrips are shown separately.</p>
            )}
            {effectiveCantripSelectionCap !== null && effectiveCantripSelectionCap !== undefined && (
              <p>Cantrips: {cantripSelectionCount}/{effectiveCantripSelectionCap} selected.</p>
            )}
          </div>
        )}
        {levels.map(level => (
          <div key={level}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                {LEVEL_LABELS[level]}
              </h4>
              {level > 0 && (
                <span className="text-[11px] text-neutral-500">
                  {spellLevelCaps[level] ?? 0} slots available
                </span>
              )}
              {level === 0 && effectiveCantripSelectionCap !== null && effectiveCantripSelectionCap !== undefined && (
                <span className="text-[11px] text-neutral-500">
                  {cantripSelectionCount}/{effectiveCantripSelectionCap} selected
                </span>
              )}
            </div>
            <div className="space-y-2">
              {byLevel[level].map(spell => {
                const derivedSelectedSpell = derivedSelectedSpellMap.get(spell.id)
                const chosen = spellChoices.includes(spell.id)
                const atTotalCap =
                  spell.level > 0 &&
                  spell.counts_against_selection_limit !== false &&
                  !chosen &&
                  effectiveLeveledSpellSelectionCap !== undefined &&
                  leveledSelectionCount >= effectiveLeveledSpellSelectionCap
                const atCantripCap =
                  spell.level === 0 &&
                  spell.counts_against_selection_limit !== false &&
                  !chosen &&
                  effectiveCantripSelectionCap !== null &&
                  effectiveCantripSelectionCap !== undefined &&
                  cantripSelectionCount >= effectiveCantripSelectionCap
                const disabled = !canEdit || atTotalCap || atCantripCap
                return (
                  <button
                    key={spell.id}
                    type="button"
                    onClick={() => toggle(spell.id)}
                    disabled={disabled}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                      chosen
                        ? 'border-blue-400/25 bg-blue-400/10 text-blue-50'
                        : !disabled
                          ? 'cursor-pointer border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/18 hover:bg-white/[0.05]'
                          : 'border-white/8 bg-white/[0.02] text-neutral-500'
                    } ${!disabled ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${chosen ? 'bg-blue-300' : 'bg-neutral-600'}`} />
                      <span className="font-medium">{spell.name}</span>
                      <span className="text-xs text-neutral-500">{spell.school}</span>
                      {derivedSelectedSpell?.granted || spell.granted_by_subclasses?.length ? (
                        <span className="rounded-full border border-emerald-300/20 px-2 py-0.5 text-[10px] text-emerald-200">
                          Free
                        </span>
                      ) : null}
                      {spell.ritual && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-400">Ritual</span>}
                      {spell.concentration && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-400">Concentration</span>}
                    </div>
                    <div className="ml-2 shrink-0 text-right">
                      <span className="text-xs text-neutral-500">{spell.casting_time}</span>
                      {(spell.level > 0 && atTotalCap) || (spell.level === 0 && atCantripCap) ? (
                        <p className="text-[10px] text-neutral-600">cap reached</p>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {levels.length === 0 && search && (
          <p className="text-sm text-neutral-500">No spells match &ldquo;{search}&rdquo;.</p>
        )}
      </CardContent>
    </Card>
  )
}
