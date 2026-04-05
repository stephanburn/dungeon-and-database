'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const ALL_SOURCES = [
  { key: 'SRD',       label: 'SRD (Systems Reference Document)' },
  { key: 'PHB',       label: 'Player\'s Handbook (PHB)' },
  { key: 'TCoE',      label: 'Tasha\'s Cauldron of Everything (TCoE)' },
  { key: 'GGtR',      label: 'Guildmasters\' Guide to Ravnica (GGtR)' },
  { key: 'ERftLW',    label: 'Eberron: Rising from the Last War (ERftLW)' },
  { key: 'Homebrew',  label: 'Homebrew' },
]

interface CampaignAllowlistProps {
  campaignId: string
  initialAllowlist: string[]
}

export function CampaignAllowlist({ campaignId, initialAllowlist }: CampaignAllowlistProps) {
  const { toast } = useToast()
  const [selected, setSelected] = useState<Set<string>>(new Set(initialAllowlist))
  const [saving, setSaving] = useState(false)

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/allowlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_keys: Array.from(selected) }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast({ title: 'Error', description: json.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Source allowlist saved' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-neutral-200">Source Allowlist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-400">
          Only content from allowed sources will be available to players when building characters.
        </p>
        <div className="space-y-2">
          {ALL_SOURCES.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selected.has(key)}
                onChange={() => toggle(key)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-neutral-200 group-hover:text-white transition-colors">
                {label}
              </span>
              <code className="text-xs text-neutral-500 font-mono">{key}</code>
            </label>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save allowlist'}
        </Button>
      </CardContent>
    </Card>
  )
}
