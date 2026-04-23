import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Campaign,
  CampaignSourceAllowlist,
  Database,
  RuleSet,
  Source,
} from '@/lib/types/database'

type SourceRuleSetRow = Pick<Source, 'key' | 'rule_set'>
type AllowlistRow = Pick<CampaignSourceAllowlist, 'source_key'>

export type WizardCampaignContext = {
  campaign: Campaign
  allowedSources: string[]
  allSourceRuleSets: Record<string, RuleSet>
}

export function buildAllSourceRuleSets(
  sources: SourceRuleSetRow[]
): Record<string, RuleSet> {
  return Object.fromEntries(
    sources.map((source) => [source.key, source.rule_set])
  )
}

export function resolveAllowedSources(
  allowlistRows: AllowlistRow[],
  sources: SourceRuleSetRow[]
): string[] {
  const explicitAllowlist = Array.from(
    new Set(
      allowlistRows
        .map((row) => row.source_key)
        .filter((value): value is string => Boolean(value))
    )
  )

  if (explicitAllowlist.length > 0) {
    return explicitAllowlist
  }

  return Array.from(
    new Set(
      sources
        .map((source) => source.key)
        .filter((value): value is string => Boolean(value))
    )
  )
}

export async function loadCampaignWizardContext(
  supabase: SupabaseClient<Database>,
  campaignId: string
): Promise<WizardCampaignContext | null> {
  const [campaignResult, allowlistResult, sourcesResult] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', campaignId).single(),
    supabase
      .from('campaign_source_allowlist')
      .select('source_key')
      .eq('campaign_id', campaignId),
    supabase.from('sources').select('key, rule_set'),
  ])

  if (campaignResult.error || !campaignResult.data) {
    return null
  }

  const sourceRows = (sourcesResult.data ?? []) as SourceRuleSetRow[]
  const allowlistRows = (allowlistResult.data ?? []) as AllowlistRow[]

  return {
    campaign: campaignResult.data as Campaign,
    allowedSources: resolveAllowedSources(allowlistRows, sourceRows),
    allSourceRuleSets: buildAllSourceRuleSets(sourceRows),
  }
}
