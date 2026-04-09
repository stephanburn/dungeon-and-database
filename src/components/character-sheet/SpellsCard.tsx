'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  spellChoices: string[]
  canEdit: boolean
  onChange: (spells: string[]) => void
}

export function SpellsCard({ classId, campaignId, spellChoices, canEdit, onChange }: SpellsCardProps) {
  const [spells, setSpells] = useState<Spell[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!classId) return
    fetch(`/api/content/spells?class_id=${classId}&campaign_id=${campaignId}`)
      .then(r => r.json())
      .then(data => setSpells(Array.isArray(data) ? data : []))
  }, [classId, campaignId])

  const filtered = search.trim()
    ? spells.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : spells

  const byLevel = filtered.reduce<Record<number, Spell[]>>((acc, spell) => {
    acc[spell.level] = [...(acc[spell.level] ?? []), spell]
    return acc
  }, {})

  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b)

  function toggle(spellId: string) {
    if (!canEdit) return
    if (spellChoices.includes(spellId)) {
      onChange(spellChoices.filter(id => id !== spellId))
    } else {
      onChange([...spellChoices, spellId])
    }
  }

  if (spells.length === 0 && !search) {
    return (
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader><CardTitle className="text-neutral-200">Spells</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">No spells available for this class in this campaign.</p>
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
          <p className="text-xs text-neutral-500">Choose the spells this character currently knows or prepares.</p>
        )}
        {levels.map(level => (
          <div key={level}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              {LEVEL_LABELS[level]}
            </h4>
            <div className="space-y-2">
              {byLevel[level].map(spell => {
                const chosen = spellChoices.includes(spell.id)
                return (
                  <button
                    key={spell.id}
                    type="button"
                    onClick={() => toggle(spell.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                      chosen
                        ? 'border-blue-400/25 bg-blue-400/10 text-blue-50'
                        : canEdit
                          ? 'cursor-pointer border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/18 hover:bg-white/[0.05]'
                          : 'text-neutral-400'
                    } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${chosen ? 'bg-blue-300' : 'bg-neutral-600'}`} />
                      <span className="font-medium">{spell.name}</span>
                      <span className="text-xs text-neutral-500">{spell.school}</span>
                      {spell.ritual && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-400">Ritual</span>}
                      {spell.concentration && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-400">Concentration</span>}
                    </div>
                    <span className="text-xs text-neutral-500 shrink-0 ml-2">{spell.casting_time}</span>
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
