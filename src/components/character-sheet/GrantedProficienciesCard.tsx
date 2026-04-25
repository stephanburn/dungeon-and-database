'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  DerivedGrantedNonSkillProficiencies,
  DerivedGrantedProficiencyEntry,
} from '@/lib/characters/derived'

type GrantedProficienciesCardProps = {
  proficiencies: DerivedGrantedNonSkillProficiencies
}

const CATEGORY_TITLES: Array<{
  key: keyof DerivedGrantedNonSkillProficiencies
  label: string
}> = [
  { key: 'armor', label: 'Armor' },
  { key: 'weapons', label: 'Weapons' },
  { key: 'tools', label: 'Tools' },
  { key: 'languages', label: 'Languages' },
]

const SOURCE_CATEGORY_STYLES = {
  class: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
  subclass: 'border-violet-400/20 bg-violet-400/10 text-violet-100',
  background: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  species: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  feat: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
  manual: 'border-white/10 bg-white/[0.06] text-neutral-300',
} as const

export function GrantedProficienciesCard({
  proficiencies,
}: GrantedProficienciesCardProps) {
  const hasEntries = CATEGORY_TITLES.some(({ key }) => proficiencies[key].length > 0)
  if (!hasEntries) return null

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-4">
        <CardTitle className="text-neutral-200">Granted Proficiencies</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {CATEGORY_TITLES.map(({ key, label }) => (
          <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{label}</p>
            {proficiencies[key].length > 0 ? (
              <div className="mt-3 space-y-2">
                {proficiencies[key].map((entry) => (
                  <GrantedProficiencyRow key={entry.key} entry={entry} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">None shown.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function GrantedProficiencyRow({
  entry,
}: {
  entry: DerivedGrantedProficiencyEntry
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-neutral-100">{entry.label}</p>
        {entry.sources.map((source) => (
          <span
            key={`${entry.key}:${source.category}:${source.label}`}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${SOURCE_CATEGORY_STYLES[source.category]}`}
          >
            {source.label}
          </span>
        ))}
      </div>
    </div>
  )
}
