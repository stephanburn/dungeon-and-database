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
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" title={check.message} />
    )
  }

  const colour =
    check.severity === 'error'
      ? 'bg-rose-400'
      : 'bg-amber-300'

  return (
    <span
      className={`inline-flex items-start gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium leading-5 ${
        check.severity === 'error'
          ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
          : 'border-amber-400/20 bg-amber-400/10 text-amber-100'
      }`}
      title={check.message}
    >
      <span className={`mt-1 h-1.5 w-1.5 rounded-full ${colour}`} />
      {check.message}
    </span>
  )
}

/** Summary badge showing overall pass/fail */
export function LegalitySummaryBadge({ passed, errorCount }: { passed: boolean; errorCount: number }) {
  if (passed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Ready to submit
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-xs font-medium text-rose-100">
      <span className="h-2 w-2 rounded-full bg-rose-400" />
      {errorCount} {errorCount === 1 ? 'issue to fix' : 'issues to fix'}
    </span>
  )
}
