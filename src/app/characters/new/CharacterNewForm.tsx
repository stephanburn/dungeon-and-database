'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import type {
  Campaign,
  CharacterType,
  Class,
  Feat,
  FeatureOption,
  Language,
  Tool,
  Species,
  Background,
  StatMethod,
  Subclass,
} from '@/lib/types/database'
import type { LegalityResult } from '@/lib/legality/engine'
import { StatBlock } from '@/components/character-sheet/StatBlock'
import { LanguagesToolsCard } from '@/components/character-sheet/LanguagesToolsCard'
import { MaverickBreakthroughCard } from '@/components/character-sheet/MaverickBreakthroughCard'
import { SpeciesAbilityBonusCard } from '@/components/character-sheet/SpeciesAbilityBonusCard'
import { SkillsCard } from '@/components/character-sheet/SkillsCard'
import { SpellsCard } from '@/components/character-sheet/SpellsCard'
import { FeatsCard } from '@/components/character-sheet/FeatsCard'
import { FeatSpellChoicesCard } from '@/components/character-sheet/FeatSpellChoicesCard'
import { FeatureOptionChoicesCard } from '@/components/character-sheet/FeatureOptionChoicesCard'
import { LegalityBadge, LegalitySummaryBadge } from '@/components/character-sheet/LegalityBadge'
import {
  buildCombinedSpellSelections,
  buildTypedAsiChoices,
  buildLocalCharacterContext,
  buildTypedAbilityBonusChoices,
  buildTypedFeatChoices,
  buildTypedLanguageChoices,
  buildTypedSkillProficiencies,
  buildTypedToolChoices,
  buildWizardHitDieRows,
  calculateCreationHpMax,
  ClassDetail,
  deriveLocalCharacter,
  SpellOption,
  summarizeWizardLegality,
  type AsiSelection,
  type WizardLevel,
} from '@/lib/characters/wizard-helpers'
import type { FeatureOptionChoiceInput } from '@/lib/characters/choice-persistence'
import {
  buildSpeciesAbilityBonusMap,
  getSpeciesAbilityChoiceLimit,
  type AbilityKey as SpeciesChoiceAbilityKey,
} from '@/lib/characters/species-ability-bonus-provenance'
import { getFeatSpellChoiceDefinitions } from '@/lib/characters/feat-spell-options'
import {
  buildFeatureOptionChoicesFromDefinitionMap,
  buildMaverickFeatureOptionChoices,
  getFeatureOptionChoiceValue,
  getFightingStyleFeatureOptionDefinition,
  getMaverickArcaneBreakthroughOptionDefinitions,
} from '@/lib/characters/feature-grants'
import { isMaverickSubclass } from '@/lib/characters/maverick'

interface CharacterNewFormProps {
  isDm: boolean
}

type StepId =
  | 'identity'
  | 'species'
  | 'background'
  | 'classes'
  | 'subclasses'
  | 'stats'
  | 'skills'
  | 'spells-feats'
  | 'review'

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'identity', label: 'Identity' },
  { id: 'species', label: 'Species' },
  { id: 'background', label: 'Background' },
  { id: 'classes', label: 'Classes' },
  { id: 'subclasses', label: 'Subclasses' },
  { id: 'stats', label: 'Ability Scores' },
  { id: 'skills', label: 'Skills' },
  { id: 'spells-feats', label: 'Spells + Feats' },
  { id: 'review', label: 'Review' },
]

export function CharacterNewForm({ isDm }: CharacterNewFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [name, setName] = useState('')
  const [statMethod, setStatMethod] = useState<StatMethod>('point_buy')
  const [characterType, setCharacterType] = useState<CharacterType>('pc')
  const [stepIndex, setStepIndex] = useState(0)
  const [working, setWorking] = useState(false)
  const [characterId, setCharacterId] = useState<string | null>(null)
  const [legalityResult, setLegalityResult] = useState<LegalityResult | null>(null)

  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [backgroundList, setBackgroundList] = useState<Background[]>([])
  const [classList, setClassList] = useState<Class[]>([])
  const [featList, setFeatList] = useState<Feat[]>([])
  const [languageList, setLanguageList] = useState<Language[]>([])
  const [toolList, setToolList] = useState<Tool[]>([])
  const [maverickOptionRows, setMaverickOptionRows] = useState<FeatureOption[]>([])
  const [subclassMap, setSubclassMap] = useState<Record<string, Subclass[]>>({})
  const [classDetailMap, setClassDetailMap] = useState<Record<string, ClassDetail>>({})
  const [spellOptions, setSpellOptions] = useState<SpellOption[]>([])

  const [speciesId, setSpeciesId] = useState('')
  const [backgroundId, setBackgroundId] = useState('')
  const [levels, setLevels] = useState<WizardLevel[]>([])
  const [stats, setStats] = useState({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })
  const [skillProficiencies, setSkillProficiencies] = useState<string[]>([])
  const [abilityBonusChoices, setAbilityBonusChoices] = useState<SpeciesChoiceAbilityKey[]>([])
  const [asiChoices, setAsiChoices] = useState<AsiSelection[]>([])
  const [languageChoices, setLanguageChoices] = useState<string[]>([])
  const [toolChoices, setToolChoices] = useState<string[]>([])
  const [spellChoices, setSpellChoices] = useState<string[]>([])
  const [featChoices, setFeatChoices] = useState<string[]>([])
  const [featSpellChoices, setFeatSpellChoices] = useState<Record<string, string>>({})
  const [featSpellOptions, setFeatSpellOptions] = useState<SpellOption[]>([])
  const [maverickBreakthroughClassIds, setMaverickBreakthroughClassIds] = useState<string[]>([])
  const [featureOptionChoices, setFeatureOptionChoices] = useState<FeatureOptionChoiceInput[]>([])

  useEffect(() => {
    fetch('/api/campaigns')
      .then((response) => response.json())
      .then((data: Campaign[]) => {
        setCampaigns(data)
        if (data.length === 1) setCampaignId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (!campaignId) return
    const qs = `?campaign_id=${campaignId}`
    Promise.all([
      fetch(`/api/content/species${qs}`).then((response) => response.json()),
      fetch(`/api/content/backgrounds${qs}`).then((response) => response.json()),
      fetch(`/api/content/classes${qs}`).then((response) => response.json()),
      fetch(`/api/content/feats${qs}`).then((response) => response.json()),
      fetch(`/api/content/languages${qs}`).then((response) => response.json()),
      fetch(`/api/content/tools${qs}`).then((response) => response.json()),
      fetch(`/api/content/feature-options${qs}&group_key=maverick%3Aarcane_breakthrough_classes`).then((response) => response.json()),
      fetch(`/api/content/feature-options${qs}&option_family=fighting_style`).then((response) => response.json()),
    ]).then(([species, backgrounds, classes, feats, languages, tools, featureOptions, fightingStyleOptions]) => {
      setSpeciesList(species)
      setBackgroundList(backgrounds)
      setClassList(classes)
      setFeatList(feats)
      setLanguageList(Array.isArray(languages) ? languages : [])
      setToolList(Array.isArray(tools) ? tools : [])
      setMaverickOptionRows([
        ...(Array.isArray(featureOptions) ? featureOptions : []),
        ...(Array.isArray(fightingStyleOptions) ? fightingStyleOptions : []),
      ])
      if (levels.length === 0 && Array.isArray(classes) && classes.length > 0) {
        setLevels([{ class_id: classes[0].id, level: 1, subclass_id: null }])
      }
    })
  }, [campaignId, levels.length])

  useEffect(() => {
    const classIds = Array.from(new Set(levels.map((level) => level.class_id).filter(Boolean)))
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

    if (missingSubclasses.length > 0 && campaignId) {
      Promise.all(
        missingSubclasses.map((classId) =>
          fetch(`/api/content/classes/${classId}/subclasses?campaign_id=${campaignId}`)
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
  }, [levels, campaignId, classDetailMap, subclassMap])

  useEffect(() => {
    const firstClassId = levels[0]?.class_id
    const firstClassLevel = levels[0]?.level ?? 0
    const firstClassSubclassIds = levels
      .filter((level) => level.class_id === firstClassId && level.subclass_id)
      .map((level) => level.subclass_id as string)
    const firstClass = firstClassId ? classDetailMap[firstClassId] : null
    if (!campaignId || !firstClass || !firstClass.spellcasting_type || firstClass.spellcasting_type === 'none') {
      setSpellOptions([])
      return
    }

    const params = new URLSearchParams({
      campaign_id: campaignId,
      class_id: firstClassId,
      class_level: String(firstClassLevel),
    })
    if (speciesId) params.set('species_id', speciesId)
    for (const subclassId of firstClassSubclassIds) params.append('subclass_id', subclassId)
    for (const expandedClassId of maverickBreakthroughClassIds.filter(Boolean)) {
      params.append('expanded_class_id', expandedClassId)
    }

    fetch(`/api/content/spells?${params.toString()}`)
      .then((response) => response.json())
      .then((data: SpellOption[]) => setSpellOptions(Array.isArray(data) ? data : []))
  }, [campaignId, levels, classDetailMap, maverickBreakthroughClassIds, speciesId])

  const currentStep = STEPS[stepIndex]
  const selectedSpecies = speciesList.find((species) => species.id === speciesId) ?? null
  const selectedBackground = backgroundList.find((background) => background.id === backgroundId) ?? null
  const firstClassId = levels[0]?.class_id ?? ''
  const firstClassLevel = levels[0]?.level ?? 0
  const firstClassSubclassIds = levels
    .filter((level) => level.class_id === firstClassId && level.subclass_id)
    .map((level) => level.subclass_id as string)
  const selectedClass = classList.find((cls) => cls.id === firstClassId) ?? null
  const selectedSubclass = selectedClass
    ? (subclassMap[selectedClass.id] ?? []).find((entry) => entry.id === firstClassSubclassIds[0]) ?? null
    : null
  const fightingStyleDefinitions = useMemo(() => {
    const maxLevelByClassId = new Map<string, number>()
    for (const level of levels) {
      maxLevelByClassId.set(level.class_id, Math.max(maxLevelByClassId.get(level.class_id) ?? 0, level.level))
    }

    return Array.from(maxLevelByClassId.entries()).flatMap(([classId, classLevel]) => {
      const classDetail = classDetailMap[classId]
      return getFightingStyleFeatureOptionDefinition({
        classId,
        className: classDetail?.name ?? null,
        classLevel,
        optionRows: maverickOptionRows,
      }).map((definition) => ({
        ...definition,
        optionKey: `${classId}:style`,
      }))
    })
  }, [classDetailMap, levels, maverickOptionRows])
  const maverickOptionDefinitions = useMemo(
    () => getMaverickArcaneBreakthroughOptionDefinitions({
      classLevel: firstClassLevel,
      subclassId: selectedSubclass?.id ?? null,
      optionRows: maverickOptionRows,
    }),
    [firstClassLevel, maverickOptionRows, selectedSubclass?.id]
  )
  const breakthroughClassOptions = maverickOptionDefinitions[0]?.choices ?? []

  useEffect(() => {
    const activeKeys = new Set(
      fightingStyleDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !choice.option_group_key.startsWith('fighting_style:')
      || activeKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [fightingStyleDefinitions])
  const backgroundFeat = selectedBackground?.background_feat_id
    ? featList.find((feat) => feat.id === selectedBackground.background_feat_id) ?? null
    : null
  const activeFeatSpellFeats = useMemo(
    () => [
      ...featChoices
        .map((featId) => featList.find((feat) => feat.id === featId))
        .filter((feat): feat is Feat => Boolean(feat)),
      ...(backgroundFeat ? [backgroundFeat] : []),
    ],
    [backgroundFeat, featChoices, featList]
  )
  const featSpellDefinitions = useMemo(
    () => getFeatSpellChoiceDefinitions(activeFeatSpellFeats),
    [activeFeatSpellFeats]
  )
  const combinedSpellSelections = useMemo(
    () => buildCombinedSpellSelections({
      classSpellChoices: spellChoices,
      spellOptions: [...spellOptions, ...featSpellOptions],
      owningClassId: firstClassId || null,
      activeSubclassIds: firstClassSubclassIds,
      derived: null,
      featSpellChoices,
      featList: activeFeatSpellFeats,
    }),
    [
      activeFeatSpellFeats,
      featSpellChoices,
      featSpellOptions,
      firstClassId,
      firstClassSubclassIds,
      spellChoices,
      spellOptions,
    ]
  )

  const campaign = campaigns.find((entry) => entry.id === campaignId) ?? null
  const creationHitDieRows = buildWizardHitDieRows(levels, classDetailMap)
  const creationHpMax = calculateCreationHpMax(creationHitDieRows, stats.con)
  const localContext = buildLocalCharacterContext({
    campaign,
    allowedSources: [],
    allSourceRuleSets: {},
    statMethod,
    persistedHpMax: creationHpMax,
    stats,
    selectedSpecies,
    selectedBackground,
    levels,
    classDetailMap,
    subclassMap,
    spellOptions: [...spellOptions, ...featSpellOptions],
    spellChoices,
    spellSelections: combinedSpellSelections,
    featList,
    featChoices,
    asiChoices,
    skillProficiencies,
    abilityBonusChoices,
    languageChoices,
    toolChoices,
    featureOptionChoices: [
      ...featureOptionChoices.map((choice) => ({
        id: `${choice.option_group_key}:${choice.option_key}`,
        character_id: 'local',
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
      ...buildMaverickFeatureOptionChoices({
        selectedClassIds: maverickBreakthroughClassIds,
        definitions: maverickOptionDefinitions,
      }).map((choice) => ({
        id: `${choice.option_group_key}:${choice.option_key}`,
        character_id: 'local',
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
    ],
  })
  const derived = deriveLocalCharacter(localContext)
  const persistedSpellSelections = buildCombinedSpellSelections({
    classSpellChoices: spellChoices,
    spellOptions: [...spellOptions, ...featSpellOptions],
    owningClassId: firstClassId || null,
    activeSubclassIds: firstClassSubclassIds,
    derived,
    featSpellChoices,
    featList: activeFeatSpellFeats,
  })
  const wizardLegalitySummary = summarizeWizardLegality(legalityResult)
  const derivedBlockingIssues = legalityResult?.derived?.blockingIssues ?? []
  const derivedWarnings = legalityResult?.derived?.warnings ?? []

  useEffect(() => {
    const allowedKeys = new Set(featSpellDefinitions.map((definition) => definition.sourceFeatureKey))
    setFeatSpellChoices((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([sourceFeatureKey]) => allowedKeys.has(sourceFeatureKey))
      )
    )
  }, [featSpellDefinitions])

  function handleStatChange(stat: string, value: number) {
    setStats((prev) => ({ ...prev, [stat]: value }))
  }

  function updateLevel(index: number, field: 'class_id' | 'level' | 'subclass_id', value: string | number | null) {
    setLevels((prev) => prev.map((level, i) => (i === index ? { ...level, [field]: value } : level)))
  }

  function addClassLevelRow() {
    if (classList.length === 0) return
    setLevels((prev) => [...prev, { class_id: classList[0].id, level: 1, subclass_id: null }])
  }

  function removeClassLevelRow(index: number) {
    setLevels((prev) => prev.filter((_, i) => i !== index))
  }

  function validateCurrentStep(): string | null {
    switch (currentStep.id) {
      case 'identity':
        if (!campaignId) return 'Select a campaign first.'
        if (!name.trim()) return 'Enter a character name.'
        return null
      case 'species':
        return speciesId ? null : 'Choose a species to continue.'
      case 'background':
        return backgroundId ? null : 'Choose a background to continue.'
      case 'classes':
        if (levels.length === 0) return 'Add at least one class entry.'
        if (levels.some((level) => !level.class_id)) return 'Every class row needs a class.'
        if (levels.some((level) => !classDetailMap[level.class_id])) return 'Class details are still loading. Try again in a moment.'
        if (derived && localContext && derived.totalLevel > localContext.campaignSettings.max_level) {
          return `This build exceeds the campaign max level of ${localContext.campaignSettings.max_level}.`
        }
        for (const definition of fightingStyleDefinitions) {
          const selectedValue = getFeatureOptionChoiceValue(
            featureOptionChoices,
            definition.optionGroupKey,
            definition.optionKey,
            definition.valueKey ?? 'class_id'
          )
          if (!selectedValue) {
            return 'Choose a fighting style for each class that unlocks one.'
          }
        }
        return null
      case 'stats': {
        const speciesAbilityChoiceLimit = getSpeciesAbilityChoiceLimit(selectedSpecies)
        if (speciesAbilityChoiceLimit > 0 && abilityBonusChoices.length < speciesAbilityChoiceLimit) {
          return `Choose ${speciesAbilityChoiceLimit} flexible species ability bonus${speciesAbilityChoiceLimit === 1 ? '' : 'es'} to continue.`
        }
        return null
      }
      case 'subclasses': {
        if (!derived) return null
        const missing = derived.subclassRequirements.find((entry) => entry.missingRequiredSubclass)
        if (missing) return `${missing.className} needs a subclass before continuing.`
        if (selectedSubclass && isMaverickSubclass(selectedSubclass)) {
          const requiredChoices = maverickOptionDefinitions.length
          if (maverickBreakthroughClassIds.filter(Boolean).length < requiredChoices) {
            return `Choose ${requiredChoices} Arcane Breakthrough class${requiredChoices === 1 ? '' : 'es'} for Maverick.`
          }
        }
        return null
      }
      case 'spells-feats': {
        const requiredSlots = derived?.featSlotLabels?.length ?? 0
        const incompleteAsiSlot = Array.from({ length: requiredSlots }, (_, index) => index)
          .find((index) => !featChoices[index] && (asiChoices[index]?.length ?? 0) !== 2)
        if (incompleteAsiSlot !== undefined) {
          return `Choose a feat or finish both ASI picks for slot ${incompleteAsiSlot + 1}.`
        }
        return null
      }
      default:
        return null
    }
  }

  async function ensureCharacter(): Promise<string | null> {
    if (characterId) return characterId

    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaignId,
        name,
        stat_method: statMethod,
        ...(isDm ? { character_type: characterType } : {}),
      }),
    })
    const json = await response.json()
    if (!response.ok) {
      toast({ title: 'Unable to create character', description: json.error, variant: 'destructive' })
      return null
    }
    setCharacterId(json.id)
    return json.id
  }

  async function persistDraft(targetCharacterId: string) {
    const levelsWithHp = levels.map((level) => ({
      class_id: level.class_id,
      level: level.level,
      subclass_id: level.subclass_id,
      hp_roll: classDetailMap[level.class_id]?.hit_die ?? null,
    }))

    const response = await fetch(`/api/characters/${targetCharacterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        stat_method: statMethod,
        species_id: speciesId || null,
        background_id: backgroundId || null,
        hp_max: creationHpMax,
        levels: levelsWithHp,
        base_str: stats.str,
        base_dex: stats.dex,
        base_con: stats.con,
        base_int: stats.int,
        base_wis: stats.wis,
        base_cha: stats.cha,
        skill_proficiencies: buildTypedSkillProficiencies({
          skillProficiencies,
          background: selectedBackground,
          selectedClass,
          species: selectedSpecies,
        }),
        ability_bonus_choices: buildTypedAbilityBonusChoices(
          selectedSpecies,
          abilityBonusChoices
        ),
        asi_choices: buildTypedAsiChoices(
          asiChoices,
          derived?.featSlotLabels,
          featChoices
        ),
        language_choices: buildTypedLanguageChoices({
          languageChoices,
          background: selectedBackground,
          species: selectedSpecies,
        }),
        tool_choices: buildTypedToolChoices({
          toolChoices,
          selectedClass,
          species: selectedSpecies,
        }),
        feature_option_choices: [
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
          ...buildMaverickFeatureOptionChoices({
            selectedClassIds: maverickBreakthroughClassIds,
            definitions: maverickOptionDefinitions,
          }),
        ],
        spell_choices: persistedSpellSelections,
        feat_choices: buildTypedFeatChoices(featChoices, derived?.featSlotLabels),
      }),
    })
    const json = await response.json()
    if (!response.ok) {
      throw new Error(json.error ?? 'Unable to save draft')
    }
    setLegalityResult(json.legality ?? null)
  }

  async function goNext() {
    const validationError = validateCurrentStep()
    if (validationError) {
      toast({ title: 'Cannot continue', description: validationError, variant: 'destructive' })
      return
    }

    setWorking(true)
    try {
      const id = await ensureCharacter()
      if (!id) return

      if (currentStep.id !== 'identity') {
        await persistDraft(id)
      }

      if (stepIndex < STEPS.length - 1) {
        setStepIndex((value) => value + 1)
      }
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unable to save this step.',
        variant: 'destructive',
      })
    } finally {
      setWorking(false)
    }
  }

  function goBack() {
    setStepIndex((value) => Math.max(0, value - 1))
  }

  async function finishWizard() {
    if (!characterId) return
    setWorking(true)
    try {
      await persistDraft(characterId)
      router.push(`/characters/${characterId}`)
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unable to open the sheet yet.',
        variant: 'destructive',
      })
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
            ← Back
          </Button>
          {characterId && <p className="text-sm text-neutral-500">Draft character saved in progress</p>}
        </div>

        <Card className="border-white/10 bg-white/[0.04]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-2xl text-neutral-50">Guided Character Creation</CardTitle>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                  Build the mechanical core here, then continue into the full character sheet for advanced edits and review.
                </p>
              </div>
              <p className="text-sm text-neutral-500">
                Step {stepIndex + 1} of {STEPS.length}: {currentStep.label}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
              {STEPS.map((step, index) => (
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
            {currentStep.id === 'identity' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Campaign</Label>
                  <Select value={campaignId} onValueChange={setCampaignId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id} className="text-neutral-200">
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">Character Name</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mira Stormborn" />
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">Stat Method</Label>
                  <Select value={statMethod} onValueChange={(value) => setStatMethod(value as StatMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="point_buy" className="text-neutral-200">Point Buy</SelectItem>
                      <SelectItem value="standard_array" className="text-neutral-200">Standard Array</SelectItem>
                      <SelectItem value="rolled" className="text-neutral-200">Rolled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isDm && (
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Character Type</Label>
                    <Select value={characterType} onValueChange={(value) => setCharacterType(value as CharacterType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pc" className="text-neutral-200">Player character</SelectItem>
                        <SelectItem value="npc" className="text-neutral-200">NPC</SelectItem>
                        <SelectItem value="test" className="text-neutral-200">Test character</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {currentStep.id === 'species' && (
              <div className="space-y-4">
                <Label className="text-neutral-300">Species</Label>
                <Select value={speciesId} onValueChange={setSpeciesId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose species" />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesList.map((species) => (
                      <SelectItem key={species.id} value={species.id} className="text-neutral-200">
                        {species.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentStep.id === 'background' && (
              <div className="space-y-4">
                <Label className="text-neutral-300">Background</Label>
                <Select value={backgroundId} onValueChange={setBackgroundId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose background" />
                  </SelectTrigger>
                  <SelectContent>
                    {backgroundList.map((background) => (
                      <SelectItem key={background.id} value={background.id} className="text-neutral-200">
                        {background.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBackground?.feature && (
                  <Alert className="border-white/10 bg-white/[0.03]">
                    <AlertDescription className="text-neutral-300">
                      Background feature: {selectedBackground.feature}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep.id === 'classes' && (
              <div className="space-y-4">
                {levels.map((level, index) => (
                  <div key={`${level.class_id}-${index}`} className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1.4fr_0.6fr_auto]">
                    <div className="space-y-2">
                      <Label className="text-neutral-300">Class</Label>
                      <Select
                        value={level.class_id}
                        onValueChange={(value) => updateLevel(index, 'class_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {classList.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id} className="text-neutral-200">
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-neutral-300">Level</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={level.level}
                        onChange={(event) => updateLevel(index, 'level', Math.max(1, Number(event.target.value) || 1))}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeClassLevelRow(index)}
                        disabled={levels.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {creationHitDieRows.length > 0 && (
                  <Alert className="border-white/10 bg-white/[0.03]">
                    <AlertDescription className="text-neutral-300">
                      Creation HP preview: {derived?.hitPoints.max ?? creationHpMax}. The wizard uses full hit dice for each selected level at creation, and you can adjust HP later on the full sheet.
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="button" variant="outline" onClick={addClassLevelRow}>
                  Add Class
                </Button>

                <FeatureOptionChoicesCard
                  title="Fighting Styles"
                  definitions={fightingStyleDefinitions}
                  choices={featureOptionChoices}
                  canEdit
                  onChange={setFeatureOptionChoices}
                />
              </div>
            )}

            {currentStep.id === 'subclasses' && (
              <div className="space-y-4">
                {levels.map((level, index) => {
                  const subclasses = subclassMap[level.class_id] ?? []
                  const detail = classDetailMap[level.class_id]
                  const needsSubclass = detail ? level.level >= detail.subclass_choice_level : false
                  const className = classList.find((cls) => cls.id === level.class_id)?.name ?? 'Class'

                  return (
                    <div key={`${level.class_id}-${index}`} className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <Label className="text-neutral-300">{className}</Label>
                      {needsSubclass ? (
                        <Select
                          value={level.subclass_id ?? ''}
                          onValueChange={(value) => updateLevel(index, 'subclass_id', value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose subclass" />
                          </SelectTrigger>
                          <SelectContent>
                            {subclasses.map((subclass) => (
                              <SelectItem key={subclass.id} value={subclass.id} className="text-neutral-200">
                                {subclass.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-neutral-500">Subclass unlocks at level {detail?.subclass_choice_level ?? 3}.</p>
                      )}
                    </div>
                  )
                })}
                {selectedSubclass && isMaverickSubclass(selectedSubclass) && (
                  <MaverickBreakthroughCard
                    classLevel={firstClassLevel}
                    availableChoices={breakthroughClassOptions}
                    selectedClassIds={maverickBreakthroughClassIds}
                    canEdit
                    onChange={setMaverickBreakthroughClassIds}
                  />
                )}
              </div>
            )}

            {currentStep.id === 'stats' && (
              <StatBlock
                values={stats}
                onChange={handleStatChange}
                readOnly={false}
                statMethod={statMethod}
                racialBonuses={(() => {
                  const fixedBonuses = selectedSpecies?.ability_score_bonuses.reduce<Record<string, number>>((acc, bonus) => {
                    acc[bonus.ability] = (acc[bonus.ability] ?? 0) + bonus.bonus
                    return acc
                  }, {}) ?? {}
                  const chosenBonuses = buildSpeciesAbilityBonusMap(selectedSpecies, abilityBonusChoices)
                  const combined = { ...fixedBonuses }
                  for (const [ability, bonus] of Object.entries(chosenBonuses)) {
                    combined[ability] = (combined[ability] ?? 0) + bonus
                  }
                  asiChoices.forEach((selection, slotIndex) => {
                    if ((featChoices[slotIndex] ?? '').length > 0) return
                    selection.forEach((ability) => {
                      combined[ability] = (combined[ability] ?? 0) + 1
                    })
                  })
                  return combined
                })()}
              />
            )}

            {currentStep.id === 'stats' && (
              <SpeciesAbilityBonusCard
                species={selectedSpecies}
                selectedChoices={abilityBonusChoices}
                canEdit
                onChange={setAbilityBonusChoices}
              />
            )}

            {currentStep.id === 'skills' && (
              <div className="space-y-4">
                <SkillsCard
                  stats={stats}
                  totalLevel={derived?.totalLevel ?? 0}
                  selectedClass={selectedClass}
                  species={selectedSpecies}
                  background={selectedBackground}
                  derived={derived ? { savingThrows: derived.savingThrows, skills: derived.skills } : undefined}
                  skillProficiencies={skillProficiencies}
                  canEdit
                  onChange={setSkillProficiencies}
                />
                <LanguagesToolsCard
                  species={selectedSpecies}
                  background={selectedBackground}
                  availableLanguages={languageList}
                  availableTools={toolList}
                  languageChoices={languageChoices}
                  toolChoices={toolChoices}
                  canEdit
                  onLanguageChange={setLanguageChoices}
                  onToolChange={setToolChoices}
                />
              </div>
            )}

            {currentStep.id === 'spells-feats' && (
              <div className="space-y-4">
                {selectedClass?.spellcasting_type && selectedClass.spellcasting_type !== 'none' && (
                  <SpellsCard
                    classId={firstClassId}
                    campaignId={campaignId}
                    speciesId={speciesId || null}
                    subclassIds={firstClassSubclassIds}
                    expandedClassIds={maverickBreakthroughClassIds.filter(Boolean)}
                    classLevel={firstClassLevel}
                    derivedSpellcasting={derived?.spellcasting}
                    spellChoices={spellChoices}
                    maxSpellLevel={derived?.maxSpellLevel}
                    spellLevelCaps={derived?.spellLevelCaps}
                    leveledSpellSelectionCap={derived?.leveledSpellSelectionCap}
                    cantripSelectionCap={derived?.cantripSelectionCap}
                    selectionSummary={derived?.spellSelectionSummary}
                    canEdit
                    onChange={setSpellChoices}
                  />
                )}

                <FeatsCard
                  background={selectedBackground}
                  backgroundFeat={backgroundFeat}
                  availableFeats={featList}
                  featChoices={featChoices}
                  asiChoices={asiChoices}
                  totalLevel={derived?.totalLevel ?? 0}
                  featSlotLabels={derived?.featSlotLabels}
                  canEdit
                  onChange={setFeatChoices}
                  onAsiChange={setAsiChoices}
                />

                <FeatSpellChoicesCard
                  activeFeats={activeFeatSpellFeats}
                  campaignId={campaignId}
                  classList={classList}
                  selectedChoices={featSpellChoices}
                  canEdit
                  onChange={setFeatSpellChoices}
                  onOptionsLoaded={setFeatSpellOptions}
                />
              </div>
            )}

            {currentStep.id === 'review' && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-neutral-500">Class Build</p>
                    <p className="text-neutral-100">
                      {levels.map((level) => {
                        const className = classList.find((cls) => cls.id === level.class_id)?.name ?? 'Class'
                        const subclassName = level.subclass_id
                          ? (subclassMap[level.class_id] ?? []).find((entry) => entry.id === level.subclass_id)?.name
                          : null
                        return subclassName ? `${className} ${level.level} (${subclassName})` : `${className} ${level.level}`
                      }).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-neutral-500">Creation HP</p>
                    <p className="text-neutral-100">{derived?.hitPoints.max ?? creationHpMax}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Full hit die at creation, including Constitution at each selected level.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-neutral-500">Species</p>
                    <p className="text-neutral-100">{selectedSpecies?.name ?? '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-neutral-500">Background</p>
                    <p className="text-neutral-100">{selectedBackground?.name ?? '—'}</p>
                  </div>
                </div>

                {derived && (
                  <>
                    <Alert className="border-white/10 bg-white/[0.03]">
                      <AlertDescription className="text-neutral-300">
                        Level {derived.totalLevel} build with {derived.totalAsiSlots} feat/ASI slots.
                        {` HP ${derived.hitPoints.max}.`}
                        {derived.spellSlots.length > 0 && ` Spell slots: ${derived.spellSlots.join(' / ')}.`}
                        {spellChoices.length > 0 && ` ${spellChoices.length} spells selected.`}
                        {featChoices.length > 0 && ` ${featChoices.length} feats selected.`}
                      </AlertDescription>
                    </Alert>

                    {derived.spellcasting.sources.length > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm font-medium text-neutral-100">Spellcasting Review</p>
                        <div className="mt-3 space-y-3">
                          {derived.spellcasting.sources.map((source) => (
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

                {legalityResult ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-100">Review your build</p>
                        <p className="mt-1 text-sm text-neutral-400">
                          This is the final mechanical check before opening the full sheet.
                        </p>
                      </div>
                      <LegalitySummaryBadge
                        passed={legalityResult.passed}
                        errorCount={derivedBlockingIssues.length}
                      />
                    </div>

                    {derivedBlockingIssues.length > 0 && (
                      <Alert className="border-rose-400/20 bg-rose-400/10">
                        <AlertDescription className="space-y-2 text-rose-50">
                          <p className="text-sm font-medium">Finish these before submission</p>
                          <ul className="space-y-1 text-sm text-rose-100">
                            {derivedBlockingIssues.map((item) => (
                              <li key={item.key}>• {item.message}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {derivedWarnings.length > 0 && (
                      <Alert className="border-amber-400/20 bg-amber-400/10">
                        <AlertDescription className="space-y-2 text-amber-50">
                          <p className="text-sm font-medium">Heads up</p>
                          <ul className="space-y-1 text-sm text-amber-100">
                            {derivedWarnings.map((item) => (
                              <li key={item.key}>• {item.message}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {wizardLegalitySummary.successes.length > 0 && (
                      <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                        <p className="text-sm font-medium text-emerald-100">Already looking good</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {wizardLegalitySummary.successes.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-neutral-200">Detailed legality check</p>
                      <div className="flex flex-wrap gap-2">
                        {legalityResult.checks.map((check) => (
                          <LegalityBadge key={check.key} check={check} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert className="border-white/10 bg-white/[0.03]">
                    <AlertDescription className="text-neutral-300">
                      Open the full character sheet to run the complete legality pass. If anything needs attention, the sheet will show exactly what to fix before submission.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={goBack} disabled={stepIndex === 0 || working}>
            Back
          </Button>
          {currentStep.id === 'review' ? (
            <Button type="button" onClick={finishWizard} disabled={working}>
              {working ? 'Saving…' : 'Open full character sheet'}
            </Button>
          ) : (
            <Button type="button" onClick={goNext} disabled={working}>
              {working ? 'Saving…' : 'Continue'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
