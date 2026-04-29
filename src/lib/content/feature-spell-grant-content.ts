import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, FeatureSpellGrant } from '@/lib/types/database'
import { getAllowedSources } from '@/lib/content-helpers'

type FeatureSpellGrantQuery = {
  campaignId?: string | null
}

export async function listFeatureSpellGrants(
  supabase: SupabaseClient<Database>,
  query: FeatureSpellGrantQuery = {}
) {
  const { data, error } = await supabase
    .from('feature_spell_grants')
    .select('*')
    .order('source_feature_key')
  if (error) {
    return {
      data: [] as FeatureSpellGrant[],
      error,
    }
  }

  const rows = (data ?? []) as FeatureSpellGrant[]
  const allowedSources = await getAllowedSources(supabase, query.campaignId ?? null)
  if (!allowedSources || rows.length === 0) {
    return {
      data: rows,
      error: null,
    }
  }

  const { data: spells, error: spellError } = await supabase
    .from('spells')
    .select('id, source')
    .in('id', rows.map((row) => row.spell_id))
  if (spellError) {
    return {
      data: [] as FeatureSpellGrant[],
      error: spellError,
    }
  }

  const allowedSpellIds = new Set(
    (spells ?? [])
      .filter((spell) => allowedSources.has(spell.source))
      .map((spell) => spell.id)
  )

  return {
    data: rows.filter((row) => allowedSpellIds.has(row.spell_id)),
    error: null,
  }
}
