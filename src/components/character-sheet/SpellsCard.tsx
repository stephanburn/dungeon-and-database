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
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-neutral-200">
          Spells
          {spellChoices.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-400">({spellChoices.length} selected)</span>
          )}
        </CardTitle>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search spells…"
          className="w-48 h-8 bg-neutral-800 border-neutral-700 text-neutral-100 text-sm"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <p className="text-xs text-neutral-500">Click a spell to add or remove it from your spell list.</p>
        )}
        {levels.map(level => (
          <div key={level}>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              {LEVEL_LABELS[level]}
            </h4>
            <div className="space-y-1">
              {byLevel[level].map(spell => {
                const chosen = spellChoices.includes(spell.id)
                return (
                  <div
                    key={spell.id}
                    onClick={() => toggle(spell.id)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded text-sm transition-colors ${
                      chosen
                        ? 'bg-blue-900/40 text-blue-200'
                        : canEdit
                          ? 'hover:bg-neutral-800 text-neutral-300 cursor-pointer'
                          : 'text-neutral-400'
                    } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2">
                      {chosen && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                      <span className="font-medium">{spell.name}</span>
                      <span className="text-xs text-neutral-500">{spell.school}</span>
                      {spell.ritual && <span className="text-xs text-neutral-500">(R)</span>}
                      {spell.concentration && <span className="text-xs text-neutral-500">(C)</span>}
                    </div>
                    <span className="text-xs text-neutral-500 shrink-0 ml-2">{spell.casting_time}</span>
                  </div>
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
