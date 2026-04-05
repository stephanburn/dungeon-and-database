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
      <span className="inline-block w-2 h-2 rounded-full bg-green-500" title={check.message} />
    )
  }

  const colour =
    check.severity === 'error'
      ? 'bg-red-500'
      : 'bg-amber-400'

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
        check.severity === 'error'
          ? 'bg-red-900/60 text-red-300'
          : 'bg-amber-900/60 text-amber-300'
      }`}
      title={check.message}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colour}`} />
      {check.message}
    </span>
  )
}

/** Summary badge showing overall pass/fail */
export function LegalitySummaryBadge({ passed, errorCount }: { passed: boolean; errorCount: number }) {
  if (passed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        Legal
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      {errorCount} {errorCount === 1 ? 'error' : 'errors'}
    </span>
  )
}
