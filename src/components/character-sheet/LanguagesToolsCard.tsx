'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { Background, Language, Species, Tool } from '@/lib/types/database'
import {
  getAvailableLanguageChoices,
  getAvailableToolChoices,
  getAvailableToolChoicesFromCatalog,
  getFixedBackgroundLanguages,
  getLanguageChoiceLimit,
  getToolChoiceLimit,
} from '@/lib/characters/language-tool-provenance'

type LanguagesToolsCardProps = {
  species: Species | null
  background: Background | null
  availableLanguages?: Language[]
  availableTools?: Tool[]
  languageChoices: string[]
  toolChoices: string[]
  canEdit: boolean
  onLanguageChange: (choices: string[]) => void
  onToolChange: (choices: string[]) => void
}

function toggleChoice(current: string[], value: string, enabled: boolean, limit: number) {
  if (!enabled) {
    return current.filter((entry) => entry !== value)
  }
  if (current.includes(value)) {
    return current.filter((entry) => entry !== value)
  }
  if (limit > 0 && current.length >= limit) {
    return current
  }
  return [...current, value]
}

export function LanguagesToolsCard({
  species,
  background,
  availableLanguages,
  availableTools,
  languageChoices,
  toolChoices,
  canEdit,
  onLanguageChange,
  onToolChange,
}: LanguagesToolsCardProps) {
  const fixedLanguages = Array.from(new Set([
    ...(species?.languages ?? []),
    ...getFixedBackgroundLanguages(background),
  ]))
  const fixedTools = Array.from(new Set(background?.tool_proficiencies ?? []))
  const configuredLanguageOptions = getAvailableLanguageChoices(
    background,
    species,
    availableLanguages && availableLanguages.length > 0
      ? availableLanguages.map((language) => language.name)
      : undefined
  )
  const languageOptions = Array.from(new Set([
    ...configuredLanguageOptions,
    ...languageChoices,
  ]))
  const configuredToolOptions = getAvailableToolChoicesFromCatalog(
    species,
    availableTools && availableTools.length > 0
      ? availableTools.map((tool) => tool.name)
      : undefined
  )
  const toolOptions = Array.from(new Set([
    ...configuredToolOptions,
    ...toolChoices,
  ]))
  const languageLimit = getLanguageChoiceLimit(background, species)
  const toolLimit = getToolChoiceLimit(species)

  if (
    fixedLanguages.length === 0 &&
    fixedTools.length === 0 &&
    languageOptions.length === 0 &&
    toolOptions.length === 0
  ) {
    return null
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-neutral-100">Languages and Tools</h3>
        <p className="mt-1 text-sm text-neutral-400">
          Fixed grants come from species and background data. Choice-driven rows are persisted separately with provenance.
        </p>
      </div>

      {fixedLanguages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-200">Fixed languages</p>
          <p className="text-sm text-neutral-400">{fixedLanguages.join(', ')}</p>
        </div>
      )}

      {languageOptions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-200">
            Chosen languages ({languageChoices.length}/{languageLimit})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {languageOptions.map((language) => (
              <label
                key={language}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-neutral-300"
              >
                <Checkbox
                  checked={languageChoices.includes(language)}
                  disabled={!canEdit || (!languageChoices.includes(language) && languageChoices.length >= languageLimit)}
                  onChange={(event) => {
                    onLanguageChange(toggleChoice(languageChoices, language, event.currentTarget.checked, languageLimit))
                  }}
                />
                <span>{language}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {fixedTools.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-200">Fixed tool proficiencies</p>
          <p className="text-sm text-neutral-400">{fixedTools.join(', ')}</p>
        </div>
      )}

      {toolOptions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-200">
            Chosen tool proficiencies ({toolChoices.length}/{toolLimit})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {toolOptions.map((tool) => (
              <label
                key={tool}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-neutral-300"
              >
                <Checkbox
                  checked={toolChoices.includes(tool)}
                  disabled={!canEdit || (!toolChoices.includes(tool) && toolChoices.length >= toolLimit)}
                  onChange={(event) => {
                    onToolChange(toggleChoice(toolChoices, tool, event.currentTarget.checked, toolLimit))
                  }}
                />
                <span>{tool}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
