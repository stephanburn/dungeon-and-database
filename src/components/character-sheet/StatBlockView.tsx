'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Character, Species, Background, CharacterLevel, Sense, Class, Feat } from '@/lib/types/database'
import { SKILLS, normalizeSkillKey } from '@/lib/skills'
import type { AbilityKey } from '@/lib/skills'

interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

interface StatBlockViewProps {
  character: CharacterWithRelations
  classNames?: string[]
  selectedClass?: Class | null
  skillProficiencies?: string[]
  feats?: Feat[]
}

function mod(score: number): number {
  return Math.floor((score - 10) / 2)
}

function modStr(score: number): string {
  const m = mod(score)
  return m >= 0 ? `+${m}` : `${m}`
}

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

function proficiencyBonus(totalLevel: number): number {
  return Math.floor((Math.max(totalLevel, 1) - 1) / 4) + 2
}

function computeUnarmoredAc(
  dex: number, con: number, wis: number,
  classNames: string[]
): number {
  const dexMod = mod(dex)
  if (classNames.includes('Barbarian')) return 10 + dexMod + mod(con)
  if (classNames.includes('Monk'))      return 10 + dexMod + mod(wis)
  return 10 + dexMod
}

function formatSenses(senses: Sense[]): string {
  return senses
    .map((s) => `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} ${s.range_ft} ft.`)
    .join(', ')
}

export function StatBlockView({ character, classNames = [], selectedClass = null, skillProficiencies = [], feats = [] }: StatBlockViewProps) {
  const computedAc = computeUnarmoredAc(
    character.base_dex,
    character.base_con,
    character.base_wis,
    classNames,
  )
  const [acOverride, setAcOverride] = useState('')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const displayAc = acOverride || String(computedAc)
  const acLabel = acOverride
    ? displayAc
    : `${computedAc} (unarmored)`

  const totalLevel = character.character_levels.reduce((sum, l) => sum + l.level, 0)
  const pb = proficiencyBonus(totalLevel)

  const scores = [
    { abbr: 'STR', value: character.base_str },
    { abbr: 'DEX', value: character.base_dex },
    { abbr: 'CON', value: character.base_con },
    { abbr: 'INT', value: character.base_int },
    { abbr: 'WIS', value: character.base_wis },
    { abbr: 'CHA', value: character.base_cha },
  ]

  // Saving throws with proficiency bonus
  const savingThrowProfs = new Set(
    (selectedClass?.saving_throw_proficiencies ?? []).map((s) => s.toLowerCase() as AbilityKey)
  )
  const abilityKeys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  const abilityScores: Record<AbilityKey, number> = {
    str: character.base_str, dex: character.base_dex, con: character.base_con,
    int: character.base_int, wis: character.base_wis, cha: character.base_cha,
  }
  const proficientSaves = abilityKeys
    .filter((a) => savingThrowProfs.has(a))
    .map((a) => `${a.charAt(0).toUpperCase() + a.slice(1)} ${fmtMod(mod(abilityScores[a]) + pb)}`)

  // Skills with proficiency
  const bgSkillKeys = new Set(
    (character.background?.skill_proficiencies ?? []).map(normalizeSkillKey)
  )
  const classSkillKeys = new Set(skillProficiencies)
  const proficientSkills = SKILLS
    .filter((s) => bgSkillKeys.has(s.key) || classSkillKeys.has(s.key))
    .map((s) => `${s.name} ${fmtMod(mod(abilityScores[s.ability]) + pb)}`)

  const size = character.species?.size ?? 'medium'
  const speed = character.species?.speed ?? 30
  const languages = character.species?.languages ?? []
  const speciesName = character.species?.name ?? null
  const derivedSenses = character.species?.senses ?? []
  const damageResistances = character.species?.damage_resistances ?? []
  const conditionImmunities = character.species?.condition_immunities ?? []
  const allSenses = derivedSenses.length > 0 ? formatSenses(derivedSenses as Sense[]) : ''

  const typeLineSpecies = speciesName ? ` (${speciesName})` : ''

  function buildMarkdown(): string {
    const lines: string[] = []
    lines.push(`**Name:** ${character.name}`)
    lines.push(`**Size:** ${size.charAt(0).toUpperCase() + size.slice(1)}  **Type:** Humanoid${typeLineSpecies}  **Alignment:** ${character.alignment ?? '—'}`)
    lines.push(`**AC:** ${displayAc}`)
    lines.push(`**HP:** ${character.hp_max}`)
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
              <p><span className="font-bold">Hit Points</span> {character.hp_max}</p>
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
