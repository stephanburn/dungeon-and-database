import type {
  CharacterFeatureOptionChoice,
  CharacterSpellSelection,
  Class,
  FeatureOption,
  FeatureSpellGrant,
  Species,
  Spell,
} from '@/lib/types/database'
import type {
  SpellChoiceInput,
} from '@/lib/characters/choice-persistence'
import {
  CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
  FEATURE_OPTION_VALUE_KEY,
  HIGH_ELF_CANTRIP_SOURCE_KEY,
  INTERACTIVE_FEATURE_SPELL_PREFIXES,
  MAVERICK_CANTRIP_SPECIALIST_SOURCE_KEY,
  MAVERICK_SUBCLASS_NAME,
  ordinalSuffix,
  type FeatureSpellChoiceDefinition,
} from './feature-grants-types'
import { getFeatureOptionChoiceValue } from './feature-grants-options'

export function isInteractiveFeatureSpellSourceFeatureKey(sourceFeatureKey: string | null | undefined) {
  return INTERACTIVE_FEATURE_SPELL_PREFIXES.some((prefix) => sourceFeatureKey?.startsWith(prefix))
}

export function extractInteractiveFeatureSpellChoiceMap(
  rows: CharacterSpellSelection[]
): Record<string, string> {
  const entries = rows.flatMap((row) => {
    if (!isInteractiveFeatureSpellSourceFeatureKey(row.source_feature_key)) return []
    return [[row.source_feature_key as string, row.spell_id] as const]
  })

  return Object.fromEntries(entries)
}

export function buildTypedFeatureSpellChoices(args: {
  selectedChoices: Record<string, string>
  definitions: FeatureSpellChoiceDefinition[]
}): SpellChoiceInput[] {
  const definitionsByKey = new Map(
    args.definitions.map((definition) => [definition.sourceFeatureKey, definition])
  )

  return Object.entries(args.selectedChoices).flatMap(([sourceFeatureKey, spellId]) => {
    if (!spellId) return []

    const definition = definitionsByKey.get(sourceFeatureKey)
    if (!definition) return []

    return [{
      spell_id: spellId,
      character_level_id: null,
      owning_class_id: definition.owningClassId ?? null,
      granting_subclass_id: null,
      acquisition_mode: definition.acquisitionMode,
      counts_against_selection_limit: definition.countsAgainstSelectionLimit,
      source_feature_key: sourceFeatureKey,
    }]
  })
}

export function getSpeciesFeatureSpellChoiceDefinitions(args: {
  species: Pick<Species, 'id' | 'name' | 'source'> | null
}): FeatureSpellChoiceDefinition[] {
  if (!isPhbHighElf(args.species)) return []

  return [{
    ownerLabel: 'High Elf',
    label: 'High Elf cantrip',
    spellLevel: 0,
    spellListClassNames: ['Wizard'],
    acquisitionMode: 'granted',
    countsAgainstSelectionLimit: false,
    sourceFeatureKey: HIGH_ELF_CANTRIP_SOURCE_KEY,
    owningClassId: null,
  }]
}

export function getMaverickFeatureSpellChoiceDefinitions(args: {
  classLevel: number
  artificerClassId: string | null
  selectedBreakthroughClassIds: string[]
  classList: Class[]
}): FeatureSpellChoiceDefinition[] {
  if (!args.artificerClassId || args.classLevel < 3) return []

  const breakthroughClassNames = args.selectedBreakthroughClassIds
    .map((classId) => args.classList.find((entry) => entry.id === classId)?.name)
    .filter((value): value is string => Boolean(value))

  const artificerClassName = args.classList.find((entry) => entry.id === args.artificerClassId)?.name ?? 'Artificer'

  const definitions: FeatureSpellChoiceDefinition[] = [{
    ownerLabel: MAVERICK_SUBCLASS_NAME,
    label: 'Maverick bonus cantrip',
    spellLevel: 0,
    spellListClassNames: Array.from(new Set([artificerClassName, ...breakthroughClassNames])),
    acquisitionMode: 'known',
    countsAgainstSelectionLimit: false,
    sourceFeatureKey: MAVERICK_CANTRIP_SPECIALIST_SOURCE_KEY,
    owningClassId: args.artificerClassId,
  }]

  const unlockedSpellLevels = [
    { requiredClassLevel: 3, spellLevel: 1 },
    { requiredClassLevel: 5, spellLevel: 2 },
    { requiredClassLevel: 9, spellLevel: 3 },
    { requiredClassLevel: 13, spellLevel: 4 },
    { requiredClassLevel: 17, spellLevel: 5 },
  ].filter((entry) => args.classLevel >= entry.requiredClassLevel)

  for (const entry of unlockedSpellLevels) {
    definitions.push({
      ownerLabel: MAVERICK_SUBCLASS_NAME,
      label: `Arcane Breakthrough ${entry.spellLevel}${ordinalSuffix(entry.spellLevel)}-level spell`,
      spellLevel: entry.spellLevel,
      spellListClassNames: breakthroughClassNames,
      acquisitionMode: 'prepared',
      countsAgainstSelectionLimit: false,
      sourceFeatureKey: `feature_spell:maverick:arcane_breakthrough:${entry.spellLevel}`,
      owningClassId: args.artificerClassId,
    })
  }

  return definitions
}

export function getStaticSpeciesGrantedSpells(args: {
  speciesId: string | null
  speciesName: string | null
  speciesSource: string | null
  totalLevel: number
  spells: Array<Pick<Spell, 'id' | 'name' | 'level' | 'school' | 'classes' | 'source'>>
  featureSpellGrants: FeatureSpellGrant[]
}) {
  if (!args.speciesId) return []

  const spellById = new Map(args.spells.map((spell) => [spell.id, spell]))
  return args.featureSpellGrants.flatMap((grant) => {
    if (grant.source_category !== 'species_trait') return []
    if (grant.source_entity_id !== args.speciesId) return []
    if (grant.minimum_character_level > args.totalLevel) return []

    const spell = spellById.get(grant.spell_id)
    if (!spell) return []

    return [{
      ...spell,
      acquisitionMode: grant.acquisition_mode,
      countsAgainstSelectionLimit: grant.counts_against_selection_limit,
      sourceFeatureKey: grant.source_feature_key,
      owningClassId: grant.owning_class_id,
      grantedBySubclassIds: grant.granting_subclass_id ? [grant.granting_subclass_id] : [] as string[],
    }]
  })
}

export function getStaticSubclassFeatureGrantedSpells(args: {
  classes: Array<{
    classId: string
    level: number
    subclass: { id: string | null; name: string | null; source: string | null } | null
  }>
  selectedFeatureOptions: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
  optionRows: Array<Pick<FeatureOption, 'id' | 'group_key' | 'key'>>
  spells: Array<Pick<Spell, 'id' | 'name' | 'level' | 'school' | 'classes' | 'source'>>
  featureSpellGrants: FeatureSpellGrant[]
}) {
  const grantedSpells: Array<ReturnType<typeof getStaticSpeciesGrantedSpells>[number]> = []
  const spellById = new Map(args.spells.map((spell) => [spell.id, spell]))

  for (const cls of args.classes) {
    if (cls.subclass?.name !== 'Circle of the Land' || cls.subclass.source !== 'PHB') continue

    const terrainKey = getFeatureOptionChoiceValue(
      args.selectedFeatureOptions,
      CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
      `${cls.classId}:terrain`,
      FEATURE_OPTION_VALUE_KEY
    )
    if (!terrainKey) continue

    const terrainOption = args.optionRows.find((option) => (
      option.group_key === CIRCLE_OF_LAND_TERRAIN_GROUP_KEY
      && option.key === terrainKey
    ))
    if (!terrainOption) continue

    for (const grant of args.featureSpellGrants) {
      if (grant.source_category !== 'feature_option') continue
      if (grant.source_entity_id !== terrainOption.id) continue
      if ((grant.minimum_class_level ?? 1) > cls.level) continue

      const spell = spellById.get(grant.spell_id)
      if (!spell) continue

      grantedSpells.push({
        ...spell,
        acquisitionMode: grant.acquisition_mode,
        countsAgainstSelectionLimit: grant.counts_against_selection_limit,
        sourceFeatureKey: grant.source_feature_key,
        owningClassId: grant.owning_class_id ?? cls.classId,
        grantedBySubclassIds: grant.granting_subclass_id ? [grant.granting_subclass_id] : [],
      })
    }
  }

  return grantedSpells
}

function isPhbHighElf(species: Pick<Species, 'name' | 'source'> | null) {
  return species?.name === 'High Elf' && species.source === 'PHB'
}
