import type { Background, ClassFeatureProgression, SpeciesTrait } from '@/lib/types/database'
import { getFixedBackgroundLanguages } from '@/lib/characters/language-tool-provenance'
import { normalizeSkillKey } from '@/lib/skills'
import type {
  BuildBackgroundSummary,
  BuildFeatureUnlockSummary,
  BuildProgressionRow,
  BuildSpeciesTraitSummary,
} from '@/lib/characters/build-context-types'

export function progressionRowToSummary(
  row: ClassFeatureProgression,
  featureNames: string[],
  features?: BuildFeatureUnlockSummary[]
): BuildProgressionRow {
  return {
    level: row.level,
    asiAvailable: row.asi_available,
    proficiencyBonus: row.proficiency_bonus,
    featureNames,
    features,
  }
}

export function normalizeToolProficiencies(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((value): value is string => typeof value === 'string')
  }
  if (input && typeof input === 'object') {
    return Object.keys(input as Record<string, unknown>)
  }
  return []
}

export function createBuildBackgroundSummary(background: Background | null): BuildBackgroundSummary | null {
  if (!background) return null
  return {
    id: background.id,
    name: background.name,
    source: background.source,
    skillProficiencies: background.skill_proficiencies.map(normalizeSkillKey),
    skillChoiceCount: background.skill_choice_count,
    skillChoiceFrom: background.skill_choice_from.map(normalizeSkillKey),
    toolProficiencies: background.tool_proficiencies,
    fixedLanguages: getFixedBackgroundLanguages(background),
    backgroundFeatId: background.background_feat_id,
  }
}

export function createBuildSpeciesTraitSummaries(traits: SpeciesTrait[]): BuildSpeciesTraitSummary[] {
  return traits.map((trait) => ({
    id: trait.id,
    name: trait.name,
    description: trait.description,
    source: trait.source,
  }))
}
