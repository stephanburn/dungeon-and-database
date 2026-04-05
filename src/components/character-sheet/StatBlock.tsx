import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ABILITY_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON',
  int: 'INT', wis: 'WIS', cha: 'CHA',
}

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

interface StatBlockProps {
  values: { str: number; dex: number; con: number; int: number; wis: number; cha: number }
  onChange?: (stat: string, value: number) => void
  readOnly?: boolean
}

export function StatBlock({ values, onChange, readOnly = false }: StatBlockProps) {
  const stats = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div
          key={stat}
          className="flex flex-col items-center gap-1 bg-neutral-800 rounded-lg p-3 border border-neutral-700"
        >
          <Label className="text-xs font-bold text-neutral-400 tracking-widest">
            {ABILITY_LABELS[stat]}
          </Label>
          <span className="text-2xl font-bold text-neutral-100">
            {modifier(values[stat])}
          </span>
          {readOnly ? (
            <span className="text-sm text-neutral-300">{values[stat]}</span>
          ) : (
            <Input
              type="number"
              min={1}
              max={30}
              value={values[stat]}
              onChange={(e) => onChange?.(stat, parseInt(e.target.value, 10) || 8)}
              className="w-full text-center text-sm bg-neutral-700 border-neutral-600 text-neutral-100 h-7 px-1"
            />
          )}
        </div>
      ))}
    </div>
  )
}
