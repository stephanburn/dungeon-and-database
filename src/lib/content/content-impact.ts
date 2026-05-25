import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import {
  summarizeContentImpact,
  type ContentImpactRow,
  type ContentImpactSummary,
  type ProvenanceRow,
} from '@/lib/characters/stale-provenance'
import type { Database } from '@/lib/types/database'

type ContentImpactResult = {
  summary: ContentImpactSummary
  error: PostgrestError | null
}

type ProvenanceRowsResult = {
  rows: ProvenanceRow[]
  error: PostgrestError | null
}

type CharacterLookupRow = {
  id: string
  name: string
  campaign_id: string
  campaign?: unknown
}

const EMPTY_IMPACT_SUMMARY = summarizeContentImpact([])

const IMPACT_CATEGORIES_BY_TAB: Record<string, string[]> = {
  classes: ['class', 'class_choice', 'class_feature'],
  backgrounds: ['background', 'background_choice', 'background_feature'],
  species: ['species', 'species_choice', 'species_feature'],
  subclasses: ['subclass', 'subclass_choice', 'subclass_feature'],
  feats: ['feat', 'feat_choice'],
  'starting-equipment-packages': ['package', 'starting_equipment'],
  'feature-options': ['feature'],
}

function campaignName(campaign: unknown, fallback: string) {
  if (Array.isArray(campaign)) {
    const first = campaign[0] as { name?: unknown } | undefined
    return typeof first?.name === 'string' ? first.name : fallback
  }
  if (campaign && typeof campaign === 'object' && 'name' in campaign) {
    const name = (campaign as { name?: unknown }).name
    if (typeof name === 'string') return name
  }
  return fallback
}

async function loadCharacterLookups(
  supabase: SupabaseClient<Database>,
  rows: ProvenanceRow[]
) {
  const characterIds = Array.from(new Set(rows.map((row) => row.character_id)))
  if (characterIds.length === 0) return { lookup: new Map<string, CharacterLookupRow>(), error: null }

  const { data, error } = await supabase
    .from('characters')
    .select('id, name, campaign_id, campaign:campaign_id(id, name)')
    .in('id', characterIds)

  if (error) return { lookup: new Map<string, CharacterLookupRow>(), error }

  return {
    lookup: new Map((data ?? []).map((row) => [row.id, row as CharacterLookupRow])),
    error: null,
  }
}

async function hydrateImpactRows(
  supabase: SupabaseClient<Database>,
  rows: ProvenanceRow[]
) {
  const { lookup, error } = await loadCharacterLookups(supabase, rows)
  if (error) return { rows: [] as ContentImpactRow[], error }

  return {
    rows: rows.map((row) => {
      const character = lookup.get(row.character_id)
      const campaignId = character?.campaign_id ?? 'unknown'
      return {
        ...row,
        character_name: character?.name ?? 'Unknown character',
        campaign_id: campaignId,
        campaign_name: campaignName(character?.campaign, campaignId),
      }
    }),
    error: null,
  }
}

function appendRows(
  target: ProvenanceRow[],
  rows: Array<Record<string, unknown>>,
  choiceTable: string,
  choiceKeyColumn: string
) {
  for (const row of rows) {
    target.push({
      character_id: String(row.character_id),
      choice_table: choiceTable,
      choice_key: String(row[choiceKeyColumn] ?? ''),
      source_category: String(row.source_category),
      source_entity_id: typeof row.source_entity_id === 'string' ? row.source_entity_id : null,
      source_feature_key: typeof row.source_feature_key === 'string' ? row.source_feature_key : null,
    })
  }
}

async function loadProvenanceRowsForEntity(
  supabase: SupabaseClient<Database>,
  categories: string[],
  entityId: string
): Promise<ProvenanceRowsResult> {
  const rows: ProvenanceRow[] = []

  const skills = await supabase
    .from('character_skill_proficiencies')
    .select('character_id, skill, source_category, source_entity_id, source_feature_key')
    .eq('source_entity_id', entityId)
    .in('source_category', categories)
  if (skills.error) return { rows: [], error: skills.error }
  appendRows(rows, skills.data ?? [], 'character_skill_proficiencies', 'skill')

  const languages = await supabase
    .from('character_language_choices')
    .select('character_id, language, source_category, source_entity_id, source_feature_key')
    .eq('source_entity_id', entityId)
    .in('source_category', categories)
  if (languages.error) return { rows: [], error: languages.error }
  appendRows(rows, languages.data ?? [], 'character_language_choices', 'language')

  const tools = await supabase
    .from('character_tool_choices')
    .select('character_id, tool, source_category, source_entity_id, source_feature_key')
    .eq('source_entity_id', entityId)
    .in('source_category', categories)
  if (tools.error) return { rows: [], error: tools.error }
  appendRows(rows, tools.data ?? [], 'character_tool_choices', 'tool')

  const abilityBonuses = await supabase
    .from('character_ability_bonus_choices')
    .select('character_id, ability, source_category, source_entity_id, source_feature_key')
    .eq('source_entity_id', entityId)
    .in('source_category', categories)
  if (abilityBonuses.error) return { rows: [], error: abilityBonuses.error }
  appendRows(rows, abilityBonuses.data ?? [], 'character_ability_bonus_choices', 'ability')

  const featureOptions = await supabase
    .from('character_feature_option_choices')
    .select('character_id, option_key, source_category, source_entity_id, source_feature_key')
    .eq('source_entity_id', entityId)
    .in('source_category', categories)
  if (featureOptions.error) return { rows: [], error: featureOptions.error }
  appendRows(rows, featureOptions.data ?? [], 'character_feature_option_choices', 'option_key')

  const equipmentItems = await supabase
    .from('character_equipment_items')
    .select('character_id, item_id, source_category, source_entity_id')
    .eq('source_entity_id', entityId)
    .in('source_category', categories)
  if (equipmentItems.error) return { rows: [], error: equipmentItems.error }
  appendRows(rows, equipmentItems.data ?? [], 'character_equipment_items', 'item_id')

  return { rows, error: null }
}

export async function summarizeContentImpactForEntity(
  supabase: SupabaseClient<Database>,
  tab: string,
  entityId: string
): Promise<ContentImpactResult> {
  const categories = IMPACT_CATEGORIES_BY_TAB[tab]
  if (!categories) return { summary: EMPTY_IMPACT_SUMMARY, error: null }

  const provenance = await loadProvenanceRowsForEntity(supabase, categories, entityId)
  if (provenance.error) return { summary: EMPTY_IMPACT_SUMMARY, error: provenance.error }

  const hydrated = await hydrateImpactRows(supabase, provenance.rows)
  if (hydrated.error) return { summary: EMPTY_IMPACT_SUMMARY, error: hydrated.error }

  return {
    summary: summarizeContentImpact(hydrated.rows, { exampleLimit: 6 }),
    error: null,
  }
}

export async function summarizeStaleContentImpact(
  supabase: SupabaseClient<Database>
): Promise<ContentImpactResult> {
  const { data, error } = await supabase
    .from('character_stale_provenance')
    .select('*')
    .limit(200)
  if (error) return { summary: EMPTY_IMPACT_SUMMARY, error }

  const hydrated = await hydrateImpactRows(supabase, data ?? [])
  if (hydrated.error) return { summary: EMPTY_IMPACT_SUMMARY, error: hydrated.error }

  return {
    summary: summarizeContentImpact(hydrated.rows, { exampleLimit: 8 }),
    error: null,
  }
}
