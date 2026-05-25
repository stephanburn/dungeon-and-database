import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type ContentLoadError = {
  scope: string
  message: string
}

export type AllowedSources =
  | { sources: Set<string> | null }
  | { error: ContentLoadError }

export function hasContentLoadError(
  result: AllowedSources
): result is { error: ContentLoadError } {
  return 'error' in result
}

/**
 * Returns the set of allowed source keys for a campaign.
 * If campaign_id is null, returns null (no filtering applied).
 */
export async function getAllowedSources(
  supabase: SupabaseClient<Database>,
  campaignId: string | null
): Promise<AllowedSources> {
  if (!campaignId) return { sources: null }

  const { data, error } = await supabase
    .from('campaign_source_allowlist')
    .select('source_key')
    .eq('campaign_id', campaignId)

  if (error) {
    return {
      error: {
        scope: 'campaign_source_allowlist',
        message: error.message,
      },
    }
  }

  if (!data || data.length === 0) return { sources: null }
  return { sources: new Set(data.map((r) => r.source_key)) }
}

/**
 * Filters a Supabase query builder by source allowlist.
 * Returns the allowlist set so callers can use it for additional filtering.
 */
export function applySourceFilter<T extends { in: (col: string, vals: string[]) => T }>(
  query: T,
  allowedSources: { sources: Set<string> | null }
): T {
  if (!allowedSources.sources) return query
  return query.in('source', Array.from(allowedSources.sources))
}
