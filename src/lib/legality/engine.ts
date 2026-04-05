import type { CheckSeverity } from '@/lib/types/database'

// ── Result shape (Section 4.3) ─────────────────────────────

export interface LegalityCheck {
  key: string
  passed: boolean
  message: string
  severity: CheckSeverity
}

export interface LegalityResult {
  passed: boolean
  checks: LegalityCheck[]
}

// ── Input shape ────────────────────────────────────────────

export interface LegalityInput {
  // Campaign context
  allowedSources: string[]
  campaignSettings: {
    stat_method: 'point_buy' | 'standard_array' | 'rolled'
    max_level: number
  }

  // Character data
  statMethod: 'point_buy' | 'standard_array' | 'rolled'
  baseStats: {
    str: number; dex: number; con: number
    int: number; wis: number; cha: number
  }
  totalLevel: number

  // Sources of chosen content (null = not yet chosen)
  speciesSource: string | null
  backgroundSource: string | null
  classSources: string[]       // one per class_id chosen
  subclassSources: string[]    // one per subclass chosen
  spellSources: string[]       // sources of all spells on sheet
  featSources: string[]        // sources of all feats on sheet

  // For rolled stat validation
  statRolls: Array<{
    assigned_to: string
    roll_set: number[]
  }>
}

// ── Point buy constants ────────────────────────────────────

const POINT_BUY_BUDGET = 27
// cost[score - 8]: index 0 = score 8, index 7 = score 15
const POINT_BUY_COST = [0, 1, 2, 3, 4, 5, 7, 9]

function pointBuyCost(score: number): number | null {
  const idx = score - 8
  if (idx < 0 || idx >= POINT_BUY_COST.length) return null
  return POINT_BUY_COST[idx]
}

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

// ── Individual checks ──────────────────────────────────────

function checkSourceAllowlist(input: LegalityInput): LegalityCheck {
  const allowed = new Set(input.allowedSources)

  const violations: string[] = []

  if (input.speciesSource && !allowed.has(input.speciesSource)) {
    violations.push(`species (${input.speciesSource})`)
  }
  if (input.backgroundSource && !allowed.has(input.backgroundSource)) {
    violations.push(`background (${input.backgroundSource})`)
  }
  for (const src of input.classSources) {
    if (!allowed.has(src)) violations.push(`class (${src})`)
  }
  for (const src of input.subclassSources) {
    if (!allowed.has(src)) violations.push(`subclass (${src})`)
  }
  for (const src of input.spellSources) {
    if (!allowed.has(src)) violations.push(`spell (${src})`)
  }
  for (const src of input.featSources) {
    if (!allowed.has(src)) violations.push(`feat (${src})`)
  }

  const passed = violations.length === 0
  return {
    key: 'source_allowlist',
    passed,
    message: passed
      ? 'All content sources are allowed.'
      : `Content from disallowed sources: ${violations.join(', ')}.`,
    severity: 'error',
  }
}

function checkStatMethod(input: LegalityInput): LegalityCheck {
  const { statMethod, baseStats, statRolls } = input
  const scores = [
    baseStats.str, baseStats.dex, baseStats.con,
    baseStats.int, baseStats.wis, baseStats.cha,
  ]

  if (statMethod === 'point_buy') {
    let total = 0
    const invalid: number[] = []

    for (const score of scores) {
      const cost = pointBuyCost(score)
      if (cost === null) {
        invalid.push(score)
      } else {
        total += cost
      }
    }

    if (invalid.length > 0) {
      return {
        key: 'stat_method',
        passed: false,
        message: `Point buy scores must be between 8 and 15. Invalid scores: ${invalid.join(', ')}.`,
        severity: 'error',
      }
    }
    if (total !== POINT_BUY_BUDGET) {
      return {
        key: 'stat_method',
        passed: false,
        message: `Point buy total must be exactly ${POINT_BUY_BUDGET} points. Current total: ${total}.`,
        severity: 'error',
      }
    }
    return { key: 'stat_method', passed: true, message: 'Point buy scores are valid.', severity: 'error' }
  }

  if (statMethod === 'standard_array') {
    const sorted = [...scores].sort((a, b) => b - a)
    const expected = [...STANDARD_ARRAY].sort((a, b) => b - a)
    const valid = sorted.every((v, i) => v === expected[i])
    return {
      key: 'stat_method',
      passed: valid,
      message: valid
        ? 'Standard array scores are valid.'
        : `Standard array must use exactly [${STANDARD_ARRAY.join(', ')}]. Got [${sorted.join(', ')}].`,
      severity: 'error',
    }
  }

  if (statMethod === 'rolled') {
    const assignedStats = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    const coveredStats = new Set(statRolls.map((r) => r.assigned_to))
    const missing = assignedStats.filter((s) => !coveredStats.has(s))

    if (missing.length > 0) {
      return {
        key: 'stat_method',
        passed: false,
        message: `Rolled stats missing assignments for: ${missing.join(', ')}.`,
        severity: 'error',
      }
    }

    // Each roll_set must have 4 values (4d6 drop lowest)
    const invalidRolls = statRolls.filter((r) => r.roll_set.length !== 4)
    if (invalidRolls.length > 0) {
      return {
        key: 'stat_method',
        passed: false,
        message: 'Each rolled stat must have exactly 4 dice values recorded.',
        severity: 'error',
      }
    }

    return { key: 'stat_method', passed: true, message: 'Rolled stats are valid.', severity: 'error' }
  }

  return { key: 'stat_method', passed: false, message: 'Unknown stat method.', severity: 'error' }
}

function checkLevelCap(input: LegalityInput): LegalityCheck {
  const { totalLevel, campaignSettings } = input
  const passed = totalLevel <= campaignSettings.max_level
  return {
    key: 'level_cap',
    passed,
    message: passed
      ? `Character level (${totalLevel}) is within the campaign maximum (${campaignSettings.max_level}).`
      : `Character level (${totalLevel}) exceeds the campaign maximum (${campaignSettings.max_level}).`,
    severity: 'error',
  }
}

function checkStatMethodConsistency(input: LegalityInput): LegalityCheck {
  const passed = input.statMethod === input.campaignSettings.stat_method
  return {
    key: 'stat_method_consistency',
    passed,
    message: passed
      ? 'Stat generation method matches campaign setting.'
      : `Campaign requires ${input.campaignSettings.stat_method} but character uses ${input.statMethod}.`,
    severity: 'error',
  }
}

// ── Main engine ────────────────────────────────────────────

export function runLegalityChecks(input: LegalityInput): LegalityResult {
  const checks: LegalityCheck[] = [
    checkSourceAllowlist(input),
    checkStatMethodConsistency(input),
    checkStatMethod(input),
    checkLevelCap(input),
  ]

  const passed = checks
    .filter((c) => c.severity === 'error')
    .every((c) => c.passed)

  return { passed, checks }
}
