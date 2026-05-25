import type { SupabaseClient } from '@supabase/supabase-js'
import type { CharacterClassLevel, Database } from '@/lib/types/database'
import {
  aggregateCharacterLevels,
  sortCharacterClassLevels,
} from '@/lib/characters/class-levels'

type SnapshotIssue = {
  scope: string
  message: string
}

export type SnapshotResult =
  | { ok: true }
  | {
      ok: false
      error: {
        message: string
        issues: SnapshotIssue[]
      }
    }

function snapshotFailure(message: string, issues: SnapshotIssue[]): SnapshotResult {
  return {
    ok: false,
    error: {
      message,
      issues,
    },
  }
}

function collectSnapshotIssues(
  results: Array<{ error?: { message: string } | null }>,
  scopes: string[]
): SnapshotIssue[] {
  return results.flatMap((result, index) => result.error
    ? [{
        scope: scopes[index] ?? 'unknown',
        message: result.error.message,
      }]
    : [])
}

/**
 * Captures a full character snapshot and stores it in character_snapshots.
 */
export async function captureSnapshot(
  supabase: SupabaseClient<Database>,
  characterId: string
): Promise<SnapshotResult> {
  const [characterResult, classLevelsResult, hpRollsResult, choicesResult, spellSelectionsResult, featChoicesResult, abilityBonusChoicesResult, asiChoicesResult, featureOptionChoicesResult, languageChoicesResult, toolChoicesResult, equipmentItemsResult, rollsResult, skillsResult] = await Promise.all([
    supabase.from('characters').select('*').eq('id', characterId).single(),
    supabase.from('character_class_levels').select('*').eq('character_id', characterId),
    supabase.from('character_hp_rolls').select('*').eq('character_id', characterId),
    supabase.from('character_choices').select('*').eq('character_id', characterId),
    supabase.from('character_spell_selections').select('*').eq('character_id', characterId),
    supabase.from('character_feat_choices').select('*').eq('character_id', characterId),
    supabase.from('character_ability_bonus_choices').select('*').eq('character_id', characterId),
    supabase.from('character_asi_choices').select('*').eq('character_id', characterId),
    supabase.from('character_feature_option_choices').select('*').eq('character_id', characterId),
    supabase.from('character_language_choices').select('*').eq('character_id', characterId),
    supabase.from('character_tool_choices').select('*').eq('character_id', characterId),
    supabase.from('character_equipment_items').select('*').eq('character_id', characterId),
    supabase.from('character_stat_rolls').select('*').eq('character_id', characterId),
    supabase.from('character_skill_proficiencies').select('*').eq('character_id', characterId),
  ])

  const issues = collectSnapshotIssues(
    [
      characterResult,
      classLevelsResult,
      hpRollsResult,
      choicesResult,
      spellSelectionsResult,
      featChoicesResult,
      abilityBonusChoicesResult,
      asiChoicesResult,
      featureOptionChoicesResult,
      languageChoicesResult,
      toolChoicesResult,
      equipmentItemsResult,
      rollsResult,
      skillsResult,
    ],
    [
      'character',
      'class_levels',
      'hp_rolls',
      'choices',
      'spell_selections',
      'feat_choices',
      'ability_bonus_choices',
      'asi_choices',
      'feature_option_choices',
      'language_choices',
      'tool_choices',
      'equipment_items',
      'stat_rolls',
      'skill_proficiencies',
    ]
  )
  if (issues.length > 0) return snapshotFailure('Failed to capture character snapshot', issues)

  if (!characterResult.data) {
    return snapshotFailure('Failed to capture character snapshot', [{
      scope: 'character',
      message: `Character ${characterId} was not found`,
    }])
  }

  const classLevels = sortCharacterClassLevels((classLevelsResult.data ?? []) as CharacterClassLevel[])
  const levels = aggregateCharacterLevels(classLevels)
  const snapshot = {
    character: characterResult.data,
    levels,
    class_levels: classLevels,
    hp_rolls: hpRollsResult.data ?? [],
    choices: choicesResult.data ?? [],
    spell_selections: spellSelectionsResult.data ?? [],
    feat_choices: featChoicesResult.data ?? [],
    ability_bonus_choices: abilityBonusChoicesResult.data ?? [],
    asi_choices: asiChoicesResult.data ?? [],
    feature_option_choices: featureOptionChoicesResult.data ?? [],
    language_choices: languageChoicesResult.data ?? [],
    tool_choices: toolChoicesResult.data ?? [],
    equipment_items: equipmentItemsResult.data ?? [],
    stat_rolls: rollsResult.data ?? [],
    skill_proficiencies: skillsResult.data ?? [],
  }

  const insertResult = await supabase.from('character_snapshots').insert({
    character_id: characterId,
    snapshot,
    level_total: classLevels.length,
  })
  if (insertResult.error) {
    return snapshotFailure('Failed to insert character snapshot', [{
      scope: 'character_snapshots',
      message: insertResult.error.message,
    }])
  }

  return { ok: true }
}
