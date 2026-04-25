'use client'

import type { ReactNode } from 'react'

type WizardStepFrameProps = {
  title: string
  description?: string
  guidance?: string | null
  summaryTitle?: string
  summaryItems?: string[]
  children: ReactNode
}

export function WizardStepFrame({
  title,
  description,
  guidance,
  summaryTitle = 'Step summary',
  summaryItems = [],
  children,
}: WizardStepFrameProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-50">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm leading-6 text-neutral-400">{description}</p>
        )}
      </div>

      {guidance && (
        <div className="surface-row px-3 py-2.5 text-sm text-neutral-300">
          <span className="font-medium text-neutral-100">Next:</span> {guidance}
        </div>
      )}

      {children}

      {summaryItems.length > 0 && (
        <details className="surface-row group px-3 py-2.5">
          <summary className="cursor-pointer list-none text-sm font-medium text-neutral-300 marker:hidden">
            <span className="inline-flex items-center gap-2">
              <span>{summaryTitle}</span>
              <span className="text-xs font-normal text-neutral-500">
                {summaryItems.length} item{summaryItems.length === 1 ? '' : 's'}
              </span>
            </span>
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {summaryItems.map((item) => (
              <span
                key={item}
                className="surface-row px-2.5 py-1 text-xs text-neutral-300"
              >
                {item}
              </span>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
