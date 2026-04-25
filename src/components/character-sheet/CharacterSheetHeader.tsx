'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LegalitySummaryBadge } from './LegalityBadge'

interface CharacterSheetHeaderProps {
  name: string
  totalLevel: number
  campaignId: string
  statusLabel: string
  statusClassName: string
  legalityPassed: boolean | null
  legalityErrorCount: number
  hpMax: number
  initiative: string
  speed: string
  passivePerception: number
  canEdit: boolean
  canSubmit: boolean
  saving: boolean
  submitting: boolean
  onSave: () => void
  onSubmit: () => void
}

export function CharacterSheetHeader({
  name,
  totalLevel,
  campaignId,
  statusLabel,
  statusClassName,
  legalityPassed,
  legalityErrorCount,
  hpMax,
  initiative,
  speed,
  passivePerception,
  canEdit,
  canSubmit,
  saving,
  submitting,
  onSave,
  onSubmit,
}: CharacterSheetHeaderProps) {
  const sheetStatSummary = [
    { label: 'HP', value: hpMax },
    { label: 'Init', value: initiative },
    { label: 'Speed', value: speed },
    { label: 'Passive', value: passivePerception },
  ]

  return (
    <div className="surface-primary sticky top-4 z-20 bg-neutral-950/88 backdrop-blur-xl">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-metadata">Character Sheet</p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-neutral-50">{name || 'Unnamed Character'}</h1>
            <p className="mt-1 text-sm text-neutral-400">Level {totalLevel} in {campaignId}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge className={`${statusClassName} border-0 text-sm`}>{statusLabel}</Badge>
            {legalityPassed !== null && (
              <LegalitySummaryBadge passed={legalityPassed} errorCount={legalityErrorCount} />
            )}
            {canEdit && (
              <Button onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
            {canSubmit && (
              <Button
                variant="outline"
                onClick={onSubmit}
                disabled={submitting}
                className="border-blue-400/20 bg-blue-400/10 text-blue-50 hover:bg-blue-400/15"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </Button>
            )}
          </div>
        </div>

        <dl aria-label="Character quick stats" className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/8 pt-3 text-sm">
          {sheetStatSummary.map((item) => (
            <div key={item.label} className="inline-flex items-baseline gap-1.5">
              <dt className="text-neutral-500">{item.label}</dt>
              <dd className="font-medium text-neutral-100">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
