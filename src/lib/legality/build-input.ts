import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CampaignSettings, SkillChoices } from '@/lib/types/database'
import type { LegalityInput } from './engine'
import { normalizeSkillKey } from '@/lib/skills'

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
    supabase.from('campaigns').select('settings, rule_set').eq('id', character.campaign_id).single(),
    supabase
      .from('campaign_source_allowlist')
      .select('source_key')
      .eq('campaign_id', character.campaign_id),
    supabase
      .from('character_levels')
      .select('class_id, level, subclass_id')
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

  const [classSourcesResult, subclassSourcesResult, classChoicesResult, skillProfResult] = await Promise.all([
    classIds.length > 0
      ? supabase.from('classes').select('source, skill_choices, saving_throw_proficiencies').in('id', classIds)
      : Promise.resolve({ data: [] }),
    subclassIds.length > 0
      ? supabase.from('subclasses').select('source').in('id', subclassIds)
      : Promise.resolve({ data: [] }),
    // Only use first class for skill choices in Phase 1
    classIds.length > 0
      ? supabase.from('classes').select('skill_choices').eq('id', classIds[0]).single()
      : Promise.resolve({ data: null }),
    supabase.from('character_skill_proficiencies').select('skill').eq('character_id', characterId),
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

  const [spellSourcesResult, featSourcesResult, allSourcesResult] = await Promise.all([
    spellIds.length > 0
      ? supabase.from('spells').select('source').in('id', spellIds)
      : Promise.resolve({ data: [] }),
    featIds.length > 0
      ? supabase.from('feats').select('source').in('id', featIds)
      : Promise.resolve({ data: [] }),
    supabase.from('sources').select('key, rule_set'),
  ])

  const rawSkillChoices = classChoicesResult.data?.skill_choices as SkillChoices | null
  const classSkillChoices = rawSkillChoices
    ? {
        count: rawSkillChoices.count,
        from: (rawSkillChoices.from ?? []).map(normalizeSkillKey),
      }
    : { count: 0, from: [] }

  const allSourceRuleSets = Object.fromEntries(
    (allSourcesResult.data ?? []).map((s) => [s.key, s.rule_set as '2014' | '2024'])
  )

  return {
    allowedSources,
    campaignSettings,
    campaignRuleSet: (campaignResult.data?.rule_set ?? '2014') as '2014' | '2024',
    allSourceRuleSets,
    statMethod: character.stat_method,
    baseStats: {
      str: character.base_str,
      dex: character.base_dex,
      con: character.base_con,
      int: character.base_int,
      wis: character.base_wis,
      cha: character.base_cha,
    },
    totalLevel: levels.reduce((sum, l) => sum + (l.level ?? 0), 0),
    classCount: classIds.length,
    speciesSource: speciesResult.data?.source ?? null,
    backgroundSource: backgroundResult.data?.source ?? null,
    classSources: (classSourcesResult.data ?? []).map((r) => (r as { source: string }).source),
    subclassSources: (subclassSourcesResult.data ?? []).map((r) => r.source),
    spellSources: (spellSourcesResult.data ?? []).map((r) => r.source),
    featSources: (featSourcesResult.data ?? []).map((r) => r.source),
    statRolls: (statRollsResult.data ?? []).map((r) => ({
      assigned_to: r.assigned_to,
      roll_set: r.roll_set,
    })),
    classSkillChoices,
    skillProficiencies: (skillProfResult.data ?? []).map((r) => r.skill),
  }
}
