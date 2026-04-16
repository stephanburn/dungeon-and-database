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
import type { Class, Spell } from '@/lib/types/database'
import type { FeatureSpellChoiceDefinition } from '@/lib/characters/feature-grants'

type SpellOption = Spell & {
  granted_by_subclasses?: string[]
  counts_against_selection_limit?: boolean
}

interface FeatureSpellChoicesCardProps {
  title: string
  definitions: FeatureSpellChoiceDefinition[]
  campaignId: string
  classList: Class[]
  selectedChoices: Record<string, string>
  canEdit: boolean
  onChange: (choices: Record<string, string>) => void
  onOptionsLoaded?: (options: SpellOption[]) => void
}

export function FeatureSpellChoicesCard({
  title,
  definitions,
  campaignId,
  classList,
  selectedChoices,
  canEdit,
  onChange,
  onOptionsLoaded,
}: FeatureSpellChoicesCardProps) {
  const [optionsByFeatureKey, setOptionsByFeatureKey] = useState<Record<string, SpellOption[]>>({})

  const classIdsByName = useMemo(
    () => new Map(classList.map((cls) => [cls.name.toLowerCase(), cls.id])),
    [classList]
  )

  useEffect(() => {
    if (definitions.length === 0) {
      setOptionsByFeatureKey({})
      onOptionsLoaded?.([])
      return
    }

    let cancelled = false

    Promise.all(
      definitions.map(async (definition) => {
        if (definition.spellLevel === null) {
          return [definition.sourceFeatureKey, []] as const
        }

        const spellLists = await Promise.all(
          definition.spellListClassNames.map(async (className) => {
            const classId = classIdsByName.get(className.toLowerCase()) ?? null
            if (!classId) return []

            const params = new URLSearchParams({
              campaign_id: campaignId,
              class_id: classId,
              level: String(definition.spellLevel),
            })
            const response = await fetch(`/api/content/spells?${params.toString()}`)
            const data = await response.json()
            return Array.isArray(data) ? data as SpellOption[] : []
          })
        )

        const mergedById = new Map<string, SpellOption>()
        for (const spellList of spellLists) {
          for (const option of spellList) mergedById.set(option.id, option)
        }

        return [definition.sourceFeatureKey, Array.from(mergedById.values())] as const
      })
    ).then((entries) => {
      if (cancelled) return

      const next = Object.fromEntries(entries) as Record<string, SpellOption[]>
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
  }, [campaignId, classIdsByName, definitions, onOptionsLoaded])

  if (definitions.length === 0) return null

  function setChoice(definition: FeatureSpellChoiceDefinition, spellId: string) {
    const next = { ...selectedChoices }
    if (!spellId || spellId === 'none') delete next[definition.sourceFeatureKey]
    else next[definition.sourceFeatureKey] = spellId
    onChange(next)
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-neutral-200">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {definitions.map((definition) => {
          const options = optionsByFeatureKey[definition.sourceFeatureKey] ?? []
          const selectedSpellId = selectedChoices[definition.sourceFeatureKey] ?? ''

          return (
            <div key={definition.sourceFeatureKey} className="space-y-1">
              <p className="text-sm font-medium text-neutral-200">{definition.label}</p>
              <p className="text-xs text-neutral-500">
                {definition.ownerLabel}
                {definition.spellListClassNames.length > 0 ? ` • ${definition.spellListClassNames.join(', ')} list` : ''}
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
