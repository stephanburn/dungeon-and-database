import type { LegalityCheck, LegalityInput } from './types'

export function checkSourceAllowlist(input: LegalityInput): LegalityCheck {
  if (input.allowedSources.length === 0) {
    return {
      key: 'source_allowlist',
      passed: true,
      message: 'Campaign has no explicit source allowlist.',
      severity: 'error',
    }
  }

  const allowed = new Set(input.allowedSources)
  const violations: string[] = []

  if (input.speciesSource && !allowed.has(input.speciesSource)) {
    violations.push(`species (${input.speciesSource})`)
  }
  if (input.background && !allowed.has(input.background.source)) {
    violations.push(`background (${input.background.source})`)
  }
  for (const src of input.sourceCollections.classSources) {
    if (!allowed.has(src)) violations.push(`class (${src})`)
  }
  for (const src of input.sourceCollections.subclassSources) {
    if (!allowed.has(src)) violations.push(`subclass (${src})`)
  }
  for (const src of input.sourceCollections.spellSources) {
    if (!allowed.has(src)) violations.push(`spell (${src})`)
  }
  for (const src of input.sourceCollections.featSources) {
    if (!allowed.has(src)) violations.push(`feat (${src})`)
  }

  return {
    key: 'source_allowlist',
    passed: violations.length === 0,
    message: violations.length === 0
      ? 'All content sources are allowed.'
      : `Content from disallowed sources: ${violations.join(', ')}.`,
    severity: 'error',
  }
}

export function checkRuleSetConsistency(input: LegalityInput): LegalityCheck {
  const usedSources = [
    input.speciesSource,
    input.background?.source ?? null,
    ...input.sourceCollections.classSources,
    ...input.sourceCollections.subclassSources,
    ...input.sourceCollections.spellSources,
    ...input.sourceCollections.featSources,
  ].filter((value): value is string => Boolean(value))

  const mismatches: string[] = []
  for (const source of usedSources) {
    const sourceRuleSet = input.allSourceRuleSets[source]
    if (sourceRuleSet && sourceRuleSet !== input.campaignRuleSet && !mismatches.includes(source)) {
      mismatches.push(source)
    }
  }

  return {
    key: 'rule_set_consistency',
    passed: mismatches.length === 0,
    message: mismatches.length === 0
      ? `All content matches campaign rule set (${input.campaignRuleSet}).`
      : `Campaign uses ${input.campaignRuleSet} rules but content from incompatible sources: ${mismatches.join(', ')}.`,
    severity: 'warning',
  }
}
