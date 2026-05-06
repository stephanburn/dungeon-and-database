import type { DerivedClassResourceSummary } from '@/lib/characters/derived'
import type { CharacterBuildContext, CharacterProgressionSummary } from '@/lib/characters/build-context-types'

function rageUses(level: number) {
  if (level >= 20) return 'Unlimited'
  if (level >= 17) return '6'
  if (level >= 12) return '5'
  if (level >= 6) return '4'
  if (level >= 3) return '3'
  return '2'
}

function bardicInspirationDie(level: number) {
  if (level >= 15) return 'd12'
  if (level >= 10) return 'd10'
  if (level >= 5) return 'd8'
  return 'd6'
}

function superiorityDice(level: number) {
  const count = level >= 15 ? 6 : level >= 7 ? 5 : 4
  const die = level >= 18 ? 'd12' : level >= 10 ? 'd10' : 'd8'
  return `${count}${die}`
}

function channelDivinityUses(className: string, level: number) {
  if (className === 'Cleric') {
    if (level >= 18) return '3 uses'
    if (level >= 6) return '2 uses'
    return '1 use'
  }
  return '1 use'
}

export function deriveClassResources(
  context: CharacterBuildContext,
  progression: CharacterProgressionSummary,
  charismaModifier: number
): DerivedClassResourceSummary[] {
  const resources: DerivedClassResourceSummary[] = []

  for (const cls of context.classes) {
    const featureNames = new Set(cls.progression.flatMap((row) => row.featureNames))
    const sourceLabel = cls.subclass?.name ? `${cls.name} (${cls.subclass.name})` : cls.name

    if (cls.name === 'Barbarian' && featureNames.has('Rage')) {
      resources.push({
        id: `${cls.classId}:rage`,
        label: 'Rage',
        value: rageUses(cls.level),
        detail: 'Bonus damage, resistance, and advantage while raging.',
        recharge: cls.level >= 20 ? null : 'Long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Bard' && featureNames.has('Bardic Inspiration')) {
      resources.push({
        id: `${cls.classId}:bardic_inspiration`,
        label: 'Bardic Inspiration',
        value: `${Math.max(1, charismaModifier)} ${bardicInspirationDie(cls.level)}`,
        detail: 'Uses equal Charisma modifier, minimum 1.',
        recharge: cls.level >= 5 ? 'Short or long rest' : 'Long rest',
        sourceLabel,
      })
    }

    if ((cls.name === 'Cleric' && cls.level >= 2) || (cls.name === 'Paladin' && cls.level >= 3)) {
      resources.push({
        id: `${cls.classId}:channel_divinity`,
        label: 'Channel Divinity',
        value: channelDivinityUses(cls.name, cls.level),
        detail: cls.name === 'Cleric'
          ? 'Fuel cleric domain and Turn Undead options.'
          : 'Fuel sacred oath Channel Divinity options.',
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Monk' && cls.level >= 2) {
      resources.push({
        id: `${cls.classId}:ki`,
        label: 'Ki',
        value: `${cls.level} point${cls.level === 1 ? '' : 's'}`,
        detail: 'Spend on monk techniques such as Flurry of Blows, Patient Defense, and Step of the Wind.',
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Sorcerer' && cls.level >= 2) {
      resources.push({
        id: `${cls.classId}:sorcery_points`,
        label: 'Sorcery Points',
        value: `${cls.level} point${cls.level === 1 ? '' : 's'}`,
        detail: 'Fuel Flexible Casting and Metamagic once unlocked.',
        recharge: 'Long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Fighter' && featureNames.has('Second Wind')) {
      resources.push({
        id: `${cls.classId}:second_wind`,
        label: 'Second Wind',
        value: '1 use',
        detail: `Regain 1d10 + ${cls.level} hit points.`,
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }

    if (cls.name === 'Fighter' && featureNames.has('Action Surge')) {
      resources.push({
        id: `${cls.classId}:action_surge`,
        label: 'Action Surge',
        value: cls.level >= 17 ? '2 uses' : '1 use',
        detail: 'Take one additional action on your turn.',
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }

    if (cls.subclass?.name === 'Battle Master' && featureNames.has('Combat Superiority')) {
      resources.push({
        id: `${cls.classId}:superiority_dice`,
        label: 'Superiority Dice',
        value: superiorityDice(cls.level),
        detail: 'Spend one die to fuel a Battle Master maneuver.',
        recharge: 'Short or long rest',
        sourceLabel,
      })
    }
  }

  if (progression.spellSlots.length > 0) {
    resources.push({
      id: 'spell_slots:standard',
      label: 'Spell Slots',
      value: progression.spellSlots.join(' / '),
      detail: 'Standard multiclass spell slots by spell level.',
      recharge: 'Long rest',
      sourceLabel: 'Spellcasting',
    })
  }

  for (const pact of progression.pactSpellSlots) {
    resources.push({
      id: `spell_slots:pact:${pact.classId}`,
      label: 'Pact Magic Slots',
      value: pact.slots.join(' / ') || 'none',
      detail: 'Warlock pact slots by spell level.',
      recharge: 'Short or long rest',
      sourceLabel: pact.className,
    })
  }

  return resources
}
