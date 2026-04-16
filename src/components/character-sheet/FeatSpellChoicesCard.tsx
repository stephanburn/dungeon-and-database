'use client'

import { useMemo } from 'react'
import type { Class, Feat, Spell } from '@/lib/types/database'
import { FeatureSpellChoicesCard } from '@/components/character-sheet/FeatureSpellChoicesCard'
import { getFeatSpellChoiceDefinitions } from '@/lib/characters/feat-spell-options'

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

export function FeatSpellChoicesCard(props: FeatSpellChoicesCardProps) {
  const definitions = useMemo(
    () => getFeatSpellChoiceDefinitions(props.activeFeats),
    [props.activeFeats]
  )

  return (
    <FeatureSpellChoicesCard
      title="Feat Spell Choices"
      definitions={definitions}
      campaignId={props.campaignId}
      classList={props.classList}
      selectedChoices={props.selectedChoices}
      canEdit={props.canEdit}
      onChange={props.onChange}
      onOptionsLoaded={props.onOptionsLoaded}
    />
  )
}
