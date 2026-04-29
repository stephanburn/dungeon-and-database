'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Character, Species, Background, CharacterLevel, Sense, Feat } from '@/lib/types/database'
import { formatModifier, type DerivedCharacter, type DerivedCharacterCore } from '@/lib/characters/derived'

interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

interface StatBlockViewProps {
  character: CharacterWithRelations
  derived: DerivedCharacterCore & Partial<Pick<DerivedCharacter, 'savingThrows' | 'skills' | 'speed' | 'size' | 'languages' | 'senses' | 'damageResistances' | 'conditionImmunities' | 'armorClass'>>
  feats?: Feat[]
}

function formatSenses(senses: Sense[]): string {
  return senses
    .map((s) => `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} ${s.range_ft} ft.`)
    .join(', ')
}

export function StatBlockView({ character, derived, feats = [] }: StatBlockViewProps) {
  const [acOverride, setAcOverride] = useState('')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const computedAc = derived.armorClass.value
  const displayAc = acOverride || String(computedAc)
  const acLabel = acOverride
    ? displayAc
    : `${computedAc} (${derived.armorClass.formula})`
  const acAlternatives = derived.armorClass.alternatives ?? []

  const pb = derived.proficiencyBonus

  const scores = [
    { abbr: 'STR', value: derived.abilities.str.adjusted, modifier: derived.abilities.str.modifier },
    { abbr: 'DEX', value: derived.abilities.dex.adjusted, modifier: derived.abilities.dex.modifier },
    { abbr: 'CON', value: derived.abilities.con.adjusted, modifier: derived.abilities.con.modifier },
    { abbr: 'INT', value: derived.abilities.int.adjusted, modifier: derived.abilities.int.modifier },
    { abbr: 'WIS', value: derived.abilities.wis.adjusted, modifier: derived.abilities.wis.modifier },
    { abbr: 'CHA', value: derived.abilities.cha.adjusted, modifier: derived.abilities.cha.modifier },
  ]

  const proficientSaves = derived.savingThrows
    .filter((save) => save.proficient)
    .map((save) => `${save.name} ${formatModifier(save.modifier)}`)

  const proficientSkills = derived.skills
    .filter((skill) => skill.proficient)
    .map((skill) => `${skill.name} ${formatModifier(skill.modifier)}`)

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
    for (const alternative of acAlternatives) {
      lines.push(`**AC Option (${alternative.label}):** ${alternative.value} (${alternative.formula})`)
    }
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
      scores.map((s) => `${s.value} (${formatModifier(s.modifier)})`).join(' | ') +
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
              {acAlternatives.length > 0 && acAlternatives.map((alternative) => (
                <p key={`${alternative.label}:${alternative.value}`} className="pl-4 text-xs italic text-[#5f4632]">
                  {alternative.label}: {alternative.value} ({alternative.formula})
                </p>
              ))}
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
                    <div className="text-xs text-[#9c1b1b]">({formatModifier(s.modifier)})</div>
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
