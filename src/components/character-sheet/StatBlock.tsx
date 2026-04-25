import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { abilityModifier, formatModifier, type DerivedAbilityScore } from '@/lib/characters/derived'
import type { StatMethod } from '@/lib/types/database'

const ABILITY_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON',
  int: 'INT', wis: 'WIS', cha: 'CHA',
}

const STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

// Point cost to raise a score from 8; only 8–15 are legal for point buy
const POINT_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
}

function totalPointsSpent(values: Record<string, number>): number {
  return STATS.reduce((sum, s) => sum + (POINT_COST[values[s]] ?? 0), 0)
}

interface StatBlockProps {
  values: { str: number; dex: number; con: number; int: number; wis: number; cha: number }
  onChange?: (stat: string, value: number) => void
  readOnly?: boolean
  statMethod?: StatMethod
  racialBonuses?: Partial<Record<string, number>>
  derivedAbilities?: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', DerivedAbilityScore>
}

export function StatBlock({
  values,
  onChange,
  readOnly = false,
  statMethod = 'point_buy',
  racialBonuses = {},
  derivedAbilities,
}: StatBlockProps) {
  const spent = totalPointsSpent(values)
  const remaining = 27 - spent

  return (
    <div className="space-y-4">
      {/* Point buy budget tracker */}
      {!readOnly && statMethod === 'point_buy' && (
        <p className={`text-sm font-medium ${
          remaining < 0 ? 'text-rose-300' : remaining === 0 ? 'text-emerald-300' : 'text-neutral-400'
        }`}>
          Points: {spent} / 27
          {remaining > 0 && ` · ${remaining} remaining`}
          {remaining < 0 && ` · ${Math.abs(remaining)} over budget`}
          {remaining === 0 && ' · budget exactly spent'}
        </p>
      )}

      {/* Standard array legend */}
      {!readOnly && statMethod === 'standard_array' && (
        <p className="text-sm text-neutral-400">
          Assign each value exactly once: 15 · 14 · 13 · 12 · 10 · 8
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {STATS.map((stat) => {
          const base = values[stat]
          const derivedAbility = derivedAbilities?.[stat]
          const racial = derivedAbility?.bonus ?? racialBonuses[stat] ?? 0
          const effective = derivedAbility?.adjusted ?? base + racial
          const effectiveModifier = derivedAbility?.modifier ?? abilityModifier(effective)
          const outOfRange = statMethod === 'point_buy' && !(base in POINT_COST)
          const contributors = derivedAbility?.contributors ?? []

          return (
            <div
              key={stat}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 ${
                outOfRange
                  ? 'border-rose-500/25 bg-rose-500/10'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <Label className="text-[11px] font-semibold text-neutral-500 tracking-[0.18em]">
                {ABILITY_LABELS[stat]}
              </Label>

              {/* Modifier based on effective score */}
              <span className="text-2xl font-bold text-neutral-100">
                {formatModifier(effectiveModifier)}
              </span>

              {/* Effective score */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-sm font-medium text-neutral-200">{effective}</span>
                {racial !== 0 && (
                  <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-100">
                    {racial > 0 ? `+${racial}` : racial}
                  </span>
                )}
              </div>

              {/* Base score input / display */}
              {readOnly ? (
                <span className="text-xs text-neutral-500">
                  Base {base}
                </span>
              ) : statMethod === 'standard_array' ? (
                <Select
                  value={String(base)}
                  onValueChange={(v) => onChange?.(stat, parseInt(v, 10))}
                >
                  <SelectTrigger className="h-8 w-full px-2 text-center text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_ARRAY.map((v) => {
                      const usedElsewhere = STATS.some((s) => s !== stat && values[s] === v)
                      return (
                        <SelectItem
                          key={v}
                          value={String(v)}
                          disabled={usedElsewhere}
                          className={usedElsewhere ? 'text-neutral-500' : 'text-neutral-200'}
                        >
                          {v}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  min={statMethod === 'point_buy' ? 8 : 3}
                  max={statMethod === 'point_buy' ? 15 : 20}
                  value={base}
                  onChange={(e) => onChange?.(stat, parseInt(e.target.value, 10) || 8)}
                  className="h-8 w-full px-2 text-center text-xs"
                />
              )}

              {/* Racial bonus indicator */}
              {!readOnly && racial !== 0 && (
                <span className="text-xs text-neutral-500">
                  Base {base}
                </span>
              )}

              {contributors.length > 0 && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  {contributors.map((contributor, index) => (
                    <span
                      key={`${stat}-${contributor.label}-${index}`}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-center text-[10px] leading-4 text-neutral-400"
                    >
                      {contributor.label}: {formatModifier(contributor.bonus)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
