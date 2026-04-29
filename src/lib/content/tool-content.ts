import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tool } from '@/lib/types/database'
import { getAllowedSources } from '@/lib/content-helpers'

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

  let builder = supabase
    .from('tools')
    .select('*')
    .order('sort_order')
    .order('name')
  if (allowedSources) builder = builder.in('source', Array.from(allowedSources))

  const { data, error } = await builder
  return {
    data: (data ?? []) as Tool[],
    error,
  }
}
