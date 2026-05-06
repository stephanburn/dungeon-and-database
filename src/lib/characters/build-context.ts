import {
  abilityModifier,
  buildSavingThrowSourceMap,
  deriveArmorClass,
  deriveCharacterCore,
  deriveSheetPassivePerception,
  deriveSheetSavingThrows,
  deriveSheetSkills,
  deriveSpellcastingSummary,
  type DerivedCharacter,
  type DerivedFeatureSummary,
  type DerivedProficiencySummary,
  type DerivedSavingThrowSummary,
  type DerivedSpeciesTraitSummary,
  type DerivedSubclassState,
} from '@/lib/characters/derived'
import { getSpeciesDerivedDamageResistances } from '@/lib/characters/feature-grants'
import { normalizeSkillKey } from '@/lib/skills'
import {
  getAdjustedAbilityScores,
  toCharacterAggregate,
} from './build-context-ability'
import {
  createBuildBackgroundSummary,
  createBuildSpeciesTraitSummaries,
  normalizeToolProficiencies,
  progressionRowToSummary,
} from './build-context-summaries'
import { deriveCharacterProgression } from './build-context-progression'
import { deriveClassResources } from './build-context-resources'
import { deriveCombatActions, getDynamicSpeciesTraits } from './build-context-combat'
import { deriveAsiFeatHistory } from './build-context-history'
import type {
  BuildFeatureUnlockSummary,
  CharacterBuildContext,
} from './build-context-types'

export type {
  CharacterBuildContext,
  BuildClassSummary,
  BuildBackgroundSummary,
  BuildFeatureUnlockSummary,
  BuildFeatSummary,
  BuildProgressionRow,
  BuildSpeciesTraitSummary,
  BuildSpellSummary,
  BuildSubclassSummary,
  CharacterProgressionSummary,
  AbilityKey,
} from './build-context-types'

export {
  createBuildBackgroundSummary,
  createBuildSpeciesTraitSummaries,
  deriveCharacterProgression,
  getAdjustedAbilityScores,
  normalizeToolProficiencies,
  progressionRowToSummary,
  toCharacterAggregate,
}

export function deriveCharacter(context: CharacterBuildContext): DerivedCharacter {
  const core = deriveCharacterCore(toCharacterAggregate(context))
  const progression = deriveCharacterProgression(context)
  const adjustedScores = getAdjustedAbilityScores(context)
  const proficiencyBonus = core.proficiencyBonus

  const selectedSkillProficiencies = new Set<string>(context.skillProficiencies.map(normalizeSkillKey))
  const selectedSkillExpertise = new Set<string>(context.skillExpertise.map(normalizeSkillKey))
  const backgroundSkillProficiencies = new Set<string>((context.background?.skillProficiencies ?? []).map(normalizeSkillKey))
  const savingThrowProficiencies = new Set<string>(
    context.classes.flatMap((cls) => cls.savingThrowProficiencies.map((save) => save.toLowerCase()))
  )
  const armorProficiencies = new Set<string>(
    context.classes.flatMap((cls) => cls.armorProficiencies.map((item) => item.toLowerCase()))
  )
  const weaponProficiencies = new Set<string>(
    context.classes.flatMap((cls) => cls.weaponProficiencies.map((item) => item.toLowerCase()))
  )
  const toolProficiencies = new Set<string>(
    context.classes.flatMap((cls) => cls.toolProficiencies.map((item) => item.toLowerCase()))
  )

  for (const item of context.background?.toolProficiencies ?? []) {
    toolProficiencies.add(item.toLowerCase())
  }
  for (const item of context.selectedTools) {
    toolProficiencies.add(item.toLowerCase())
  }

  const skills = deriveSheetSkills({
    abilities: core.abilities,
    proficiencyBonus,
    proficientSkills: Array.from(new Set([
      ...Array.from(backgroundSkillProficiencies),
      ...Array.from(selectedSkillProficiencies),
    ])),
    expertiseSkills: Array.from(selectedSkillExpertise),
  })

  const savingThrows: DerivedSavingThrowSummary[] = deriveSheetSavingThrows({
    abilities: core.abilities,
    proficiencyBonus,
    proficientAbilities: Array.from(savingThrowProficiencies),
    proficiencySources: buildSavingThrowSourceMap(
      context.classes.map((cls) => ({
        className: cls.name,
        savingThrowProficiencies: cls.savingThrowProficiencies,
      }))
    ),
  })

  const proficiencies: DerivedProficiencySummary = {
    skills: Array.from(new Set(skills.filter((skill) => skill.proficient).map((skill) => skill.key))),
    savingThrows: Array.from(savingThrowProficiencies),
    armor: Array.from(armorProficiencies),
    weapons: Array.from(weaponProficiencies),
    tools: Array.from(toolProficiencies),
    all: Array.from(
      new Set([
        ...skills.filter((skill) => skill.proficient).map((skill) => skill.key),
        ...Array.from(savingThrowProficiencies),
        ...Array.from(armorProficiencies),
        ...Array.from(weaponProficiencies),
        ...Array.from(toolProficiencies),
      ])
    ),
  }

  const passivePerception = deriveSheetPassivePerception({
    skills,
    wisdomModifier: core.abilities.wis.modifier,
  })
  const conModifier = abilityModifier(adjustedScores.con)
  const classNames = context.classes.map((cls) => cls.name)
  const subclassStates: DerivedSubclassState[] = context.classes.map((cls) => {
    const available = cls.level >= cls.subclassChoiceLevel
    let status: DerivedSubclassState['status'] = 'not_yet_available'

    if (cls.subclass && cls.level < cls.subclassChoiceLevel) {
      status = 'selected_too_early'
    } else if (cls.subclass) {
      status = 'selected'
    } else if (available) {
      status = 'available_unselected'
    }

    return {
      classId: cls.classId,
      className: cls.name,
      currentLevel: cls.level,
      requiredAt: cls.subclassChoiceLevel,
      subclassId: cls.subclass?.id ?? null,
      subclassName: cls.subclass?.name ?? null,
      status,
    }
  })

  const features: DerivedFeatureSummary[] = context.classes.flatMap((cls) =>
    cls.progression.flatMap((row) =>
      (row.features && row.features.length > 0
        ? row.features
        : row.featureNames.map((name): BuildFeatureUnlockSummary => ({
            name,
            description: null,
            sourceType: 'class',
            sourceLabel: cls.name,
            source: cls.source,
            amended: false,
            amendmentNote: null,
          }))
      ).map((feature) => ({
        classId: cls.classId,
        className: cls.name,
        level: row.level,
        name: feature.name,
        subclassName: cls.subclass?.name ?? null,
        sourceType: feature.sourceType,
        sourceLabel: feature.sourceLabel,
        description: feature.description,
        source: feature.source,
        amended: feature.amended,
        amendmentNote: feature.amendmentNote,
      }))
    )
  )
  const classResources = deriveClassResources(context, progression, core.abilities.cha.modifier)
  const asiFeatHistory = deriveAsiFeatHistory(context)

  const armorClass = deriveArmorClass({
    abilities: core.abilities,
    classNames,
    subclassNames: context.classes
      .map((cls) => cls.subclass?.name ?? null)
      .filter((name): name is string => Boolean(name)),
    speciesName: context.speciesName,
    speciesSource: context.speciesSource,
    selectedFeatureOptions: context.selectedFeatureOptions,
    selectedSpellNames: context.selectedSpells.map((spell) => spell.name),
    equippedItems: context.equipmentItems,
    armorCatalog: context.armorCatalog,
    shieldCatalog: context.shieldCatalog,
  })

  const dynamicSpeciesTraits = getDynamicSpeciesTraits({
    context,
    totalLevel: progression.totalLevel,
    proficiencyBonus,
    constitutionModifier: conModifier,
  })
  const replacedStaticTraitNames = new Set(
    dynamicSpeciesTraits.flatMap((trait) => {
      switch (trait.name) {
        case 'Draconic Ancestry':
          return ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance']
        case 'Cantrip':
          return ['Cantrip']
        case 'Drow Magic':
          return ['Drow Magic']
        case 'Infernal Legacy':
          return ['Infernal Legacy']
        default:
          return [trait.name]
      }
    })
  )
  const speciesTraits: DerivedSpeciesTraitSummary[] = [
    ...context.speciesTraits.filter((trait) => !replacedStaticTraitNames.has(trait.name)),
    ...dynamicSpeciesTraits,
  ]
  const combatActions = deriveCombatActions(context, proficiencyBonus, core.abilities, speciesTraits)

  const spellcasting = deriveSpellcastingSummary({
    classes: context.classes.map((cls) => ({
      classId: cls.classId,
      className: cls.name,
      classLevel: cls.level,
      spellcastingType: cls.spellcastingType,
      spellcastingProgression: cls.spellcastingProgression,
      subclass: cls.subclass,
    })),
    selectedSpells: context.selectedSpells,
    grantedSpellIds: context.grantedSpellIds,
    freePreparedSpellIds: context.freePreparedSpellIds,
    progression,
    adjustedScores,
    proficiencyBonus: core.proficiencyBonus,
  })

  return {
    ...core,
    ...progression,
    savingThrows,
    skills,
    proficiencies,
    initiative: core.initiative,
    passivePerception,
    speed: context.speciesSpeed,
    size: context.speciesSize,
    languages: Array.from(new Set([
      ...context.speciesLanguages,
      ...(context.background?.fixedLanguages ?? []),
      ...context.selectedLanguages,
    ])),
    speciesTraits,
    senses: context.speciesSenses,
    damageResistances: Array.from(new Set([
      ...context.speciesDamageResistances,
      ...getSpeciesDerivedDamageResistances({
        speciesName: context.speciesName,
        speciesSource: context.speciesSource,
        selectedOptions: context.selectedFeatureOptions,
      }),
    ])),
    conditionImmunities: context.speciesConditionImmunities,
    armorClass,
    subclassStates,
    features,
    classResources,
    asiFeatHistory,
    combatActions,
    spellcasting,
    blockingIssues: [],
    warnings: [],
  }
}

export function collectKnownProficiencies(context: CharacterBuildContext): Set<string> {
  return new Set(deriveCharacter(context).proficiencies.all)
}
