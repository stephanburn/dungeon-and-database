'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Class, Feat, Spell } from '@/lib/types/database'
import {
  getFeatSpellChoiceDefinitions,
  type FeatSpellChoiceDefinition,
} from '@/lib/characters/feat-spell-options'

type SpellOption = Spell & {
  granted_by_subclasses?: string[]
  counts_against_selection_limit?: boolean
}

interface FeatSpellChoicesCardProps {
  activeFeats: Feat[]
  campaignId: string
  classList: Class[]
  selectedChoices: Record<string, string>
  canEdit: boolean
  onChange: (choices: Record<string, string>) => void
  onOptionsLoaded?: (options: SpellOption[]) => void
}

export function FeatSpellChoicesCard({
  activeFeats,
  campaignId,
  classList,
  selectedChoices,
  canEdit,
  onChange,
  onOptionsLoaded,
}: FeatSpellChoicesCardProps) {
  const definitions = useMemo(
    () => getFeatSpellChoiceDefinitions(activeFeats),
    [activeFeats]
  )
  const [optionsByFeatureKey, setOptionsByFeatureKey] = useState<Record<string, SpellOption[]>>({})

  useEffect(() => {
    if (definitions.length === 0) {
      setOptionsByFeatureKey({})
      onOptionsLoaded?.([])
      return
    }

    let cancelled = false
    const classesByName = new Map(classList.map((cls) => [cls.name.toLowerCase(), cls.id]))

    Promise.all(
      definitions.map(async (definition) => {
        const classId = definition.spellListClassName
          ? classesByName.get(definition.spellListClassName.toLowerCase()) ?? null
          : null

        if (!classId || definition.spellLevel === null) {
          return [definition.sourceFeatureKey, []] as const
        }

        const params = new URLSearchParams({
          campaign_id: campaignId,
          class_id: classId,
          level: String(definition.spellLevel),
        })
        const response = await fetch(`/api/content/spells?${params.toString()}`)
        const data = await response.json()
        return [definition.sourceFeatureKey, Array.isArray(data) ? data : []] as const
      })
    ).then((entries) => {
      if (cancelled) return
      const next: Record<string, SpellOption[]> = Object.fromEntries(entries)
      setOptionsByFeatureKey(next)

      const mergedById = new Map<string, SpellOption>()
      for (const options of Object.values(next)) {
        for (const option of options) mergedById.set(option.id, option)
      }
      onOptionsLoaded?.(Array.from(mergedById.values()))
    })

    return () => {
      cancelled = true
    }
  }, [campaignId, classList, definitions, onOptionsLoaded])

  if (definitions.length === 0) return null

  function setChoice(definition: FeatSpellChoiceDefinition, spellId: string) {
    const next = { ...selectedChoices }
    if (!spellId || spellId === 'none') delete next[definition.sourceFeatureKey]
    else next[definition.sourceFeatureKey] = spellId
    onChange(next)
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-neutral-200">Feat Spell Choices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {definitions.map((definition) => {
          const options = optionsByFeatureKey[definition.sourceFeatureKey] ?? []
          const selectedSpellId = selectedChoices[definition.sourceFeatureKey] ?? ''

          return (
            <div key={definition.sourceFeatureKey} className="space-y-1">
              <p className="text-sm font-medium text-neutral-200">{definition.label}</p>
              <p className="text-xs text-neutral-500">
                {definition.featName}
                {definition.spellListClassName ? ` • ${definition.spellListClassName} list` : ''}
                {definition.spellLevel !== null
                  ? ` • ${definition.spellLevel === 0 ? 'cantrip' : `level ${definition.spellLevel}`}`
                  : ''}
              </p>
              {canEdit ? (
                <Select
                  value={selectedSpellId || 'none'}
                  onValueChange={(value) => setChoice(definition, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a spell" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-neutral-400">Choose later</SelectItem>
                    {options.map((spell) => (
                      <SelectItem key={spell.id} value={spell.id} className="text-neutral-200">
                        {spell.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-sm text-neutral-300">
                  {options.find((spell) => spell.id === selectedSpellId)?.name ?? 'No spell selected'}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
