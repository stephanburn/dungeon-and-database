import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Returns the set of allowed source keys for a campaign.
 * If campaign_id is null, returns null (no filtering applied).
 */
export async function getAllowedSources(
  supabase: SupabaseClient<Database>,
  campaignId: string | null
): Promise<Set<string> | null> {
  if (!campaignId) return null

  const { data } = await supabase
    .from('campaign_source_allowlist')
    .select('source_key')
    .eq('campaign_id', campaignId)

  if (!data || data.length === 0) return null
  return new Set(data.map((r) => r.source_key))
}

/**
 * Filters a Supabase query builder by source allowlist.
 * Returns the allowlist set so callers can use it for additional filtering.
 */
export function applySourceFilter<T extends { in: (col: string, vals: string[]) => T }>(
  query: T,
  allowedSources: Set<string> | null
): T {
  if (!allowedSources) return query
  return query.in('source', Array.from(allowedSources))
}
