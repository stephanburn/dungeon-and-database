import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tool } from '@/lib/types/database'
import { applySourceFilter, getAllowedSources, hasContentLoadError } from '@/lib/content-helpers'

type ToolQuery = {
  campaignId?: string | null
}

export function normalizeToolName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function buildToolKeyByNameMap(
  tools: Array<Pick<Tool, 'key' | 'name'>>
) {
  return new Map(
    tools.map((tool) => [normalizeToolName(tool.name), tool.key])
  )
}

export function buildToolNameByKeyMap(
  tools: Array<Pick<Tool, 'key' | 'name'>>
) {
  return new Map(
    tools.map((tool) => [tool.key, tool.name])
  )
}

export async function listTools(
  supabase: SupabaseClient<Database>,
  query: ToolQuery = {}
) {
  const allowedSources = await getAllowedSources(supabase, query.campaignId ?? null)
  if (hasContentLoadError(allowedSources)) return { data: [] as Tool[], error: allowedSources.error }

  let builder = supabase
    .from('tools')
    .select('*')
    .order('sort_order')
    .order('name')
  builder = applySourceFilter(builder, allowedSources)

  const { data, error } = await builder
  return {
    data: (data ?? []) as Tool[],
    error,
  }
}
