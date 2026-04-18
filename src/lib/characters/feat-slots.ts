import type { Species } from '@/lib/types/database'

export type FeatSlotChoiceKind = 'asi_or_feat' | 'feat_only'

export type FeatSlotDefinition = {
  label: string
  choiceKind: FeatSlotChoiceKind
  sourceFeatureKey: string | null
}

export function createAsiFeatSlotDefinition(label: string): FeatSlotDefinition {
  return {
    label,
    choiceKind: 'asi_or_feat',
    sourceFeatureKey: `asi_slot:${label}`,
  }
}

export function getSpeciesFeatSlotDefinitions(
  species: Pick<Species, 'name' | 'source'> | null
): FeatSlotDefinition[] {
  if (!species) return []

  if (species.name === 'Variant Human' && species.source === 'PHB') {
    return [
      {
        label: 'Variant Human',
        choiceKind: 'feat_only',
        sourceFeatureKey: 'species_feat:variant_human',
      },
    ]
  }

  return []
}
