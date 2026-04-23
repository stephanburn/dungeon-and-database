import type { Class, MulticlassPrereq } from '@/lib/types/database'
import type { FeatureOptionChoiceDefinition } from '@/lib/characters/feature-grants'
import type { CharacterSpellSelection } from '@/lib/types/database'
import { getContiguouslyCompletedSteps } from '@/lib/characters/wizard-step-helpers'

type AdjustedStats = Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>

type BaseLevel = {
  class_id: string
  level: number
  subclass_id?: string | null
}

export function findMissingMulticlassPrereqs(
  adjustedStats: AdjustedStats,
  prereqs: MulticlassPrereq[]
): string[] {
  return prereqs.flatMap((prereq) => {
    const ability = prereq.ability.toLowerCase() as keyof typeof adjustedStats
    const score = adjustedStats[ability] ?? 0
    return score >= prereq.min ? [] : [`${prereq.ability.toUpperCase()} ${prereq.min}`]
  })
}

export function buildLevelUpClassOptions(args: {
  classList: Class[]
  baseLevels: BaseLevel[]
  adjustedStats: AdjustedStats
}) {
  return args.classList.map((cls) => {
    const existingLevel = args.baseLevels.find((level) => level.class_id === cls.id)?.level ?? 0
    const missingPrereqs = existingLevel > 0
      ? []
      : findMissingMulticlassPrereqs(args.adjustedStats, cls.multiclass_prereqs)
    const invalidReason = missingPrereqs.length > 0
      ? `Requires ${missingPrereqs.join(', ')}`
      : null

    return {
      classId: cls.id,
      existingLevel,
      disabled: existingLevel === 0 && missingPrereqs.length > 0,
      invalidReason,
      label: existingLevel > 0
        ? `${cls.name} (${existingLevel} → ${existingLevel + 1})`
        : `${cls.name} (new multiclass${invalidReason ? `, ${invalidReason}` : ''})`,
    }
  })
}

export function isSubclassSelectionRequired(args: {
  nextClassLevel: number
  subclassChoiceLevel: number
  selectedSubclassId: string | null
}) {
  return args.nextClassLevel >= args.subclassChoiceLevel && !args.selectedSubclassId
}

export function getLevelUpFeatureOptionStepDefinitions(args: {
  currentDefinitions: FeatureOptionChoiceDefinition[]
  nextDefinitions: FeatureOptionChoiceDefinition[]
}) {
  const currentKeys = new Set(
    args.currentDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
  )
  const changedGroupKeys = new Set(
    args.nextDefinitions
      .filter((definition) => !currentKeys.has(`${definition.optionGroupKey}:${definition.optionKey}`))
      .map((definition) => definition.optionGroupKey)
  )

  if (changedGroupKeys.size === 0) return []

  return args.nextDefinitions.filter((definition) => changedGroupKeys.has(definition.optionGroupKey))
}

export function getEditableLevelUpSpellChoiceIds(
  spellSelections: CharacterSpellSelection[],
  selectedClassId: string
) {
  return spellSelections
    .filter((selection) => (
      selection.owning_class_id === selectedClassId
      && !selection.source_feature_key?.startsWith('feat_spell:')
      && !selection.source_feature_key?.startsWith('feature_spell:')
    ))
    .map((selection) => selection.spell_id)
}

export function getPreservedLevelUpSpellSelections(
  spellSelections: CharacterSpellSelection[],
  selectedClassId: string
) {
  return spellSelections
    .filter((selection) => (
      selection.source_feature_key?.startsWith('feature_spell:')
      || (
        selection.owning_class_id !== selectedClassId
        && !selection.source_feature_key?.startsWith('feat_spell:')
      )
    ))
    .map((selection) => ({
      spell_id: selection.spell_id,
      character_level_id: selection.character_level_id,
      owning_class_id: selection.owning_class_id,
      granting_subclass_id: selection.granting_subclass_id,
      acquisition_mode: selection.acquisition_mode,
      counts_against_selection_limit: selection.counts_against_selection_limit,
      source_feature_key: selection.source_feature_key,
    }))
}

export function getLevelUpResumeStepIndex<TStep extends string>(
  orderedSteps: readonly TStep[],
  completed: Partial<Record<TStep, boolean>>
) {
  if (orderedSteps.length === 0) return 0

  const completedSteps = getContiguouslyCompletedSteps(orderedSteps, completed)
  return Math.min(completedSteps.length, orderedSteps.length - 1)
}

export function summarizeLevelUpSpellChanges(args: {
  beforeSpellIds: string[]
  afterSpellIds: string[]
  spellNameById: Map<string, string>
}) {
  const beforeSet = new Set(args.beforeSpellIds)
  const afterSet = new Set(args.afterSpellIds)
  const addedIds = args.afterSpellIds.filter((spellId) => !beforeSet.has(spellId))
  const removedIds = args.beforeSpellIds.filter((spellId) => !afterSet.has(spellId))
  const replacementCount = Math.min(addedIds.length, removedIds.length)

  return {
    additions: addedIds.slice(replacementCount).map((spellId) => args.spellNameById.get(spellId) ?? spellId),
    removals: removedIds.slice(replacementCount).map((spellId) => args.spellNameById.get(spellId) ?? spellId),
    replacements: Array.from({ length: replacementCount }, (_, index) => ({
      added: args.spellNameById.get(addedIds[index]) ?? addedIds[index],
      removed: args.spellNameById.get(removedIds[index]) ?? removedIds[index],
    })),
  }
}
