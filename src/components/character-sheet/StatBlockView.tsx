'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Character, Species, Background, CharacterLevel, Sense, Class, Feat } from '@/lib/types/database'
import type { DerivedCharacter } from '@/lib/characters/build-context'
import { abilityModifier, type DerivedCharacterCore } from '@/lib/characters/derived'
import { SKILLS, normalizeSkillKey } from '@/lib/skills'
import type { AbilityKey } from '@/lib/skills'

interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

interface StatBlockViewProps {
  character: CharacterWithRelations
  derived: DerivedCharacterCore & Partial<Pick<DerivedCharacter, 'savingThrows' | 'skills' | 'speed' | 'size' | 'languages' | 'senses' | 'damageResistances' | 'conditionImmunities' | 'armorClass'>>
  classNames?: string[]
  selectedClass?: Class | null
  skillProficiencies?: string[]
  feats?: Feat[]
}

function modStr(score: number): string {
  const m = abilityModifier(score)
  return m >= 0 ? `+${m}` : `${m}`
}

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

function computeUnarmoredAc(
  dex: number, con: number, wis: number,
  classNames: string[],
  species: Species | null
): number {
  const dexMod = abilityModifier(dex)
  const warforgedBonus = species?.name === 'Warforged' && species.source === 'ERftLW' ? 1 : 0
  if (classNames.includes('Barbarian')) return 10 + dexMod + abilityModifier(con) + warforgedBonus
  if (classNames.includes('Monk'))      return 10 + dexMod + abilityModifier(wis) + warforgedBonus
  return 10 + dexMod + warforgedBonus
}

function formatSenses(senses: Sense[]): string {
  return senses
    .map((s) => `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} ${s.range_ft} ft.`)
    .join(', ')
}

export function StatBlockView({ character, derived, classNames = [], selectedClass = null, skillProficiencies = [], feats = [] }: StatBlockViewProps) {
  const fallbackAc = computeUnarmoredAc(
    derived.abilities.dex.adjusted,
    derived.abilities.con.adjusted,
    derived.abilities.wis.adjusted,
    classNames,
    character.species,
  )
  const [acOverride, setAcOverride] = useState('')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const computedAc = derived.armorClass?.value ?? fallbackAc
  const displayAc = acOverride || String(computedAc)
  const acLabel = acOverride
    ? displayAc
    : derived.armorClass?.formula
      ? `${computedAc} (${derived.armorClass.formula})`
      : `${computedAc} (unarmored)`

  const pb = derived.proficiencyBonus

  const scores = [
    { abbr: 'STR', value: derived.abilities.str.adjusted },
    { abbr: 'DEX', value: derived.abilities.dex.adjusted },
    { abbr: 'CON', value: derived.abilities.con.adjusted },
    { abbr: 'INT', value: derived.abilities.int.adjusted },
    { abbr: 'WIS', value: derived.abilities.wis.adjusted },
    { abbr: 'CHA', value: derived.abilities.cha.adjusted },
  ]

  const proficientSaves = derived.savingThrows
    ? derived.savingThrows
        .filter((save) => save.proficient)
        .map((save) => `${save.name} ${fmtMod(save.modifier)}`)
    : (() => {
        const savingThrowProfs = new Set(
          (selectedClass?.saving_throw_proficiencies ?? []).map((s) => s.toLowerCase() as AbilityKey)
        )
        const abilityKeys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
        const abilityScores: Record<AbilityKey, number> = {
          str: derived.abilities.str.adjusted,
          dex: derived.abilities.dex.adjusted,
          con: derived.abilities.con.adjusted,
          int: derived.abilities.int.adjusted,
          wis: derived.abilities.wis.adjusted,
          cha: derived.abilities.cha.adjusted,
        }

        return abilityKeys
          .filter((ability) => savingThrowProfs.has(ability))
          .map((ability) => `${ability.charAt(0).toUpperCase() + ability.slice(1)} ${fmtMod(abilityModifier(abilityScores[ability]) + pb)}`)
      })()

  const proficientSkills = derived.skills
    ? derived.skills
        .filter((skill) => skill.proficient)
        .map((skill) => `${skill.name} ${fmtMod(skill.modifier)}`)
    : (() => {
        const bgSkillKeys = new Set(
          (character.background?.skill_proficiencies ?? []).map(normalizeSkillKey)
        )
        const classSkillKeys = new Set(skillProficiencies)
        const abilityScores: Record<AbilityKey, number> = {
          str: derived.abilities.str.adjusted,
          dex: derived.abilities.dex.adjusted,
          con: derived.abilities.con.adjusted,
          int: derived.abilities.int.adjusted,
          wis: derived.abilities.wis.adjusted,
          cha: derived.abilities.cha.adjusted,
        }

        return SKILLS
          .filter((skill) => bgSkillKeys.has(skill.key) || classSkillKeys.has(skill.key))
          .map((skill) => `${skill.name} ${fmtMod(abilityModifier(abilityScores[skill.ability]) + pb)}`)
      })()

  const size = derived.size ?? character.species?.size ?? 'medium'
  const speed = derived.speed ?? character.species?.speed ?? 30
  const languages = derived.languages ?? character.species?.languages ?? []
  const speciesName = character.species?.name ?? null
  const derivedSenses = derived.senses ?? character.species?.senses ?? []
  const damageResistances = derived.damageResistances ?? character.species?.damage_resistances ?? []
  const conditionImmunities = derived.conditionImmunities ?? character.species?.condition_immunities ?? []
  const allSenses = derivedSenses.length > 0 ? formatSenses(derivedSenses as Sense[]) : ''

  const typeLineSpecies = speciesName ? ` (${speciesName})` : ''

  function buildMarkdown(): string {
    const lines: string[] = []
    lines.push(`**Name:** ${character.name}`)
    lines.push(`**Size:** ${size.charAt(0).toUpperCase() + size.slice(1)}  **Type:** Humanoid${typeLineSpecies}  **Alignment:** ${character.alignment ?? '—'}`)
    lines.push(`**AC:** ${displayAc}`)
    lines.push(`**HP:** ${derived.hitPoints.max}`)
    lines.push(`**Speed:** ${speed} ft.`)
    lines.push(`**Proficiency Bonus:** +${pb}`)
    if (allSenses) lines.push(`**Senses:** ${allSenses}`)
    if (proficientSaves.length > 0) lines.push(`**Saving Throws:** ${proficientSaves.join(', ')}`)
    if (proficientSkills.length > 0) lines.push(`**Skills:** ${proficientSkills.join(', ')}`)
    if (damageResistances.length > 0) lines.push(`**Damage Resistances:** ${damageResistances.join(', ')}`)
    if (conditionImmunities.length > 0) lines.push(`**Condition Immunities:** ${conditionImmunities.join(', ')}`)
    lines.push('')
    lines.push('| STR | DEX | CON | INT | WIS | CHA |')
    lines.push('|---------|---------|---------|---------|---------|---------|')
    lines.push(
      '| ' +
      scores.map((s) => `${s.value} (${modStr(s.value)})`).join(' | ') +
      ' |'
    )
    if (languages.length > 0) {
      lines.push('')
      lines.push(`**Languages:** ${languages.join(', ')}`)
    }
    if (character.background?.name) {
      lines.push(`**Background:** ${character.background.name}`)
    }
    if (feats.length > 0) {
      lines.push(`**Feats:** ${feats.map((f) => f.name).join(', ')}`)
    }
    return lines.join('\n')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildMarkdown())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Clipboard write failed. Copy the text manually.')
    }
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide Stat Block' : 'Stat Block'}
      </Button>

      <div className={`space-y-4${open ? '' : ' hidden'}`}>
        {/* AC override */}
        <div className="flex gap-4 flex-wrap">
          <div className="space-y-1">
            <Label className="text-neutral-400 text-xs">AC override</Label>
            <Input
              type="number"
              min={0}
              value={acOverride}
              onChange={(e) => setAcOverride(e.target.value)}
              placeholder={`${computedAc} (unarmored)`}
              className="h-10 w-36 text-sm"
            />
          </div>
        </div>

        {/* On-screen Monster Manual style block */}
        <div className="bg-[#fdf1dc] text-[#1a0a00] rounded p-4 max-w-2xl font-serif">
          <div className="border-b-2 border-[#9c1b1b] pb-2 mb-2">
            <h3 className="text-xl font-bold text-[#9c1b1b]">{character.name}</h3>
            <p className="text-sm italic">
              {size.charAt(0).toUpperCase() + size.slice(1)} humanoid{typeLineSpecies}
              {character.alignment ? `, ${character.alignment}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 border-b border-[#9c1b1b] pb-2 mb-2">
            <div className="space-y-0.5 text-sm">
              <p><span className="font-bold">Armor Class</span> {acLabel}</p>
              <p><span className="font-bold">Hit Points</span> {derived.hitPoints.max}</p>
              <p><span className="font-bold">Speed</span> {speed} ft.</p>
              <p><span className="font-bold">Proficiency Bonus</span> +{pb}</p>
              {proficientSaves.length > 0 && (
                <p><span className="font-bold">Saving Throws</span> {proficientSaves.join(', ')}</p>
              )}
              {proficientSkills.length > 0 && (
                <p><span className="font-bold">Skills</span> {proficientSkills.join(', ')}</p>
              )}
              {allSenses && <p><span className="font-bold">Senses</span> {allSenses}</p>}
              {damageResistances.length > 0 && (
                <p><span className="font-bold">Damage Resistances</span> {damageResistances.join(', ')}</p>
              )}
              {conditionImmunities.length > 0 && (
                <p><span className="font-bold">Condition Immunities</span> {conditionImmunities.join(', ')}</p>
              )}
              {languages.length > 0 && (
                <p><span className="font-bold">Languages</span> {languages.join(', ')}</p>
              )}
            </div>

            <div>
              <div className="grid grid-cols-6 text-center text-xs font-bold text-[#9c1b1b] border-b border-[#9c1b1b] pb-1 mb-1">
                {scores.map((s) => <div key={s.abbr}>{s.abbr}</div>)}
              </div>
              <div className="grid grid-cols-6 text-center text-sm">
                {scores.map((s) => (
                  <div key={s.abbr}>
                    <div>{s.value}</div>
                    <div className="text-xs text-[#9c1b1b]">({modStr(s.value)})</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {character.background && (
            <p className="text-sm"><span className="font-bold">Background</span> {character.background.name}</p>
          )}
          {feats.length > 0 && (
            <p className="text-sm"><span className="font-bold">Feats</span> {feats.map((f) => f.name).join(', ')}</p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy for Craft'}
        </Button>
      </div>
    </div>
  )
}
