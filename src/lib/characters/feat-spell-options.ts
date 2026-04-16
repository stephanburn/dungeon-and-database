import type {
  CharacterSpellSelection,
  Feat,
} from '@/lib/types/database'
import type { FeatureSpellChoiceDefinition } from '@/lib/characters/feature-grants'
import {
  buildTypedFeatureSpellChoices,
  extractInteractiveFeatureSpellChoiceMap,
} from '@/lib/characters/feature-grants'

export interface FeatSpellChoiceDefinition extends FeatureSpellChoiceDefinition {
  featId: string
  featName: string
  choiceKey: string
}

type RawFeatSpellChoice = {
  key?: unknown
  label?: unknown
  spell_level?: unknown
  spell_list_class_name?: unknown
  acquisition_mode?: unknown
  counts_against_selection_limit?: unknown
}

function normalizeFeatSpellChoiceDefinition(
  feat: Feat,
  raw: RawFeatSpellChoice,
  index: number
): FeatSpellChoiceDefinition | null {
  const choiceKey = typeof raw.key === 'string' && raw.key.length > 0
    ? raw.key
    : `choice_${index + 1}`
  const spellLevel = typeof raw.spell_level === 'number' && Number.isInteger(raw.spell_level)
    ? raw.spell_level
    : null
  const spellListClassName = typeof raw.spell_list_class_name === 'string' && raw.spell_list_class_name.length > 0
    ? raw.spell_list_class_name
    : null

  if (spellLevel === null || spellListClassName === null) {
    return null
  }

  return {
    featId: feat.id,
    featName: feat.name,
    choiceKey,
    ownerLabel: feat.name,
    label: typeof raw.label === 'string' && raw.label.length > 0
      ? raw.label
      : `${feat.name} spell choice`,
    spellLevel,
    spellListClassNames: [spellListClassName],
    acquisitionMode: typeof raw.acquisition_mode === 'string' && raw.acquisition_mode.length > 0
      ? raw.acquisition_mode
      : 'granted',
    countsAgainstSelectionLimit: raw.counts_against_selection_limit === true,
    sourceFeatureKey: buildFeatSpellSourceFeatureKey(feat.id, choiceKey),
  }
}

function getFallbackFeatSpellChoices(feat: Feat): RawFeatSpellChoice[] {
  if (feat.name === 'Aberrant Dragonmark' && feat.source === 'EE') {
    return [
      {
        key: 'cantrip',
        label: 'Aberrant Dragonmark cantrip',
        spell_level: 0,
        spell_list_class_name: 'Sorcerer',
        acquisition_mode: 'granted',
        counts_against_selection_limit: false,
      },
      {
        key: 'level_1_spell',
        label: 'Aberrant Dragonmark 1st-level spell',
        spell_level: 1,
        spell_list_class_name: 'Sorcerer',
        acquisition_mode: 'granted',
        counts_against_selection_limit: false,
      },
    ]
  }

  return []
}

export function buildFeatSpellSourceFeatureKey(featId: string, choiceKey: string) {
  return `feat_spell:${featId}:${choiceKey}`
}

export function isFeatSpellSourceFeatureKey(sourceFeatureKey: string | null | undefined) {
  return Boolean(sourceFeatureKey?.startsWith('feat_spell:'))
}

export function parseFeatSpellSourceFeatureKey(sourceFeatureKey: string | null | undefined) {
  if (!isFeatSpellSourceFeatureKey(sourceFeatureKey)) return null

  const [, featId, ...choiceKeyParts] = sourceFeatureKey!.split(':')
  const choiceKey = choiceKeyParts.join(':')
  if (!featId || !choiceKey) return null

  return { featId, choiceKey }
}

export function getFeatSpellChoiceDefinitions(feats: Feat[]): FeatSpellChoiceDefinition[] {
  return feats.flatMap((feat) => {
    const rawChoices = Array.isArray((feat.benefits as { spell_choices?: unknown }).spell_choices)
      ? ((feat.benefits as { spell_choices: RawFeatSpellChoice[] }).spell_choices ?? [])
      : getFallbackFeatSpellChoices(feat)

    return rawChoices
      .map((choice, index) => normalizeFeatSpellChoiceDefinition(feat, choice, index))
      .filter((choice): choice is FeatSpellChoiceDefinition => Boolean(choice))
  })
}

export function extractFeatSpellChoiceMap(
  rows: CharacterSpellSelection[]
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(extractInteractiveFeatureSpellChoiceMap(rows)).filter(([sourceFeatureKey]) =>
      isFeatSpellSourceFeatureKey(sourceFeatureKey)
    )
  )
}

export function buildTypedFeatSpellChoices(args: {
  featSpellChoices: Record<string, string>
  definitions: FeatSpellChoiceDefinition[]
}) {
  return buildTypedFeatureSpellChoices({
    selectedChoices: args.featSpellChoices,
    definitions: args.definitions,
  })
}
