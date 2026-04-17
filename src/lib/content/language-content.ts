import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Language } from '@/lib/types/database'
import { getAllowedSources } from '@/lib/content-helpers'

type LanguageQuery = {
  campaignId?: string | null
}

export function normalizeLanguageName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function buildLanguageKeyByNameMap(
  languages: Array<Pick<Language, 'key' | 'name'>>
) {
  return new Map(
    languages.map((language) => [normalizeLanguageName(language.name), language.key])
  )
}

export async function listLanguages(
  supabase: SupabaseClient<Database>,
  query: LanguageQuery = {}
) {
  const allowedSources = await getAllowedSources(supabase, query.campaignId ?? null)

  let builder = supabase
    .from('languages')
    .select('*')
    .order('sort_order')
    .order('name')
  if (allowedSources) builder = builder.in('source', Array.from(allowedSources))

  const { data, error } = await builder
  return {
    data: (data ?? []) as Language[],
    error,
  }
}
