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
  return (
    <div className="sticky top-4 z-20 rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">{name || 'Unnamed Character'}</h1>
            <p className="text-sm text-neutral-400 mt-1">Level {totalLevel} · {campaignId}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
                className="border-blue-700 text-blue-300 hover:bg-blue-900/30"
              >
                {submitting ? 'Submitting…' : 'Submit for review'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-neutral-900 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">HP</p>
            <p className="text-xl font-semibold text-neutral-100">{hpMax}</p>
          </div>
          <div className="rounded-xl bg-neutral-900 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Initiative</p>
            <p className="text-xl font-semibold text-neutral-100">{initiative}</p>
          </div>
          <div className="rounded-xl bg-neutral-900 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Speed</p>
            <p className="text-xl font-semibold text-neutral-100">{speed}</p>
          </div>
          <div className="rounded-xl bg-neutral-900 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Passive Perception</p>
            <p className="text-xl font-semibold text-neutral-100">{passivePerception}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
