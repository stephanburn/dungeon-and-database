'use client'

import { useEffect, useState } from 'react'
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
  RuleSet,
  Species,
  Background,
  Spell,
  SpellSlotTable,
  ClassFeatureProgression,
  StatMethod,
  Subclass,
} from '@/lib/types/database'
import type { LegalityResult } from '@/lib/legality/engine'
import { StatBlock } from '@/components/character-sheet/StatBlock'
import { SkillsCard } from '@/components/character-sheet/SkillsCard'
import { SpellsCard } from '@/components/character-sheet/SpellsCard'
import { FeatsCard } from '@/components/character-sheet/FeatsCard'
import { LegalityBadge } from '@/components/character-sheet/LegalityBadge'
import {
  createBuildBackgroundSummary,
  deriveCharacterProgression,
  normalizeToolProficiencies,
  progressionRowToSummary,
  type BuildClassSummary,
  type CharacterBuildContext,
} from '@/lib/characters/build-context'

interface CharacterNewFormProps {
  isDm: boolean
}

interface ClassDetail extends Class {
  progression: ClassFeatureProgression[]
  spell_slots: SpellSlotTable[]
}

type SpellOption = Spell & {
  granted_by_subclasses?: string[]
  counts_against_selection_limit?: boolean
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
  const [subclassMap, setSubclassMap] = useState<Record<string, Subclass[]>>({})
  const [classDetailMap, setClassDetailMap] = useState<Record<string, ClassDetail>>({})
  const [spellOptions, setSpellOptions] = useState<SpellOption[]>([])

  const [speciesId, setSpeciesId] = useState('')
  const [backgroundId, setBackgroundId] = useState('')
  const [levels, setLevels] = useState<Array<{ class_id: string; level: number; subclass_id: string | null }>>([])
  const [stats, setStats] = useState({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })
  const [skillProficiencies, setSkillProficiencies] = useState<string[]>([])
  const [spellChoices, setSpellChoices] = useState<string[]>([])
  const [featChoices, setFeatChoices] = useState<string[]>([])

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
    ]).then(([species, backgrounds, classes, feats]) => {
      setSpeciesList(species)
      setBackgroundList(backgrounds)
      setClassList(classes)
      setFeatList(feats)
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
    for (const subclassId of firstClassSubclassIds) params.append('subclass_id', subclassId)

    fetch(`/api/content/spells?${params.toString()}`)
      .then((response) => response.json())
      .then((data: SpellOption[]) => setSpellOptions(Array.isArray(data) ? data : []))
  }, [campaignId, levels, classDetailMap])

  const currentStep = STEPS[stepIndex]
  const selectedSpecies = speciesList.find((species) => species.id === speciesId) ?? null
  const selectedBackground = backgroundList.find((background) => background.id === backgroundId) ?? null
  const firstClassId = levels[0]?.class_id ?? ''
  const firstClassLevel = levels[0]?.level ?? 0
  const firstClassSubclassIds = levels
    .filter((level) => level.class_id === firstClassId && level.subclass_id)
    .map((level) => level.subclass_id as string)
  const selectedClass = classList.find((cls) => cls.id === firstClassId) ?? null
  const backgroundFeat = selectedBackground?.background_feat_id
    ? featList.find((feat) => feat.id === selectedBackground.background_feat_id) ?? null
    : null

  const localContext = buildLocalContext({
    campaignId,
    campaigns,
    statMethod,
    stats,
    selectedSpecies,
    selectedBackground,
    levels,
    classDetailMap,
    subclassMap,
    spellOptions,
    spellChoices,
    featList,
    featChoices,
    skillProficiencies,
  })
  const derived = localContext ? deriveCharacterProgression(localContext) : null

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
        if (derived && localContext && derived.totalLevel > localContext.campaignSettings.max_level) {
          return `This build exceeds the campaign max level of ${localContext.campaignSettings.max_level}.`
        }
        return null
      case 'subclasses': {
        if (!derived) return null
        const missing = derived.subclassRequirements.find((entry) => entry.missingRequiredSubclass)
        return missing ? `${missing.className} needs a subclass before continuing.` : null
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
    const response = await fetch(`/api/characters/${targetCharacterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        stat_method: statMethod,
        species_id: speciesId || null,
        background_id: backgroundId || null,
        levels,
        base_str: stats.str,
        base_dex: stats.dex,
        base_con: stats.con,
        base_int: stats.int,
        base_wis: stats.wis,
        base_cha: stats.cha,
        skill_proficiencies: skillProficiencies,
        spell_choices: spellChoices,
        feat_choices: featChoices,
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

                <Button type="button" variant="outline" onClick={addClassLevelRow}>
                  Add Class
                </Button>
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
              </div>
            )}

            {currentStep.id === 'stats' && (
              <StatBlock
                values={stats}
                onChange={handleStatChange}
                readOnly={false}
                statMethod={statMethod}
                racialBonuses={selectedSpecies?.ability_score_bonuses.reduce<Record<string, number>>((acc, bonus) => {
                  acc[bonus.ability] = (acc[bonus.ability] ?? 0) + bonus.bonus
                  return acc
                }, {}) ?? {}}
              />
            )}

            {currentStep.id === 'skills' && (
              <SkillsCard
                stats={stats}
                totalLevel={derived?.totalLevel ?? 0}
                selectedClass={selectedClass}
                background={selectedBackground}
                skillProficiencies={skillProficiencies}
                canEdit
                onChange={setSkillProficiencies}
              />
            )}

            {currentStep.id === 'spells-feats' && (
              <div className="space-y-4">
                {selectedClass?.spellcasting_type && selectedClass.spellcasting_type !== 'none' && (
                  <SpellsCard
                    classId={firstClassId}
                    campaignId={campaignId}
                    subclassIds={firstClassSubclassIds}
                    classLevel={firstClassLevel}
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
                  totalLevel={derived?.totalLevel ?? 0}
                  featSlotLabels={derived?.featSlotLabels}
                  canEdit
                  onChange={setFeatChoices}
                />
              </div>
            )}

            {currentStep.id === 'review' && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
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
                      {derived.spellSlots.length > 0 && ` Spell slots: ${derived.spellSlots.join(' / ')}.`}
                    </AlertDescription>
                  </Alert>
                )}

                {legalityResult ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-200">Legality check</p>
                    {legalityResult.checks.map((check) => (
                      <LegalityBadge key={check.key} check={check} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">Continue once more to run a full legality check and open the sheet.</p>
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

function buildLocalContext({
  campaignId,
  campaigns,
  statMethod,
  stats,
  selectedSpecies,
    selectedBackground,
    levels,
    classDetailMap,
    subclassMap,
    spellOptions,
  spellChoices,
  featList,
  featChoices,
  skillProficiencies,
}: {
  campaignId: string
  campaigns: Campaign[]
  statMethod: StatMethod
  stats: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>
  selectedSpecies: Species | null
  selectedBackground: Background | null
  levels: Array<{ class_id: string; level: number; subclass_id: string | null }>
  classDetailMap: Record<string, ClassDetail>
  subclassMap: Record<string, Subclass[]>
  spellOptions: SpellOption[]
  spellChoices: string[]
  featList: Feat[]
  featChoices: string[]
  skillProficiencies: string[]
}): CharacterBuildContext | null {
  const campaign = campaigns.find((entry) => entry.id === campaignId)
  if (!campaign) return null

  const classes: BuildClassSummary[] = levels.flatMap((level) => {
    const detail = classDetailMap[level.class_id]
    if (!detail) return []
    const subclass = level.subclass_id
      ? (subclassMap[level.class_id] ?? []).find((entry) => entry.id === level.subclass_id) ?? null
      : null

    return [{
      classId: detail.id,
      name: detail.name,
      level: level.level,
      source: detail.source,
      spellcastingType: detail.spellcasting_type,
      spellcastingProgression: detail.spellcasting_progression,
      subclassChoiceLevel: detail.subclass_choice_level,
      multiclassPrereqs: detail.multiclass_prereqs,
      skillChoices: detail.skill_choices,
      savingThrowProficiencies: detail.saving_throw_proficiencies,
      armorProficiencies: detail.armor_proficiencies,
      weaponProficiencies: detail.weapon_proficiencies,
      toolProficiencies: normalizeToolProficiencies(detail.tool_proficiencies),
      subclass: subclass
        ? {
            id: subclass.id,
            name: subclass.name,
            source: subclass.source,
            choiceLevel: subclass.choice_level,
          }
        : null,
      progression: detail.progression
        .filter((row) => row.level <= level.level)
        .map((row) => progressionRowToSummary(row, [])),
      spellSlots: detail.spell_slots.find((row) => row.level === level.level)?.slots_by_spell_level ?? [],
    }]
  })

  const spellById = new Map(spellOptions.map((spell) => [spell.id, spell]))
  const featById = new Map(featList.map((feat) => [feat.id, feat]))
  const background = createBuildBackgroundSummary(selectedBackground)
  const backgroundFeat = selectedBackground?.background_feat_id
    ? featById.get(selectedBackground.background_feat_id) ?? null
    : null

  return {
    allowedSources: [],
    campaignSettings: campaign.settings,
    campaignRuleSet: campaign.rule_set as RuleSet,
    allSourceRuleSets: {},
    statMethod,
    baseStats: stats,
    statRolls: [],
    skillProficiencies,
    speciesSource: selectedSpecies?.source ?? null,
    speciesAbilityBonuses: selectedSpecies?.ability_score_bonuses.reduce<Record<string, number>>((acc, bonus) => {
      acc[bonus.ability] = (acc[bonus.ability] ?? 0) + bonus.bonus
      return acc
    }, {}) ?? {},
    background,
    backgroundFeat: backgroundFeat
      ? {
          id: backgroundFeat.id,
          name: backgroundFeat.name,
          source: backgroundFeat.source,
          prerequisites: backgroundFeat.prerequisites,
        }
      : null,
    classes,
    selectedSpells: spellChoices
      .map((spellId) => spellById.get(spellId))
      .filter((spell): spell is SpellOption => Boolean(spell))
      .map((spell) => ({
        id: spell.id,
        name: spell.name,
        level: spell.level,
        classes: spell.classes,
        source: spell.source,
        grantedBySubclassIds: spell.granted_by_subclasses ?? [],
        countsAgainstSelectionLimit: spell.counts_against_selection_limit !== false,
      })),
    selectedFeats: featChoices
      .map((featId) => featById.get(featId))
      .filter((feat): feat is Feat => Boolean(feat))
      .map((feat) => ({
        id: feat.id,
        name: feat.name,
        source: feat.source,
        prerequisites: feat.prerequisites,
      })),
    sourceCollections: {
      classSources: classes.map((cls) => cls.source),
      subclassSources: classes
        .map((cls) => cls.subclass?.source)
        .filter((value): value is string => Boolean(value)),
      spellSources: spellChoices.map((spellId) => spellById.get(spellId)?.source).filter((value): value is string => Boolean(value)),
      featSources: featChoices.map((featId) => featById.get(featId)?.source).filter((value): value is string => Boolean(value)),
    },
    grantedSpellIds: spellChoices
      .filter((spellId) => (spellById.get(spellId)?.granted_by_subclasses?.length ?? 0) > 0),
    freePreparedSpellIds: spellChoices
      .filter((spellId) => spellById.get(spellId)?.counts_against_selection_limit === false),
    multiclassSpellSlotsByCasterLevel: {},
  }
}
