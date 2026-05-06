import { abilityModifier } from '@/lib/characters/derived'
import {
  getMaverickCantripBonus,
  getMaverickPreparedBreakthroughLevels,
  isMaverickSubclass,
} from '@/lib/characters/maverick'
import { createAsiFeatSlotDefinition, getSpeciesFeatSlotDefinitions } from '@/lib/characters/feat-slots'
import {
  buildSpellSelectionSummary,
  resolveLeveledSpellSelectionCap,
  resolvePreparedSpellCap,
} from '@/lib/characters/spell-selection'
import { getAdjustedAbilityScores } from '@/lib/characters/build-context-ability'
import type { CharacterBuildContext, CharacterProgressionSummary } from '@/lib/characters/build-context-types'
import type { SpellcastingType } from '@/lib/types/database'

function spellcastingContribution(type: SpellcastingType | null, level: number): number {
  switch (type) {
    case 'full':
      return level
    case 'half':
      // 2014 multiclass slot progression rounds half-caster levels down when combining caster levels.
      return Math.floor(level / 2)
    case 'third':
      // 2014 multiclass slot progression also rounds third-caster levels down.
      return Math.floor(level / 3)
    default:
      return 0
  }
}

function maxUnlockedSpellLevel(slots: number[]): number {
  for (let index = slots.length - 1; index >= 0; index -= 1) {
    if ((slots[index] ?? 0) > 0) return index + 1
  }
  return 0
}

export function deriveCharacterProgression(context: CharacterBuildContext): CharacterProgressionSummary {
  const totalLevel = context.classes.reduce((sum, cls) => sum + cls.level, 0)
  const classFeatSlots = context.classes.flatMap((cls) =>
    cls.progression
      .filter((row) => row.asiAvailable)
      .map((row) => createAsiFeatSlotDefinition(`${cls.name} ${row.level}`))
  )
  const speciesFeatSlots = getSpeciesFeatSlotDefinitions(
    context.speciesName && context.speciesSource
      ? { name: context.speciesName, source: context.speciesSource }
      : null
  )
  const featSlots = [...speciesFeatSlots, ...classFeatSlots]
  const totalAsiSlots = featSlots.length
  const featSlotLabels = featSlots.map((slot) => slot.label)
  const multiclassCasterLevel = context.classes.reduce(
    (sum, cls) => sum + spellcastingContribution(cls.spellcastingType, cls.level),
    0
  )

  const nonPactClasses = context.classes.filter(
    (cls) => cls.spellcastingType && cls.spellcastingType !== 'none' && cls.spellcastingType !== 'pact'
  )
  const pactClasses = context.classes.filter((cls) => cls.spellcastingType === 'pact')

  let spellSlots: number[] = []
  if (nonPactClasses.length === 1 && context.classes.length === 1) {
    spellSlots = nonPactClasses[0].spellSlots
  } else if (multiclassCasterLevel > 0) {
    // Pact Magic stays on its own track in 2014, so only non-pact casters feed the shared multiclass slot table.
    spellSlots = context.multiclassSpellSlotsByCasterLevel[multiclassCasterLevel] ?? []
  }

  const pactSpellSlots = pactClasses.map((cls) => ({
    classId: cls.classId,
    className: cls.name,
    slots: cls.spellSlots,
  }))

  const spellLevelCaps = Object.fromEntries(
    spellSlots
      .map((slots, index) => [index + 1, slots] as const)
      .filter(([, slots]) => slots > 0)
  )
  const leveledSpellSelectionCap = spellSlots.reduce((sum, slots) => sum + slots, 0)

  const unlockedFeatures = Array.from(
    new Set(
      context.classes.flatMap((cls) =>
        cls.progression.flatMap((row) => row.featureNames)
      )
    )
  )

  const subclassRequirements = context.classes.map((cls) => {
    const subclassRequired = cls.level >= cls.subclassChoiceLevel
    return {
      classId: cls.classId,
      className: cls.name,
      currentLevel: cls.level,
      requiredAt: cls.subclassChoiceLevel,
      subclassId: cls.subclass?.id ?? null,
      subclassName: cls.subclass?.name ?? null,
      subclassRequired,
      missingRequiredSubclass: subclassRequired && !cls.subclass,
      selectedTooEarly: !!cls.subclass && cls.level < cls.subclassChoiceLevel,
    }
  })

  const maxSpellLevel = Math.max(
    maxUnlockedSpellLevel(spellSlots),
    ...pactSpellSlots.map((entry) => maxUnlockedSpellLevel(entry.slots)),
    0
  )

  const adjustedScores = getAdjustedAbilityScores(context)
  const primarySpellcastingClass = context.classes.find(
    (cls) => cls.spellcastingType && cls.spellcastingType !== 'none' && cls.spellcastingProgression?.mode && cls.spellcastingProgression.mode !== 'none'
  ) ?? null
  // Batch 1 intentionally exposes a single primary selection model here.
  // Multiclass builds with multiple distinct preparation/known systems will need a richer per-source summary later.
  const spellcastingProfile = primarySpellcastingClass?.spellcastingProgression ?? null
  const maverickCantripBonus = primarySpellcastingClass?.subclass && isMaverickSubclass(primarySpellcastingClass.subclass)
    ? getMaverickCantripBonus(primarySpellcastingClass.level)
    : 0
  const cantripSelectionCapBase = spellcastingProfile?.cantrips_known_by_level?.[Math.max((primarySpellcastingClass?.level ?? 1) - 1, 0)] ?? null
  const cantripSelectionCap = cantripSelectionCapBase === null ? null : cantripSelectionCapBase + maverickCantripBonus

  let leveledCapFromProgression = 0
  let spellSelectionMode: CharacterProgressionSummary['spellSelectionMode'] = 'none'
  let spellSelectionSummary: string | null = null

  if (primarySpellcastingClass && spellcastingProfile) {
    spellSelectionMode = spellcastingProfile.mode
    const ability = spellcastingProfile.spellcasting_ability
    const abilityMod = ability ? abilityModifier(adjustedScores[ability]) : 0
    const preparedSpellCap = spellcastingProfile.mode === 'prepared' || spellcastingProfile.mode === 'spellbook'
      ? resolvePreparedSpellCap({
          profile: spellcastingProfile,
          classLevel: primarySpellcastingClass.level,
          abilityModifier: abilityMod,
        })
      : null
    leveledCapFromProgression = resolveLeveledSpellSelectionCap({
      profile: spellcastingProfile,
      classLevel: primarySpellcastingClass.level,
      abilityModifier: abilityMod,
    })
    spellSelectionSummary = buildSpellSelectionSummary({
      className: primarySpellcastingClass.name,
      classLevel: primarySpellcastingClass.level,
      mode: spellcastingProfile.mode,
      leveledSelectionCap: leveledCapFromProgression,
      preparedSpellCap,
    })
    if (primarySpellcastingClass.subclass && isMaverickSubclass(primarySpellcastingClass.subclass)) {
      const extraLevels = getMaverickPreparedBreakthroughLevels(primarySpellcastingClass.level)
      if (extraLevels.length > 0) {
        spellSelectionSummary = `${spellSelectionSummary} Maverick also prepares one Breakthrough spell each of levels ${extraLevels.join(', ')} without counting against the normal prepared total.`
      }
    }
  }

  return {
    totalLevel,
    classCount: context.classes.length,
    totalAsiSlots,
    featSlots,
    featSlotLabels,
    multiclassCasterLevel,
    spellSlots,
    spellLevelCaps,
    leveledSpellSelectionCap: leveledCapFromProgression > 0 ? leveledCapFromProgression : leveledSpellSelectionCap,
    cantripSelectionCap,
    spellSelectionMode,
    spellSelectionClassName: primarySpellcastingClass?.name ?? null,
    spellSelectionSummary,
    pactSpellSlots,
    maxSpellLevel,
    unlockedFeatures,
    subclassRequirements,
    choiceCaps: {
      featSlots: featSlots.length,
      backgroundSkillChoices: context.background?.skillChoiceCount ?? 0,
      classSkillChoices: context.classes[0]?.skillChoices.count ?? 0,
    },
  }
}
