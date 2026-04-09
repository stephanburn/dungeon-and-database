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
    <div className="sticky top-4 z-20 rounded-3xl border border-white/10 bg-neutral-950/88 backdrop-blur-xl">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">Character Sheet</p>
            <h1 className="mt-2 text-3xl font-semibold text-neutral-50">{name || 'Unnamed Character'}</h1>
            <p className="mt-1 text-sm text-neutral-400">Level {totalLevel} in {campaignId}</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
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
                {submitting ? 'Submitting…' : 'Submit for review'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">HP</p>
            <p className="mt-2 text-xl font-semibold text-neutral-100">{hpMax}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Initiative</p>
            <p className="mt-2 text-xl font-semibold text-neutral-100">{initiative}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Speed</p>
            <p className="mt-2 text-xl font-semibold text-neutral-100">{speed}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Passive Perception</p>
            <p className="mt-2 text-xl font-semibold text-neutral-100">{passivePerception}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
