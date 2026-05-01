import type { StatMethod } from '@/lib/types/database'

export type CreationStepId =
  | 'identity'
  | 'species'
  | 'background'
  | 'classes'
  | 'subclasses'
  | 'stats'
  | 'skills'
  | 'equipment'
  | 'spells-feats'
  | 'review'

export const CREATION_STEPS: Array<{ id: CreationStepId; label: string }> = [
  { id: 'identity', label: 'Identity' },
  { id: 'species', label: 'Species' },
  { id: 'background', label: 'Background' },
  { id: 'classes', label: 'Classes' },
  { id: 'subclasses', label: 'Subclasses' },
  { id: 'stats', label: 'Ability Scores' },
  { id: 'skills', label: 'Skills' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'spells-feats', label: 'Spells + Feats' },
  { id: 'review', label: 'Review' },
]

export function buildCreationStepList(args: {
  includeSubclassStep: boolean
  includeSpellsFeatsStep: boolean
}) {
  return CREATION_STEPS.filter((step) => {
    if (step.id === 'subclasses') return args.includeSubclassStep
    if (step.id === 'spells-feats') return args.includeSpellsFeatsStep
    return true
  })
}

const STAT_METHOD_COPY: Record<StatMethod, { label: string; description: string }> = {
  point_buy: {
    label: 'Point Buy',
    description: 'Spend exactly 27 points across scores from 8 to 15.',
  },
  standard_array: {
    label: 'Standard Array',
    description: 'Assign 15, 14, 13, 12, 10, and 8 exactly once each.',
  },
  rolled: {
    label: 'Rolled',
    description: 'Roll six sets of 4d6 and drop the lowest die in each set.',
  },
}

export function formatStatMethod(method: StatMethod) {
  return STAT_METHOD_COPY[method].label
}

export function normalizeStatMethodForCampaign(current: StatMethod, required: StatMethod | null | undefined) {
  return required ?? current
}

export function getAllowedStatMethodOptions(required: StatMethod | null | undefined) {
  return (Object.keys(STAT_METHOD_COPY) as StatMethod[]).map((method) => ({
    id: method,
    label: STAT_METHOD_COPY[method].label,
    description: STAT_METHOD_COPY[method].description,
    disabledReason: required && method !== required
      ? `Campaign requires ${formatStatMethod(required)}.`
      : null,
  }))
}
