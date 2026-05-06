import type { FeatPrerequisite } from '@/lib/types/database'
import { getAdjustedAbilityScores } from '@/lib/characters/build-context'
import type { DerivedCharacter } from '@/lib/characters/derived'
import type { LegalityCheck, LegalityInput } from './types'

export function checkFeatPrerequisites(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
  const invalid = input.selectedFeats.filter((feat) =>
    feat.prerequisites.some((prerequisite) => !checkFeatPrerequisite(prerequisite, input, derived))
  )

  return {
    key: 'feat_prerequisites',
    passed: invalid.length === 0,
    message: invalid.length === 0
      ? 'All selected feats meet their prerequisites.'
      : `Feat prerequisites not met: ${invalid.map((feat) => feat.name).join(', ')}.`,
    severity: 'error',
  }
}

export function checkFeatSlots(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
  const selectedCount = input.selectedFeats.length
  const backgroundFeatCount = input.backgroundFeat ? 1 : 0
  const effectiveCount = selectedCount + backgroundFeatCount

  return {
    key: 'feat_slots',
    passed: selectedCount <= derived.choiceCaps.featSlots,
    message: selectedCount <= derived.choiceCaps.featSlots
      ? `Feat choices fit available progression slots (${effectiveCount} total including background).`
      : `Selected ${selectedCount} progression feats but only ${derived.choiceCaps.featSlots} ASI/feat slots are available.`,
    severity: 'error',
  }
}

function checkFeatPrerequisite(prerequisite: FeatPrerequisite, input: LegalityInput, derived: DerivedCharacter): boolean {
  const adjustedScores = getAdjustedAbilityScores(input)
  const unlockedFeatures = new Set(derived.unlockedFeatures.map((feature) => feature.toLowerCase()))

  switch (prerequisite.type) {
    case 'ability': {
      const ability = prerequisite.ability?.toLowerCase() as keyof typeof adjustedScores | undefined
      return ability ? (adjustedScores[ability] ?? 0) >= (prerequisite.min ?? 0) : true
    }
    case 'level':
      return derived.totalLevel >= (prerequisite.min ?? 0)
    case 'spellcasting':
      return input.classes.some((cls) => cls.spellcastingType && cls.spellcastingType !== 'none')
    case 'feature':
      return prerequisite.feature ? unlockedFeatures.has(prerequisite.feature.toLowerCase()) : true
    case 'proficiency':
      return prerequisite.proficiency ? derived.proficiencies.all.includes(prerequisite.proficiency.toLowerCase()) : true
    case 'species':
      return checkSpeciesFeatPrerequisite(prerequisite, input)
    default:
      return true
  }
}

function normalizePrerequisiteValue(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function inferSpeciesLineage(speciesName: string | null): string | null {
  if (!speciesName) return null
  const normalizedName = normalizePrerequisiteValue(speciesName.replace(/\(.+\)$/, '').trim())
  if (normalizedName === 'high_elf' || normalizedName === 'wood_elf' || normalizedName === 'dark_elf') return 'elf'
  return normalizedName || null
}

function checkSpeciesFeatPrerequisite(prerequisite: FeatPrerequisite, input: LegalityInput): boolean {
  const requiredSpecies = normalizePrerequisiteValue(prerequisite.species)
  const requiredLineage = normalizePrerequisiteValue(prerequisite.lineage)
  const speciesName = normalizePrerequisiteValue(input.speciesName)
  const speciesLineage = normalizePrerequisiteValue(input.speciesLineage ?? inferSpeciesLineage(input.speciesName))

  if (requiredSpecies && speciesName !== requiredSpecies) return false
  if (requiredLineage && speciesLineage !== requiredLineage) return false
  return true
}
