import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, FeatureOption, FeatureOptionGroup } from '@/lib/types/database'
import { getAllowedSources } from '@/lib/content-helpers'

type FeatureOptionGroupQuery = {
  campaignId?: string | null
  optionFamily?: string | null
  keys?: string[]
}

type FeatureOptionQuery = {
  campaignId?: string | null
  optionFamily?: string | null
  groupKeys?: string[]
}

export async function listFeatureOptionGroups(
  supabase: SupabaseClient<Database>,
  query: FeatureOptionGroupQuery = {}
) {
  const allowedSources = await getAllowedSources(supabase, query.campaignId ?? null)

  let builder = supabase.from('feature_option_groups').select('*').order('name')
  if (query.optionFamily) builder = builder.eq('option_family', query.optionFamily)
  if ((query.keys?.length ?? 0) > 0) builder = builder.in('key', query.keys ?? [])
  if (allowedSources) builder = builder.in('source', Array.from(allowedSources))

  const { data, error } = await builder
  return {
    data: (data ?? []) as FeatureOptionGroup[],
    error,
  }
}

export async function listFeatureOptions(
  supabase: SupabaseClient<Database>,
  query: FeatureOptionQuery = {}
) {
  const groupResult = await listFeatureOptionGroups(supabase, {
    campaignId: query.campaignId,
    optionFamily: query.optionFamily,
    keys: query.groupKeys,
  })
  if (groupResult.error) {
    return {
      data: [] as FeatureOption[],
      error: groupResult.error,
    }
  }

  const eligibleGroupKeys = (query.optionFamily || (query.groupKeys?.length ?? 0) > 0)
    ? groupResult.data.map((group) => group.key)
    : null

  if (eligibleGroupKeys && eligibleGroupKeys.length === 0) {
    return {
      data: [] as FeatureOption[],
      error: null,
    }
  }

  const allowedSources = await getAllowedSources(supabase, query.campaignId ?? null)

  let builder = supabase
    .from('feature_options')
    .select('*')
    .order('group_key')
    .order('option_order')
    .order('name')
  if (eligibleGroupKeys) builder = builder.in('group_key', eligibleGroupKeys)
  if (allowedSources) builder = builder.in('source', Array.from(allowedSources))

  const { data, error } = await builder
  return {
    data: (data ?? []) as FeatureOption[],
    error,
  }
}
