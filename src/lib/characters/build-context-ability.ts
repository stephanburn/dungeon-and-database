import {
  abilityBonusMapToContributors,
  deriveAbilityScores,
  sumAbilityContributors,
  type CharacterAggregate,
  type DerivedAbilityScoreContributor,
} from '@/lib/characters/derived'
import type { AbilityKey, CharacterBuildContext } from '@/lib/characters/build-context-types'

export function buildAbilityScoreContributors(
  context: Pick<CharacterBuildContext, 'speciesName' | 'speciesAbilityBonuses' | 'selectedAbilityBonuses' | 'selectedAsiBonuses' | 'asiChoiceSlots'>
): DerivedAbilityScoreContributor[] {
  const speciesLabel = context.speciesName ? `${context.speciesName} ability bonus` : 'Species ability bonus'
  const contributors = [
    ...abilityBonusMapToContributors(context.speciesAbilityBonuses, speciesLabel, 'species'),
    ...abilityBonusMapToContributors(
      context.selectedAbilityBonuses,
      context.speciesName ? `${context.speciesName} flexible bonus` : 'Species flexible bonus',
      'species_choice'
    ),
  ]

  const asiContributors = context.asiChoiceSlots.flatMap((slot) =>
    abilityBonusMapToContributors(
      slot.bonuses,
      `ASI ${slot.slotIndex + 1}`,
      'asi'
    ).map((contributor) => ({
      ...contributor,
      sourceFeatureKey: `asi_slot:${slot.slotIndex}`,
    }))
  )

  if (asiContributors.length > 0) {
    return [...contributors, ...asiContributors]
  }

  return [
    ...contributors,
    ...abilityBonusMapToContributors(context.selectedAsiBonuses, 'Ability Score Improvement', 'asi'),
  ]
}

export function getAdjustedAbilityScores(
  context: CharacterBuildContext
): Record<AbilityKey, number> {
  const contributors = buildAbilityScoreContributors(context)
  const abilities = deriveAbilityScores(context.baseStats, sumAbilityContributors(contributors), contributors)

  return {
    str: abilities.str.adjusted,
    dex: abilities.dex.adjusted,
    con: abilities.con.adjusted,
    int: abilities.int.adjusted,
    wis: abilities.wis.adjusted,
    cha: abilities.cha.adjusted,
  }
}

export function toCharacterAggregate(context: CharacterBuildContext): CharacterAggregate {
  const abilityContributors = buildAbilityScoreContributors(context)

  return {
    baseStats: context.baseStats,
    speciesAbilityBonuses: sumAbilityContributors(abilityContributors),
    abilityContributors,
    persistedHpMax: context.persistedHpMax,
    savingThrowProficiencies: context.classes.flatMap((cls) => cls.savingThrowProficiencies),
    selectedFeatureOptions: context.selectedFeatureOptions.map((choice) => ({
      option_group_key: choice.option_group_key,
      selected_value: choice.selected_value,
    })),
    selectedSpellNames: context.selectedSpells.map((spell) => spell.name),
    equippedItems: context.equipmentItems,
    armorCatalog: context.armorCatalog,
    shieldCatalog: context.shieldCatalog,
    species: {
      name: context.speciesName,
      source: context.speciesSource,
      speed: context.speciesSpeed,
      size: context.speciesSize,
      languages: context.speciesLanguages,
      senses: context.speciesSenses,
      damageResistances: context.speciesDamageResistances,
      conditionImmunities: context.speciesConditionImmunities,
    },
    classes: context.classes.map((cls) => ({
      classId: cls.classId,
      className: cls.name,
      subclassName: cls.subclass?.name ?? null,
      level: cls.level,
      hitDie: cls.hitDie,
      hpRoll: cls.hpRoll,
      savingThrowProficiencies: cls.savingThrowProficiencies,
    })),
  }
}
