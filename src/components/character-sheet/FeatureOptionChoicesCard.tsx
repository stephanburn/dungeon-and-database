'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FeatureOptionChoiceInput } from '@/lib/characters/choice-persistence'
import type { FeatureOptionChoiceDefinition } from '@/lib/characters/feature-grants'

interface FeatureOptionChoicesCardProps {
  title: string
  definitions: FeatureOptionChoiceDefinition[]
  choices: FeatureOptionChoiceInput[]
  canEdit: boolean
  onChange: (choices: FeatureOptionChoiceInput[]) => void
}

export function FeatureOptionChoicesCard({
  title,
  definitions,
  choices,
  canEdit,
  onChange,
}: FeatureOptionChoicesCardProps) {
  if (definitions.length === 0) return null

  const selectedValuesByOptionKey = new Map(
    definitions.map((definition) => {
      const row = choices.find(
        (choice) => choice.option_group_key === definition.optionGroupKey && choice.option_key === definition.optionKey
      )
      const valueKey = definition.valueKey ?? 'class_id'
      const selectedValue = row?.selected_value?.[valueKey]
      return [
        definition.optionKey,
        typeof selectedValue === 'string' ? selectedValue : '',
      ] as const
    })
  )

  function setChoice(definition: FeatureOptionChoiceDefinition, value: string) {
    const remaining = choices.filter(
      (choice) => !(choice.option_group_key === definition.optionGroupKey && choice.option_key === definition.optionKey)
    )

    if (!value || value === 'none') {
      onChange(remaining)
      return
    }

    onChange([
      ...remaining,
      {
        option_group_key: definition.optionGroupKey,
        option_key: definition.optionKey,
        selected_value: { [definition.valueKey ?? 'class_id']: value },
        choice_order: definition.choiceOrder,
        character_level_id: null,
        source_category: definition.sourceCategory,
        source_entity_id: definition.sourceEntityId,
        source_feature_key: definition.sourceFeatureKey,
      },
    ])
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-neutral-200">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {definitions.map((definition) => {
          const selectedValue = typeof selectedValuesByOptionKey.get(definition.optionKey) === 'string'
            ? selectedValuesByOptionKey.get(definition.optionKey) as string
            : ''
          const otherSelectedValues = new Set(
            Array.from(selectedValuesByOptionKey.entries())
              .filter(([optionKey]) => optionKey !== definition.optionKey)
              .map(([, value]) => value)
              .filter((value): value is string => typeof value === 'string' && value.length > 0)
          )
          const selectedChoice = definition.choices.find((choice) => choice.value === selectedValue) ?? null

          return (
            <div key={definition.optionKey} className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-200">{definition.label}</p>
                  {definition.description ? (
                    <p className="text-xs text-neutral-500">{definition.description}</p>
                  ) : null}
                </div>
                {selectedChoice ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-100">
                    {selectedChoice.label}
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Unselected
                  </span>
                )}
              </div>
              {canEdit ? (
                <div className="space-y-2">
                  <Select
                    value={selectedValue || 'none'}
                    onValueChange={(value) => setChoice(definition, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-neutral-400">Choose later</SelectItem>
                      {definition.choices
                        .filter((choice) => choice.value === selectedValue || !otherSelectedValues.has(choice.value))
                        .map((choice) => (
                          <SelectItem key={choice.value} value={choice.value} className="text-neutral-200">
                            {choice.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedChoice?.description ? (
                    <p className="text-sm leading-6 text-neutral-300">{selectedChoice.description}</p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-neutral-300">
                    {selectedChoice?.label ?? 'No option selected'}
                  </div>
                  {selectedChoice?.description ? (
                    <p className="text-sm leading-6 text-neutral-400">{selectedChoice.description}</p>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
