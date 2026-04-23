'use client'

import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type WizardStepFrameProps = {
  title: string
  description?: string
  summaryTitle?: string
  summaryItems?: string[]
  children: ReactNode
}

export function WizardStepFrame({
  title,
  description,
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

      {children}

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-neutral-100">{summaryTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {summaryItems.length > 0 ? (
            summaryItems.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-neutral-300"
              >
                {item}
              </div>
            ))
          ) : (
            <Alert className="border-white/10 bg-white/[0.02]">
              <AlertDescription className="text-neutral-400">
                Nothing selected for this step yet.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
