import type { CharacterAsiChoice } from '@/lib/types/database'
import type { AsiChoiceInput } from '@/lib/characters/choice-persistence'
import type { AbilityKey } from '@/lib/characters/build-context'
import type { FeatSlotDefinition } from '@/lib/characters/feat-slots'

export type AsiSelection = AbilityKey[]

export function buildTypedAsiChoices(
  asiChoices: AsiSelection[],
  featSlots: FeatSlotDefinition[] | undefined,
  featChoices?: string[]
): AsiChoiceInput[] {
  return asiChoices.flatMap((selection, slotIndex) => {
    const slotDefinition = featSlots?.[slotIndex]
    if ((featChoices?.[slotIndex] ?? '').length > 0) return []
    if (slotDefinition?.choiceKind === 'feat_only') return []

    const bonusByAbility = selection.reduce<Partial<Record<AbilityKey, number>>>((acc, ability) => {
      acc[ability] = (acc[ability] ?? 0) + 1
      return acc
    }, {})

    return (Object.entries(bonusByAbility) as Array<[AbilityKey, number]>).map(([ability, bonus]) => ({
      slot_index: slotIndex,
      ability,
      bonus,
      character_level_id: null,
      source_feature_key: slotDefinition?.sourceFeatureKey ?? null,
    }))
  })
}

export function buildAsiSelectionsFromRows(rows: CharacterAsiChoice[]): AsiSelection[] {
  const grouped = new Map<number, AsiSelection>()

  for (const row of rows) {
    const existing = grouped.get(row.slot_index) ?? []
    for (let index = 0; index < row.bonus; index += 1) {
      existing.push(row.ability)
    }
    grouped.set(row.slot_index, existing)
  }

  if (grouped.size === 0) return []

  const maxSlotIndex = Math.max(...Array.from(grouped.keys()))
  return Array.from({ length: maxSlotIndex + 1 }, (_, slotIndex) => grouped.get(slotIndex) ?? [])
}

export function buildAsiBonusMap(asiChoices: AsiSelection[]): Partial<Record<AbilityKey, number>> {
  return asiChoices.reduce<Partial<Record<AbilityKey, number>>>((acc, selection) => {
    for (const ability of selection) {
      acc[ability] = (acc[ability] ?? 0) + 1
    }
    return acc
  }, {})
}
