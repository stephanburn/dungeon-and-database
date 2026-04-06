'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Character, Species, Background, CharacterLevel, Sense } from '@/lib/types/database'

interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

interface StatBlockViewProps {
  character: CharacterWithRelations
  // Class names parallel to character_levels, for unarmored AC computation
  classNames?: string[]
}

function mod(score: number): number {
  return Math.floor((score - 10) / 2)
}

function modStr(score: number): string {
  const m = mod(score)
  return m >= 0 ? `+${m}` : `${m}`
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

export function StatBlockView({ character, classNames = [] }: StatBlockViewProps) {
  const computedAc = computeUnarmoredAc(
    character.base_dex,
    character.base_con,
    character.base_wis,
    classNames,
  )
  const [acOverride, setAcOverride] = useState('')
  const [extraSenses, setExtraSenses] = useState('')
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

  const size = character.species?.size ?? 'medium'
  const speed = character.species?.speed ?? 30
  const languages = character.species?.languages ?? []
  const speciesName = character.species?.name ?? null
  const derivedSenses = character.species?.senses ?? []
  const derivedSensesStr = derivedSenses.length > 0 ? formatSenses(derivedSenses as Sense[]) : ''
  const allSenses = [derivedSensesStr, extraSenses].filter(Boolean).join(', ')

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
        className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
      >
        {open ? 'Hide Stat Block' : 'Stat Block'}
      </Button>

      <div className={`space-y-4${open ? '' : ' hidden'}`}>
        {/* Manual override / extra senses */}
        <div className="flex gap-4 flex-wrap">
          <div className="space-y-1">
            <Label className="text-neutral-400 text-xs">AC override</Label>
            <Input
              type="number"
              min={0}
              value={acOverride}
              onChange={(e) => setAcOverride(e.target.value)}
              placeholder={`${computedAc} (unarmored)`}
              className="w-36 bg-neutral-800 border-neutral-700 text-neutral-100 h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-neutral-400 text-xs">Senses</Label>
            {derivedSensesStr && (
              <p className="text-xs text-neutral-300">
                {derivedSensesStr} <span className="text-neutral-500">(from species)</span>
              </p>
            )}
            <Input
              value={extraSenses}
              onChange={(e) => setExtraSenses(e.target.value)}
              placeholder={derivedSensesStr ? 'Additional senses…' : 'e.g. Darkvision 60 ft.'}
              className="w-72 bg-neutral-800 border-neutral-700 text-neutral-100 h-8 text-sm"
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
              {allSenses && <p><span className="font-bold">Senses</span> {allSenses}</p>}
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
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
        >
          {copied ? 'Copied!' : 'Copy for Craft'}
        </Button>
      </div>
    </div>
  )
}
