'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatModifier, type DerivedCharacterCore } from '@/lib/characters/derived'

type HitPointsCardProps = {
  derivedCore: DerivedCharacterCore
  hpMax: number
  canEdit: boolean
  onHpMaxChange: (value: number) => void
}

export function HitPointsCard({
  derivedCore,
  hpMax,
  canEdit,
  onHpMaxChange,
}: HitPointsCardProps) {
  return (
    <div className="panel-subtle">
      <CardHeader>
        <CardTitle className="text-neutral-200">Hit Points</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Label className="text-neutral-300 w-16">HP Max</Label>
          {canEdit ? (
            <Input
              type="number"
              min={0}
              value={hpMax}
              onChange={(event) => onHpMaxChange(parseInt(event.target.value, 10) || 0)}
              className="w-24"
            />
          ) : (
            <span className="text-2xl font-bold text-neutral-100">{hpMax}</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Stored Max</p>
            <p className="mt-2 text-lg font-semibold text-neutral-100">{derivedCore.hitPoints.max}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Estimated From Levels</p>
            <p className="mt-2 text-lg font-semibold text-neutral-100">
              {derivedCore.hitPoints.estimatedFromLevels ?? <>&mdash;</>}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Possible Range</p>
            <p className="mt-2 text-lg font-semibold text-neutral-100">
              {derivedCore.hitPoints.minimumPossible !== null && derivedCore.hitPoints.maximumPossible !== null
                ? `${derivedCore.hitPoints.minimumPossible}-${derivedCore.hitPoints.maximumPossible}`
                : <>&mdash;</>}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">CON Per Level</p>
            <p className="mt-2 text-lg font-semibold text-neutral-100">
              {formatModifier(derivedCore.hitPoints.constitutionModifier)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-neutral-400">
          <p>
            Hit dice: {derivedCore.hitPoints.hitDice.length > 0
              ? derivedCore.hitPoints.hitDice
                  .map((entry) => `${entry.level}d${entry.dieSize ?? '?'} ${entry.className}`)
                  .join(' · ')
              : <>&mdash;</>}
          </p>
          {derivedCore.hitPoints.usesInferredLevels && (
            <p>
              HP estimate infers {derivedCore.hitPoints.inferredLevelCount} level
              {derivedCore.hitPoints.inferredLevelCount === 1 ? '' : 's'} using fixed average where no per-level HP roll is recorded.
            </p>
          )}
        </div>
      </CardContent>
    </div>
  )
}
