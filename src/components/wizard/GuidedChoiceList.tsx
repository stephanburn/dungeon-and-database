'use client'

import { Check, Lock, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type GuidedChoiceOption = {
  id: string
  label: string
  description?: string
  detail?: string
  disabledReason?: string | null
  prerequisiteLabel?: string | null
  replacesLabel?: string | null
}

type GuidedChoiceListProps = {
  title: string
  description?: string
  options: GuidedChoiceOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  selectionLimit: number
  emptyMessage?: string
}

function toggleSelection(
  selectedIds: string[],
  optionId: string,
  selectionLimit: number
) {
  if (selectionLimit === 1) {
    return selectedIds[0] === optionId ? [] : [optionId]
  }

  if (selectedIds.includes(optionId)) {
    return selectedIds.filter((id) => id !== optionId)
  }

  if (selectionLimit > 0 && selectedIds.length >= selectionLimit) {
    return selectedIds
  }

  return [...selectedIds, optionId]
}

function GuidedChoiceCard({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: GuidedChoiceOption
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const hasRichDetail = Boolean(
    option.description ||
    option.detail ||
    option.disabledReason ||
    option.prerequisiteLabel ||
    option.replacesLabel
  )

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'focus-ring w-full border text-left transition-colors',
        hasRichDetail
          ? 'rounded-xl px-4 py-4'
          : 'surface-row px-3 py-2.5',
        selected
          ? 'border-blue-400/35 bg-blue-400/10'
          : 'border-white/10 bg-white/[0.02]',
        !disabled && 'hover:border-white/20 hover:bg-white/[0.04]',
        disabled && !selected && 'opacity-70'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border',
            selected
              ? 'border-blue-300 bg-blue-300 text-neutral-950'
              : 'border-white/15 text-neutral-500'
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </div>

        <div className={cn('min-w-0 flex-1', hasRichDetail ? 'space-y-2' : 'space-y-1')}>
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('font-medium', selected ? 'text-blue-50' : 'text-neutral-100')}>{option.label}</p>
            {option.prerequisiteLabel && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                {option.prerequisiteLabel}
              </Badge>
            )}
            {option.replacesLabel && (
              <Badge variant="secondary" className="gap-1">
                <RefreshCcw className="h-3 w-3" />
                Replaces {option.replacesLabel}
              </Badge>
            )}
          </div>
          {option.description && (
            <p className="text-sm leading-6 text-neutral-400">{option.description}</p>
          )}
          {option.detail && (
            <p className="text-xs leading-5 text-neutral-500">{option.detail}</p>
          )}
          {option.disabledReason && (
            <p className="text-xs text-amber-200">{option.disabledReason}</p>
          )}
        </div>
      </div>
    </button>
  )
}

export function GuidedChoiceList({
  title,
  description,
  options,
  selectedIds,
  onChange,
  selectionLimit,
  emptyMessage = 'No options available yet.',
}: GuidedChoiceListProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-neutral-100">{title}</CardTitle>
        {description && (
          <p className="text-sm leading-6 text-neutral-400">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {options.length === 0 ? (
          <p className="text-sm text-neutral-500">{emptyMessage}</p>
        ) : (
          options.map((option) => {
            const selected = selectedIds.includes(option.id)
            const disabled = Boolean(option.disabledReason) && !selected
            return (
              <GuidedChoiceCard
                key={option.id}
                option={option}
                selected={selected}
                disabled={disabled}
                onSelect={() => onChange(toggleSelection(selectedIds, option.id, selectionLimit))}
              />
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export function GuidedChooseOne(
  props: Omit<GuidedChoiceListProps, 'selectionLimit' | 'selectedIds' | 'onChange'> & {
    selectedId: string | null
    onChange: (id: string | null) => void
  }
) {
  const { selectedId, onChange, ...rest } = props

  return (
    <GuidedChoiceList
      {...rest}
      selectedIds={selectedId ? [selectedId] : []}
      selectionLimit={1}
      onChange={(ids) => onChange(ids[0] ?? null)}
    />
  )
}

export function GuidedChooseMany(
  props: GuidedChoiceListProps
) {
  return <GuidedChoiceList {...props} />
}
