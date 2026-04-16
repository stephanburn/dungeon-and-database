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
    choices
      .filter((choice) => choice.option_group_key === definitions[0]?.optionGroupKey)
      .map((choice) => [choice.option_key, choice.selected_value?.class_id])
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
        selected_value: { class_id: value },
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

          return (
            <div key={definition.optionKey} className="space-y-1">
              <p className="text-sm font-medium text-neutral-200">{definition.label}</p>
              {definition.description ? (
                <p className="text-xs text-neutral-500">{definition.description}</p>
              ) : null}
              {canEdit ? (
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
              ) : (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-sm text-neutral-300">
                  {definition.choices.find((choice) => choice.value === selectedValue)?.label ?? 'No option selected'}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
