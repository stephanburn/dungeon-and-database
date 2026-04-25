import type { StaleProvenanceRow } from '@/lib/types/database'
import { choiceTableLabel, sourceCategoryLabel } from '@/lib/characters/stale-provenance'

interface StaleProvenancePanelProps {
  entries: StaleProvenanceRow[]
}

export function StaleProvenancePanel({ entries }: StaleProvenancePanelProps) {
  if (entries.length === 0) return null

  // Group by choice_table for a cleaner layout
  const grouped = new Map<string, StaleProvenanceRow[]>()
  for (const entry of entries) {
    const list = grouped.get(entry.choice_table) ?? []
    list.push(entry)
    grouped.set(entry.choice_table, list)
  }

  return (
    <details className="surface-section px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-amber-100 marker:hidden">
        Content Integrity: {entries.length} stale {entries.length === 1 ? 'reference' : 'references'}
      </summary>
      <div className="mt-4 space-y-4">
        <p className="text-xs leading-5 text-neutral-400">
          These character rows reference content that no longer exists. The build may display
          incorrectly until the underlying content is restored or the choices are re-made.
        </p>
        {Array.from(grouped.entries()).map(([table, rows]) => (
          <div key={table}>
            <p className="text-neutral-300 text-xs font-medium mb-1">{choiceTableLabel(table)}</p>
            <ul className="space-y-1">
              {rows.map((row, i) => (
                <li key={i} className="text-xs text-amber-200 bg-amber-950/30 rounded px-2 py-1 font-mono">
                  <span className="text-neutral-400">
                    {sourceCategoryLabel(row.source_category)}
                  </span>
                  {' '}
                  <span title={row.source_entity_id}>
                    {row.source_entity_id.slice(0, 8)}…
                  </span>
                  {' → '}
                  <span className="text-amber-100">{row.choice_key}</span>
                  {row.source_feature_key && (
                    <span className="text-neutral-500 ml-1">({row.source_feature_key})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}
