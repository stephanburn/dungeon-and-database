'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FeatsCard } from '@/components/character-sheet/FeatsCard'
import { FeatSpellChoicesCard } from '@/components/character-sheet/FeatSpellChoicesCard'
import { FeatureOptionChoicesCard } from '@/components/character-sheet/FeatureOptionChoicesCard'
import { LegalityBadge, LegalitySummaryBadge } from '@/components/character-sheet/LegalityBadge'
import { MaverickBreakthroughCard } from '@/components/character-sheet/MaverickBreakthroughCard'
import { SpellsCard } from '@/components/character-sheet/SpellsCard'
import { SkillsCard } from '@/components/character-sheet/SkillsCard'
import { useToast } from '@/hooks/use-toast'
import { runLegalityChecks, type LegalityResult } from '@/lib/legality/engine'
import type {
  Background,
  Campaign,
  Character,
  CharacterClassLevel,
  CharacterFeatureOptionChoice,
  CharacterLevel,
  CharacterSpellSelection,
  Class,
  Feat,
  FeatureOption,
  RuleSet,
  Species,
  StatMethod,
  Subclass,
} from '@/lib/types/database'
import {
  buildCombinedSpellSelections,
  buildTypedAsiChoices,
  buildLocalCharacterContext,
  buildTypedFeatChoices,
  buildTypedSkillProficiencies,
  calculateLevelUpHpGain,
  ClassDetail,
  deriveLocalCharacter,
  getMulticlassSkillChoiceConfig,
  type AsiSelection,
  type SpellOption,
  type WizardLevel,
} from '@/lib/characters/wizard-helpers'
import { buildSpeciesAbilityBonusMap } from '@/lib/characters/species-ability-bonus-provenance'
import { getFeatSpellChoiceDefinitions } from '@/lib/characters/feat-spell-options'
import {
  buildFeatureOptionChoicesFromDefinitionMap,
  getActiveFeatureOptionChoices,
  buildMaverickFeatureOptionChoices,
  getFeatureOptionChoiceValue,
  getFightingStyleFeatureOptionDefinition,
  getMaverickArcaneBreakthroughOptionDefinitions,
  getSelectedMaverickBreakthroughClassIds,
  getSubclassFeatureOptionDefinitions,
  mergeFeatureOptionChoiceInputs,
} from '@/lib/characters/feature-grants'
import type { FeatureOptionChoiceInput } from '@/lib/characters/choice-persistence'
import { isMaverickSubclass } from '@/lib/characters/maverick'
import { getFixedHpGainValue } from '@/lib/characters/derived'
import {
  buildLevelUpClassOptions,
  getEditableLevelUpSpellChoiceIds,
  getLevelUpFeatureOptionStepDefinitions,
  getLevelUpResumeStepIndex,
  getPreservedLevelUpSpellSelections,
  isSubclassSelectionRequired,
  summarizeLevelUpSpellChanges,
} from '@/lib/characters/level-up-flow'

type CharacterWithRelations = Character & {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
  character_class_levels: CharacterClassLevel[]
}

type StepId = 'class' | 'subclass' | 'features' | 'skills' | 'spells' | 'feat' | 'hp' | 'review'

type LevelUpWizardProps = {
  character: CharacterWithRelations
  campaign: Campaign
  allowedSources: string[]
  allSourceRuleSets: Record<string, RuleSet>
  initialSkillProficiencies: string[]
  initialAbilityBonusChoices: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>
  initialAsiChoices: AsiSelection[]
  initialLanguageChoices: string[]
  initialToolChoices: string[]
  initialFeatureOptionChoices: CharacterFeatureOptionChoice[]
  initialSpellChoices: string[]
  initialFeatSpellChoices?: Record<string, string>
  initialSpellSelections: CharacterSpellSelection[]
  initialSelectedSpells: SpellOption[]
  initialFeatChoices: string[]
  isDm: boolean
}

type HpMode = 'fixed' | 'max' | 'manual'

const LEVEL_UP_REVIEW_STEP_LABELS: Record<StepId, string> = {
  class: 'Class',
  subclass: 'Subclass',
  features: 'Features',
  skills: 'Skills',
  spells: 'Spells',
  feat: 'ASI / Feat',
  hp: 'HP',
  review: 'Review',
}

const LEVEL_UP_CHECK_STEP_MAP: Record<string, StepId> = {
  source_allowlist: 'class',
  rule_set_consistency: 'class',
  level_cap: 'class',
  multiclass_prerequisites: 'class',
  subclass_timing: 'subclass',
  fighting_style_selections: 'features',
  subclass_feature_option_selections: 'features',
  multiclass_skill_validation: 'skills',
  skill_proficiencies: 'skills',
  spell_legality: 'spells',
  spell_selection_count: 'spells',
  feat_prerequisites: 'feat',
  feat_slots: 'feat',
  asi_choices: 'feat',
}

function getAdjustedStats(
  character: CharacterWithRelations,
  abilityBonusChoices: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>
) {
  const bonuses = character.species?.ability_score_bonuses ?? []
  const totals = bonuses.reduce<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>(
    (acc, bonus) => {
      acc[bonus.ability] += bonus.bonus
      return acc
    },
    { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  )
  const chosenBonuses = buildSpeciesAbilityBonusMap(character.species, abilityBonusChoices)
  for (const [ability, bonus] of Object.entries(chosenBonuses)) {
    totals[ability as keyof typeof totals] += bonus
  }

  return {
    str: character.base_str + totals.str,
    dex: character.base_dex + totals.dex,
    con: character.base_con + totals.con,
    int: character.base_int + totals.int,
    wis: character.base_wis + totals.wis,
    cha: character.base_cha + totals.cha,
  }
}

function setsDiffer(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return true
  for (const value of Array.from(left)) {
    if (!right.has(value)) return true
  }
  return false
}

function getFeatureOptionChoiceKey(choice: Pick<FeatureOptionChoiceInput, 'option_group_key' | 'option_key' | 'choice_order' | 'source_feature_key'>) {
  return [
    choice.option_group_key,
    choice.option_key,
    choice.choice_order ?? 0,
    choice.source_feature_key ?? '',
  ].join('::')
}

function getFeatureOptionChoiceSignature(choice: Pick<FeatureOptionChoiceInput, 'option_group_key' | 'option_key' | 'selected_value' | 'choice_order' | 'source_feature_key'>) {
  return `${getFeatureOptionChoiceKey(choice)}::${JSON.stringify(choice.selected_value ?? {})}`
}

function getSpellSelectionKey(choice: CharacterSpellSelection | Exclude<ReturnType<typeof buildCombinedSpellSelections>[number], string>) {
  return [
    choice.spell_id,
    choice.owning_class_id ?? '',
    choice.granting_subclass_id ?? '',
    choice.acquisition_mode ?? 'known',
  ].join('::')
}

function getFeatChoiceKey(choice: Exclude<ReturnType<typeof buildTypedFeatChoices>[number], string>) {
  return [
    choice.feat_id,
    choice.choice_kind ?? 'feat',
  ].join('::')
}

export function LevelUpWizard({
  character,
  campaign,
  allowedSources,
  allSourceRuleSets,
  initialSkillProficiencies,
  initialAbilityBonusChoices,
  initialAsiChoices,
  initialLanguageChoices,
  initialToolChoices,
  initialFeatureOptionChoices,
  initialSpellChoices,
  initialFeatSpellChoices = {},
  initialSpellSelections,
  initialSelectedSpells,
  initialFeatChoices,
  isDm,
}: LevelUpWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const levelUpDraftStorageKey = `level-up-draft:${character.id}`

  const baseLevels = useMemo<Array<WizardLevel & { hp_roll: number | null }>>(
    () => character.character_levels.map((level) => ({
      class_id: level.class_id,
      level: level.level,
      subclass_id: level.subclass_id,
      hp_roll: level.hp_roll,
    })),
    [character.character_levels]
  )

  const [classList, setClassList] = useState<Class[]>([])
  const [featList, setFeatList] = useState<Feat[]>([])
  const [featureOptionRows, setFeatureOptionRows] = useState<FeatureOption[]>([])
  const [classDetailMap, setClassDetailMap] = useState<Record<string, ClassDetail>>({})
  const [subclassMap, setSubclassMap] = useState<Record<string, Subclass[]>>({})
  const [spellOptions, setSpellOptions] = useState<SpellOption[]>([])

  const [selectedClassId, setSelectedClassId] = useState(baseLevels[0]?.class_id ?? '')
  const [selectedSubclassId, setSelectedSubclassId] = useState<string | null>(null)
  const [skillProficiencies, setSkillProficiencies] = useState<string[]>(initialSkillProficiencies)
  const [asiChoices, setAsiChoices] = useState<AsiSelection[]>(initialAsiChoices)
  const [languageChoices] = useState<string[]>(initialLanguageChoices)
  const [toolChoices] = useState<string[]>(initialToolChoices)
  const [featureOptionChoices, setFeatureOptionChoices] = useState<FeatureOptionChoiceInput[]>(
    initialFeatureOptionChoices
      .filter((choice) => (
        choice.option_group_key !== 'maverick:arcane_breakthrough_classes'
        && !choice.option_group_key.startsWith('maverick:breakthrough:')
      ))
      .map((choice) => ({
        option_group_key: choice.option_group_key,
        option_key: choice.option_key,
        selected_value: choice.selected_value,
        choice_order: choice.choice_order,
        character_level_id: choice.character_level_id,
        source_category: choice.source_category,
        source_entity_id: choice.source_entity_id,
        source_feature_key: choice.source_feature_key,
      }))
  )
  const [maverickBreakthroughClassIds, setMaverickBreakthroughClassIds] = useState<string[]>(
    getSelectedMaverickBreakthroughClassIds(initialFeatureOptionChoices)
  )
  const [spellChoices, setSpellChoices] = useState<string[]>(
    getEditableLevelUpSpellChoiceIds(initialSpellSelections, baseLevels[0]?.class_id ?? '')
  )
  const [featChoices] = useState<string[]>(initialFeatChoices)
  const [featSpellChoices, setFeatSpellChoices] = useState<Record<string, string>>(initialFeatSpellChoices)
  const [featSpellOptions, setFeatSpellOptions] = useState<SpellOption[]>([])
  const [newFeatChoice, setNewFeatChoice] = useState('')
  const [hpMode, setHpMode] = useState<HpMode>('fixed')
  const [manualHpRoll, setManualHpRoll] = useState<number>(1)
  const [stepIndex, setStepIndex] = useState(0)
  const [working, setWorking] = useState(false)
  const [savedLegality, setSavedLegality] = useState<LegalityResult | null>(null)
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false)
  const activeInitialFeatureOptionChoices = useMemo(
    () => getActiveFeatureOptionChoices(initialFeatureOptionChoices),
    [initialFeatureOptionChoices]
  )
  const initialFightingStyleKeys = useMemo(
    () => new Set(
      activeInitialFeatureOptionChoices
        .filter((choice) => choice.option_group_key.startsWith('fighting_style:'))
        .map((choice) => `${choice.option_group_key}:${choice.option_key}`)
    ),
    [activeInitialFeatureOptionChoices]
  )
  const initialSubclassFeatureOptionKeys = useMemo(
    () => new Set(
      activeInitialFeatureOptionChoices
        .filter((choice) => (
          choice.option_group_key === 'maneuver:battle_master:2014'
          || choice.option_group_key.startsWith('hunter:')
          || choice.option_group_key === 'circle_of_land:terrain:2014'
          || choice.option_group_key === 'elemental_discipline:four_elements:2014'
        ))
        .map((choice) => `${choice.option_group_key}:${choice.option_key}`)
    ),
    [activeInitialFeatureOptionChoices]
  )
  const allInitialFeatureOptionChoiceSignatures = useMemo(
    () => new Set(initialFeatureOptionChoices.map((choice) => getFeatureOptionChoiceSignature({
      option_group_key: choice.option_group_key,
      option_key: choice.option_key,
      selected_value: choice.selected_value,
      choice_order: choice.choice_order,
      source_feature_key: choice.source_feature_key,
    }))),
    [initialFeatureOptionChoices]
  )
  const initialSpellSelectionKeys = useMemo(
    () => new Set(initialSpellSelections.map((choice) => getSpellSelectionKey(choice))),
    [initialSpellSelections]
  )

  const currentClassIds = useMemo(
    () => Array.from(new Set(baseLevels.map((level) => level.class_id))),
    [baseLevels]
  )

  useEffect(() => {
    const draftJson = window.localStorage.getItem(levelUpDraftStorageKey)
    if (!draftJson) {
      setDraftHydrated(true)
      return
    }

    try {
      const draft = JSON.parse(draftJson) as {
        selectedClassId?: string
        selectedSubclassId?: string | null
        skillProficiencies?: string[]
        asiChoices?: AsiSelection[]
        featureOptionChoices?: FeatureOptionChoiceInput[]
        maverickBreakthroughClassIds?: string[]
        spellChoices?: string[]
        featSpellChoices?: Record<string, string>
        newFeatChoice?: string
        hpMode?: HpMode
        manualHpRoll?: number
        stepIndex?: number
      }

      if (typeof draft.selectedClassId === 'string' && draft.selectedClassId.length > 0) {
        setSelectedClassId(draft.selectedClassId)
      }
      if (draft.selectedSubclassId !== undefined) {
        setSelectedSubclassId(draft.selectedSubclassId)
      }
      if (Array.isArray(draft.skillProficiencies)) {
        setSkillProficiencies(draft.skillProficiencies)
      }
      if (Array.isArray(draft.asiChoices)) {
        setAsiChoices(draft.asiChoices)
      }
      if (Array.isArray(draft.featureOptionChoices)) {
        setFeatureOptionChoices(draft.featureOptionChoices)
      }
      if (Array.isArray(draft.maverickBreakthroughClassIds)) {
        setMaverickBreakthroughClassIds(draft.maverickBreakthroughClassIds)
      }
      if (Array.isArray(draft.spellChoices)) {
        setSpellChoices(draft.spellChoices)
      }
      if (draft.featSpellChoices && typeof draft.featSpellChoices === 'object') {
        setFeatSpellChoices(draft.featSpellChoices)
      }
      if (typeof draft.newFeatChoice === 'string') {
        setNewFeatChoice(draft.newFeatChoice)
      }
      if (draft.hpMode === 'fixed' || draft.hpMode === 'max' || draft.hpMode === 'manual') {
        setHpMode(draft.hpMode)
      }
      if (typeof draft.manualHpRoll === 'number' && Number.isFinite(draft.manualHpRoll)) {
        setManualHpRoll(draft.manualHpRoll)
      }
      if (typeof draft.stepIndex === 'number' && Number.isFinite(draft.stepIndex)) {
        setStepIndex(Math.max(0, draft.stepIndex))
      }

      setDraftRestored(true)
      setShowDraftRestoredNotice(true)
    } catch {
      window.localStorage.removeItem(levelUpDraftStorageKey)
    } finally {
      setDraftHydrated(true)
    }
  }, [levelUpDraftStorageKey])

  useEffect(() => {
    if (!draftHydrated || working) return

    window.localStorage.setItem(levelUpDraftStorageKey, JSON.stringify({
      selectedClassId,
      selectedSubclassId,
      skillProficiencies,
      asiChoices,
      featureOptionChoices,
      maverickBreakthroughClassIds,
      spellChoices,
      featSpellChoices,
      newFeatChoice,
      hpMode,
      manualHpRoll,
      stepIndex,
    }))
  }, [
    asiChoices,
    draftHydrated,
    featSpellChoices,
    featureOptionChoices,
    hpMode,
    levelUpDraftStorageKey,
    manualHpRoll,
    maverickBreakthroughClassIds,
    newFeatChoice,
    selectedClassId,
    selectedSubclassId,
    skillProficiencies,
    spellChoices,
    stepIndex,
    working,
  ])

  useEffect(() => {
    const qs = `?campaign_id=${campaign.id}`
    Promise.all([
      fetch(`/api/content/classes${qs}`).then((response) => response.json()),
      fetch(`/api/content/feats${qs}`).then((response) => response.json()),
      fetch(`/api/content/feature-options${qs}`).then((response) => response.json()),
    ]).then(([classes, feats, featureOptions]) => {
      setClassList(Array.isArray(classes) ? classes : [])
      setFeatList(Array.isArray(feats) ? feats : [])
      setFeatureOptionRows(Array.isArray(featureOptions) ? featureOptions : [])
      if (!selectedClassId && Array.isArray(classes) && classes.length > 0) {
        setSelectedClassId(classes[0].id)
      }
    })
  }, [campaign.id, selectedClassId])

  useEffect(() => {
    const classIds = Array.from(new Set([...currentClassIds, selectedClassId].filter(Boolean)))
    const missingDetails = classIds.filter((classId) => !classDetailMap[classId])
    const missingSubclasses = classIds.filter((classId) => !subclassMap[classId])

    if (missingDetails.length > 0) {
      Promise.all(
        missingDetails.map((classId) =>
          fetch(`/api/content/classes/${classId}`)
            .then((response) => response.json())
            .then((detail: ClassDetail) => ({ classId, detail }))
        )
      ).then((results) => {
        setClassDetailMap((prev) => {
          const next = { ...prev }
          for (const result of results) next[result.classId] = result.detail
          return next
        })
      })
    }

    if (missingSubclasses.length > 0) {
      Promise.all(
        missingSubclasses.map((classId) =>
          fetch(`/api/content/classes/${classId}/subclasses?campaign_id=${campaign.id}`)
            .then((response) => response.json())
            .then((subclasses: Subclass[]) => ({ classId, subclasses }))
        )
      ).then((results) => {
        setSubclassMap((prev) => {
          const next = { ...prev }
          for (const result of results) next[result.classId] = result.subclasses
          return next
        })
      })
    }
  }, [campaign.id, classDetailMap, currentClassIds, selectedClassId, subclassMap])

  const selectedClassDetail = selectedClassId ? classDetailMap[selectedClassId] ?? null : null
  const currentTargetLevel = baseLevels.find((level) => level.class_id === selectedClassId)?.level ?? 0
  const nextTargetLevel = currentTargetLevel > 0 ? currentTargetLevel + 1 : 1
  const enteringNewClass = currentTargetLevel === 0
  const adjustedStats = useMemo(
    () => getAdjustedStats(character, initialAbilityBonusChoices),
    [character, initialAbilityBonusChoices]
  )

  useEffect(() => {
    if (!selectedClassDetail) return
    if (!selectedClassDetail.spellcasting_type || selectedClassDetail.spellcasting_type === 'none') {
      setSpellOptions([])
      return
    }

    const params = new URLSearchParams({
      class_id: selectedClassId,
      campaign_id: campaign.id,
      class_level: String(nextTargetLevel),
    })
    if (character.species_id) params.set('species_id', character.species_id)
    if (selectedSubclassId) params.append('subclass_id', selectedSubclassId)
    for (const expandedClassId of maverickBreakthroughClassIds.filter(Boolean)) {
      params.append('expanded_class_id', expandedClassId)
    }

    fetch(`/api/content/spells?${params.toString()}`)
      .then((response) => response.json())
      .then((data: SpellOption[]) => setSpellOptions(Array.isArray(data) ? data : []))
  }, [campaign.id, character.species_id, maverickBreakthroughClassIds, nextTargetLevel, selectedClassDetail, selectedClassId, selectedSubclassId])

  useEffect(() => {
    const existingSubclassId = baseLevels.find((level) => level.class_id === selectedClassId)?.subclass_id ?? null
    if (!draftHydrated || draftRestored) return
    setSelectedSubclassId(existingSubclassId)
  }, [baseLevels, draftHydrated, draftRestored, selectedClassId])

  useEffect(() => {
    if (!selectedClassId) {
      setSpellChoices([])
      return
    }

    if (!draftHydrated || draftRestored) return
    setSpellChoices(getEditableLevelUpSpellChoiceIds(initialSpellSelections, selectedClassId))
  }, [draftHydrated, draftRestored, initialSpellSelections, selectedClassId])

  useEffect(() => {
    if (!draftRestored) return
    setDraftRestored(false)
  }, [draftRestored])

  const mergedSpellOptions = useMemo<SpellOption[]>(() => {
    const byId = new Map<string, SpellOption>()
    for (const spell of initialSelectedSpells) {
      byId.set(spell.id, spell)
    }
    for (const spell of spellOptions) {
      byId.set(spell.id, spell)
    }
    for (const spell of featSpellOptions) {
      byId.set(spell.id, spell)
    }
    return Array.from(byId.values())
  }, [featSpellOptions, initialSelectedSpells, spellOptions])
  const selectedSubclass = selectedClassId
    ? (subclassMap[selectedClassId] ?? []).find((entry) => entry.id === selectedSubclassId) ?? null
    : null
  const currentSubclassId = baseLevels.find((level) => level.class_id === selectedClassId)?.subclass_id ?? null
  const currentSubclass = selectedClassId
    ? (subclassMap[selectedClassId] ?? []).find((entry) => entry.id === currentSubclassId) ?? null
    : null
  const fightingStyleDefinitions = useMemo(
    () => getFightingStyleFeatureOptionDefinition({
      classId: selectedClassId || null,
      className: selectedClassDetail?.name ?? null,
      classLevel: nextTargetLevel,
      optionRows: featureOptionRows,
    }).map((definition) => ({
      ...definition,
      optionKey: `${selectedClassId}:style`,
    })),
    [featureOptionRows, nextTargetLevel, selectedClassDetail?.name, selectedClassId]
  )
  const currentFightingStyleDefinitions = useMemo(
    () => getFightingStyleFeatureOptionDefinition({
      classId: selectedClassId || null,
      className: selectedClassDetail?.name ?? null,
      classLevel: currentTargetLevel,
      optionRows: featureOptionRows,
    }).map((definition) => ({
      ...definition,
      optionKey: `${selectedClassId}:style`,
    })),
    [currentTargetLevel, featureOptionRows, selectedClassDetail?.name, selectedClassId]
  )
  const maverickOptionDefinitions = useMemo(
    () => getMaverickArcaneBreakthroughOptionDefinitions({
      classLevel: nextTargetLevel,
      subclassId: selectedSubclassId,
      optionRows: featureOptionRows,
    }),
    [featureOptionRows, nextTargetLevel, selectedSubclassId]
  )
  const breakthroughClassOptions = maverickOptionDefinitions[0]?.choices ?? []
  const subclassFeatureOptionDefinitions = useMemo(
    () => getSubclassFeatureOptionDefinitions({
      classId: selectedClassId || null,
      classLevel: nextTargetLevel,
      subclassId: selectedSubclassId,
      subclassName: selectedSubclass?.name ?? null,
      subclassSource: selectedSubclass?.source ?? null,
      optionRows: featureOptionRows,
    }),
    [featureOptionRows, nextTargetLevel, selectedClassId, selectedSubclass?.name, selectedSubclass?.source, selectedSubclassId]
  )
  const currentSubclassFeatureOptionDefinitions = useMemo(
    () => getSubclassFeatureOptionDefinitions({
      classId: selectedClassId || null,
      classLevel: currentTargetLevel,
      subclassId: currentSubclass?.id ?? null,
      subclassName: currentSubclass?.name ?? null,
      subclassSource: currentSubclass?.source ?? null,
      optionRows: featureOptionRows,
    }),
    [currentSubclass?.id, currentSubclass?.name, currentSubclass?.source, currentTargetLevel, featureOptionRows, selectedClassId]
  )
  const levelUpFeatureOptionDefinitions = useMemo(
    () => [
      ...getLevelUpFeatureOptionStepDefinitions({
        currentDefinitions: currentFightingStyleDefinitions,
        nextDefinitions: fightingStyleDefinitions,
      }),
      ...getLevelUpFeatureOptionStepDefinitions({
        currentDefinitions: currentSubclassFeatureOptionDefinitions,
        nextDefinitions: subclassFeatureOptionDefinitions,
      }),
    ],
    [currentFightingStyleDefinitions, currentSubclassFeatureOptionDefinitions, fightingStyleDefinitions, subclassFeatureOptionDefinitions]
  )

  useEffect(() => {
    const activeKeys = new Set(
      fightingStyleDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !choice.option_group_key.startsWith('fighting_style:')
      || initialFightingStyleKeys.has(`${choice.option_group_key}:${choice.option_key}`)
      || activeKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [fightingStyleDefinitions, initialFightingStyleKeys])

  useEffect(() => {
    const activeKeys = new Set(
      subclassFeatureOptionDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !(
        choice.option_group_key === 'maneuver:battle_master:2014'
        || choice.option_group_key.startsWith('hunter:')
        || choice.option_group_key === 'circle_of_land:terrain:2014'
        || choice.option_group_key === 'elemental_discipline:four_elements:2014'
      )
      || initialSubclassFeatureOptionKeys.has(`${choice.option_group_key}:${choice.option_key}`)
      || activeKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [initialSubclassFeatureOptionKeys, subclassFeatureOptionDefinitions])

  const canonicalFeatureOptionChoices = useMemo(
    () => mergeFeatureOptionChoiceInputs({
      preservedChoices: featureOptionChoices,
      replacementDefinitions: fightingStyleDefinitions,
      replacements: [
        ...buildFeatureOptionChoicesFromDefinitionMap({
          definitions: fightingStyleDefinitions,
          selectedValues: Object.fromEntries(
            fightingStyleDefinitions.map((definition) => [
              definition.optionKey,
              getFeatureOptionChoiceValue(
                featureOptionChoices,
                definition.optionGroupKey,
                definition.optionKey,
                definition.valueKey ?? 'class_id'
              ) ?? '',
            ])
          ),
        }),
        ...buildFeatureOptionChoicesFromDefinitionMap({
          definitions: subclassFeatureOptionDefinitions,
          selectedValues: Object.fromEntries(
            subclassFeatureOptionDefinitions.map((definition) => [
              definition.optionKey,
              getFeatureOptionChoiceValue(
                featureOptionChoices,
                definition.optionGroupKey,
                definition.optionKey,
                definition.valueKey ?? 'class_id'
              ) ?? '',
            ])
          ),
        }),
        ...buildMaverickFeatureOptionChoices({
          selectedClassIds: maverickBreakthroughClassIds,
          definitions: maverickOptionDefinitions,
        }),
      ],
    }),
    [featureOptionChoices, fightingStyleDefinitions, maverickBreakthroughClassIds, maverickOptionDefinitions, subclassFeatureOptionDefinitions]
  )

  const targetLevels = useMemo<WizardLevel[]>(() => {
    if (!selectedClassId) {
      return baseLevels.map((level) => ({
        class_id: level.class_id,
        level: level.level,
        subclass_id: level.subclass_id,
      }))
    }

    let updated = false
    const next = baseLevels.map((level) => {
      if (level.class_id !== selectedClassId) {
        return {
          class_id: level.class_id,
          level: level.level,
          subclass_id: level.subclass_id,
        }
      }

      updated = true
      return {
        class_id: level.class_id,
        level: level.level + 1,
        subclass_id: selectedSubclassId ?? level.subclass_id,
      }
    })

    if (!updated) {
      next.push({
        class_id: selectedClassId,
        level: 1,
        subclass_id: selectedSubclassId,
      })
    }

    return next
  }, [baseLevels, selectedClassId, selectedSubclassId])

  const backgroundFeat = useMemo(
    () => character.background?.background_feat_id
      ? featList.find((feat) => feat.id === character.background?.background_feat_id) ?? null
      : null,
    [character.background, featList]
  )
  const currentContext = buildLocalCharacterContext({
    campaign,
    allowedSources,
    allSourceRuleSets,
    statMethod: character.stat_method as StatMethod,
    persistedHpMax: character.hp_max,
    stats: {
      str: character.base_str,
      dex: character.base_dex,
      con: character.base_con,
      int: character.base_int,
      wis: character.base_wis,
      cha: character.base_cha,
    },
    selectedSpecies: character.species,
    selectedBackground: character.background,
    levels: baseLevels,
    classDetailMap,
    subclassMap,
    spellOptions: mergedSpellOptions,
    spellChoices: initialSpellChoices,
    spellSelections: initialSpellSelections,
    featList,
    featChoices: initialFeatChoices,
    asiChoices: initialAsiChoices,
    skillProficiencies: initialSkillProficiencies,
    abilityBonusChoices: initialAbilityBonusChoices,
    languageChoices: initialLanguageChoices,
    toolChoices: initialToolChoices,
    featureOptionRows,
    featureOptionChoices: activeInitialFeatureOptionChoices,
  })

  const preservedNonEditableSpellSelections = useMemo(
    () => getPreservedLevelUpSpellSelections(initialSpellSelections, selectedClassId),
    [initialSpellSelections, selectedClassId]
  )

  const nextFeatChoices = useMemo(() => {
    const next = [...featChoices]
    const currentSlots = deriveLocalCharacter(currentContext)?.totalAsiSlots ?? 0
    const previewContext = buildLocalCharacterContext({
      campaign,
      allowedSources,
      allSourceRuleSets,
      statMethod: character.stat_method as StatMethod,
      persistedHpMax: character.hp_max,
      stats: {
        str: character.base_str,
        dex: character.base_dex,
        con: character.base_con,
        int: character.base_int,
        wis: character.base_wis,
        cha: character.base_cha,
      },
      selectedSpecies: character.species,
      selectedBackground: character.background,
      levels: targetLevels,
      classDetailMap,
      subclassMap,
      spellOptions: mergedSpellOptions,
      spellChoices,
      featList,
      featChoices: next,
      asiChoices,
      skillProficiencies,
      abilityBonusChoices: initialAbilityBonusChoices,
      languageChoices,
      toolChoices,
      featureOptionRows,
      featureOptionChoices: [
        ...canonicalFeatureOptionChoices.map((choice) => ({
          id: `${choice.option_group_key}:${choice.option_key}`,
          character_id: character.id,
          character_level_id: null,
          option_group_key: choice.option_group_key,
          option_key: choice.option_key,
          selected_value: choice.selected_value ?? {},
          choice_order: choice.choice_order ?? 0,
          source_category: choice.source_category ?? 'feature',
          source_entity_id: choice.source_entity_id ?? null,
          source_feature_key: choice.source_feature_key ?? null,
          created_at: '',
        })),
      ],
    })
    const nextSlots = deriveLocalCharacter(previewContext)?.totalAsiSlots ?? currentSlots
    if (nextSlots > currentSlots) {
      next[currentSlots] = newFeatChoice === 'asi' ? '' : newFeatChoice
    }
    return next
  }, [
    allSourceRuleSets,
    allowedSources,
    campaign,
    character.background,
    character.hp_max,
    character.base_cha,
    character.base_con,
    character.base_dex,
    character.base_int,
    character.base_str,
    character.base_wis,
    character.species,
    character.stat_method,
    classDetailMap,
    featChoices,
    featList,
    featureOptionRows,
    canonicalFeatureOptionChoices,
    mergedSpellOptions,
    newFeatChoice,
    asiChoices,
    languageChoices,
    skillProficiencies,
    spellChoices,
    subclassMap,
    targetLevels,
    toolChoices,
    character.id,
    currentContext,
    initialAbilityBonusChoices,
  ])

  const nextActiveFeatSpellFeats = useMemo(
    () => [
      ...nextFeatChoices
        .map((featId) => featList.find((feat) => feat.id === featId))
        .filter((feat): feat is Feat => Boolean(feat)),
      ...(backgroundFeat ? [backgroundFeat] : []),
    ],
    [backgroundFeat, featList, nextFeatChoices]
  )
  const nextFeatSpellDefinitions = useMemo(
    () => getFeatSpellChoiceDefinitions(nextActiveFeatSpellFeats),
    [nextActiveFeatSpellFeats]
  )

  useEffect(() => {
    const allowedKeys = new Set(nextFeatSpellDefinitions.map((definition) => definition.sourceFeatureKey))
    setFeatSpellChoices((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([sourceFeatureKey]) => allowedKeys.has(sourceFeatureKey))
      )
    )
  }, [nextFeatSpellDefinitions])

  const hitDie = selectedClassDetail?.hit_die ?? 0
  const fixedHpGain = hitDie > 0 ? getFixedHpGainValue(hitDie) : 1
  const resolvedHpRoll = hpMode === 'manual'
    ? manualHpRoll
    : hpMode === 'max'
      ? hitDie
      : fixedHpGain
  const hpGainTotal = hitDie > 0 ? calculateLevelUpHpGain(hitDie, character.base_con, resolvedHpRoll) : 0
  const nextHpMax = character.hp_max + hpGainTotal
  const nextCombinedSpellSelections = buildCombinedSpellSelections({
    classSpellChoices: spellChoices,
    spellOptions: mergedSpellOptions,
    owningClassId: selectedClassId || null,
    activeSubclassIds: selectedSubclassId ? [selectedSubclassId] : [],
    derived: null,
    featSpellChoices,
    featList: nextActiveFeatSpellFeats,
  }).concat(preservedNonEditableSpellSelections)

  const nextContext = buildLocalCharacterContext({
    campaign,
    allowedSources,
    allSourceRuleSets,
    statMethod: character.stat_method as StatMethod,
    persistedHpMax: nextHpMax,
    stats: {
      str: character.base_str,
      dex: character.base_dex,
      con: character.base_con,
      int: character.base_int,
      wis: character.base_wis,
      cha: character.base_cha,
    },
    selectedSpecies: character.species,
    selectedBackground: character.background,
    levels: targetLevels,
    classDetailMap,
    subclassMap,
    spellOptions: mergedSpellOptions,
    spellChoices,
    spellSelections: nextCombinedSpellSelections,
    featList,
    featChoices: nextFeatChoices,
    asiChoices,
    skillProficiencies,
    abilityBonusChoices: initialAbilityBonusChoices,
    languageChoices,
    toolChoices,
    featureOptionRows,
    featureOptionChoices: [
      ...canonicalFeatureOptionChoices.map((choice) => ({
        id: `${choice.option_group_key}:${choice.option_key}`,
        character_id: character.id,
        character_level_id: null,
        option_group_key: choice.option_group_key,
        option_key: choice.option_key,
        selected_value: choice.selected_value ?? {},
        choice_order: choice.choice_order ?? 0,
        source_category: choice.source_category ?? 'feature',
        source_entity_id: choice.source_entity_id ?? null,
        source_feature_key: choice.source_feature_key ?? null,
        created_at: '',
      })),
    ],
  })

  const currentDerived = deriveLocalCharacter(currentContext)
  const nextDerived = deriveLocalCharacter(nextContext)
  const persistedNextSpellSelections = buildCombinedSpellSelections({
    classSpellChoices: spellChoices,
    spellOptions: mergedSpellOptions,
    owningClassId: selectedClassId || null,
    activeSubclassIds: selectedSubclassId ? [selectedSubclassId] : [],
    derived: nextDerived,
    featSpellChoices,
    featList: nextActiveFeatSpellFeats,
  }).concat(preservedNonEditableSpellSelections)
  const localLegality = nextContext ? runLegalityChecks(nextContext) : null
  const canonicalIssues = (savedLegality ?? localLegality)?.derived
  const canonicalBlockingIssues = useMemo(
    () => canonicalIssues?.blockingIssues ?? [],
    [canonicalIssues]
  )
  const canonicalWarnings = useMemo(
    () => canonicalIssues?.warnings ?? [],
    [canonicalIssues]
  )
  const groupedReviewIssues = useMemo(() => {
    const groups = new Map<StepId, Array<{ key: string; message: string; severity: 'error' | 'warning' }>>()

    for (const issue of [...canonicalBlockingIssues, ...canonicalWarnings]) {
      const stepId = LEVEL_UP_CHECK_STEP_MAP[issue.key] ?? 'review'
      const existing = groups.get(stepId) ?? []
      existing.push(issue)
      groups.set(stepId, existing)
    }

    return Array.from(groups.entries()).map(([stepId, issues]) => ({
      stepId,
      stepLabel: LEVEL_UP_REVIEW_STEP_LABELS[stepId],
      issues,
    }))
  }, [canonicalBlockingIssues, canonicalWarnings])

  const targetLevelRow = targetLevels.find((level) => level.class_id === selectedClassId) ?? null
  const subclassRequired = Boolean(
    selectedClassDetail &&
    targetLevelRow &&
    isSubclassSelectionRequired({
      nextClassLevel: targetLevelRow.level,
      subclassChoiceLevel: selectedClassDetail.subclass_choice_level,
      selectedSubclassId: targetLevelRow.subclass_id ?? null,
    })
  )

  const featSlots = nextDerived?.featSlots ?? []
  const currentFeatSlotCount = currentDerived?.totalAsiSlots ?? 0
  const newFeatSlot = featSlots[currentFeatSlotCount] ?? null
  const newFeatSlotLabel = newFeatSlot?.label ?? null
  const needsFeatStep = Boolean(newFeatSlot)
  const initialTypedFeatChoices = useMemo(
    () => buildTypedFeatChoices(initialFeatChoices, currentDerived?.featSlots),
    [currentDerived?.featSlots, initialFeatChoices]
  )
  const initialFeatChoiceKeys = useMemo(
    () => new Set(
      initialTypedFeatChoices
        .filter((choice): choice is Exclude<typeof choice, string> => typeof choice !== 'string')
        .map((choice) => getFeatChoiceKey(choice))
    ),
    [initialTypedFeatChoices]
  )
  const nextTypedAsiChoices = useMemo(
    () => buildTypedAsiChoices(
      asiChoices,
      nextDerived?.featSlots,
      nextFeatChoices
    ),
    [asiChoices, nextDerived?.featSlots, nextFeatChoices]
  )
  const newLevelSkillChoices = useMemo(
    () => buildTypedSkillProficiencies({
      skillProficiencies,
      background: character.background,
      selectedClass: selectedClassDetail,
      species: character.species,
    })
      .filter((choice): choice is Exclude<typeof choice, string> => typeof choice !== 'string')
      .filter((choice) => !initialSkillProficiencies.includes(choice.skill)),
    [character.background, character.species, initialSkillProficiencies, selectedClassDetail, skillProficiencies]
  )
  const newLevelAsiChoices = useMemo(
    () => nextTypedAsiChoices.filter((choice) => choice.slot_index === currentFeatSlotCount),
    [currentFeatSlotCount, nextTypedAsiChoices]
  )
  const newLevelFeatureOptionChoices = useMemo(
    () => canonicalFeatureOptionChoices.filter((choice) => !allInitialFeatureOptionChoiceSignatures.has(getFeatureOptionChoiceSignature(choice))),
    [allInitialFeatureOptionChoiceSignatures, canonicalFeatureOptionChoices]
  )
  const newLevelSpellSelections = useMemo(
    () => persistedNextSpellSelections
      .filter((choice): choice is Exclude<typeof choice, string> => typeof choice !== 'string')
      .filter((choice) => !initialSpellSelectionKeys.has(getSpellSelectionKey(choice))),
    [initialSpellSelectionKeys, persistedNextSpellSelections]
  )
  const newLevelFeatChoices = useMemo(
    () => buildTypedFeatChoices(nextFeatChoices, nextDerived?.featSlots)
      .filter((choice): choice is Exclude<typeof choice, string> => typeof choice !== 'string')
      .filter((choice) => !initialFeatChoiceKeys.has(getFeatChoiceKey(choice))),
    [initialFeatChoiceKeys, nextDerived?.featSlots, nextFeatChoices]
  )
  const spellNameById = useMemo(() => new Map(
    [...initialSelectedSpells, ...mergedSpellOptions].map((spell) => [spell.id, spell.name])
  ), [initialSelectedSpells, mergedSpellOptions])
  const targetClassSpellDelta = useMemo(() => {
    const beforeIds = initialSpellSelections
      .filter((selection) => selection.owning_class_id === selectedClassId && !selection.source_feature_key?.startsWith('feat_spell:') && !selection.source_feature_key?.startsWith('feature_spell:'))
      .map((selection) => selection.spell_id)
    const afterIds = persistedNextSpellSelections
      .filter((selection): selection is Exclude<typeof selection, string> => typeof selection !== 'string')
      .filter((selection) => selection.owning_class_id === selectedClassId && !selection.source_feature_key?.startsWith('feat_spell:') && !selection.source_feature_key?.startsWith('feature_spell:'))
      .map((selection) => selection.spell_id)

    return summarizeLevelUpSpellChanges({
      beforeSpellIds: beforeIds,
      afterSpellIds: afterIds,
      spellNameById,
    })
  }, [initialSpellSelections, persistedNextSpellSelections, selectedClassId, spellNameById])
  const newFeatureOptionSummaries = useMemo(() => newLevelFeatureOptionChoices.map((choice) => {
    const definition = levelUpFeatureOptionDefinitions.find((entry) => (
      entry.optionGroupKey === choice.option_group_key
      && entry.optionKey === choice.option_key
    ))
    const valueKey = definition?.valueKey ?? 'feature_option_key'
    const selectedValue = typeof choice.selected_value?.[valueKey] === 'string'
      ? choice.selected_value?.[valueKey] as string
      : ''
    const selectedLabel = definition?.choices.find((entry) => entry.value === selectedValue)?.label ?? selectedValue
    const previousValue = getFeatureOptionChoiceValue(
      activeInitialFeatureOptionChoices,
      choice.option_group_key,
      choice.option_key,
      valueKey
    )
    const previousLabel = previousValue
      ? (definition?.choices.find((entry) => entry.value === previousValue)?.label ?? previousValue)
      : null

    return {
      label: definition?.label ?? choice.option_key,
      selectedLabel,
      previousLabel,
    }
  }), [activeInitialFeatureOptionChoices, levelUpFeatureOptionDefinitions, newLevelFeatureOptionChoices])
  const newFeatNames = useMemo(() => newLevelFeatChoices.map((choice) => (
    featList.find((feat) => feat.id === choice.feat_id)?.name ?? choice.feat_id
  )), [featList, newLevelFeatChoices])
  const newAsiSummary = useMemo(() => {
    if (newLevelAsiChoices.length === 0) return null

    const totals = new Map<string, number>()
    for (const choice of newLevelAsiChoices) {
      const current = totals.get(choice.ability) ?? 0
      totals.set(choice.ability, current + (choice.bonus ?? 1))
    }

    return Array.from(totals.entries()).map(([ability, bonus]) => `+${bonus} ${ability.toUpperCase()}`).join(', ')
  }, [newLevelAsiChoices])

  const multiclassSkillConfig = enteringNewClass ? getMulticlassSkillChoiceConfig(selectedClassDetail) : null
  const knownSkills = useMemo(() => new Set(initialSkillProficiencies), [initialSkillProficiencies])
  const multiclassSkillOptions = (multiclassSkillConfig?.from ?? []).filter((skill) => !knownSkills.has(skill))
  const selectedNewSkillCount = skillProficiencies.filter((skill) => !initialSkillProficiencies.includes(skill)).length
  const needsFeatureOptionStep = levelUpFeatureOptionDefinitions.length > 0
  const needsSkillStep = Boolean(multiclassSkillConfig && multiclassSkillOptions.length > 0)
  const multiclassSkillChoicesComplete = !multiclassSkillConfig
    || selectedNewSkillCount === multiclassSkillConfig.count
  const classOptions = useMemo(
    () => buildLevelUpClassOptions({
      classList,
      baseLevels,
      adjustedStats,
    }),
    [adjustedStats, baseLevels, classList]
  )

  const currentGrantedSpells = new Set(currentContext?.grantedSpellIds ?? [])
  const nextGrantedSpells = new Set(nextContext?.grantedSpellIds ?? [])
  const spellUnlockChanged = Boolean(
    selectedClassDetail?.spellcasting_type &&
    selectedClassDetail.spellcasting_type !== 'none' &&
    nextDerived &&
    (
      nextDerived.spellSelectionMode !== (currentDerived?.spellSelectionMode ?? 'none') ||
      nextDerived.leveledSpellSelectionCap !== (currentDerived?.leveledSpellSelectionCap ?? 0) ||
      nextDerived.cantripSelectionCap !== (currentDerived?.cantripSelectionCap ?? null) ||
      nextDerived.maxSpellLevel !== (currentDerived?.maxSpellLevel ?? 0) ||
      setsDiffer(nextGrantedSpells, currentGrantedSpells)
    )
  )
  const classStepComplete = Boolean(
    selectedClassId
    && selectedClassDetail
    && (!enteringNewClass || localLegality?.checks.find((check) => check.key === 'multiclass_prerequisites')?.passed !== false)
  )
  const subclassStepComplete = !subclassRequired || (
    Boolean(selectedSubclassId)
    && (
      !selectedSubclass
      || !isMaverickSubclass(selectedSubclass)
      || maverickBreakthroughClassIds.filter(Boolean).length >= maverickOptionDefinitions.length
    )
  )
  const featuresStepComplete = !needsFeatureOptionStep || levelUpFeatureOptionDefinitions.every((definition) => {
    const selectedValue = getFeatureOptionChoiceValue(
      featureOptionChoices,
      definition.optionGroupKey,
      definition.optionKey,
      definition.valueKey ?? 'class_id'
    )
    return Boolean(selectedValue)
  })
  const spellsStepComplete = !spellUnlockChanged || canonicalBlockingIssues.every((issue) => (
    issue.key !== 'spell_legality'
    && issue.key !== 'spell_selection_count'
  ))
  const featStepComplete = !needsFeatStep || (
    Boolean(newFeatChoice)
    && (newFeatChoice !== 'asi' || newLevelAsiChoices.length === 2)
    && !(newFeatSlot?.choiceKind === 'feat_only' && newFeatChoice === 'asi')
  )
  const hpStepComplete = hpMode !== 'manual' || (manualHpRoll >= 1 && manualHpRoll <= hitDie)
  const stepCompletion = useMemo<Partial<Record<StepId, boolean>>>(() => ({
    class: classStepComplete,
    subclass: subclassStepComplete,
    features: featuresStepComplete,
    skills: !needsSkillStep || multiclassSkillChoicesComplete,
    spells: spellsStepComplete,
    feat: featStepComplete,
    hp: hpStepComplete,
    review: false,
  }), [
    classStepComplete,
    subclassStepComplete,
    featuresStepComplete,
    needsSkillStep,
    multiclassSkillChoicesComplete,
    spellsStepComplete,
    featStepComplete,
    hpStepComplete,
  ])

  const steps = useMemo<Array<{ id: StepId; label: string }>>(() => {
    const nextSteps: Array<{ id: StepId; label: string }> = [
      { id: 'class', label: 'Class' },
    ]

    if (subclassRequired) nextSteps.push({ id: 'subclass', label: 'Subclass' })
    if (needsFeatureOptionStep) nextSteps.push({ id: 'features', label: 'Features' })
    if (needsSkillStep) nextSteps.push({ id: 'skills', label: 'Skills' })
    if (spellUnlockChanged) nextSteps.push({ id: 'spells', label: 'Spells' })
    if (needsFeatStep) nextSteps.push({ id: 'feat', label: 'ASI / Feat' })
    nextSteps.push({ id: 'hp', label: 'HP' })
    nextSteps.push({ id: 'review', label: 'Review' })

    return nextSteps
  }, [needsFeatStep, needsFeatureOptionStep, needsSkillStep, spellUnlockChanged, subclassRequired])
  const restoredStepIndex = useMemo(
    () => getLevelUpResumeStepIndex(
      steps.map((step) => step.id),
      stepCompletion
    ),
    [stepCompletion, steps]
  )

  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(Math.max(0, steps.length - 1))
    }
  }, [stepIndex, steps.length])

  useEffect(() => {
    if (!draftHydrated || !draftRestored) return
    setStepIndex(restoredStepIndex)
  }, [draftHydrated, draftRestored, restoredStepIndex])

  const currentStep = steps[stepIndex]

  function validateCurrentStep(): string | null {
    if (!currentStep) return 'Loading level-up steps.'

    switch (currentStep.id) {
      case 'class': {
        if (!selectedClassId) return 'Choose which class gains the new level.'
        if (!selectedClassDetail) return 'Class details are still loading.'
        const multiclassCheck = localLegality?.checks.find((check) => check.key === 'multiclass_prerequisites')
        if (enteringNewClass && multiclassCheck && !multiclassCheck.passed) {
          return multiclassCheck.message
        }
        return null
      }
      case 'subclass':
        if (!selectedSubclassId) return 'Choose the subclass unlocked by this level.'
        if (selectedSubclass && isMaverickSubclass(selectedSubclass)) {
          const requiredChoices = maverickOptionDefinitions.length
          if (maverickBreakthroughClassIds.filter(Boolean).length < requiredChoices) {
            return `Choose ${requiredChoices} Arcane Breakthrough class${requiredChoices === 1 ? '' : 'es'} for Maverick.`
          }
        }
        return null
      case 'features':
        for (const definition of levelUpFeatureOptionDefinitions) {
          const selectedValue = getFeatureOptionChoiceValue(
            featureOptionChoices,
            definition.optionGroupKey,
            definition.optionKey,
            definition.valueKey ?? 'class_id'
          )
          if (!selectedValue) return 'Finish the feature choices unlocked by this level.'
        }
        return null
      case 'skills':
        if (!multiclassSkillConfig) return null
        if (selectedNewSkillCount < multiclassSkillConfig.count) {
          return `Choose ${multiclassSkillConfig.count} new skill${multiclassSkillConfig.count === 1 ? '' : 's'} before continuing.`
        }
        if (selectedNewSkillCount > multiclassSkillConfig.count) {
          return `Choose no more than ${multiclassSkillConfig.count} new skill${multiclassSkillConfig.count === 1 ? '' : 's'}.`
        }
        return null
      case 'feat':
        if (!newFeatSlot) return null
        if (!newFeatChoice) {
          return newFeatSlot.choiceKind === 'feat_only'
            ? `Choose the feat granted by ${newFeatSlot.label}.`
            : 'Choose whether this level grants an ASI or a feat.'
        }
        if (newFeatSlot.choiceKind === 'feat_only' && newFeatChoice === 'asi') {
          return `${newFeatSlot.label} grants a feat, not an ASI.`
        }
        if (newFeatChoice === 'asi') {
          const selection = asiChoices[currentFeatSlotCount] ?? []
          if (selection.length !== 2) {
            return 'Choose two ASI increases for this slot.'
          }
        }
        return null
      case 'hp':
        if (hpMode === 'manual' && (manualHpRoll < 1 || manualHpRoll > hitDie)) {
          return `Enter an HP roll between 1 and ${hitDie}.`
        }
        return null
      default:
        return null
    }
  }

  function goBack() {
    setStepIndex((value) => Math.max(0, value - 1))
  }

  function goNext() {
    const error = validateCurrentStep()
    if (error) {
      toast({ title: 'Cannot continue', description: error, variant: 'destructive' })
      return
    }
    setStepIndex((value) => Math.min(steps.length - 1, value + 1))
  }

  function goToStep(stepId: StepId) {
    const nextIndex = steps.findIndex((step) => step.id === stepId)
    if (nextIndex >= 0) {
      setStepIndex(nextIndex)
    }
  }

  async function finishLevelUp() {
    const error = validateCurrentStep()
    if (error) {
      toast({ title: 'Cannot save level-up', description: error, variant: 'destructive' })
      return
    }

    setWorking(true)
    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          save_mode: 'level_up',
          hp_max: nextHpMax,
          level_up: {
            class_id: selectedClassId,
            previous_level: currentTargetLevel,
            new_level: nextTargetLevel,
            subclass_id: selectedSubclassId,
            hp_roll: resolvedHpRoll,
          },
          skill_proficiencies: newLevelSkillChoices,
          asi_choices: newLevelAsiChoices,
          feature_option_choices: newLevelFeatureOptionChoices,
          spell_choices: newLevelSpellSelections,
          feat_choices: newLevelFeatChoices,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error ?? 'Unable to save the level-up draft.')
      }

      setSavedLegality(json.legality ?? null)
      window.localStorage.removeItem(levelUpDraftStorageKey)
      router.push(`/characters/${character.id}`)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unable to save the level-up draft.',
        variant: 'destructive',
      })
    } finally {
      setWorking(false)
    }
  }

  const totalLevelBefore = currentDerived?.totalLevel ?? baseLevels.reduce((sum, level) => sum + level.level, 0)
  const totalLevelAfter = nextDerived?.totalLevel ?? totalLevelBefore + 1
  const canEdit = character.status === 'draft' || character.status === 'changes_requested' || isDm

  if (!canEdit) {
    return (
      <Alert className="border-amber-400/20 bg-amber-400/10">
        <AlertDescription className="text-amber-50">
          This character cannot level up from its current status. Return to the sheet and move it back into an editable draft first.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-2">
          <Link href={`/characters/${character.id}`}>← Back to sheet</Link>
        </Button>
        <p className="text-sm text-neutral-500">
          Level {totalLevelBefore} → {totalLevelAfter}
        </p>
      </div>

      <Card className="border-white/10 bg-white/[0.04]">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-2xl text-neutral-50">Level-Up Wizard</CardTitle>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
                Add exactly one level, make only the newly unlocked choices, then return to the full sheet for any advanced edits.
              </p>
            </div>
            <p className="text-sm text-neutral-500">
              Step {stepIndex + 1} of {steps.length}: {currentStep?.label ?? 'Loading'}
            </p>
          </div>

          {showDraftRestoredNotice && (
            <Alert className="border-blue-400/20 bg-blue-400/10">
              <AlertDescription className="flex items-center justify-between gap-3 text-blue-50">
                <span>Restored your in-progress level-up draft for this character. Review each step before saving.</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowDraftRestoredNotice(false)}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  index === stepIndex
                    ? 'border-blue-400/30 bg-blue-400/10 text-blue-50'
                    : index < stepIndex
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                      : 'border-white/10 bg-white/[0.02] text-neutral-500'
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep?.id === 'class' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-neutral-500">Current build</p>
                <p className="mt-1 text-neutral-100">
                  {baseLevels.map((level) => {
                    const className = classDetailMap[level.class_id]?.name ?? 'Class'
                    return `${className} ${level.level}`
                  }).join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">Which class gets the new level?</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((option) => {
                      return (
                        <SelectItem
                          key={option.classId}
                          value={option.classId}
                          disabled={option.disabled}
                          className="text-neutral-200"
                        >
                          {option.label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedClassDetail && (
                <Alert className="border-white/10 bg-white/[0.03]">
                  <AlertDescription className="text-neutral-300">
                    {enteringNewClass
                      ? `${selectedClassDetail.name} will be added as a new multiclass at level 1.`
                      : `${selectedClassDetail.name} will advance from level ${currentTargetLevel} to ${nextTargetLevel}.`}
                  </AlertDescription>
                </Alert>
              )}

              {enteringNewClass && localLegality?.checks.some((check) => check.key === 'multiclass_prerequisites' && !check.passed) && (
                <Alert className="border-rose-400/20 bg-rose-400/10">
                  <AlertDescription className="text-rose-100">
                    {localLegality.checks.find((check) => check.key === 'multiclass_prerequisites' && !check.passed)?.message}
                  </AlertDescription>
                </Alert>
              )}

            </div>
          )}

          {currentStep?.id === 'subclass' && selectedClassDetail && (
            <div className="space-y-4">
              <Label className="text-neutral-300">
                {selectedClassDetail.name} unlocks a subclass at level {selectedClassDetail.subclass_choice_level}
              </Label>
              <Select value={selectedSubclassId ?? ''} onValueChange={(value) => setSelectedSubclassId(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose subclass" />
                </SelectTrigger>
                <SelectContent>
                  {(subclassMap[selectedClassId] ?? []).map((subclass) => (
                    <SelectItem key={subclass.id} value={subclass.id} className="text-neutral-200">
                      {subclass.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSubclass && isMaverickSubclass(selectedSubclass) && (
                <MaverickBreakthroughCard
                  classLevel={nextTargetLevel}
                  availableChoices={breakthroughClassOptions}
                  selectedClassIds={maverickBreakthroughClassIds}
                  canEdit
                  onChange={setMaverickBreakthroughClassIds}
                />
              )}
            </div>
          )}

          {currentStep?.id === 'features' && (
            <div className="space-y-4">
              <Alert className="border-white/10 bg-white/[0.03]">
                <AlertDescription className="text-neutral-300">
                  Resolve the feature options this level unlocked. If one of these systems allows retraining, changing an earlier slot here records a new level-tagged replacement without deleting the old row.
                </AlertDescription>
              </Alert>
              <FeatureOptionChoicesCard
                title="Feature Options"
                definitions={levelUpFeatureOptionDefinitions}
                choices={featureOptionChoices}
                baselineChoices={activeInitialFeatureOptionChoices}
                canEdit
                onChange={setFeatureOptionChoices}
              />
            </div>
          )}

          {currentStep?.id === 'skills' && multiclassSkillConfig && (
            <div className="space-y-4">
              <Alert className="border-white/10 bg-white/[0.03]">
                <AlertDescription className="text-neutral-300">
                  {selectedClassDetail?.name} grants {multiclassSkillConfig.count} multiclass skill choice{multiclassSkillConfig.count === 1 ? '' : 's'} in this data set.
                </AlertDescription>
              </Alert>
              <SkillsCard
                stats={{
                  str: character.base_str,
                  dex: character.base_dex,
                  con: character.base_con,
                  int: character.base_int,
                  wis: character.base_wis,
                  cha: character.base_cha,
                }}
                totalLevel={nextDerived?.totalLevel ?? totalLevelAfter}
                selectedClass={selectedClassDetail}
                species={character.species}
                background={character.background}
                derived={nextDerived ? { savingThrows: nextDerived.savingThrows, skills: nextDerived.skills } : undefined}
                skillProficiencies={skillProficiencies}
                canEdit
                onChange={(nextSkills) => {
                  const preserved = nextSkills.filter((skill) => initialSkillProficiencies.includes(skill))
                  const newChoices = nextSkills
                    .filter((skill) => !initialSkillProficiencies.includes(skill))
                    .filter((skill) => multiclassSkillOptions.includes(skill))
                    .slice(0, multiclassSkillConfig.count)
                  setSkillProficiencies([...preserved, ...newChoices])
                }}
              />
            </div>
          )}

          {currentStep?.id === 'spells' && selectedClassDetail && (
            <div className="space-y-4">
              <Alert className="border-white/10 bg-white/[0.03]">
                <AlertDescription className="text-neutral-300">
                  Review only the spells tied to {selectedClassDetail.name} {nextTargetLevel}. You can add newly learned spells or swap older class picks here, while other class and feature-granted spells stay untouched.
                </AlertDescription>
              </Alert>
              <SpellsCard
                classId={selectedClassId}
                campaignId={campaign.id}
                speciesId={character.species_id}
                subclassIds={selectedSubclassId ? [selectedSubclassId] : []}
                expandedClassIds={maverickBreakthroughClassIds.filter(Boolean)}
                classLevel={nextTargetLevel}
                derivedSpellcasting={nextDerived?.spellcasting}
                spellChoices={spellChoices}
                maxSpellLevel={nextDerived?.maxSpellLevel}
                spellLevelCaps={nextDerived?.spellLevelCaps}
                leveledSpellSelectionCap={nextDerived?.leveledSpellSelectionCap}
                cantripSelectionCap={nextDerived?.cantripSelectionCap}
                selectionSummary={nextDerived?.spellSelectionSummary}
                canEdit
                onChange={setSpellChoices}
              />
            </div>
          )}

          {currentStep?.id === 'feat' && newFeatSlotLabel && (
            <div className="space-y-4">
              <Alert className="border-white/10 bg-white/[0.03]">
                <AlertDescription className="text-neutral-300">
                  {newFeatSlot?.choiceKind === 'feat_only'
                    ? `${newFeatSlotLabel} grants a bonus feat. Choose that feat now.`
                    : `${newFeatSlotLabel} unlocks a new ASI / feat decision. Choose a feat, or leave the feat slot empty and assign the ASI increases here now.`}
                </AlertDescription>
              </Alert>
              <FeatsCard
                background={character.background}
                backgroundFeat={backgroundFeat}
                availableFeats={featList}
                featChoices={nextFeatChoices}
                asiChoices={asiChoices}
                totalLevel={nextDerived?.totalLevel ?? totalLevelAfter}
                featSlots={nextDerived?.featSlots}
                canEdit
                onChange={(choices) => {
                  const nextChoice = choices[currentFeatSlotCount] ?? ''
                  setNewFeatChoice(nextChoice === ''
                    ? (newFeatSlot?.choiceKind === 'feat_only' ? '' : 'asi')
                    : nextChoice)
                  if (nextChoice) {
                    setAsiChoices((prev) => {
                      const next = [...prev]
                      next[currentFeatSlotCount] = []
                      while (next.length > 0 && (next[next.length - 1] ?? []).length === 0) next.pop()
                      return next
                    })
                  }
                }}
                onAsiChange={setAsiChoices}
              />
              <FeatSpellChoicesCard
                activeFeats={nextActiveFeatSpellFeats}
                campaignId={campaign.id}
                classList={classList}
                selectedChoices={featSpellChoices}
                canEdit
                onChange={setFeatSpellChoices}
                onOptionsLoaded={setFeatSpellOptions}
              />
            </div>
          )}

          {currentStep?.id === 'hp' && selectedClassDetail && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setHpMode('fixed')}
                  className={`rounded-2xl border px-4 py-4 text-left ${hpMode === 'fixed' ? 'border-blue-400/30 bg-blue-400/10 text-blue-50' : 'border-white/10 bg-white/[0.03] text-neutral-300'}`}
                >
                  <p className="text-sm font-medium">Fixed gain</p>
                  <p className="mt-1 text-xs text-neutral-400">Use the standard average of {fixedHpGain} on a d{hitDie}.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setHpMode('max')}
                  className={`rounded-2xl border px-4 py-4 text-left ${hpMode === 'max' ? 'border-blue-400/30 bg-blue-400/10 text-blue-50' : 'border-white/10 bg-white/[0.03] text-neutral-300'}`}
                >
                  <p className="text-sm font-medium">Max hit die</p>
                  <p className="mt-1 text-xs text-neutral-400">Use the class hit die maximum of {hitDie}.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setHpMode('manual')}
                  className={`rounded-2xl border px-4 py-4 text-left ${hpMode === 'manual' ? 'border-blue-400/30 bg-blue-400/10 text-blue-50' : 'border-white/10 bg-white/[0.03] text-neutral-300'}`}
                >
                  <p className="text-sm font-medium">Manual roll</p>
                  <p className="mt-1 text-xs text-neutral-400">Enter the actual die result for this level.</p>
                </button>
              </div>

              {hpMode === 'manual' && (
                <div className="space-y-2">
                  <Label className="text-neutral-300">Rolled HP on d{hitDie}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={hitDie}
                    value={manualHpRoll}
                    onChange={(event) => setManualHpRoll(Math.max(1, Number(event.target.value) || 1))}
                    className="max-w-xs"
                  />
                </div>
              )}

              <Alert className="border-white/10 bg-white/[0.03]">
                <AlertDescription className="text-neutral-300">
                  HP gain for this level: {hpGainTotal}. Current HP max {character.hp_max} → {nextDerived?.hitPoints.max ?? nextHpMax}.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep?.id === 'review' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-neutral-100">Level-up Change Summary</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Class</p>
                    <p className="mt-1 text-sm text-neutral-100">
                      {selectedClassDetail?.name ?? 'Class'} {currentTargetLevel} → {nextTargetLevel}
                    </p>
                    {selectedSubclass && currentSubclassId !== selectedSubclass.id && (
                      <p className="mt-1 text-sm text-neutral-400">Subclass: {selectedSubclass.name}</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">HP</p>
                    <p className="mt-1 text-sm text-neutral-100">{character.hp_max} → {nextDerived?.hitPoints.max ?? nextHpMax}</p>
                    <p className="mt-1 text-sm text-neutral-400">+{hpGainTotal} using {hpMode === 'manual' ? `a roll of ${resolvedHpRoll}` : hpMode === 'max' ? 'max hit die' : 'fixed average'}</p>
                  </div>
                  {(newAsiSummary || newFeatNames.length > 0) && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">ASI / Feat</p>
                      {newAsiSummary && <p className="mt-1 text-sm text-neutral-100">{newAsiSummary}</p>}
                      {newFeatNames.length > 0 && (
                        <p className="mt-1 text-sm text-neutral-100">{newFeatNames.join(', ')}</p>
                      )}
                    </div>
                  )}
                  {(newFeatureOptionSummaries.length > 0 || newLevelSkillChoices.length > 0) && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Features & Skills</p>
                      {newFeatureOptionSummaries.map((entry) => (
                        <p key={`${entry.label}:${entry.selectedLabel}`} className="mt-1 text-sm text-neutral-100">
                          {entry.label}: {entry.selectedLabel}
                          {entry.previousLabel ? ` (replaces ${entry.previousLabel})` : ''}
                        </p>
                      ))}
                      {newLevelSkillChoices.map((entry) => (
                        <p key={entry.skill} className="mt-1 text-sm text-neutral-100">
                          Skill proficiency: {entry.skill}
                        </p>
                      ))}
                    </div>
                  )}
                  {spellUnlockChanged && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Spell Changes</p>
                      {targetClassSpellDelta.replacements.map((entry) => (
                        <p key={`${entry.removed}:${entry.added}`} className="mt-1 text-sm text-neutral-100">
                          Swapped: {entry.removed} → {entry.added}
                        </p>
                      ))}
                      {targetClassSpellDelta.additions.length > 0 && (
                        <p className="mt-1 text-sm text-neutral-100">Added: {targetClassSpellDelta.additions.join(', ')}</p>
                      )}
                      {targetClassSpellDelta.removals.length > 0 && (
                        <p className="mt-1 text-sm text-neutral-400">Removed: {targetClassSpellDelta.removals.join(', ')}</p>
                      )}
                      {targetClassSpellDelta.replacements.length === 0 && targetClassSpellDelta.additions.length === 0 && targetClassSpellDelta.removals.length === 0 && (
                        <p className="mt-1 text-sm text-neutral-400">No class-scoped spell changes were selected on this level.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-neutral-500">Updated class spread</p>
                  <p className="mt-1 text-neutral-100">
                    {targetLevels.map((level) => {
                      const className = classDetailMap[level.class_id]?.name ?? 'Class'
                      const subclassName = level.subclass_id
                        ? (subclassMap[level.class_id] ?? []).find((entry) => entry.id === level.subclass_id)?.name
                        : null
                      return subclassName ? `${className} ${level.level} (${subclassName})` : `${className} ${level.level}`
                    }).join(', ')}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-neutral-500">HP after level-up</p>
                  <p className="mt-1 text-neutral-100">{nextDerived?.hitPoints.max ?? nextHpMax}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    +{hpGainTotal} from this level using {hpMode === 'manual' ? `a roll of ${resolvedHpRoll}` : hpMode === 'max' ? 'max hit die' : 'fixed average'}.
                  </p>
                </div>
              </div>

              {nextDerived && (
                <>
                  <Alert className="border-white/10 bg-white/[0.03]">
                    <AlertDescription className="text-neutral-300">
                      HP {nextDerived.hitPoints.max}. Level {nextDerived.totalLevel} build with {nextDerived.totalAsiSlots} feat / ASI slot{nextDerived.totalAsiSlots === 1 ? '' : 's'}.
                      {nextDerived.spellSlots.length > 0 && ` Spell slots: ${nextDerived.spellSlots.join(' / ')}.`}
                    </AlertDescription>
                  </Alert>

                  {nextDerived.spellcasting.sources.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium text-neutral-100">Spellcasting Review</p>
                      <div className="mt-3 space-y-3">
                        {nextDerived.spellcasting.sources.map((source) => (
                          <div key={source.classId} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                            <p className="text-sm text-neutral-100">{source.className} {source.classLevel}</p>
                            {source.selectionSummary && (
                              <p className="mt-1 text-sm text-neutral-400">{source.selectionSummary}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(source.selectedSpellCountsByLevel).map(([level, count]) => (
                                <span
                                  key={`${source.classId}-${level}`}
                                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300"
                                >
                                  {level === '0' ? `${count} cantrip${count === 1 ? '' : 's'}` : `${count} level ${level} spell${count === 1 ? '' : 's'}`}
                                </span>
                              ))}
                              {source.selectedSpells.length === 0 && (
                                <span className="text-xs text-neutral-500">No currently selected spells from this source.</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-100">Review blockers before returning to the sheet</p>
                    <p className="mt-1 text-sm text-neutral-400">
                      Saving this draft will run the full legality pass. If anything is still blocked, the full sheet will show exactly what to fix before submission.
                    </p>
                  </div>
                  {(savedLegality ?? localLegality) && (
                    <LegalitySummaryBadge
                      passed={(savedLegality ?? localLegality)?.passed ?? false}
                      errorCount={canonicalBlockingIssues.length}
                    />
                  )}
                </div>

                {groupedReviewIssues.length > 0 && (
                  <div className="space-y-3">
                    {groupedReviewIssues.map((group) => (
                      <div key={group.stepId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-neutral-100">{group.stepLabel}</p>
                            <p className="mt-1 text-sm text-neutral-400">
                              {group.issues.length} item{group.issues.length === 1 ? '' : 's'} to review.
                            </p>
                          </div>
                          {group.stepId !== 'review' && (
                            <Button type="button" variant="outline" onClick={() => goToStep(group.stepId)}>
                              Edit {group.stepLabel}
                            </Button>
                          )}
                        </div>
                        <div className="mt-3 space-y-2">
                          {group.issues.map((issue) => (
                            <div
                              key={`${group.stepId}:${issue.key}`}
                              className={`rounded-xl border px-3 py-2 text-sm ${
                                issue.severity === 'error'
                                  ? 'border-rose-400/20 bg-rose-400/10 text-rose-50'
                                  : 'border-amber-400/20 bg-amber-400/10 text-amber-50'
                              }`}
                            >
                              {issue.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(savedLegality ?? localLegality) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-200">Detailed legality check</p>
                    <div className="flex flex-wrap gap-2">
                      {(savedLegality ?? localLegality)?.checks.map((check) => (
                        <LegalityBadge key={check.key} check={check} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={goBack} disabled={stepIndex === 0 || working}>
          Back
        </Button>
        {currentStep?.id === 'review' ? (
          <Button type="button" onClick={finishLevelUp} disabled={working}>
            {working ? 'Saving…' : 'Save level-up draft and return to sheet'}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={working}>
            Continue
          </Button>
        )}
      </div>
    </div>
  )
}
