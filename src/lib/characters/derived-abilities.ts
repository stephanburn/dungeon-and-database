import type { AbilityKey } from '@/lib/characters/build-context'

export interface DerivedAbilityScoreContributor {
  ability: AbilityKey
  bonus: number
  label: string
  sourceType: 'species' | 'species_choice' | 'asi' | 'feat' | 'manual' | 'other'
  sourceFeatureKey?: string | null
}

export interface DerivedAbilityScore {
  base: number
  bonus: number
  adjusted: number
  modifier: number
  contributors: DerivedAbilityScoreContributor[]
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export function deriveAbilityScores(
  baseStats: Record<AbilityKey, number>,
  bonuses: Partial<Record<AbilityKey, number>>,
  contributors: DerivedAbilityScoreContributor[] = abilityBonusMapToContributors(bonuses, 'Ability bonus')
): Record<AbilityKey, DerivedAbilityScore> {
  return {
    str: buildDerivedAbilityScore('str', baseStats.str, bonuses.str ?? 0, contributors),
    dex: buildDerivedAbilityScore('dex', baseStats.dex, bonuses.dex ?? 0, contributors),
    con: buildDerivedAbilityScore('con', baseStats.con, bonuses.con ?? 0, contributors),
    int: buildDerivedAbilityScore('int', baseStats.int, bonuses.int ?? 0, contributors),
    wis: buildDerivedAbilityScore('wis', baseStats.wis, bonuses.wis ?? 0, contributors),
    cha: buildDerivedAbilityScore('cha', baseStats.cha, bonuses.cha ?? 0, contributors),
  }
}

export function abilityBonusMapToContributors(
  bonuses: Partial<Record<AbilityKey, number>>,
  label: string,
  sourceType: DerivedAbilityScoreContributor['sourceType'] = 'other'
): DerivedAbilityScoreContributor[] {
  return (Object.entries(bonuses) as Array<[AbilityKey, number]>)
    .filter(([, bonus]) => bonus !== 0)
    .map(([ability, bonus]) => ({
      ability,
      bonus,
      label,
      sourceType,
      sourceFeatureKey: null,
    }))
}

export function sumAbilityContributors(
  contributors: DerivedAbilityScoreContributor[]
): Partial<Record<AbilityKey, number>> {
  return contributors.reduce<Partial<Record<AbilityKey, number>>>((acc, contributor) => {
    acc[contributor.ability] = (acc[contributor.ability] ?? 0) + contributor.bonus
    return acc
  }, {})
}

function buildDerivedAbilityScore(
  ability: AbilityKey,
  base: number,
  bonus: number,
  allContributors: DerivedAbilityScoreContributor[]
): DerivedAbilityScore {
  const adjusted = base + bonus
  return {
    base,
    bonus,
    adjusted,
    modifier: abilityModifier(adjusted),
    contributors: allContributors.filter((contributor) => contributor.ability === ability),
  }
}
