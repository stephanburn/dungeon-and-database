import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Captures a full character snapshot and stores it in character_snapshots.
 */
export async function captureSnapshot(
  supabase: SupabaseClient<Database>,
  characterId: string
): Promise<void> {
  const [characterResult, levelsResult, choicesResult, rollsResult] = await Promise.all([
    supabase.from('characters').select('*').eq('id', characterId).single(),
    supabase.from('character_levels').select('*').eq('character_id', characterId),
    supabase.from('character_choices').select('*').eq('character_id', characterId),
    supabase.from('character_stat_rolls').select('*').eq('character_id', characterId),
  ])

  if (!characterResult.data) return

  const snapshot = {
    character: characterResult.data,
    levels: levelsResult.data ?? [],
    choices: choicesResult.data ?? [],
    stat_rolls: rollsResult.data ?? [],
  }

  await supabase.from('character_snapshots').insert({
    character_id: characterId,
    snapshot,
    level_total: (levelsResult.data ?? []).length,
  })
}
