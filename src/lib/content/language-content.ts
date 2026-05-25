import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Language } from '@/lib/types/database'
import { applySourceFilter, getAllowedSources, hasContentLoadError } from '@/lib/content-helpers'

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

export function buildLanguageNameByKeyMap(
  languages: Array<Pick<Language, 'key' | 'name'>>
) {
  return new Map(
    languages.map((language) => [language.key, language.name])
  )
}

export async function listLanguages(
  supabase: SupabaseClient<Database>,
  query: LanguageQuery = {}
) {
  const allowedSources = await getAllowedSources(supabase, query.campaignId ?? null)
  if (hasContentLoadError(allowedSources)) return { data: [] as Language[], error: allowedSources.error }

  let builder = supabase
    .from('languages')
    .select('*')
    .order('sort_order')
    .order('name')
  builder = applySourceFilter(builder, allowedSources)

  const { data, error } = await builder
  return {
    data: (data ?? []) as Language[],
    error,
  }
}
