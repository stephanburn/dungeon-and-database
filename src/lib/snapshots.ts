import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Captures a full character snapshot and stores it in character_snapshots.
 */
export async function captureSnapshot(
  supabase: SupabaseClient<Database>,
  characterId: string
): Promise<void> {
  const [characterResult, levelsResult, choicesResult, rollsResult, skillsResult] = await Promise.all([
    supabase.from('characters').select('*').eq('id', characterId).single(),
    supabase.from('character_levels').select('*').eq('character_id', characterId),
    supabase.from('character_choices').select('*').eq('character_id', characterId),
    supabase.from('character_stat_rolls').select('*').eq('character_id', characterId),
    supabase.from('character_skill_proficiencies').select('skill, expertise').eq('character_id', characterId),
  ])

  if (!characterResult.data) return

  const levels = levelsResult.data ?? []
  const snapshot = {
    character: characterResult.data,
    levels,
    choices: choicesResult.data ?? [],
    stat_rolls: rollsResult.data ?? [],
    skill_proficiencies: skillsResult.data ?? [],
  }

  await supabase.from('character_snapshots').insert({
    character_id: characterId,
    snapshot,
    level_total: levels.reduce((sum, l) => sum + (l.level ?? 0), 0),
  })
}
