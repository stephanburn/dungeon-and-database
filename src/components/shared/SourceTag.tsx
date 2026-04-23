import { Badge } from '@/components/ui/badge'

interface SourceTagProps {
  source: string
  amended?: boolean
  amendmentNote?: string | null
}

const SOURCE_COLOURS: Record<string, string> = {
  SRD: 'bg-neutral-700 text-neutral-200',
  PHB: 'bg-neutral-700 text-neutral-200',
  TCoE: 'bg-neutral-700 text-neutral-200',
  GGtR: 'bg-neutral-700 text-neutral-200',
  ERftLW: 'bg-neutral-700 text-neutral-200',
  EE: 'bg-neutral-700 text-neutral-200',
  Homebrew: 'bg-rose-900 text-rose-200',
}

export function SourceTag({ source, amended, amendmentNote }: SourceTagProps) {
  const colour = SOURCE_COLOURS[source] ?? 'bg-neutral-700 text-neutral-200'
  const amendedLabel = amendmentNote?.trim() || 'This entry has been amended from the source text.'

  return (
    <span className="inline-flex items-center gap-1">
      <Badge className={`text-xs font-mono px-1.5 py-0 ${colour} border-0`}>
        {source}
      </Badge>
      {amended && (
        <Badge
          className="cursor-help text-xs px-1.5 py-0 bg-amber-800 text-amber-200 border-0"
          title={amendedLabel}
          aria-label={`Amended: ${amendedLabel}`}
        >
          amended
        </Badge>
      )}
    </span>
  )
}
