import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CampaignSettings } from '@/lib/types/database'
import type { LegalityInput } from './engine'

/**
 * Builds a LegalityInput from a character ID by querying the database.
 * Returns null if the character doesn't exist or isn't accessible.
 */
export async function buildLegalityInput(
  supabase: SupabaseClient<Database>,
  characterId: string
): Promise<LegalityInput | null> {
  // Fetch character + campaign in parallel
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (!character) return null

  const [
    campaignResult,
    allowlistResult,
    levelsResult,
    statRollsResult,
    speciesResult,
    backgroundResult,
  ] = await Promise.all([
    supabase.from('campaigns').select('settings').eq('id', character.campaign_id).single(),
    supabase
      .from('campaign_source_allowlist')
      .select('source_key')
      .eq('campaign_id', character.campaign_id),
    supabase
      .from('character_levels')
      .select('class_id, subclass_id')
      .eq('character_id', characterId),
    supabase
      .from('character_stat_rolls')
      .select('assigned_to, roll_set')
      .eq('character_id', characterId),
    character.species_id
      ? supabase.from('species').select('source').eq('id', character.species_id).single()
      : Promise.resolve({ data: null }),
    character.background_id
      ? supabase.from('backgrounds').select('source').eq('id', character.background_id).single()
      : Promise.resolve({ data: null }),
  ])

  const campaignSettings = (campaignResult.data?.settings ?? {
    stat_method: 'point_buy',
    max_level: 20,
    milestone_levelling: false,
  }) as CampaignSettings

  const allowedSources = (allowlistResult.data ?? []).map((r) => r.source_key)
  const levels = levelsResult.data ?? []

  // Fetch class and subclass sources
  const classIds = Array.from(new Set(levels.map((l) => l.class_id)))
  const subclassIds = levels
    .map((l) => l.subclass_id)
    .filter((id): id is string => id !== null)

  const [classSourcesResult, subclassSourcesResult] = await Promise.all([
    classIds.length > 0
      ? supabase.from('classes').select('source').in('id', classIds)
      : Promise.resolve({ data: [] }),
    subclassIds.length > 0
      ? supabase.from('subclasses').select('source').in('id', subclassIds)
      : Promise.resolve({ data: [] }),
  ])

  // Fetch spell and feat sources from character_choices
  const { data: choices } = await supabase
    .from('character_choices')
    .select('choice_type, choice_value')
    .eq('character_id', characterId)
    .in('choice_type', ['spell_known', 'feat'])

  const spellIds: string[] = []
  const featIds: string[] = []
  for (const choice of choices ?? []) {
    if (choice.choice_type === 'spell_known') {
      const val = choice.choice_value as { spell_id?: string }
      if (val.spell_id) spellIds.push(val.spell_id)
    } else if (choice.choice_type === 'feat') {
      const val = choice.choice_value as { feat_id?: string }
      if (val.feat_id) featIds.push(val.feat_id)
    }
  }

  const [spellSourcesResult, featSourcesResult] = await Promise.all([
    spellIds.length > 0
      ? supabase.from('spells').select('source').in('id', spellIds)
      : Promise.resolve({ data: [] }),
    featIds.length > 0
      ? supabase.from('feats').select('source').in('id', featIds)
      : Promise.resolve({ data: [] }),
  ])

  return {
    allowedSources,
    campaignSettings,
    statMethod: character.stat_method,
    baseStats: {
      str: character.base_str,
      dex: character.base_dex,
      con: character.base_con,
      int: character.base_int,
      wis: character.base_wis,
      cha: character.base_cha,
    },
    totalLevel: levels.length,
    speciesSource: speciesResult.data?.source ?? null,
    backgroundSource: backgroundResult.data?.source ?? null,
    classSources: (classSourcesResult.data ?? []).map((r) => r.source),
    subclassSources: (subclassSourcesResult.data ?? []).map((r) => r.source),
    spellSources: (spellSourcesResult.data ?? []).map((r) => r.source),
    featSources: (featSourcesResult.data ?? []).map((r) => r.source),
    statRolls: (statRollsResult.data ?? []).map((r) => ({
      assigned_to: r.assigned_to,
      roll_set: r.roll_set,
    })),
  }
}
