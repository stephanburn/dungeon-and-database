import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { LegalityCheck } from '@/lib/legality/engine'

interface LegalityBadgeProps {
  check: LegalityCheck | undefined
  /** Show nothing if check is undefined / passed */
  hideWhenPassed?: boolean
}

export function LegalityBadge({ check, hideWhenPassed = false }: LegalityBadgeProps) {
  if (!check) return null
  if (hideWhenPassed && check.passed) return null

  if (check.passed) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100"
        title={check.message}
      >
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Clear
      </span>
    )
  }

  const Icon = check.severity === 'error' ? AlertTriangle : Info
  const label = check.severity === 'error' ? 'Fix needed' : 'Review'

  return (
    <span
      className={`inline-flex items-start gap-2 rounded-xl border px-2.5 py-1.5 text-xs leading-5 ${
        check.severity === 'error'
          ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
          : 'border-amber-400/20 bg-amber-400/10 text-amber-100'
      }`}
      title={check.message}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium">{label}: </span>
        {check.message}
      </span>
    </span>
  )
}

/** Summary badge showing overall pass/fail */
export function LegalitySummaryBadge({ passed, errorCount }: { passed: boolean; errorCount: number }) {
  if (passed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Ready to submit
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-xs font-medium text-rose-100">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      {errorCount} {errorCount === 1 ? 'issue to fix' : 'issues to fix'}
    </span>
  )
}
