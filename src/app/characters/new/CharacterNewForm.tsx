'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Background,
  Campaign,
  CharacterAbilityBonusChoice,
  CharacterEquipmentItem,
  CharacterFeatureOptionChoice,
  CharacterLanguageChoice,
  CharacterSkillProficiency,
  CharacterStatRoll,
  CharacterToolChoice,
  CharacterType,
  Class,
  EquipmentItem,
  Feat,
  FeatureOption,
  Language,
  Species,
  StatMethod,
  Subclass,
  Tool,
} from '@/lib/types/database'
import type { LegalityResult } from '@/lib/legality/engine'
import type { WizardCampaignContext } from '@/lib/characters/wizard-context'
import { StatBlock } from '@/components/character-sheet/StatBlock'
import { LanguagesToolsCard } from '@/components/character-sheet/LanguagesToolsCard'
import { MaverickBreakthroughCard } from '@/components/character-sheet/MaverickBreakthroughCard'
import { SkillsCard } from '@/components/character-sheet/SkillsCard'
import { SpellsCard } from '@/components/character-sheet/SpellsCard'
import { FeatsCard } from '@/components/character-sheet/FeatsCard'
import { FeatSpellChoicesCard } from '@/components/character-sheet/FeatSpellChoicesCard'
import { FeatureOptionChoicesCard } from '@/components/character-sheet/FeatureOptionChoicesCard'
import { FeatureSpellChoicesCard } from '@/components/character-sheet/FeatureSpellChoicesCard'
import { StartingEquipmentCard } from '@/components/character-sheet/StartingEquipmentCard'
import { LegalityBadge, LegalitySummaryBadge } from '@/components/character-sheet/LegalityBadge'
import { GuidedChooseMany, GuidedChooseOne } from '@/components/wizard/GuidedChoiceList'
import { WizardStepFrame } from '@/components/wizard/WizardStepFrame'
import {
  ABILITY_KEYS,
  buildStatRollRows,
  buildStatsFromRollRows,
  createRolledStatSets,
  isStandardArrayAssignment,
  restoreRolledState,
  STANDARD_ARRAY,
  sumBestThree,
  totalPointBuySpend,
  type AbilityKey as StatAbilityKey,
  type RolledStatSet,
} from '@/lib/characters/ability-generation'
import {
  buildCombinedSpellSelections,
  buildTypedAsiChoices,
  buildLocalCharacterContext,
  buildTypedAbilityBonusChoices,
  buildTypedFeatChoices,
  buildWizardHitDieRows,
  calculateCreationHpMax,
  ClassDetail,
  deriveLocalCharacter,
  SpellOption,
  summarizeWizardLegality,
  type AsiSelection,
  type WizardLevel,
  type WizardStatRoll,
} from '@/lib/characters/wizard-helpers'
import {
  buildCreationLanguageChoices,
  buildCreationSkillProficiencies,
  buildCreationToolChoices,
  mergeCreationLanguageSelections,
  mergeCreationSkillSelections,
  mergeCreationToolSelections,
} from '@/lib/characters/creation-step-selections'
import type { FeatureOptionChoiceInput } from '@/lib/characters/choice-persistence'
import {
  resolveStartingEquipment,
  restoreStartingEquipmentSelections,
  type StartingEquipmentSelections,
} from '@/lib/characters/starting-equipment'
import {
  getBackgroundLanguageChoiceConfig,
  getClassToolChoiceConfig,
  getSpeciesLanguageChoiceConfig,
  getSubclassLanguageChoiceConfig,
  getSpeciesToolChoiceConfig,
  STANDARD_LANGUAGE_OPTIONS,
  STANDARD_TOOL_OPTIONS,
} from '@/lib/characters/language-tool-provenance'
import {
  buildSpeciesAbilityBonusMap,
  getAbilityChoiceLabel,
  getAvailableSpeciesAbilityChoices,
  getSpeciesAbilityChoiceLimit,
  type AbilityKey as SpeciesChoiceAbilityKey,
} from '@/lib/characters/species-ability-bonus-provenance'
import { getFeatSpellChoiceDefinitions } from '@/lib/characters/feat-spell-options'
import {
  buildFeatureOptionChoicesFromDefinitionMap,
  buildMaverickFeatureOptionChoices,
  buildTypedFeatureSpellChoices,
  getFeatureOptionChoiceValue,
  getFightingStyleFeatureOptionDefinition,
  getMaverickArcaneBreakthroughOptionDefinitions,
  getSubclassFeatureOptionDefinitions,
  getSpeciesFeatureOptionDefinitions,
  getSpeciesFeatureSpellChoiceDefinitions,
} from '@/lib/characters/feature-grants'
import { isMaverickSubclass } from '@/lib/characters/maverick'
import {
  getSpeciesSkillChoiceConfig,
  getSubclassSkillChoiceConfig,
} from '@/lib/characters/skill-provenance'
import {
  getContiguouslyCompletedSteps,
  hasCompletedStep,
} from '@/lib/characters/wizard-step-helpers'
import type {
  StartingEquipmentPackageEntry,
  WeaponCatalogEntry,
} from '@/lib/content/equipment-content'

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
  | 'equipment'
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
  { id: 'equipment', label: 'Equipment' },
  { id: 'spells-feats', label: 'Spells + Feats' },
  { id: 'review', label: 'Review' },
]

type ReviewIssueGroup = {
  stepId: Exclude<StepId, 'review'>
  stepLabel: string
  issues: LegalityResult['checks']
}

const REVIEW_STEP_LABELS: Record<Exclude<StepId, 'review'>, string> = {
  identity: 'Identity + Campaign',
  species: 'Species',
  background: 'Background',
  classes: 'Class',
  subclasses: 'Subclass',
  stats: 'Ability Scores',
  skills: 'Skills + Proficiencies',
  equipment: 'Equipment',
  'spells-feats': 'Spells + Feats',
}

function getReviewStepForCheckKey(key: string): Exclude<StepId, 'review'> {
  switch (key) {
    case 'source_allowlist':
    case 'rule_set_consistency':
      return 'identity'
    case 'species_ability_bonus_choices':
      return 'species'
    case 'stat_method_consistency':
    case 'stat_method':
      return 'stats'
    case 'level_cap':
      return 'classes'
    case 'skill_proficiencies':
      return 'skills'
    case 'multiclass_prerequisites':
    case 'fighting_style_selections':
      return 'classes'
    case 'subclass_timing':
    case 'maverick_breakthroughs':
    case 'subclass_feature_option_selections':
      return 'subclasses'
    case 'asi_choices':
    case 'feat_prerequisites':
    case 'feat_slots':
    case 'spell_legality':
    case 'spell_selection_count':
      return 'spells-feats'
    default:
      return 'identity'
  }
}

export function CharacterNewForm({ isDm }: CharacterNewFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const resumeCharacterId = searchParams.get('characterId')

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignContext, setCampaignContext] = useState<WizardCampaignContext | null>(null)
  const [campaignId, setCampaignId] = useState('')
  const [name, setName] = useState('')
  const [statMethod, setStatMethod] = useState<StatMethod>('point_buy')
  const [characterType, setCharacterType] = useState<CharacterType>('pc')
  const [stepIndex, setStepIndex] = useState(0)
  const [working, setWorking] = useState(false)
  const [characterId, setCharacterId] = useState<string | null>(null)
  const [legalityResult, setLegalityResult] = useState<LegalityResult | null>(null)
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [draftStepInitialized, setDraftStepInitialized] = useState(false)
  const [draftEquipmentItems, setDraftEquipmentItems] = useState<CharacterEquipmentItem[]>([])
  const [equipmentSelectionsHydrated, setEquipmentSelectionsHydrated] = useState(false)

  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [backgroundList, setBackgroundList] = useState<Background[]>([])
  const [classList, setClassList] = useState<Class[]>([])
  const [featList, setFeatList] = useState<Feat[]>([])
  const [languageList, setLanguageList] = useState<Language[]>([])
  const [toolList, setToolList] = useState<Tool[]>([])
  const [featureOptionRows, setFeatureOptionRows] = useState<FeatureOption[]>([])
  const [startingEquipmentPackages, setStartingEquipmentPackages] = useState<StartingEquipmentPackageEntry[]>([])
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([])
  const [weaponCatalog, setWeaponCatalog] = useState<WeaponCatalogEntry[]>([])
  const [subclassMap, setSubclassMap] = useState<Record<string, Subclass[]>>({})
  const [classDetailMap, setClassDetailMap] = useState<Record<string, ClassDetail>>({})
  const [spellOptions, setSpellOptions] = useState<SpellOption[]>([])
  const [speciesSpellOptions, setSpeciesSpellOptions] = useState<SpellOption[]>([])

  const [speciesId, setSpeciesId] = useState('')
  const [backgroundId, setBackgroundId] = useState('')
  const [levels, setLevels] = useState<WizardLevel[]>([])
  const [stats, setStats] = useState({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })
  const [rolledStatSets, setRolledStatSets] = useState<RolledStatSet[]>([])
  const [rolledAssignments, setRolledAssignments] = useState<Partial<Record<StatAbilityKey, string>>>({})
  const [speciesSkillChoices, setSpeciesSkillChoices] = useState<string[]>([])
  const [backgroundSkillChoices, setBackgroundSkillChoices] = useState<string[]>([])
  const [classSkillChoices, setClassSkillChoices] = useState<string[]>([])
  const [subclassSkillChoices, setSubclassSkillChoices] = useState<string[]>([])
  const [abilityBonusChoices, setAbilityBonusChoices] = useState<SpeciesChoiceAbilityKey[]>([])
  const [asiChoices, setAsiChoices] = useState<AsiSelection[]>([])
  const [speciesLanguageChoices, setSpeciesLanguageChoices] = useState<string[]>([])
  const [backgroundLanguageChoices, setBackgroundLanguageChoices] = useState<string[]>([])
  const [subclassLanguageChoices, setSubclassLanguageChoices] = useState<string[]>([])
  const [speciesToolChoices, setSpeciesToolChoices] = useState<string[]>([])
  const [classToolChoices, setClassToolChoices] = useState<string[]>([])
  const [spellChoices, setSpellChoices] = useState<string[]>([])
  const [featChoices, setFeatChoices] = useState<string[]>([])
  const [featSpellChoices, setFeatSpellChoices] = useState<Record<string, string>>({})
  const [featSpellOptions, setFeatSpellOptions] = useState<SpellOption[]>([])
  const [featureSpellChoices, setFeatureSpellChoices] = useState<Record<string, string>>({})
  const [featureSpellOptions, setFeatureSpellOptions] = useState<SpellOption[]>([])
  const [maverickBreakthroughClassIds, setMaverickBreakthroughClassIds] = useState<string[]>([])
  const [featureOptionChoices, setFeatureOptionChoices] = useState<FeatureOptionChoiceInput[]>([])
  const [startingEquipmentSelections, setStartingEquipmentSelections] = useState<StartingEquipmentSelections>({})

  useEffect(() => {
    fetch('/api/campaigns')
      .then((response) => response.json())
      .then((data: Campaign[]) => {
        setCampaigns(data)
        if (data.length === 1) setCampaignId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (!campaignId) {
      setCampaignContext(null)
      return
    }

    let cancelled = false

    fetch(`/api/campaigns/${campaignId}/wizard-context`)
      .then((response) => response.json())
      .then((data: WizardCampaignContext) => {
        if (!cancelled) {
          setCampaignContext(data)
        }
      })

    return () => {
      cancelled = true
    }
  }, [campaignId])

  useEffect(() => {
    if (!resumeCharacterId) {
      setDraftHydrated(true)
      return
    }

    let cancelled = false

    type DraftCharacterResponse = {
      id: string
      campaign_id: string
      name: string
      stat_method: StatMethod
      character_type: CharacterType
      species_id: string | null
      background_id: string | null
      base_str: number
      base_dex: number
      base_con: number
      base_int: number
      base_wis: number
      base_cha: number
      character_levels: Array<{
        class_id: string
        level: number
        subclass_id: string | null
        hp_roll: number | null
      }>
      skill_proficiencies: string[]
      typed_skill_proficiencies: CharacterSkillProficiency[]
      ability_bonus_choices: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>
      typed_ability_bonus_choices: CharacterAbilityBonusChoice[]
      language_choices: string[]
      typed_language_choices: CharacterLanguageChoice[]
      tool_choices: string[]
      typed_tool_choices: CharacterToolChoice[]
      spell_choices: string[]
      feat_choices: string[]
      feature_option_choices: CharacterFeatureOptionChoice[]
      equipment_items: CharacterEquipmentItem[]
      stat_rolls: CharacterStatRoll[]
      legality: LegalityResult | null
    }

    fetch(`/api/characters/${resumeCharacterId}`)
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok) {
          throw new Error(json.error ?? 'Unable to load draft character')
        }
        return json as DraftCharacterResponse
      })
      .then((data) => {
        if (cancelled) return

        const restoredRolledState = restoreRolledState(data.stat_rolls ?? [])

        setCharacterId(data.id)
        setCampaignId(data.campaign_id)
        setName(data.name ?? '')
        setStatMethod(data.stat_method ?? 'point_buy')
        if (isDm) {
          setCharacterType(data.character_type ?? 'pc')
        }
        setSpeciesId(data.species_id ?? '')
        setBackgroundId(data.background_id ?? '')
        setLevels(
          (Array.isArray(data.character_levels) ? data.character_levels : []).map((level) => ({
            class_id: level.class_id,
            level: level.level,
            subclass_id: level.subclass_id,
            hp_roll: level.hp_roll,
          }))
        )
        setStats({
          str: data.base_str,
          dex: data.base_dex,
          con: data.base_con,
          int: data.base_int,
          wis: data.base_wis,
          cha: data.base_cha,
        })
        setRolledStatSets(restoredRolledState.rolledSets)
        setRolledAssignments(restoredRolledState.assignments)
        setSpeciesSkillChoices(
          (data.typed_skill_proficiencies ?? [])
            .filter((row) => row.source_category === 'species_choice')
            .map((row) => row.skill)
        )
        setBackgroundSkillChoices(
          (data.typed_skill_proficiencies ?? [])
            .filter((row) => row.source_category === 'background_choice')
            .map((row) => row.skill)
        )
        setClassSkillChoices(
          (data.typed_skill_proficiencies ?? [])
            .filter((row) => row.source_category === 'class_choice')
            .map((row) => row.skill)
        )
        setSubclassSkillChoices(
          (data.typed_skill_proficiencies ?? [])
            .filter((row) => row.source_category === 'subclass_choice')
            .map((row) => row.skill)
        )
        setAbilityBonusChoices(
          (data.typed_ability_bonus_choices ?? [])
            .filter((row) => row.source_category === 'species_choice')
            .map((row) => row.ability)
        )
        setSpeciesLanguageChoices(
          (data.typed_language_choices ?? [])
            .filter((row) => row.source_category === 'species_choice')
            .map((row) => row.language)
        )
        setBackgroundLanguageChoices(
          (data.typed_language_choices ?? [])
            .filter((row) => row.source_category === 'background_choice')
            .map((row) => row.language)
        )
        setSubclassLanguageChoices(
          (data.typed_language_choices ?? [])
            .filter((row) => row.source_category === 'subclass_choice')
            .map((row) => row.language)
        )
        setSpeciesToolChoices(
          (data.typed_tool_choices ?? [])
            .filter((row) => row.source_category === 'species_choice')
            .map((row) => row.tool)
        )
        setClassToolChoices(
          (data.typed_tool_choices ?? [])
            .filter((row) => row.source_category === 'class_choice')
            .map((row) => row.tool)
        )
        setSpellChoices(data.spell_choices ?? [])
        setFeatChoices(data.feat_choices ?? [])
        setFeatureOptionChoices(data.feature_option_choices ?? [])
        setDraftEquipmentItems(data.equipment_items ?? [])
        setLegalityResult(data.legality ?? null)
        setDraftHydrated(true)
      })
      .catch((error) => {
        if (cancelled) return
        setDraftHydrated(true)
        toast({
          title: 'Unable to load draft',
          description: error instanceof Error ? error.message : 'The saved draft could not be restored.',
          variant: 'destructive',
        })
      })

    return () => {
      cancelled = true
    }
  }, [isDm, resumeCharacterId, toast])

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
      fetch(`/api/content/feature-options${qs}`).then((response) => response.json()),
      fetch(`/api/content/starting-equipment-packages${qs}`).then((response) => response.json()),
      fetch(`/api/content/equipment-items${qs}`).then((response) => response.json()),
      fetch(`/api/content/weapons${qs}`).then((response) => response.json()),
    ]).then(([species, backgrounds, classes, feats, languages, tools, featureOptions, packages, items, weapons]) => {
      setSpeciesList(species)
      setBackgroundList(backgrounds)
      setClassList(classes)
      setFeatList(feats)
      setLanguageList(Array.isArray(languages) ? languages : [])
      setToolList(Array.isArray(tools) ? tools : [])
      setFeatureOptionRows(Array.isArray(featureOptions) ? featureOptions : [])
      setStartingEquipmentPackages(Array.isArray(packages) ? packages : [])
      setEquipmentItems(Array.isArray(items) ? items : [])
      setWeaponCatalog(Array.isArray(weapons) ? weapons : [])
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
    if (levels.length === 0) return

    const primaryLevel = levels[0]
    if (levels.length === 1 && primaryLevel.level === 1) return

    setLevels([{
      class_id: primaryLevel.class_id,
      level: 1,
      subclass_id: primaryLevel.subclass_id,
    }])
  }, [levels])

  useEffect(() => {
    if (statMethod !== 'rolled') return
    const currentStatRollRows = buildStatRollRows(rolledAssignments, rolledStatSets)
    if (currentStatRollRows.length !== ABILITY_KEYS.length) return

    setStats((prev) => buildStatsFromRollRows(currentStatRollRows, prev))
  }, [rolledAssignments, rolledStatSets, statMethod])

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

  useEffect(() => {
    if (!campaignId || !speciesId) {
      setSpeciesSpellOptions([])
      return
    }

    const totalLevel = levels.reduce((sum, level) => sum + level.level, 0)
    const params = new URLSearchParams({
      campaign_id: campaignId,
      species_id: speciesId,
      class_level: String(totalLevel),
    })

    fetch(`/api/content/spells?${params.toString()}`)
      .then((response) => response.json())
      .then((data: SpellOption[]) => setSpeciesSpellOptions(Array.isArray(data) ? data : []))
  }, [campaignId, levels, speciesId])

  useEffect(() => {
    if (statMethod === 'standard_array' && !isStandardArrayAssignment(stats)) {
      setStats({
        str: STANDARD_ARRAY[0],
        dex: STANDARD_ARRAY[1],
        con: STANDARD_ARRAY[2],
        int: STANDARD_ARRAY[3],
        wis: STANDARD_ARRAY[4],
        cha: STANDARD_ARRAY[5],
      })
    }

    if (statMethod === 'point_buy') {
      const clampedStats = {
        str: Math.min(15, Math.max(8, stats.str)),
        dex: Math.min(15, Math.max(8, stats.dex)),
        con: Math.min(15, Math.max(8, stats.con)),
        int: Math.min(15, Math.max(8, stats.int)),
        wis: Math.min(15, Math.max(8, stats.wis)),
        cha: Math.min(15, Math.max(8, stats.cha)),
      }
      if (!ABILITY_KEYS.every((ability) => stats[ability] === clampedStats[ability])) {
        setStats(clampedStats)
      }
    }
  }, [statMethod, stats])

  const currentStep = STEPS[stepIndex]
  const selectedSpecies = speciesList.find((species) => species.id === speciesId) ?? null
  const selectedBackground = backgroundList.find((background) => background.id === backgroundId) ?? null
  const firstClassId = levels[0]?.class_id ?? ''
  const firstClassLevel = levels[0]?.level ?? 0
  const firstClassSubclassIds = levels
    .filter((level) => level.class_id === firstClassId && level.subclass_id)
    .map((level) => level.subclass_id as string)
  const selectedClass = classList.find((cls) => cls.id === firstClassId) ?? null
  const activeStartingEquipmentPackages = useMemo(
    () => startingEquipmentPackages.filter((pkg) => (
      pkg.id === selectedBackground?.starting_equipment_package_id
      || pkg.id === selectedClass?.starting_equipment_package_id
    )),
    [
      selectedBackground?.starting_equipment_package_id,
      selectedClass?.starting_equipment_package_id,
      startingEquipmentPackages,
    ]
  )
  const campaignChoiceOptions = useMemo(
    () => campaigns.map((entry) => ({
      id: entry.id,
      label: entry.name,
      description: `Ruleset ${entry.rule_set} • ${entry.settings.stat_method.replace(/_/g, ' ')} • max level ${entry.settings.max_level}`,
    })),
    [campaigns]
  )
  const speciesChoiceOptions = useMemo(
    () => speciesList.map((species) => ({
      id: species.id,
      label: species.name,
      description: `${species.size}, speed ${species.speed} ft.`,
      detail: [
        species.languages.length > 0 ? `Languages: ${species.languages.join(', ')}` : null,
        species.ability_score_bonuses.length > 0
          ? `Fixed bonuses: ${species.ability_score_bonuses.map((bonus) => `${getAbilityChoiceLabel(bonus.ability)} +${bonus.bonus}`).join(', ')}`
          : null,
      ].filter(Boolean).join(' • '),
    })),
    [speciesList]
  )
  const backgroundChoiceOptions = useMemo(
    () => backgroundList.map((background) => ({
      id: background.id,
      label: background.name,
      description: background.feature || 'Background feature details can be reviewed later on the full sheet.',
      detail: [
        background.skill_proficiencies.length > 0
          ? `Skills: ${background.skill_proficiencies.join(', ')}`
          : null,
        background.tool_proficiencies.length > 0
          ? `Tools: ${background.tool_proficiencies.join(', ')}`
          : null,
        background.languages.length > 0
          ? `Languages: ${background.languages.join(', ')}`
          : null,
      ].filter(Boolean).join(' • '),
    })),
    [backgroundList]
  )
  const classChoiceOptions = useMemo(
    () => classList.map((cls) => ({
      id: cls.id,
      label: cls.name,
      description: `Hit die d${cls.hit_die}${cls.spellcasting_type && cls.spellcasting_type !== 'none' ? ` • ${cls.spellcasting_type} caster` : ''}`,
      detail: cls.primary_ability.length > 0 ? `Primary abilities: ${cls.primary_ability.join(', ')}` : undefined,
    })),
    [classList]
  )
  const backgroundStepSummaryItems = useMemo(() => {
    if (!selectedBackground) return []

    const items = [`Background: ${selectedBackground.name}`]
    if (selectedBackground.feature) {
      items.push(`Feature: ${selectedBackground.feature}`)
    }
    if (selectedBackground.skill_proficiencies.length > 0) {
      items.push(`Fixed skills: ${selectedBackground.skill_proficiencies.join(', ')}`)
    }
    if (selectedBackground.skill_choice_count > 0) {
      items.push(backgroundSkillChoices.length > 0
        ? `Chosen background skills: ${backgroundSkillChoices.join(', ')}`
        : `Choose ${selectedBackground.skill_choice_count} skill${selectedBackground.skill_choice_count === 1 ? '' : 's'} from ${selectedBackground.skill_choice_from.join(', ')}`
      )
    }
    if (backgroundLanguageChoices.length > 0) {
      items.push(`Chosen background languages: ${backgroundLanguageChoices.join(', ')}`)
    }
    if (selectedBackground.background_feat_id) {
      const featName = featList.find((feat) => feat.id === selectedBackground.background_feat_id)?.name
      if (featName) {
        items.push(`Background feat: ${featName}`)
      }
    }
    return items
  }, [backgroundLanguageChoices, backgroundSkillChoices, featList, selectedBackground])
  const speciesAbilityChoiceOptions = useMemo(
    () => getAvailableSpeciesAbilityChoices(selectedSpecies).map((ability) => ({
      id: ability,
      label: getAbilityChoiceLabel(ability),
      description: `Add +1 to ${getAbilityChoiceLabel(ability)}.`,
    })),
    [selectedSpecies]
  )
  const availableLanguageNames = useMemo(
    () => (languageList.length > 0 ? languageList.map((language) => language.name) : STANDARD_LANGUAGE_OPTIONS),
    [languageList]
  )
  const availableToolNames = useMemo(
    () => (toolList.length > 0 ? toolList.map((tool) => tool.name) : STANDARD_TOOL_OPTIONS),
    [toolList]
  )
  const speciesLanguageConfig = useMemo(
    () => getSpeciesLanguageChoiceConfig(selectedSpecies, availableLanguageNames),
    [availableLanguageNames, selectedSpecies]
  )
  const backgroundLanguageConfig = useMemo(
    () => getBackgroundLanguageChoiceConfig(selectedBackground, availableLanguageNames),
    [availableLanguageNames, selectedBackground]
  )
  const speciesToolConfig = useMemo(
    () => getSpeciesToolChoiceConfig(selectedSpecies, availableToolNames),
    [availableToolNames, selectedSpecies]
  )
  const speciesSkillConfig = useMemo(
    () => getSpeciesSkillChoiceConfig(selectedSpecies),
    [selectedSpecies]
  )
  const selectedSubclass = selectedClass
    ? (subclassMap[selectedClass.id] ?? []).find((entry) => entry.id === firstClassSubclassIds[0]) ?? null
    : null
  const classToolConfig = useMemo(
    () => getClassToolChoiceConfig(selectedClass, availableToolNames),
    [availableToolNames, selectedClass]
  )
  const subclassLanguageConfig = useMemo(
    () => getSubclassLanguageChoiceConfig(
      selectedSubclass,
      availableLanguageNames,
      [
        ...(selectedSpecies?.languages ?? []),
        ...(selectedBackground?.languages ?? []),
        ...speciesLanguageChoices,
        ...backgroundLanguageChoices,
      ]
    ),
    [availableLanguageNames, backgroundLanguageChoices, selectedBackground?.languages, selectedSubclass, selectedSpecies?.languages, speciesLanguageChoices]
  )
  const subclassSkillConfig = useMemo(
    () => getSubclassSkillChoiceConfig(selectedSubclass),
    [selectedSubclass]
  )
  const speciesLanguageOptions = useMemo(
    () => (speciesLanguageConfig?.options ?? []).map((language) => ({
      id: language,
      label: language,
    })),
    [speciesLanguageConfig]
  )
  const backgroundLanguageOptions = useMemo(
    () => (backgroundLanguageConfig?.options ?? []).map((language) => ({
      id: language,
      label: language,
    })),
    [backgroundLanguageConfig]
  )
  const speciesToolOptions = useMemo(
    () => (speciesToolConfig?.options ?? []).map((tool) => ({
      id: tool,
      label: tool,
    })),
    [speciesToolConfig]
  )
  const classToolOptions = useMemo(
    () => (classToolConfig?.options ?? []).map((tool) => ({
      id: tool,
      label: tool,
    })),
    [classToolConfig]
  )
  const speciesSkillOptions = useMemo(
    () => Array.from(speciesSkillConfig?.from ?? []).map((skill) => ({
      id: skill,
      label: skill.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    })),
    [speciesSkillConfig]
  )
  const backgroundSkillOptions = useMemo(
    () => (selectedBackground?.skill_choice_from ?? []).map((skill) => ({
      id: skill,
      label: skill.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    })),
    [selectedBackground]
  )
  const subclassLanguageOptions = useMemo(
    () => (subclassLanguageConfig?.options ?? []).map((language) => ({
      id: language,
      label: language,
    })),
    [subclassLanguageConfig]
  )
  const subclassSkillOptions = useMemo(
    () => Array.from(subclassSkillConfig?.from ?? []).map((skill) => ({
      id: skill,
      label: skill.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    })),
    [subclassSkillConfig]
  )
  const subclassChoiceOptions = useMemo(
    () => (selectedClass ? (subclassMap[selectedClass.id] ?? []) : []).map((subclass) => ({
      id: subclass.id,
      label: subclass.name,
      description: `${selectedClass?.name ?? 'Class'} subclass`,
    })),
    [selectedClass, subclassMap]
  )
  const skillProficiencies = useMemo(
    () => mergeCreationSkillSelections({
      speciesSkillChoices,
      backgroundSkillChoices,
      classSkillChoices,
      subclassSkillChoices,
    }),
    [backgroundSkillChoices, classSkillChoices, speciesSkillChoices, subclassSkillChoices]
  )
  const languageChoices = useMemo(
    () => mergeCreationLanguageSelections({
      speciesLanguageChoices,
      backgroundLanguageChoices,
      subclassLanguageChoices,
    }),
    [backgroundLanguageChoices, speciesLanguageChoices, subclassLanguageChoices]
  )
  const toolChoices = useMemo(
    () => mergeCreationToolSelections({
      speciesToolChoices,
      classToolChoices,
    }),
    [classToolChoices, speciesToolChoices]
  )
  const statRollRows = useMemo<WizardStatRoll[]>(
    () => buildStatRollRows(rolledAssignments, rolledStatSets),
    [rolledAssignments, rolledStatSets]
  )
  const rolledStatsComplete = statRollRows.length === ABILITY_KEYS.length
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
        optionRows: featureOptionRows,
      }).map((definition) => ({
        ...definition,
        optionKey: `${classId}:style`,
      }))
    })
  }, [classDetailMap, featureOptionRows, levels])
  const maverickOptionDefinitions = useMemo(
    () => getMaverickArcaneBreakthroughOptionDefinitions({
      classLevel: firstClassLevel,
      subclassId: selectedSubclass?.id ?? null,
      optionRows: featureOptionRows,
    }),
    [featureOptionRows, firstClassLevel, selectedSubclass?.id]
  )
  const breakthroughClassOptions = maverickOptionDefinitions[0]?.choices ?? []
  const subclassFeatureOptionDefinitions = useMemo(
    () => levels.flatMap((level) => {
      const subclass = level.subclass_id
        ? (subclassMap[level.class_id] ?? []).find((entry) => entry.id === level.subclass_id) ?? null
        : null
      return getSubclassFeatureOptionDefinitions({
        classId: level.class_id,
        classLevel: level.level,
        subclassId: subclass?.id ?? null,
        subclassName: subclass?.name ?? null,
        subclassSource: subclass?.source ?? null,
        optionRows: featureOptionRows,
      })
    }),
    [featureOptionRows, levels, subclassMap]
  )
  const speciesOptionDefinitions = useMemo(
    () => getSpeciesFeatureOptionDefinitions({ species: selectedSpecies }),
    [selectedSpecies]
  )
  const speciesFeatureSpellDefinitions = useMemo(
    () => getSpeciesFeatureSpellChoiceDefinitions({ species: selectedSpecies }),
    [selectedSpecies]
  )
  const featureSpellDefinitions = useMemo(
    () => speciesFeatureSpellDefinitions,
    [speciesFeatureSpellDefinitions]
  )

  useEffect(() => {
    const activeKeys = new Set(
      fightingStyleDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !choice.option_group_key.startsWith('fighting_style:')
      || activeKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [fightingStyleDefinitions])

  useEffect(() => {
    const activeSpeciesKeys = new Set(
      speciesOptionDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !choice.option_group_key.startsWith('species:')
      || activeSpeciesKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [speciesOptionDefinitions])

  useEffect(() => {
    const activeSubclassKeys = new Set(
      subclassFeatureOptionDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
    )
    setFeatureOptionChoices((prev) => prev.filter((choice) => (
      !(
        choice.option_group_key === 'maneuver:battle_master:2014'
        || choice.option_group_key.startsWith('hunter:')
        || choice.option_group_key === 'circle_of_land:terrain:2014'
        || choice.option_group_key === 'elemental_discipline:four_elements:2014'
      )
      || activeSubclassKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    )))
  }, [subclassFeatureOptionDefinitions])

  useEffect(() => {
    const activeKeys = new Set(featureSpellDefinitions.map((definition) => definition.sourceFeatureKey))
    setFeatureSpellChoices((prev) => Object.fromEntries(
      Object.entries(prev).filter(([sourceFeatureKey]) => activeKeys.has(sourceFeatureKey))
    ))
  }, [featureSpellDefinitions])

  useEffect(() => {
    const allowedAbilities = new Set(getAvailableSpeciesAbilityChoices(selectedSpecies))
    const limit = getSpeciesAbilityChoiceLimit(selectedSpecies)
    setAbilityBonusChoices((prev) => prev.filter((ability) => allowedAbilities.has(ability)).slice(0, limit))
  }, [selectedSpecies])

  useEffect(() => {
    const allowed = new Set(speciesLanguageConfig?.options ?? [])
    const limit = speciesLanguageConfig?.count ?? 0
    setSpeciesLanguageChoices((prev) => prev.filter((language) => allowed.has(language)).slice(0, limit))
  }, [speciesLanguageConfig])

  useEffect(() => {
    const allowed = new Set(backgroundLanguageConfig?.options ?? [])
    const limit = backgroundLanguageConfig?.count ?? 0
    setBackgroundLanguageChoices((prev) => prev.filter((language) => allowed.has(language)).slice(0, limit))
  }, [backgroundLanguageConfig])

  useEffect(() => {
    const allowed = new Set(speciesToolConfig?.options ?? [])
    const limit = speciesToolConfig?.count ?? 0
    setSpeciesToolChoices((prev) => prev.filter((tool) => allowed.has(tool)).slice(0, limit))
  }, [speciesToolConfig])

  useEffect(() => {
    const allowed = new Set(classToolConfig?.options ?? [])
    const limit = classToolConfig?.count ?? 0
    setClassToolChoices((prev) => prev.filter((tool) => allowed.has(tool)).slice(0, limit))
  }, [classToolConfig])

  useEffect(() => {
    const allowed = new Set<string>(speciesSkillConfig?.from ? Array.from(speciesSkillConfig.from) : [])
    const limit = speciesSkillConfig?.count ?? 0
    setSpeciesSkillChoices((prev) => prev.filter((skill) => allowed.has(skill)).slice(0, limit))
  }, [speciesSkillConfig])

  useEffect(() => {
    const allowed = new Set((selectedBackground?.skill_choice_from ?? []).map((skill) => skill.toLowerCase()))
    const limit = selectedBackground?.skill_choice_count ?? 0
    setBackgroundSkillChoices((prev) => prev.filter((skill) => allowed.has(skill.toLowerCase())).slice(0, limit))
  }, [selectedBackground])

  useEffect(() => {
    const allowed = new Set(subclassLanguageConfig?.options ?? [])
    const limit = subclassLanguageConfig?.count ?? 0
    setSubclassLanguageChoices((prev) => prev.filter((language) => allowed.has(language)).slice(0, limit))
  }, [subclassLanguageConfig])

  useEffect(() => {
    const allowed = new Set<string>(subclassSkillConfig?.from ? Array.from(subclassSkillConfig.from) : [])
    const limit = subclassSkillConfig?.count ?? 0
    setSubclassSkillChoices((prev) => prev.filter((skill) => allowed.has(skill)).slice(0, limit))
  }, [subclassSkillConfig])
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
      spellOptions: [...spellOptions, ...speciesSpellOptions, ...featSpellOptions, ...featureSpellOptions],
      owningClassId: firstClassId || null,
      activeSubclassIds: firstClassSubclassIds,
      derived: null,
      featSpellChoices,
      featList: activeFeatSpellFeats,
    }).concat(buildTypedFeatureSpellChoices({
      selectedChoices: featureSpellChoices,
      definitions: featureSpellDefinitions,
    })),
    [
      activeFeatSpellFeats,
      featureSpellChoices,
      featureSpellDefinitions,
      featureSpellOptions,
      featSpellChoices,
      featSpellOptions,
      firstClassId,
      firstClassSubclassIds,
      spellChoices,
      spellOptions,
      speciesSpellOptions,
    ]
  )
  const typedSkillProficiencies = useMemo<CharacterSkillProficiency[]>(
    () => buildCreationSkillProficiencies({
      speciesSkillChoices,
      backgroundSkillChoices,
      classSkillChoices,
      subclassSkillChoices,
      background: selectedBackground,
      selectedClass,
      selectedSubclass,
      species: selectedSpecies,
    }).flatMap((row) => typeof row === 'string' ? [] : [{
      character_id: 'local',
      skill: row.skill,
      expertise: row.expertise ?? false,
      character_level_id: row.character_level_id ?? null,
      source_category: row.source_category ?? 'manual',
      source_entity_id: row.source_entity_id ?? null,
      source_feature_key: row.source_feature_key ?? null,
    }]),
    [
      backgroundSkillChoices,
      classSkillChoices,
      selectedBackground,
      selectedClass,
      selectedSpecies,
      selectedSubclass,
      speciesSkillChoices,
      subclassSkillChoices,
    ]
  )

  const campaign = campaignContext?.campaign ?? campaigns.find((entry) => entry.id === campaignId) ?? null
  const creationHitDieRows = buildWizardHitDieRows(levels, classDetailMap)
  const creationHpMax = calculateCreationHpMax(creationHitDieRows, stats.con)
  const localContext = buildLocalCharacterContext({
    campaign,
    allowedSources: campaignContext?.allowedSources ?? [],
    allSourceRuleSets: campaignContext?.allSourceRuleSets ?? {},
    statMethod,
    persistedHpMax: creationHpMax,
    stats,
    statRolls: statRollRows,
    selectedSpecies,
    selectedBackground,
    levels,
    classDetailMap,
    subclassMap,
    spellOptions: [...spellOptions, ...speciesSpellOptions, ...featSpellOptions, ...featureSpellOptions],
    spellChoices,
    spellSelections: combinedSpellSelections,
    featList,
    featChoices,
    asiChoices,
    skillProficiencies,
    typedSkillProficiencies,
    abilityBonusChoices,
    languageChoices,
    toolChoices,
    featureOptionRows,
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
  const identityStepSummaryItems = useMemo(
    () => [
      campaign?.name ? `Campaign: ${campaign.name}` : null,
      name.trim() ? `Name: ${name.trim()}` : null,
      isDm ? `Type: ${characterType.toUpperCase()}` : null,
    ].filter((item): item is string => Boolean(item)),
    [campaign?.name, characterType, isDm, name]
  )
  const classStepSummaryItems = useMemo(
    () => selectedClass
      ? [
          `Class: ${selectedClass.name}`,
          `Level: 1`,
          `Hit die: d${selectedClass.hit_die}`,
          selectedClass.spellcasting_type && selectedClass.spellcasting_type !== 'none'
            ? `Spellcasting: ${selectedClass.spellcasting_type}`
            : 'Spellcasting: none',
        ]
      : [],
    [selectedClass]
  )
  const subclassStepSummaryItems = useMemo(() => {
    if (!selectedClass) return []
    if (!selectedSubclass) {
      return [`${selectedClass.name} subclass: not selected yet`]
    }
    return [`${selectedClass.name} subclass: ${selectedSubclass.name}`]
  }, [selectedClass, selectedSubclass])
  const skillsStepSummaryItems = useMemo(() => {
    const items: string[] = []

    if (classSkillChoices.length > 0) {
      items.push(`Class skills: ${classSkillChoices.join(', ')}`)
    }
    if (classToolChoices.length > 0) {
      items.push(`Class tools: ${classToolChoices.join(', ')}`)
    }
    if (subclassLanguageChoices.length > 0) {
      items.push(`Subclass languages: ${subclassLanguageChoices.join(', ')}`)
    }
    if (subclassSkillChoices.length > 0) {
      items.push(`Subclass expertise skills: ${subclassSkillChoices.join(', ')}`)
    }

    return items
  }, [classSkillChoices, classToolChoices, subclassLanguageChoices, subclassSkillChoices])
  const statsStepSummaryItems = useMemo(() => {
    const items = [
      `Method: ${statMethod.replace(/_/g, ' ')}`,
      ...ABILITY_KEYS.map((ability) => `${ability.toUpperCase()} ${stats[ability]}`),
    ]

    if (statMethod === 'rolled' && statRollRows.length > 0) {
      items.push(...statRollRows.map((row) => `${row.assigned_to.toUpperCase()}: ${row.roll_set.join(', ')} -> ${sumBestThree(row.roll_set)}`))
    }

    return items
  }, [statMethod, statRollRows, stats])
  const speciesFeatSlotIndex = useMemo(
    () => (derived?.featSlots ?? []).findIndex((slot) => slot.sourceFeatureKey?.startsWith('species_feat:')) ?? -1,
    [derived?.featSlots]
  )
  const speciesFeatChoice = speciesFeatSlotIndex >= 0 ? featChoices[speciesFeatSlotIndex] ?? '' : ''
  const speciesStepSummaryItems = useMemo(() => {
    if (!selectedSpecies) return []

    const items = [`Species: ${selectedSpecies.name}`]
    if (abilityBonusChoices.length > 0) {
      items.push(`Flexible bonuses: ${abilityBonusChoices.map(getAbilityChoiceLabel).join(', ')}`)
    }
    if (speciesSkillChoices.length > 0) {
      items.push(`Species skills: ${speciesSkillChoices.join(', ')}`)
    }
    if (speciesLanguageChoices.length > 0) {
      items.push(`Species languages: ${speciesLanguageChoices.join(', ')}`)
    }
    if (speciesToolChoices.length > 0) {
      items.push(`Species tools: ${speciesToolChoices.join(', ')}`)
    }
    if (speciesOptionDefinitions.length > 0) {
      for (const definition of speciesOptionDefinitions) {
        const selectedValue = getFeatureOptionChoiceValue(
          featureOptionChoices,
          definition.optionGroupKey,
          definition.optionKey,
          definition.valueKey ?? 'class_id'
        )
        const choiceLabel = definition.choices.find((choice) => choice.value === selectedValue)?.label
        if (choiceLabel) {
          items.push(`${definition.label}: ${choiceLabel}`)
        }
      }
    }
    if (speciesFeatChoice) {
      const featName = featList.find((feat) => feat.id === speciesFeatChoice)?.name
      if (featName) {
        items.push(`Species feat: ${featName}`)
      }
    }
    return items
  }, [
    abilityBonusChoices,
    featList,
    featureOptionChoices,
    selectedSpecies,
    speciesFeatChoice,
    speciesLanguageChoices,
    speciesOptionDefinitions,
    speciesSkillChoices,
    speciesToolChoices,
  ])
  const persistedSpellSelections = buildCombinedSpellSelections({
    classSpellChoices: spellChoices,
    spellOptions: [...spellOptions, ...speciesSpellOptions, ...featSpellOptions, ...featureSpellOptions],
    owningClassId: firstClassId || null,
    activeSubclassIds: firstClassSubclassIds,
    derived,
    featSpellChoices,
    featList: activeFeatSpellFeats,
  }).concat(buildTypedFeatureSpellChoices({
    selectedChoices: featureSpellChoices,
    definitions: featureSpellDefinitions,
  }))
  const wizardLegalitySummary = summarizeWizardLegality(legalityResult)
  const derivedBlockingIssues = legalityResult?.derived?.blockingIssues ?? []
  const derivedWarnings = legalityResult?.derived?.warnings ?? []
  const reviewIssueGroups = useMemo<ReviewIssueGroup[]>(() => {
    if (!legalityResult) return []

    const grouped = new Map<Exclude<StepId, 'review'>, LegalityResult['checks']>()
    for (const check of legalityResult.checks.filter((entry) => !entry.passed)) {
      const stepId = getReviewStepForCheckKey(check.key)
      const existing = grouped.get(stepId) ?? []
      existing.push(check)
      grouped.set(stepId, existing)
    }

    return (Object.keys(REVIEW_STEP_LABELS) as Array<Exclude<StepId, 'review'>>)
      .flatMap((stepId) => {
        const issues = grouped.get(stepId) ?? []
        if (issues.length === 0) return []
        return [{
          stepId,
          stepLabel: REVIEW_STEP_LABELS[stepId],
          issues,
        }]
      })
  }, [legalityResult])
  const activeSpellcastingSource = useMemo(
    () => derived?.spellcasting.sources.find((source) => source.classId === firstClassId) ?? null,
    [derived?.spellcasting.sources, firstClassId]
  )
  const cappedSpellChoices = useMemo(
    () => spellChoices
      .map((spellId) => spellOptions.find((option) => option.id === spellId))
      .filter((spell): spell is SpellOption => spell !== undefined)
      .filter((spell) => spell.counts_against_selection_limit !== false),
    [spellChoices, spellOptions]
  )
  const cappedCantripChoiceCount = cappedSpellChoices.filter((spell) => spell.level === 0).length
  const cappedLeveledChoiceCount = cappedSpellChoices.filter((spell) => spell.level > 0).length
  const spellsStepComplete = useMemo(() => {
    if (!activeSpellcastingSource) return true

    const requiredCantrips = activeSpellcastingSource.cantripSelectionCap ?? 0
    const requiredLeveled = activeSpellcastingSource.leveledSpellSelectionCap ?? 0

    return cappedCantripChoiceCount >= requiredCantrips && cappedLeveledChoiceCount >= requiredLeveled
  }, [activeSpellcastingSource, cappedCantripChoiceCount, cappedLeveledChoiceCount])
  const resolvedStartingEquipment = useMemo(
    () => resolveStartingEquipment(
      activeStartingEquipmentPackages,
      startingEquipmentSelections,
      equipmentItems,
      weaponCatalog
    ),
    [activeStartingEquipmentPackages, startingEquipmentSelections, equipmentItems, weaponCatalog]
  )
  const reviewSummaryItems = useMemo(() => {
    if (!derived) return []

    return [
      `Proficiency bonus: +${derived.proficiencyBonus}`,
      `Armor Class: ${derived.armorClass.value} (${derived.armorClass.formula})`,
      `Initiative: ${derived.initiative >= 0 ? '+' : ''}${derived.initiative}`,
      `Passive Perception: ${derived.passivePerception}`,
      derived.languages.length > 0 ? `Languages: ${derived.languages.join(', ')}` : 'Languages: none selected',
      derived.proficiencies.tools.length > 0 ? `Tools: ${derived.proficiencies.tools.join(', ')}` : 'Tools: none selected',
    ]
  }, [derived])

  useEffect(() => {
    if (!resumeCharacterId || !draftHydrated || equipmentSelectionsHydrated) return
    if (activeStartingEquipmentPackages.length === 0) return
    if (equipmentItems.length === 0) return

    setStartingEquipmentSelections(restoreStartingEquipmentSelections({
      packages: activeStartingEquipmentPackages,
      savedItems: draftEquipmentItems,
      equipmentItems,
      weapons: weaponCatalog,
    }))
    setEquipmentSelectionsHydrated(true)
  }, [
    activeStartingEquipmentPackages,
    draftEquipmentItems,
    draftHydrated,
    equipmentItems,
    equipmentSelectionsHydrated,
    resumeCharacterId,
    weaponCatalog,
  ])
  const stepCompletion = useMemo<Record<StepId, boolean>>(() => ({
    identity: Boolean(campaignId && name.trim()),
    species: Boolean(
      speciesId
      && abilityBonusChoices.length >= getSpeciesAbilityChoiceLimit(selectedSpecies)
      && speciesSkillChoices.length >= (speciesSkillConfig?.count ?? 0)
      && speciesLanguageChoices.length >= (speciesLanguageConfig?.count ?? 0)
      && speciesToolChoices.length >= (speciesToolConfig?.count ?? 0)
      && speciesOptionDefinitions.every((definition) => Boolean(getFeatureOptionChoiceValue(
        featureOptionChoices,
        definition.optionGroupKey,
        definition.optionKey,
        definition.valueKey ?? 'class_id'
      )))
      && (speciesFeatSlotIndex < 0 || Boolean(speciesFeatChoice))
    ),
    background: Boolean(
      backgroundId
      && backgroundSkillChoices.length >= (selectedBackground?.skill_choice_count ?? 0)
      && backgroundLanguageChoices.length >= (backgroundLanguageConfig?.count ?? 0)
    ),
    classes: Boolean(
      levels.length === 1
      && levels[0]?.level === 1
      && Boolean(levels[0]?.class_id)
      && Boolean(levels[0]?.class_id && classDetailMap[levels[0].class_id])
      && !(derived && localContext && derived.totalLevel > localContext.campaignSettings.max_level)
      && fightingStyleDefinitions.every((definition) => Boolean(getFeatureOptionChoiceValue(
        featureOptionChoices,
        definition.optionGroupKey,
        definition.optionKey,
        definition.valueKey ?? 'class_id'
      )))
    ),
    subclasses: Boolean(
      !(derived?.subclassRequirements.some((entry) => entry.missingRequiredSubclass) ?? false)
      && (
        !selectedSubclass
        || !isMaverickSubclass(selectedSubclass)
        || maverickBreakthroughClassIds.filter(Boolean).length >= maverickOptionDefinitions.length
      )
    ),
    stats: (() => {
      if (statMethod === 'point_buy') {
        return totalPointBuySpend(stats) === 27 && ABILITY_KEYS.every((ability) => stats[ability] >= 8 && stats[ability] <= 15)
      }
      if (statMethod === 'standard_array') {
        return isStandardArrayAssignment(stats)
      }
      return rolledStatsComplete
    })(),
    skills: Boolean(
      classSkillChoices.length >= (selectedClass?.skill_choices?.count ?? 0)
      && classToolChoices.length >= (classToolConfig?.count ?? 0)
      && subclassLanguageChoices.length >= (subclassLanguageConfig?.count ?? 0)
      && subclassSkillChoices.length >= (subclassSkillConfig?.count ?? 0)
    ),
    equipment: resolvedStartingEquipment.issues.length === 0,
    'spells-feats': Boolean(
      spellsStepComplete
      &&
      (derived?.featSlots ?? []).every((slot, index) => (
        slot.choiceKind === 'feat_only'
          ? Boolean(featChoices[index])
          : Boolean(featChoices[index]) || (asiChoices[index]?.length ?? 0) === 2
      ))
      && featureSpellDefinitions.every((definition) => Boolean(featureSpellChoices[definition.sourceFeatureKey]))
    ),
    review: Boolean(legalityResult),
  }), [
    abilityBonusChoices.length,
    asiChoices,
    backgroundId,
    backgroundLanguageConfig?.count,
    backgroundLanguageChoices.length,
    backgroundSkillChoices.length,
    campaignId,
    classDetailMap,
    classSkillChoices.length,
    classToolChoices.length,
    classToolConfig?.count,
    derived,
    featChoices,
    featureOptionChoices,
    featureSpellChoices,
    featureSpellDefinitions,
    fightingStyleDefinitions,
    legalityResult,
    levels,
    localContext,
    maverickBreakthroughClassIds,
    maverickOptionDefinitions.length,
    name,
    rolledStatsComplete,
    selectedBackground,
    resolvedStartingEquipment.issues.length,
    selectedClass?.skill_choices?.count,
    spellsStepComplete,
    speciesFeatChoice,
    speciesFeatSlotIndex,
    speciesLanguageChoices.length,
    speciesLanguageConfig?.count,
    speciesSkillChoices.length,
    speciesSkillConfig?.count,
    selectedSpecies,
    selectedSubclass,
    statMethod,
    stats,
    subclassLanguageChoices.length,
    subclassLanguageConfig?.count,
    subclassSkillChoices.length,
    subclassSkillConfig?.count,
    speciesId,
    speciesOptionDefinitions,
    speciesToolChoices.length,
    speciesToolConfig?.count,
  ])
  const completedSteps = useMemo(
    () => getContiguouslyCompletedSteps(
      STEPS.map((step) => step.id),
      stepCompletion
    ),
    [stepCompletion]
  )

  useEffect(() => {
    if (!resumeCharacterId || !draftHydrated || draftStepInitialized) return

    const classIds = Array.from(new Set(levels.map((level) => level.class_id).filter(Boolean)))
    if (classIds.some((classId) => !classDetailMap[classId])) return

    const firstIncompleteIndex = STEPS.findIndex((step) => !stepCompletion[step.id])
    setStepIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : STEPS.length - 1)
    setDraftStepInitialized(true)
  }, [
    classDetailMap,
    completedSteps,
    draftHydrated,
    draftStepInitialized,
    levels,
    resumeCharacterId,
    stepCompletion,
  ])

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

  function setPrimaryClass(classId: string) {
    setLevels((prev) => [{
      class_id: classId,
      level: 1,
      subclass_id: prev[0]?.class_id === classId ? (prev[0]?.subclass_id ?? null) : null,
    }])
    setClassSkillChoices([])
    setClassToolChoices([])
    setSubclassSkillChoices([])
    setSubclassLanguageChoices([])
  }

  function rollAbilitySets() {
    const nextSets = createRolledStatSets()
    setRolledStatSets(nextSets)
    setRolledAssignments({})
  }

  function setRolledAssignment(ability: StatAbilityKey, rolledSetId: string) {
    setRolledAssignments((prev) => ({
      ...prev,
      [ability]: rolledSetId === 'unassigned' ? undefined : rolledSetId,
    }))
  }

  function updateLevel(index: number, field: 'class_id' | 'level' | 'subclass_id', value: string | number | null) {
    setLevels((prev) => prev.map((level, i) => (i === index ? { ...level, [field]: value } : level)))
  }

  function validateCurrentStep(): string | null {
    switch (currentStep.id) {
      case 'identity':
        if (!campaignId) return 'Select a campaign first.'
        if (!name.trim()) return 'Enter a character name.'
        return null
      case 'species':
        if (!speciesId) return 'Choose a species to continue.'
        if (abilityBonusChoices.length < (speciesAbilityChoiceOptions.length > 0 ? getSpeciesAbilityChoiceLimit(selectedSpecies) : 0)) {
          return 'Finish the flexible species ability bonus choices.'
        }
        if (speciesSkillChoices.length < (speciesSkillConfig?.count ?? 0)) {
          return `Choose ${speciesSkillConfig?.count ?? 0} species skill${(speciesSkillConfig?.count ?? 0) === 1 ? '' : 's'} to continue.`
        }
        if (speciesLanguageChoices.length < (speciesLanguageConfig?.count ?? 0)) {
          return `Choose ${speciesLanguageConfig?.count ?? 0} species language${(speciesLanguageConfig?.count ?? 0) === 1 ? '' : 's'} to continue.`
        }
        if (speciesToolChoices.length < (speciesToolConfig?.count ?? 0)) {
          return `Choose ${speciesToolConfig?.count ?? 0} species tool proficiency${(speciesToolConfig?.count ?? 0) === 1 ? '' : 'ies'} to continue.`
        }
        for (const definition of speciesOptionDefinitions) {
          const selectedValue = getFeatureOptionChoiceValue(
            featureOptionChoices,
            definition.optionGroupKey,
            definition.optionKey,
            definition.valueKey ?? 'class_id'
          )
          if (!selectedValue) {
            return `Choose ${definition.label.toLowerCase()} for ${selectedSpecies?.name ?? 'this species'}.`
          }
        }
        if (speciesFeatSlotIndex >= 0 && !speciesFeatChoice) {
          return 'Choose the feat granted by this species before continuing.'
        }
        return null
      case 'background':
        if (!backgroundId) return 'Choose a background to continue.'
        if (backgroundSkillChoices.length < (selectedBackground?.skill_choice_count ?? 0)) {
          return `Choose ${selectedBackground?.skill_choice_count ?? 0} background skill${(selectedBackground?.skill_choice_count ?? 0) === 1 ? '' : 's'} to continue.`
        }
        if (backgroundLanguageChoices.length < (backgroundLanguageConfig?.count ?? 0)) {
          return `Choose ${backgroundLanguageConfig?.count ?? 0} background language${(backgroundLanguageConfig?.count ?? 0) === 1 ? '' : 's'} to continue.`
        }
        return null
      case 'classes':
        if (levels.length === 0 || !levels[0]?.class_id) return 'Choose a class to continue.'
        if (levels.length !== 1) return 'Creation is single-class for now. Multiclassing arrives in the level-up flow.'
        if (levels[0].level !== 1) return 'Creation currently starts at level 1 only.'
        if (!classDetailMap[levels[0].class_id]) return 'Class details are still loading. Try again in a moment.'
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
        if (statMethod === 'point_buy') {
          const spent = totalPointBuySpend(stats)
          if (spent !== 27) {
            return `Point buy must spend exactly 27 points. Current total: ${spent}.`
          }
          if (ABILITY_KEYS.some((ability) => stats[ability] < 8 || stats[ability] > 15)) {
            return 'Point buy scores must stay between 8 and 15.'
          }
        }
        if (statMethod === 'standard_array' && !isStandardArrayAssignment(stats)) {
          return 'Standard array must assign 15, 14, 13, 12, 10, and 8 exactly once each.'
        }
        if (statMethod === 'rolled' && !rolledStatsComplete) {
          return 'Assign each rolled result to an ability before continuing.'
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
      case 'skills':
        if (classSkillChoices.length < (selectedClass?.skill_choices?.count ?? 0)) {
          return `Choose ${selectedClass?.skill_choices?.count ?? 0} class skill${(selectedClass?.skill_choices?.count ?? 0) === 1 ? '' : 's'} to continue.`
        }
        if (classToolChoices.length < (classToolConfig?.count ?? 0)) {
          return `Choose ${classToolConfig?.count ?? 0} class tool proficiency${(classToolConfig?.count ?? 0) === 1 ? '' : 'ies'} to continue.`
        }
        if (subclassLanguageChoices.length < (subclassLanguageConfig?.count ?? 0)) {
          return `Choose ${subclassLanguageConfig?.count ?? 0} subclass language${(subclassLanguageConfig?.count ?? 0) === 1 ? '' : 's'} to continue.`
        }
        if (subclassSkillChoices.length < (subclassSkillConfig?.count ?? 0)) {
          return `Choose ${subclassSkillConfig?.count ?? 0} subclass skill${(subclassSkillConfig?.count ?? 0) === 1 ? '' : 's'} to continue.`
        }
        return null
      case 'equipment':
        return resolvedStartingEquipment.issues[0] ?? null
      case 'spells-feats': {
        if (activeSpellcastingSource) {
          const requiredCantrips = activeSpellcastingSource.cantripSelectionCap ?? 0
          const requiredLeveled = activeSpellcastingSource.leveledSpellSelectionCap ?? 0

          if (cappedCantripChoiceCount < requiredCantrips) {
            return `Choose ${requiredCantrips} cantrip${requiredCantrips === 1 ? '' : 's'} for ${activeSpellcastingSource.className}.`
          }

          if (cappedLeveledChoiceCount < requiredLeveled) {
            if (activeSpellcastingSource.mode === 'spellbook') {
              return `Choose ${requiredLeveled} leveled spells for ${activeSpellcastingSource.className}'s starting spellbook.`
            }
            if (activeSpellcastingSource.mode === 'prepared') {
              return `Choose ${requiredLeveled} prepared spell${requiredLeveled === 1 ? '' : 's'} for ${activeSpellcastingSource.className}.`
            }
            return `Choose ${requiredLeveled} leveled spell${requiredLeveled === 1 ? '' : 's'} for ${activeSpellcastingSource.className}.`
          }
        }

        const requiredSlots = derived?.featSlots ?? []
        const incompleteSlot = requiredSlots.find((slot, index) => (
          slot.choiceKind === 'feat_only'
            ? !featChoices[index]
            : !featChoices[index] && (asiChoices[index]?.length ?? 0) !== 2
        ))
        if (incompleteSlot) {
          return incompleteSlot.choiceKind === 'feat_only'
            ? `Choose a feat for ${incompleteSlot.label}.`
            : `Choose a feat or finish both ASI picks for slot ${requiredSlots.indexOf(incompleteSlot) + 1}.`
        }
        const missingFeatureSpell = featureSpellDefinitions.find(
          (definition) => !featureSpellChoices[definition.sourceFeatureKey]
        )
        if (missingFeatureSpell) {
          return `Choose a spell for ${missingFeatureSpell.label}.`
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
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('characterId', json.id)
    router.replace(`/characters/new?${nextParams.toString()}`)
    return json.id
  }

  async function persistDraft(targetCharacterId: string) {
    const saveIdentity = hasCompletedStep(completedSteps, 'identity')
    const saveSpecies = hasCompletedStep(completedSteps, 'species')
    const saveBackground = hasCompletedStep(completedSteps, 'background')
    const saveClasses = hasCompletedStep(completedSteps, 'classes')
    const saveSubclasses = hasCompletedStep(completedSteps, 'subclasses')
    const saveStats = hasCompletedStep(completedSteps, 'stats')
    const saveSkills = hasCompletedStep(completedSteps, 'skills')
    const saveOwnedChoices = saveSpecies || saveBackground || saveSkills
    const saveEquipment = hasCompletedStep(completedSteps, 'equipment')
    const saveSpellsAndFeats = hasCompletedStep(completedSteps, 'spells-feats')
    const saveFeatChoices = saveSpecies || saveSpellsAndFeats
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
        name: saveIdentity ? name : '',
        stat_method: saveStats ? statMethod : 'point_buy',
        species_id: saveSpecies ? (speciesId || null) : null,
        background_id: saveBackground ? (backgroundId || null) : null,
        hp_max: saveClasses ? creationHpMax : 0,
        levels: saveClasses
          ? levelsWithHp.map((level) => ({
              ...level,
              subclass_id: saveSubclasses ? level.subclass_id : null,
            }))
          : [],
        base_str: saveStats ? stats.str : 8,
        base_dex: saveStats ? stats.dex : 8,
        base_con: saveStats ? stats.con : 8,
        base_int: saveStats ? stats.int : 8,
        base_wis: saveStats ? stats.wis : 8,
        base_cha: saveStats ? stats.cha : 8,
        stat_rolls: saveStats && statMethod === 'rolled' ? statRollRows : [],
        skill_proficiencies: saveOwnedChoices ? buildCreationSkillProficiencies({
          speciesSkillChoices,
          backgroundSkillChoices,
          classSkillChoices: saveSkills ? classSkillChoices : [],
          subclassSkillChoices: saveSkills ? subclassSkillChoices : [],
          background: selectedBackground,
          selectedClass,
          selectedSubclass: saveSubclasses ? selectedSubclass : null,
          species: selectedSpecies,
        }) : [],
        ability_bonus_choices: saveSpecies ? buildTypedAbilityBonusChoices(
          selectedSpecies,
          abilityBonusChoices
        ) : [],
        asi_choices: saveSpellsAndFeats ? buildTypedAsiChoices(
          asiChoices,
          derived?.featSlots,
          featChoices
        ) : [],
        language_choices: saveOwnedChoices ? buildCreationLanguageChoices({
          speciesLanguageChoices,
          backgroundLanguageChoices,
          subclassLanguageChoices: saveSkills ? subclassLanguageChoices : [],
          background: selectedBackground,
          selectedSubclass: saveSubclasses ? selectedSubclass : null,
          species: selectedSpecies,
          availableLanguageNames,
        }) : [],
        tool_choices: saveOwnedChoices ? buildCreationToolChoices({
          speciesToolChoices,
          classToolChoices: saveSkills ? classToolChoices : [],
          selectedClass,
          species: selectedSpecies,
          availableToolNames,
        }) : [],
        feature_option_choices: [
          ...(saveSpecies ? buildFeatureOptionChoicesFromDefinitionMap({
            definitions: speciesOptionDefinitions,
            selectedValues: Object.fromEntries(
              speciesOptionDefinitions.map((definition) => [
                definition.optionKey,
                getFeatureOptionChoiceValue(
                  featureOptionChoices,
                  definition.optionGroupKey,
                  definition.optionKey,
                  definition.valueKey ?? 'class_id'
                ) ?? '',
              ])
            ),
          }) : []),
          ...(saveClasses ? buildFeatureOptionChoicesFromDefinitionMap({
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
          }) : []),
          ...(saveSubclasses ? buildMaverickFeatureOptionChoices({
            selectedClassIds: maverickBreakthroughClassIds,
            definitions: maverickOptionDefinitions,
          }) : []),
        ],
        equipment_items: saveEquipment ? resolvedStartingEquipment.items : [],
        spell_choices: saveSpellsAndFeats ? persistedSpellSelections : [],
        feat_choices: saveFeatChoices ? buildTypedFeatChoices(featChoices, derived?.featSlots) : [],
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

  function goToStep(stepId: Exclude<StepId, 'review'>) {
    const nextIndex = STEPS.findIndex((step) => step.id === stepId)
    if (nextIndex >= 0) {
      setStepIndex(nextIndex)
    }
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

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-10">
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
              <WizardStepFrame
                title="Character identity"
                description="Choose the campaign context first, then set the basic identity fields the rest of the builder will inherit."
                summaryTitle="Change summary"
                summaryItems={identityStepSummaryItems}
              >
                <GuidedChooseOne
                  title="Campaign"
                  description="This drives allowlisted content, ruleset validation, and campaign defaults."
                  options={campaignChoiceOptions}
                  selectedId={campaignId || null}
                  onChange={(value) => setCampaignId(value ?? '')}
                  emptyMessage="No campaigns are available to this user."
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Character Name</Label>
                    <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mira Stormborn" />
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
              </WizardStepFrame>
            )}

            {currentStep.id === 'species' && (
              <WizardStepFrame
                title="Choose a species"
                description="Species-owned choices live here now: flexible ability bonuses, flexible languages/tools, ancestry-style options, and any species-granted feat slot."
                summaryTitle="Change summary"
                summaryItems={speciesStepSummaryItems}
              >
                <GuidedChooseOne
                  title="Species"
                  description="Choose one species for the character."
                  options={speciesChoiceOptions}
                  selectedId={speciesId || null}
                  onChange={(value) => setSpeciesId(value ?? '')}
                  emptyMessage="No species are available for this campaign allowlist."
                />

                <GuidedChooseMany
                  title="Flexible Ability Bonuses"
                  description={`Choose ${getSpeciesAbilityChoiceLimit(selectedSpecies)} flexible ability bonus${getSpeciesAbilityChoiceLimit(selectedSpecies) === 1 ? '' : 'es'} granted by this species.`}
                  options={speciesAbilityChoiceOptions}
                  selectedIds={abilityBonusChoices}
                  onChange={(ids) => setAbilityBonusChoices(ids as SpeciesChoiceAbilityKey[])}
                  selectionLimit={getSpeciesAbilityChoiceLimit(selectedSpecies)}
                  emptyMessage="This species has no flexible ability bonus choices."
                />

                <GuidedChooseMany
                  title="Species Skills"
                  description={`Choose ${speciesSkillConfig?.count ?? 0} skill${(speciesSkillConfig?.count ?? 0) === 1 ? '' : 's'} from this species trait.`}
                  options={speciesSkillOptions}
                  selectedIds={speciesSkillChoices}
                  onChange={setSpeciesSkillChoices}
                  selectionLimit={speciesSkillConfig?.count ?? 0}
                  emptyMessage="This species has no guided skill choices."
                />

                <GuidedChooseMany
                  title="Species Languages"
                  description={`Choose ${speciesLanguageConfig?.count ?? 0} additional language${(speciesLanguageConfig?.count ?? 0) === 1 ? '' : 's'} granted by this species.`}
                  options={speciesLanguageOptions}
                  selectedIds={speciesLanguageChoices}
                  onChange={setSpeciesLanguageChoices}
                  selectionLimit={speciesLanguageConfig?.count ?? 0}
                  emptyMessage="This species has no flexible language choices."
                />

                <GuidedChooseMany
                  title="Species Tools"
                  description={`Choose ${speciesToolConfig?.count ?? 0} tool proficienc${(speciesToolConfig?.count ?? 0) === 1 ? 'y' : 'ies'} granted by this species.`}
                  options={speciesToolOptions}
                  selectedIds={speciesToolChoices}
                  onChange={setSpeciesToolChoices}
                  selectionLimit={speciesToolConfig?.count ?? 0}
                  emptyMessage="This species has no flexible tool choices."
                />

                <FeatureOptionChoicesCard
                  title="Species Options"
                  definitions={speciesOptionDefinitions}
                  choices={featureOptionChoices}
                  canEdit
                  onChange={setFeatureOptionChoices}
                />

                {speciesFeatSlotIndex >= 0 && (
                  <GuidedChooseOne
                    title="Species Feat"
                    description="Choose the feat granted by this species."
                    options={featList.map((feat) => ({
                      id: feat.id,
                      label: feat.name,
                      description: feat.description || undefined,
                    }))}
                    selectedId={speciesFeatChoice || null}
                    onChange={(value) => {
                      setFeatChoices((prev) => {
                        const next = [...prev]
                        next[speciesFeatSlotIndex] = value ?? ''
                        while (next.length > 0 && !next[next.length - 1]) next.pop()
                        return next
                      })
                    }}
                    emptyMessage="No feats are currently available."
                  />
                )}
              </WizardStepFrame>
            )}

            {currentStep.id === 'background' && (
              <WizardStepFrame
                title="Choose a background"
                description="Background-owned skills, languages, and fixed feat grants are now handled here so the whole background package persists together."
                summaryTitle="Change summary"
                summaryItems={backgroundStepSummaryItems}
              >
                <GuidedChooseOne
                  title="Background"
                  description="Choose one background for this character."
                  options={backgroundChoiceOptions}
                  selectedId={backgroundId || null}
                  onChange={(value) => setBackgroundId(value ?? '')}
                  emptyMessage="No backgrounds are available for this campaign allowlist."
                />

                <GuidedChooseMany
                  title="Background Skills"
                  description={`Choose ${selectedBackground?.skill_choice_count ?? 0} skill${(selectedBackground?.skill_choice_count ?? 0) === 1 ? '' : 's'} granted by this background.`}
                  options={backgroundSkillOptions}
                  selectedIds={backgroundSkillChoices}
                  onChange={setBackgroundSkillChoices}
                  selectionLimit={selectedBackground?.skill_choice_count ?? 0}
                  emptyMessage="This background has no flexible skill choices."
                />

                <GuidedChooseMany
                  title="Background Languages"
                  description={`Choose ${backgroundLanguageConfig?.count ?? 0} language${(backgroundLanguageConfig?.count ?? 0) === 1 ? '' : 's'} granted by this background.`}
                  options={backgroundLanguageOptions}
                  selectedIds={backgroundLanguageChoices}
                  onChange={setBackgroundLanguageChoices}
                  selectionLimit={backgroundLanguageConfig?.count ?? 0}
                  emptyMessage="This background has no flexible language choices."
                />

                {backgroundFeat && (
                  <Alert className="border-blue-400/20 bg-blue-400/10">
                    <AlertDescription className="text-blue-50">
                      This background grants the feat <span className="font-medium">{backgroundFeat.name}</span>. It will flow into derived state automatically when the background is saved.
                    </AlertDescription>
                  </Alert>
                )}
              </WizardStepFrame>
            )}

            {currentStep.id === 'classes' && (
              <WizardStepFrame
                title="Choose a class"
                description="Creation is single-class and starts at level 1. Multiclassing will be handled later in the level-up flow."
                summaryTitle="Change summary"
                summaryItems={classStepSummaryItems}
              >
                <GuidedChooseOne
                  title="Class"
                  description="Choose the starting class for this character."
                  options={classChoiceOptions}
                  selectedId={levels[0]?.class_id ?? null}
                  onChange={(value) => {
                    if (value) setPrimaryClass(value)
                  }}
                  emptyMessage="No classes are available for this campaign allowlist."
                />

                {creationHitDieRows.length > 0 && (
                  <Alert className="border-white/10 bg-white/[0.03]">
                    <AlertDescription className="text-neutral-300">
                      Creation HP preview: {derived?.hitPoints.max ?? creationHpMax}. The wizard starts every new character at level 1 with the class’s full hit die, and later levels are handled in level-up.
                    </AlertDescription>
                  </Alert>
                )}

                <FeatureOptionChoicesCard
                  title="Fighting Styles"
                  definitions={fightingStyleDefinitions}
                  choices={featureOptionChoices}
                  canEdit
                  onChange={setFeatureOptionChoices}
                />
              </WizardStepFrame>
            )}

            {currentStep.id === 'subclasses' && (
              <WizardStepFrame
                title="Choose a subclass"
                description="This step handles level-gated class identities like Cleric domains, Sorcerous Origins, and Warlock patrons once the class unlocks them."
                summaryTitle="Change summary"
                summaryItems={subclassStepSummaryItems}
              >
                {levels.map((level, index) => {
                  const detail = classDetailMap[level.class_id]
                  const className = classList.find((cls) => cls.id === level.class_id)?.name ?? 'Class'
                  const needsSubclass = detail ? level.level >= detail.subclass_choice_level : false

                  if (!needsSubclass) {
                    return (
                      <Alert key={`${level.class_id}-${index}`} className="border-white/10 bg-white/[0.03]">
                        <AlertDescription className="text-neutral-400">
                          {className} unlocks a subclass at level {detail?.subclass_choice_level ?? 3}.
                        </AlertDescription>
                      </Alert>
                    )
                  }

                  return (
                    <GuidedChooseOne
                      key={`${level.class_id}-${index}`}
                      title={`${className} Subclass`}
                      description={`Choose the subclass path for ${className}.`}
                      options={subclassChoiceOptions}
                      selectedId={level.subclass_id ?? null}
                      onChange={(value) => updateLevel(index, 'subclass_id', value ?? null)}
                      emptyMessage="No subclasses are available for this class in the current allowlist."
                    />
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
                <FeatureOptionChoicesCard
                  title="Subclass Options"
                  definitions={subclassFeatureOptionDefinitions}
                  choices={featureOptionChoices}
                  canEdit
                  onChange={setFeatureOptionChoices}
                />
              </WizardStepFrame>
            )}

            {currentStep.id === 'stats' && (
              <WizardStepFrame
                title="Generate ability scores"
                description="Choose a generation method here. Point buy, standard array, and rolled scores all persist through the normal draft save path now."
                summaryTitle="Change summary"
                summaryItems={statsStepSummaryItems}
              >
                <GuidedChooseOne
                  title="Ability Score Method"
                  description="Pick the method this character is using for base ability scores."
                  options={[
                    { id: 'point_buy', label: 'Point Buy', description: 'Spend exactly 27 points across scores from 8 to 15.' },
                    { id: 'standard_array', label: 'Standard Array', description: 'Assign 15, 14, 13, 12, 10, and 8 exactly once each.' },
                    { id: 'rolled', label: 'Rolled', description: 'Roll six sets of 4d6 and drop the lowest die in each set.' },
                  ]}
                  selectedId={statMethod}
                  onChange={(value) => setStatMethod((value ?? 'point_buy') as StatMethod)}
                />

                {statMethod === 'rolled' && (
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-100">Rolled sets</p>
                        <p className="text-sm text-neutral-400">
                          Roll six sets, then assign each result to one ability.
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={rollAbilitySets}>
                        {rolledStatSets.length > 0 ? 'Reroll all six sets' : 'Roll six sets'}
                      </Button>
                    </div>

                    {rolledStatSets.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {ABILITY_KEYS.map((ability) => {
                          const selectedSetId = rolledAssignments[ability] ?? 'unassigned'
                          return (
                            <div key={ability} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                              <Label className="text-neutral-300">{ability.toUpperCase()}</Label>
                              <Select value={selectedSetId} onValueChange={(value) => setRolledAssignment(ability, value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Assign rolled set" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned" className="text-neutral-500">Unassigned</SelectItem>
                                  {rolledStatSets.map((rolledSet) => {
                                    const alreadyUsed = Object.entries(rolledAssignments).some(([assignedAbility, assignedSetId]) => (
                                      assignedAbility !== ability && assignedSetId === rolledSet.id
                                    ))
                                    return (
                                      <SelectItem
                                        key={rolledSet.id}
                                        value={rolledSet.id}
                                        disabled={alreadyUsed}
                                        className={alreadyUsed ? 'text-neutral-500' : 'text-neutral-200'}
                                      >
                                        {`${sumBestThree(rolledSet.rolls)} (${rolledSet.rolls.join(', ')})`}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <Alert className="border-white/10 bg-white/[0.02]">
                        <AlertDescription className="text-neutral-400">
                          No rolled sets yet. Generate six sets to start assigning them.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

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
              </WizardStepFrame>
            )}

            {currentStep.id === 'skills' && (
              <WizardStepFrame
                title="Class training and level-1 picks"
                description="Handle the class-owned proficiencies and subclass-granted language or expertise picks here. These choices now persist with provenance instead of hiding in the raw sheet."
                summaryTitle="Change summary"
                summaryItems={skillsStepSummaryItems}
              >
                <GuidedChooseMany
                  title="Class Skills"
                  description={`Choose ${selectedClass?.skill_choices?.count ?? 0} skill${(selectedClass?.skill_choices?.count ?? 0) === 1 ? '' : 's'} granted by ${selectedClass?.name ?? 'this class'}.`}
                  options={(selectedClass?.skill_choices?.from ?? []).map((skill) => ({
                    id: skill.toLowerCase(),
                    label: skill,
                  }))}
                  selectedIds={classSkillChoices}
                  onChange={setClassSkillChoices}
                  selectionLimit={selectedClass?.skill_choices?.count ?? 0}
                  emptyMessage="This class has no flexible skill choices."
                />

                <GuidedChooseMany
                  title="Class Tools"
                  description={`Choose ${classToolConfig?.count ?? 0} tool proficiency${(classToolConfig?.count ?? 0) === 1 ? '' : 'ies'} granted by ${selectedClass?.name ?? 'this class'}.`}
                  options={classToolOptions}
                  selectedIds={classToolChoices}
                  onChange={setClassToolChoices}
                  selectionLimit={classToolConfig?.count ?? 0}
                  emptyMessage="This class has no flexible tool choices at level 1."
                />

                <GuidedChooseMany
                  title="Subclass Languages"
                  description={`Choose ${subclassLanguageConfig?.count ?? 0} language${(subclassLanguageConfig?.count ?? 0) === 1 ? '' : 's'} granted by ${selectedSubclass?.name ?? 'this subclass'}.`}
                  options={subclassLanguageOptions}
                  selectedIds={subclassLanguageChoices}
                  onChange={setSubclassLanguageChoices}
                  selectionLimit={subclassLanguageConfig?.count ?? 0}
                  emptyMessage="This subclass has no language choices at level 1."
                />

                <GuidedChooseMany
                  title="Subclass Skill Expertise"
                  description={`Choose ${subclassSkillConfig?.count ?? 0} skill${(subclassSkillConfig?.count ?? 0) === 1 ? '' : 's'} that gain expertise from ${selectedSubclass?.name ?? 'this subclass'}.`}
                  options={subclassSkillOptions}
                  selectedIds={subclassSkillChoices}
                  onChange={setSubclassSkillChoices}
                  selectionLimit={subclassSkillConfig?.count ?? 0}
                  emptyMessage="This subclass has no extra skill picks at level 1."
                />

                <SkillsCard
                  stats={stats}
                  totalLevel={derived?.totalLevel ?? 0}
                  selectedClass={selectedClass}
                  species={selectedSpecies}
                  background={selectedBackground}
                  derived={derived ? { savingThrows: derived.savingThrows, skills: derived.skills } : undefined}
                  skillProficiencies={skillProficiencies}
                  canEdit={false}
                  onChange={() => {}}
                />
                <LanguagesToolsCard
                  species={selectedSpecies}
                  background={selectedBackground}
                  availableLanguages={languageList}
                  availableTools={toolList}
                  languageChoices={languageChoices}
                  toolChoices={toolChoices}
                  canEdit={false}
                  onLanguageChange={() => {}}
                  onToolChange={() => {}}
                />
              </WizardStepFrame>
            )}

            {currentStep.id === 'equipment' && (
              <StartingEquipmentCard
                packages={activeStartingEquipmentPackages}
                equipmentItems={equipmentItems}
                weapons={weaponCatalog}
                selections={startingEquipmentSelections}
                canEdit
                onChange={setStartingEquipmentSelections}
              />
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
                  featSlots={derived?.featSlots}
                  canEdit
                  onChange={setFeatChoices}
                  onAsiChange={setAsiChoices}
                />

                <FeatureSpellChoicesCard
                  title="Species Spell Choices"
                  definitions={featureSpellDefinitions}
                  campaignId={campaignId}
                  classList={classList}
                  selectedChoices={featureSpellChoices}
                  canEdit
                  onChange={setFeatureSpellChoices}
                  onOptionsLoaded={setFeatureSpellOptions}
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
              <WizardStepFrame
                title="Review the derived character"
                description="This final step reads the shared derived character state and groups any remaining legality issues by the step that owns them. You can leave and resume later without losing completed steps."
                summaryTitle="Derived Snapshot"
                summaryItems={reviewSummaryItems}
              >
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
                  <Alert className="border-white/10 bg-white/[0.03]">
                    <AlertDescription className="text-neutral-300">
                      Level {derived.totalLevel} build with {derived.totalAsiSlots} feat/ASI slots.
                      {` HP ${derived.hitPoints.max}.`}
                      {derived.spellSlots.length > 0 && ` Spell slots: ${derived.spellSlots.join(' / ')}.`}
                      {spellChoices.length > 0 && ` ${spellChoices.length} spells selected.`}
                      {featChoices.length > 0 && ` ${featChoices.length} feats selected.`}
                    </AlertDescription>
                  </Alert>
                )}

                {resolvedStartingEquipment.lines.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-medium text-neutral-100">Starting Equipment</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {resolvedStartingEquipment.lines.map((line, index) => (
                        <span
                          key={`${line.packageId}:${line.itemId}:${index}`}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300"
                        >
                          {line.quantity}x {line.itemName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {derived?.spellcasting.sources.length ? (
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
                ) : null}

                {legalityResult ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-100">Review your build</p>
                        <p className="mt-1 text-sm text-neutral-400">
                          Every issue below is grouped by the step that owns it, so you can jump straight back to the right place.
                        </p>
                      </div>
                      <LegalitySummaryBadge
                        passed={legalityResult.passed}
                        errorCount={derivedBlockingIssues.length}
                      />
                    </div>

                    {reviewIssueGroups.length > 0 && (
                      <div className="space-y-3">
                        {reviewIssueGroups.map((group) => (
                          <div key={group.stepId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-neutral-100">{group.stepLabel}</p>
                                <p className="mt-1 text-sm text-neutral-400">
                                  {group.issues.length} item{group.issues.length === 1 ? '' : 's'} to review.
                                </p>
                              </div>
                              <Button type="button" variant="outline" onClick={() => goToStep(group.stepId)}>
                                Edit {group.stepLabel}
                              </Button>
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
                      The draft can still be resumed later, but this review needs the shared legality result before the character is ready to open on the full sheet.
                    </AlertDescription>
                  </Alert>
                )}
              </WizardStepFrame>
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
