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
  CharacterFeatureOptionChoice,
  CharacterLevel,
  Class,
  Feat,
  MulticlassPrereq,
  RuleSet,
  Species,
  Spell,
  StatMethod,
  Subclass,
} from '@/lib/types/database'
import {
  buildCombinedSpellSelections,
  buildTypedAsiChoices,
  buildLocalCharacterContext,
  buildTypedAbilityBonusChoices,
  buildTypedFeatChoices,
  buildTypedLanguageChoices,
  buildTypedSkillProficiencies,
  buildTypedSpellChoices,
  buildTypedToolChoices,
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
  buildMaverickFeatureOptionChoices,
  getMaverickBreakthroughClassIds,
  isMaverickSubclass,
} from '@/lib/characters/maverick'
import { getFixedHpGainValue } from '@/lib/characters/derived'

type CharacterWithRelations = Character & {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

type StepId = 'class' | 'subclass' | 'skills' | 'spells' | 'feat' | 'hp' | 'review'

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
  initialSpellSelections: Spell[]
  initialFeatChoices: string[]
  isDm: boolean
}

type HpMode = 'fixed' | 'max' | 'manual'

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

function findMissingMulticlassPrereqs(
  adjustedStats: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>,
  prereqs: MulticlassPrereq[]
): string[] {
  return prereqs.flatMap((prereq) => {
    const ability = prereq.ability.toLowerCase() as keyof typeof adjustedStats
    const score = adjustedStats[ability] ?? 0
    return score >= prereq.min ? [] : [`${prereq.ability.toUpperCase()} ${prereq.min}`]
  })
}

function setsDiffer(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return true
  for (const value of Array.from(left)) {
    if (!right.has(value)) return true
  }
  return false
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
  initialFeatChoices,
  isDm,
}: LevelUpWizardProps) {
  const router = useRouter()
  const { toast } = useToast()

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
  const [classDetailMap, setClassDetailMap] = useState<Record<string, ClassDetail>>({})
  const [subclassMap, setSubclassMap] = useState<Record<string, Subclass[]>>({})
  const [spellOptions, setSpellOptions] = useState<SpellOption[]>([])

  const [selectedClassId, setSelectedClassId] = useState(baseLevels[0]?.class_id ?? '')
  const [selectedSubclassId, setSelectedSubclassId] = useState<string | null>(null)
  const [skillProficiencies, setSkillProficiencies] = useState<string[]>(initialSkillProficiencies)
  const [asiChoices, setAsiChoices] = useState<AsiSelection[]>(initialAsiChoices)
  const [languageChoices] = useState<string[]>(initialLanguageChoices)
  const [toolChoices] = useState<string[]>(initialToolChoices)
  const [maverickBreakthroughClassIds, setMaverickBreakthroughClassIds] = useState<string[]>(
    getMaverickBreakthroughClassIds(initialFeatureOptionChoices)
  )
  const [spellChoices, setSpellChoices] = useState<string[]>(initialSpellChoices)
  const [featChoices] = useState<string[]>(initialFeatChoices)
  const [featSpellChoices, setFeatSpellChoices] = useState<Record<string, string>>(initialFeatSpellChoices)
  const [featSpellOptions, setFeatSpellOptions] = useState<SpellOption[]>([])
  const [newFeatChoice, setNewFeatChoice] = useState('')
  const [hpMode, setHpMode] = useState<HpMode>('fixed')
  const [manualHpRoll, setManualHpRoll] = useState<number>(1)
  const [stepIndex, setStepIndex] = useState(0)
  const [working, setWorking] = useState(false)
  const [savedLegality, setSavedLegality] = useState<LegalityResult | null>(null)

  const currentClassIds = useMemo(
    () => Array.from(new Set(baseLevels.map((level) => level.class_id))),
    [baseLevels]
  )

  useEffect(() => {
    const qs = `?campaign_id=${campaign.id}`
    Promise.all([
      fetch(`/api/content/classes${qs}`).then((response) => response.json()),
      fetch(`/api/content/feats${qs}`).then((response) => response.json()),
    ]).then(([classes, feats]) => {
      setClassList(Array.isArray(classes) ? classes : [])
      setFeatList(Array.isArray(feats) ? feats : [])
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
    setSelectedSubclassId(existingSubclassId)
  }, [baseLevels, selectedClassId])

  const mergedSpellOptions = useMemo<SpellOption[]>(() => {
    const byId = new Map<string, SpellOption>()
    for (const spell of initialSpellSelections) {
      byId.set(spell.id, spell)
    }
    for (const spell of spellOptions) {
      byId.set(spell.id, spell)
    }
    for (const spell of featSpellOptions) {
      byId.set(spell.id, spell)
    }
    return Array.from(byId.values())
  }, [featSpellOptions, initialSpellSelections, spellOptions])
  const selectedSubclass = selectedClassId
    ? (subclassMap[selectedClassId] ?? []).find((entry) => entry.id === selectedSubclassId) ?? null
    : null
  const breakthroughClassOptions = classList.filter((cls) => !['Artificer'].includes(cls.name))

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
  const currentActiveFeatSpellFeats = useMemo(
    () => [
      ...initialFeatChoices
        .map((featId) => featList.find((feat) => feat.id === featId))
        .filter((feat): feat is Feat => Boolean(feat)),
      ...(backgroundFeat ? [backgroundFeat] : []),
    ],
    [backgroundFeat, featList, initialFeatChoices]
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
    spellSelections: buildCombinedSpellSelections({
      classSpellChoices: initialSpellChoices,
      spellOptions: mergedSpellOptions,
      owningClassId: baseLevels[0]?.class_id ?? null,
      activeSubclassIds: baseLevels
        .filter((level) => level.class_id === (baseLevels[0]?.class_id ?? '') && level.subclass_id)
        .map((level) => level.subclass_id as string),
      derived: null,
      featSpellChoices: initialFeatSpellChoices,
      featList: currentActiveFeatSpellFeats,
    }),
    featList,
    featChoices: initialFeatChoices,
    asiChoices: initialAsiChoices,
    skillProficiencies: initialSkillProficiencies,
    abilityBonusChoices: initialAbilityBonusChoices,
    languageChoices: initialLanguageChoices,
    toolChoices: initialToolChoices,
    featureOptionChoices: initialFeatureOptionChoices,
  })

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
      featureOptionChoices: buildMaverickFeatureOptionChoices({
        subclassId: selectedSubclassId,
        classLevel: nextTargetLevel,
        selectedClassIds: maverickBreakthroughClassIds,
      }).map((choice) => ({
        id: `${choice.option_group_key}:${choice.option_key}`,
        character_id: character.id,
        character_level_id: null,
        option_group_key: choice.option_group_key,
        option_key: choice.option_key,
        selected_value: choice.selected_value ?? {},
        choice_order: choice.choice_order ?? 0,
        source_category: choice.source_category ?? 'subclass_choice',
        source_entity_id: choice.source_entity_id ?? null,
        source_feature_key: choice.source_feature_key ?? null,
        created_at: '',
      })),
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
    mergedSpellOptions,
    maverickBreakthroughClassIds,
    newFeatChoice,
    asiChoices,
    languageChoices,
    skillProficiencies,
    spellChoices,
    selectedSubclassId,
    subclassMap,
    nextTargetLevel,
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
  })

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
    featureOptionChoices: buildMaverickFeatureOptionChoices({
      subclassId: selectedSubclassId,
      classLevel: nextTargetLevel,
      selectedClassIds: maverickBreakthroughClassIds,
    }).map((choice) => ({
      id: `${choice.option_group_key}:${choice.option_key}`,
      character_id: character.id,
      character_level_id: null,
      option_group_key: choice.option_group_key,
      option_key: choice.option_key,
      selected_value: choice.selected_value ?? {},
      choice_order: choice.choice_order ?? 0,
      source_category: choice.source_category ?? 'subclass_choice',
      source_entity_id: choice.source_entity_id ?? null,
      source_feature_key: choice.source_feature_key ?? null,
      created_at: '',
    })),
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
  })
  const localLegality = nextContext ? runLegalityChecks(nextContext) : null
  const canonicalIssues = (savedLegality ?? localLegality)?.derived
  const canonicalBlockingIssues = canonicalIssues?.blockingIssues ?? []
  const canonicalWarnings = canonicalIssues?.warnings ?? []

  const targetLevelRow = targetLevels.find((level) => level.class_id === selectedClassId) ?? null
  const subclassRequired = Boolean(
    selectedClassDetail &&
    targetLevelRow &&
    targetLevelRow.level >= selectedClassDetail.subclass_choice_level &&
    !targetLevelRow.subclass_id
  )

  const featSlotLabels = nextDerived?.featSlotLabels ?? []
  const currentFeatSlotCount = currentDerived?.totalAsiSlots ?? 0
  const newFeatSlotLabel = featSlotLabels[currentFeatSlotCount] ?? null
  const needsFeatStep = Boolean(newFeatSlotLabel)

  const multiclassSkillConfig = enteringNewClass ? getMulticlassSkillChoiceConfig(selectedClassDetail) : null
  const knownSkills = useMemo(() => new Set(initialSkillProficiencies), [initialSkillProficiencies])
  const multiclassSkillOptions = (multiclassSkillConfig?.from ?? []).filter((skill) => !knownSkills.has(skill))
  const selectedNewSkillCount = skillProficiencies.filter((skill) => !initialSkillProficiencies.includes(skill)).length
  const needsSkillStep = Boolean(multiclassSkillConfig && multiclassSkillOptions.length > 0)
  const invalidMulticlassReasons = useMemo(() => {
    const next = new Map<string, string>()
    for (const cls of classList) {
      if (currentClassIds.includes(cls.id)) continue
      const missing = findMissingMulticlassPrereqs(adjustedStats, cls.multiclass_prereqs)
      if (missing.length > 0) {
        next.set(cls.id, `Requires ${missing.join(', ')}`)
      }
    }
    return next
  }, [adjustedStats, classList, currentClassIds])

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

  const steps = useMemo<Array<{ id: StepId; label: string }>>(() => {
    const nextSteps: Array<{ id: StepId; label: string }> = [
      { id: 'class', label: 'Class' },
    ]

    if (subclassRequired) nextSteps.push({ id: 'subclass', label: 'Subclass' })
    if (needsSkillStep) nextSteps.push({ id: 'skills', label: 'Skills' })
    if (spellUnlockChanged) nextSteps.push({ id: 'spells', label: 'Spells' })
    if (needsFeatStep) nextSteps.push({ id: 'feat', label: 'ASI / Feat' })
    nextSteps.push({ id: 'hp', label: 'HP' })
    nextSteps.push({ id: 'review', label: 'Review' })

    return nextSteps
  }, [needsFeatStep, needsSkillStep, spellUnlockChanged, subclassRequired])

  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(Math.max(0, steps.length - 1))
    }
  }, [stepIndex, steps.length])

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
          const requiredChoices = nextTargetLevel >= 17 ? 5 : nextTargetLevel >= 13 ? 4 : nextTargetLevel >= 9 ? 3 : nextTargetLevel >= 5 ? 2 : nextTargetLevel >= 3 ? 1 : 0
          if (maverickBreakthroughClassIds.filter(Boolean).length < requiredChoices) {
            return `Choose ${requiredChoices} Arcane Breakthrough class${requiredChoices === 1 ? '' : 'es'} for Maverick.`
          }
        }
        return null
      case 'skills':
        if (!multiclassSkillConfig) return null
        if (selectedNewSkillCount > multiclassSkillConfig.count) {
          return `Choose no more than ${multiclassSkillConfig.count} new skill${multiclassSkillConfig.count === 1 ? '' : 's'}.`
        }
        return null
      case 'feat':
        if (!newFeatChoice) return 'Choose whether this level grants an ASI or a feat.'
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

  async function finishLevelUp() {
    const error = validateCurrentStep()
    if (error) {
      toast({ title: 'Cannot save level-up', description: error, variant: 'destructive' })
      return
    }

    setWorking(true)
    try {
      const levelsPayload = targetLevels.map((level) => {
        const existing = baseLevels.find((entry) => entry.class_id === level.class_id)
        return {
          class_id: level.class_id,
          level: level.level,
          subclass_id: level.subclass_id,
          hp_roll: level.class_id === selectedClassId ? resolvedHpRoll : existing?.hp_roll ?? null,
        }
      })

      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hp_max: nextHpMax,
          levels: levelsPayload,
          skill_proficiencies: buildTypedSkillProficiencies({
            skillProficiencies,
            background: character.background,
            selectedClass: selectedClassDetail,
            species: character.species,
          }),
          ability_bonus_choices: buildTypedAbilityBonusChoices(
            character.species,
            initialAbilityBonusChoices
          ),
          asi_choices: buildTypedAsiChoices(
            asiChoices,
            nextDerived?.featSlotLabels,
            nextFeatChoices
          ),
          language_choices: buildTypedLanguageChoices({
            languageChoices,
            background: character.background,
            species: character.species,
          }),
          tool_choices: buildTypedToolChoices({
            toolChoices,
            selectedClass: selectedClassDetail,
            species: character.species,
          }),
          feature_option_choices: buildMaverickFeatureOptionChoices({
            subclassId: selectedSubclassId,
            classLevel: nextTargetLevel,
            selectedClassIds: maverickBreakthroughClassIds,
          }),
          spell_choices: persistedNextSpellSelections,
          feat_choices: buildTypedFeatChoices(nextFeatChoices, nextDerived?.featSlotLabels),
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error ?? 'Unable to save the level-up draft.')
      }

      setSavedLegality(json.legality ?? null)
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
                    {classList.map((cls) => {
                      const existingLevel = baseLevels.find((level) => level.class_id === cls.id)?.level ?? 0
                      const disabled = existingLevel === 0 && invalidMulticlassReasons.has(cls.id)
                      const invalidReason = invalidMulticlassReasons.get(cls.id)
                      const label = existingLevel > 0
                        ? `${cls.name} (${existingLevel} → ${existingLevel + 1})`
                        : `${cls.name} (new multiclass${invalidReason ? `, ${invalidReason}` : ''})`
                      return (
                        <SelectItem
                          key={cls.id}
                          value={cls.id}
                          disabled={disabled}
                          className="text-neutral-200"
                        >
                          {label}
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
                  availableClasses={breakthroughClassOptions}
                  selectedClassIds={maverickBreakthroughClassIds}
                  canEdit
                  onChange={setMaverickBreakthroughClassIds}
                />
              )}
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
                  Update the active spells for the class changes unlocked by this level. Existing spell selections stay in place unless you change them here.
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
                  {newFeatSlotLabel} unlocks a new ASI / feat decision. Choose the feat now, or mark this slot as an ASI and adjust the ability scores on the full sheet afterwards.
                </AlertDescription>
              </Alert>
              <FeatsCard
                background={character.background}
                backgroundFeat={backgroundFeat}
                availableFeats={featList}
                featChoices={nextFeatChoices}
                asiChoices={asiChoices}
                totalLevel={nextDerived?.totalLevel ?? totalLevelAfter}
                featSlotLabels={nextDerived?.featSlotLabels}
                canEdit
                onChange={(choices) => {
                  const nextChoice = choices[currentFeatSlotCount] ?? ''
                  setNewFeatChoice(nextChoice === '' ? 'asi' : nextChoice)
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

                {canonicalBlockingIssues.length > 0 && (
                  <Alert className="border-rose-400/20 bg-rose-400/10">
                    <AlertDescription className="space-y-2 text-rose-50">
                      <p className="text-sm font-medium">Blocking items</p>
                      <ul className="space-y-1 text-sm text-rose-100">
                        {canonicalBlockingIssues.map((item) => (
                          <li key={item.key}>• {item.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {canonicalWarnings.length > 0 && (
                  <Alert className="border-amber-400/20 bg-amber-400/10">
                    <AlertDescription className="space-y-2 text-amber-50">
                      <p className="text-sm font-medium">Warnings</p>
                      <ul className="space-y-1 text-sm text-amber-100">
                        {canonicalWarnings.map((item) => (
                          <li key={item.key}>• {item.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
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
