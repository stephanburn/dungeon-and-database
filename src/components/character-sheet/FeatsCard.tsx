'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Feat, Background } from '@/lib/types/database'
import type { AsiSelection } from '@/lib/characters/asi-provenance'
import type { FeatSlotDefinition } from '@/lib/characters/feat-slots'

const ABILITY_OPTIONS = [
  { value: 'str', label: 'Strength' },
  { value: 'dex', label: 'Dexterity' },
  { value: 'con', label: 'Constitution' },
  { value: 'int', label: 'Intelligence' },
  { value: 'wis', label: 'Wisdom' },
  { value: 'cha', label: 'Charisma' },
] as const

// Default ASI levels for classes that don't have custom progression loaded.
// Covers: Barbarian, Bard, Cleric, Druid, Fighter (partial), Monk, Ranger, Rogue,
// Sorcerer, Warlock, Wizard. Fighter also gets 6 & 14; Rogue also gets 10.
// For Phase 1.5 use the common subset; will refine when class_feature_progression is wired.
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]

function asiSlotsEarned(totalLevel: number): number {
  return DEFAULT_ASI_LEVELS.filter((l) => l <= totalLevel).length
}

interface FeatsCardProps {
  background: Background | null
  backgroundFeat: Feat | null
  availableFeats: Feat[]
  featChoices: string[]
  asiChoices: AsiSelection[]
  totalLevel: number
  featSlots?: FeatSlotDefinition[]
  canEdit: boolean
  onChange: (featChoices: string[]) => void
  onAsiChange: (asiChoices: AsiSelection[]) => void
}

export function FeatsCard({
  background,
  backgroundFeat,
  availableFeats,
  featChoices,
  asiChoices,
  totalLevel,
  featSlots,
  canEdit,
  onChange,
  onAsiChange,
}: FeatsCardProps) {
  const slots = featSlots?.length ?? asiSlotsEarned(totalLevel)
  const hasBgFeat = !!backgroundFeat
  const hasAnything = hasBgFeat || slots > 0

  if (!hasAnything) return null

  function setSlot(index: number, featId: string) {
    const next = [...featChoices]
    next[index] = featId || ''
    // Trim trailing empty strings
    while (next.length > 0 && !next[next.length - 1]) next.pop()
    onChange(next)
  }

  function setAsiSlot(index: number, selection: AsiSelection) {
    const next = [...asiChoices]
    next[index] = selection
    while (next.length > 0 && (next[next.length - 1] ?? []).length === 0) next.pop()
    onAsiChange(next)
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-neutral-200">Feats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Background-granted feat (locked) */}
        {hasBgFeat && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-400/15 bg-blue-400/10 p-3">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-300 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-neutral-200">{backgroundFeat!.name}</p>
              <p className="text-xs text-neutral-400">Granted by background: {background?.name}</p>
              {backgroundFeat!.description && (
                <p className="text-xs text-neutral-400 mt-1">{backgroundFeat!.description}</p>
              )}
            </div>
          </div>
        )}

        {/* ASI-level feat slots */}
        {Array.from({ length: slots }, (_, i) => {
          const chosenId = featChoices[i] ?? ''
          const chosenFeat = availableFeats.find((f) => f.id === chosenId)
          const chosenAsi = asiChoices[i] ?? []
          const slotDefinition = featSlots?.[i]
          const slotLabel = slotDefinition?.label ?? `level ${DEFAULT_ASI_LEVELS[i]}`
          const featOnly = slotDefinition?.choiceKind === 'feat_only'

          return (
            <div key={i} className="space-y-1">
              <p className="text-xs text-neutral-500">
                {featOnly ? `Feat slot ${i + 1}` : `ASI slot ${i + 1}`} ({slotLabel})
              </p>
              {canEdit ? (
                <Select
                  value={featOnly ? (chosenId || undefined) : (chosenId || 'asi')}
                  onValueChange={(value) => setSlot(i, !featOnly && value === 'asi' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={featOnly ? 'Choose feat' : 'Take ASI or choose feat'} />
                  </SelectTrigger>
                  <SelectContent>
                    {!featOnly && (
                      <SelectItem value="asi" className="text-neutral-400">Take ASI instead</SelectItem>
                    )}
                    {availableFeats.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-neutral-200">
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                  <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${chosenFeat ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  <div>
                    {chosenFeat ? (
                      <>
                        <p className="text-sm font-medium text-neutral-200">{chosenFeat.name}</p>
                        {chosenFeat.description && (
                          <p className="text-xs text-neutral-400 mt-1">{chosenFeat.description}</p>
                        )}
                      </>
                    ) : featOnly ? (
                      <p className="text-sm text-neutral-500">No feat selected yet.</p>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        ASI {chosenAsi.length > 0 ? `(${chosenAsi.map((ability) => ability.toUpperCase()).join(', ')})` : '(not allocated yet)'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {canEdit && !chosenFeat && !featOnly && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {[0, 1].map((pickIndex) => {
                    const selectedAbility = chosenAsi[pickIndex] ?? ''
                    return (
                      <Select
                        key={pickIndex}
                        value={selectedAbility || 'none'}
                        onValueChange={(value) => {
                          const next = [...chosenAsi]
                          if (value === 'none') {
                            next.splice(pickIndex, 1)
                          } else {
                            next[pickIndex] = value as AsiSelection[number]
                          }
                          setAsiSlot(i, next.filter(Boolean) as AsiSelection)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`ASI pick ${pickIndex + 1}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-neutral-500">Unassigned</SelectItem>
                          {ABILITY_OPTIONS.map((ability) => (
                            <SelectItem key={ability.value} value={ability.value} className="text-neutral-200">
                              {ability.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
