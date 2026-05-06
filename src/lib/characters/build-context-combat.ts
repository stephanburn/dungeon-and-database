import type {
  DerivedCharacterCore,
  DerivedCombatActionSummary,
  DerivedSpeciesTraitSummary,
} from '@/lib/characters/derived'
import {
  getSelectedDragonbornAncestry,
  HIGH_ELF_CANTRIP_SOURCE_KEY,
} from '@/lib/characters/feature-grants'
import type { CharacterBuildContext } from '@/lib/characters/build-context-types'

const FEATURE_OPTION_VALUE_KEY = 'feature_option_key'
const COMBAT_OPTION_GROUPS = new Set([
  'maneuver:battle_master:2014',
  'hunter:hunters_prey:2014',
  'hunter:defensive_tactics:2014',
  'hunter:multiattack:2014',
  'hunter:superior_defense:2014',
  'elemental_discipline:four_elements:2014',
])

const FOUR_ELEMENTS_KI_COSTS: Record<string, string> = {
  fangs_of_the_fire_snake: '1 ki, plus 1 ki for extra fire damage',
  fist_of_four_thunders: '2 ki',
  fist_of_unbroken_air: '2 ki',
  rush_of_the_gale_spirits: '2 ki',
  shape_the_flowing_river: '1 ki',
  shaping_of_the_ice: '1 ki',
  sweeping_cinder_strike: '2 ki',
  water_whip: '2 ki',
  clench_of_the_north_wind: '3 ki',
  gong_of_the_summit: '3 ki',
  flames_of_the_phoenix: '4 ki',
  mist_stance: '4 ki',
  ride_the_wind: '4 ki',
  breath_of_winter: '6 ki',
  eternal_mountain_defense: '5 ki',
  river_of_hungry_flame: '5 ki',
  wave_of_rolling_earth: '6 ki',
}

function combatTriggerForOption(groupKey: string, optionKey: string) {
  if (groupKey === 'maneuver:battle_master:2014') {
    if (['parry', 'riposte'].includes(optionKey)) return 'Reaction'
    if (optionKey === 'evasive_footwork') return 'When you move'
    if (optionKey === 'precision_attack') return 'When you make a weapon attack'
    return 'When you hit with a weapon attack'
  }
  if (groupKey.startsWith('hunter:')) {
    if (['giant_killer', 'uncanny_dodge', 'stand_against_the_tide'].includes(optionKey)) return 'Reaction'
    if (optionKey === 'escape_the_horde') return 'Opportunity attacks against you'
    return 'During combat'
  }
  if (groupKey === 'elemental_discipline:four_elements:2014') return 'Action'
  return null
}

export function deriveCombatActions(
  context: CharacterBuildContext,
  proficiencyBonus: number,
  abilities: DerivedCharacterCore['abilities'],
  speciesTraits: DerivedSpeciesTraitSummary[]
): DerivedCombatActionSummary[] {
  const optionByGroupAndKey = new Map(
    context.featureOptions.map((option) => [`${option.group_key}:${option.key}`, option])
  )
  const fighter = context.classes.find((cls) => cls.subclass?.name === 'Battle Master')
  const monk = context.classes.find((cls) => cls.subclass?.name === 'Way of the Four Elements')
  const maneuverSaveDc = fighter
    ? 8 + proficiencyBonus + Math.max(abilities.str.modifier, abilities.dex.modifier)
    : null
  const disciplineSaveDc = monk
    ? 8 + proficiencyBonus + abilities.wis.modifier
    : null

  const optionActions = context.selectedFeatureOptions.flatMap((choice): DerivedCombatActionSummary[] => {
    if (!COMBAT_OPTION_GROUPS.has(choice.option_group_key)) return []
    const selectedKey = typeof choice.selected_value?.[FEATURE_OPTION_VALUE_KEY] === 'string'
      ? choice.selected_value[FEATURE_OPTION_VALUE_KEY]
      : null
    if (!selectedKey) return []

    const option = optionByGroupAndKey.get(`${choice.option_group_key}:${selectedKey}`)
    if (!option) return []

    if (choice.option_group_key === 'maneuver:battle_master:2014') {
      return [{
        id: `maneuver:${choice.option_key}:${selectedKey}`,
        name: option.name,
        category: 'maneuver',
        sourceLabel: 'Battle Master Maneuver',
        trigger: combatTriggerForOption(choice.option_group_key, selectedKey),
        effect: option.description,
        cost: '1 superiority die',
        saveDc: maneuverSaveDc,
      }]
    }

    if (choice.option_group_key === 'elemental_discipline:four_elements:2014') {
      return [{
        id: `discipline:${choice.option_key}:${selectedKey}`,
        name: option.name,
        category: 'discipline',
        sourceLabel: 'Elemental Discipline',
        trigger: combatTriggerForOption(choice.option_group_key, selectedKey),
        effect: option.description,
        cost: FOUR_ELEMENTS_KI_COSTS[selectedKey] ?? 'Ki cost varies',
        saveDc: disciplineSaveDc,
      }]
    }

    return [{
      id: `hunter:${choice.option_key}:${selectedKey}`,
      name: option.name,
      category: 'hunter',
      sourceLabel: 'Hunter Option',
      trigger: combatTriggerForOption(choice.option_group_key, selectedKey),
      effect: option.description,
      cost: null,
      saveDc: null,
    }]
  })

  const traitActions = speciesTraits.flatMap((trait): DerivedCombatActionSummary[] => {
    const normalized = trait.name.toLowerCase()
    if (normalized === 'fury of the small') {
      return [{
        id: `trait:${trait.id}`,
        name: trait.name,
        category: 'trait',
        sourceLabel: 'Species Trait',
        trigger: 'When you damage a larger creature',
        effect: trait.description,
        cost: 'Once per short or long rest',
        saveDc: null,
      }]
    }
    if (normalized === 'silver lining') {
      return [{
        id: `trait:${trait.id}`,
        name: trait.name,
        category: 'trait',
        sourceLabel: 'Species Trait',
        trigger: 'When luck or timing turns against you',
        effect: trait.description,
        cost: null,
        saveDc: null,
      }]
    }
    if (normalized === 'vigilant guardian') {
      return [{
        id: `trait:${trait.id}`,
        name: trait.name,
        category: 'trait',
        sourceLabel: 'Species Trait',
        trigger: 'When a nearby ally is hit',
        effect: trait.description,
        cost: 'Reaction',
        saveDc: null,
      }]
    }
    return []
  })

  return [...optionActions, ...traitActions]
}

function getDragonbornBreathWeaponDice(totalLevel: number) {
  if (totalLevel >= 16) return '5d6'
  if (totalLevel >= 11) return '4d6'
  if (totalLevel >= 6) return '3d6'
  return '2d6'
}

export function getDynamicSpeciesTraits(args: {
  context: CharacterBuildContext
  totalLevel: number
  proficiencyBonus: number
  constitutionModifier: number
}): DerivedSpeciesTraitSummary[] {
  const { context, totalLevel, proficiencyBonus, constitutionModifier } = args

  if (context.speciesSource === 'PHB' && context.speciesName === 'Dragonborn') {
    const ancestry = getSelectedDragonbornAncestry(context.selectedFeatureOptions)
    if (!ancestry) return []

    const lineBreathKeys = new Set(['black', 'blue', 'brass', 'bronze', 'copper'])
    const isLineBreath = lineBreathKeys.has(ancestry.key)
    const breathShape = isLineBreath ? '5 by 30 ft. line' : '15 ft. cone'
    const saveAbility = isLineBreath ? 'DEX' : 'CON'
    const saveDc = 8 + proficiencyBonus + constitutionModifier
    const damageDice = getDragonbornBreathWeaponDice(totalLevel)

    return [
      {
        id: 'species:dragonborn:ancestry',
        name: 'Draconic Ancestry',
        description: `${ancestry.label} dragonborn. Your breath weapon deals ${ancestry.damageType} damage, and you have resistance to ${ancestry.damageType}.`,
        source: 'PHB',
      },
      {
        id: 'species:dragonborn:breath_weapon',
        name: 'Breath Weapon',
        description: `As an action, exhale destructive energy in a ${breathShape}. Creatures in the area make a ${saveAbility} save (DC ${saveDc}), taking ${damageDice} ${ancestry.damageType} damage on a failed save, or half as much on a success. You can use this trait once per short or long rest.`,
        source: 'PHB',
      },
      {
        id: 'species:dragonborn:damage_resistance',
        name: 'Damage Resistance',
        description: `You have resistance to ${ancestry.damageType} damage from your ${ancestry.label.toLowerCase()} draconic ancestry.`,
        source: 'PHB',
      },
    ]
  }

  if (context.speciesSource === 'PHB' && context.speciesName === 'High Elf') {
    const selectedCantrip = context.selectedSpells.find(
      (spell) => spell.sourceFeatureKey === HIGH_ELF_CANTRIP_SOURCE_KEY
    )

    return [{
      id: 'species:high_elf:cantrip',
      name: 'Cantrip',
      description: selectedCantrip
        ? `You know the wizard cantrip ${selectedCantrip.name}. Intelligence is your spellcasting ability for it.`
        : 'Choose one wizard cantrip. Intelligence is your spellcasting ability for it.',
      source: 'PHB',
    }]
  }

  if (context.speciesSource === 'PHB' && context.speciesName === 'Dark Elf (Drow)') {
    const unlockedSpells = ['Dancing Lights cantrip']
    if (totalLevel >= 3) unlockedSpells.push('Faerie Fire once per long rest')
    if (totalLevel >= 5) unlockedSpells.push('Darkness once per long rest')

    return [{
      id: 'species:drow:magic',
      name: 'Drow Magic',
      description: `You know ${unlockedSpells.join(', ')}. Charisma is your spellcasting ability for these spells.`,
      source: 'PHB',
    }]
  }

  if (context.speciesSource === 'PHB' && context.speciesName === 'Tiefling') {
    const unlockedSpells = ['Thaumaturgy cantrip']
    if (totalLevel >= 3) unlockedSpells.push('Hellish Rebuke once per long rest')
    if (totalLevel >= 5) unlockedSpells.push('Darkness once per long rest')

    return [{
      id: 'species:tiefling:infernal_legacy',
      name: 'Infernal Legacy',
      description: `You know ${unlockedSpells.join(', ')}. Charisma is your spellcasting ability for these spells.`,
      source: 'PHB',
    }]
  }

  return []
}
