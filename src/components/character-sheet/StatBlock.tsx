import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
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
}

export function StatBlock({
  values,
  onChange,
  readOnly = false,
  statMethod = 'point_buy',
  racialBonuses = {},
}: StatBlockProps) {
  const spent = totalPointsSpent(values)
  const remaining = 27 - spent

  return (
    <div className="space-y-3">
      {/* Point buy budget tracker */}
      {!readOnly && statMethod === 'point_buy' && (
        <p className={`text-sm font-medium ${
          remaining < 0 ? 'text-red-400' : remaining === 0 ? 'text-green-400' : 'text-neutral-400'
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

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {STATS.map((stat) => {
          const base = values[stat]
          const racial = racialBonuses[stat] ?? 0
          const effective = base + racial
          const outOfRange = statMethod === 'point_buy' && !(base in POINT_COST)

          return (
            <div
              key={stat}
              className={`flex flex-col items-center gap-1 rounded-lg p-3 border ${
                outOfRange
                  ? 'bg-red-950/30 border-red-700'
                  : 'bg-neutral-800 border-neutral-700'
              }`}
            >
              <Label className="text-xs font-bold text-neutral-400 tracking-widest">
                {ABILITY_LABELS[stat]}
              </Label>

              {/* Modifier based on effective score */}
              <span className="text-2xl font-bold text-neutral-100">
                {modifier(effective)}
              </span>

              {/* Effective score */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-neutral-200">{effective}</span>
                {racial !== 0 && (
                  <span className="rounded-full bg-blue-950 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                    {racial > 0 ? `+${racial}` : racial}
                  </span>
                )}
              </div>

              {/* Base score input / display */}
              {readOnly ? (
                racial !== 0 && (
                  <span className="text-xs text-neutral-500">
                    {base} {racial > 0 ? `+${racial}` : racial}
                  </span>
                )
              ) : statMethod === 'standard_array' ? (
                <Select
                  value={String(base)}
                  onValueChange={(v) => onChange?.(stat, parseInt(v, 10))}
                >
                  <SelectTrigger className="w-full text-center text-xs bg-neutral-700 border-neutral-600 text-neutral-100 h-7 px-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
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
                  className="w-full text-center text-xs bg-neutral-700 border-neutral-600 text-neutral-100 h-7 px-1"
                />
              )}

              {/* Racial bonus indicator */}
              {!readOnly && racial !== 0 && (
                <span className="text-xs text-neutral-500">
                  species bonus
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
