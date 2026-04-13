'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { Species } from '@/lib/types/database'
import {
  getAbilityChoiceLabel,
  getAvailableSpeciesAbilityChoices,
  getSpeciesAbilityChoiceLimit,
  type AbilityKey,
} from '@/lib/characters/species-ability-bonus-provenance'

type SpeciesAbilityBonusCardProps = {
  species: Species | null
  selectedChoices: AbilityKey[]
  canEdit: boolean
  onChange: (choices: AbilityKey[]) => void
}

export function SpeciesAbilityBonusCard({
  species,
  selectedChoices,
  canEdit,
  onChange,
}: SpeciesAbilityBonusCardProps) {
  const options = getAvailableSpeciesAbilityChoices(species)
  const limit = getSpeciesAbilityChoiceLimit(species)

  if (options.length === 0 || limit === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-neutral-100">Flexible Species Ability Bonus</h3>
        <p className="mt-1 text-sm text-neutral-400">
          {species?.name} grants {limit} extra ability increase{limit === 1 ? '' : 's'} to choose explicitly.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((ability) => (
          <label
            key={ability}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-neutral-300"
          >
            <Checkbox
              checked={selectedChoices.includes(ability)}
              disabled={!canEdit || (!selectedChoices.includes(ability) && selectedChoices.length >= limit)}
              onChange={(event) => {
                if (event.currentTarget.checked) {
                  onChange([...selectedChoices, ability].slice(0, limit))
                  return
                }
                onChange(selectedChoices.filter((entry) => entry !== ability))
              }}
            />
            <span>{getAbilityChoiceLabel(ability)} (+1)</span>
          </label>
        ))}
      </div>
    </div>
  )
}
