'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface SourceRow {
  key: string
  full_name: string
  rule_set: '2014' | '2024'
}

interface CampaignAllowlistProps {
  campaignId: string
  initialAllowlist: string[]
}

export function CampaignAllowlist({ campaignId, initialAllowlist }: CampaignAllowlistProps) {
  const { toast } = useToast()
  const [selected, setSelected] = useState<Set<string>>(new Set(initialAllowlist))
  const [saving, setSaving] = useState(false)
  const [allSources, setAllSources] = useState<SourceRow[]>([])

  useEffect(() => {
    fetch('/api/content/sources')
      .then(r => r.json())
      .then(d => setAllSources(Array.isArray(d) ? d : []))
  }, [])

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

  /**
   * The allowlist editor keeps a Set in local state so toggles stay O(1) and
   * order-independent while we batch-save the final source key array.
   */

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-neutral-200">Source Allowlist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-400">
          Only content from allowed sources will be available to players when building characters.
        </p>
        <div className="space-y-4">
          {(['2014', '2024'] as const).map((rs) => {
            const group = allSources.filter((s) => s.rule_set === rs)
            if (group.length === 0) return null
            return (
              <div key={rs}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  D&amp;D 5e {rs}
                </p>
                <div className="space-y-2">
                  {group.map(({ key, full_name }) => (
                    <label key={key} className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3">
                      <Checkbox
                        checked={selected.has(key)}
                        onChange={() => toggle(key)}
                      />
                      <span className="text-neutral-200 group-hover:text-white transition-colors">
                        {full_name}
                      </span>
                      <code className="text-xs text-neutral-500 font-mono">{key}</code>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save allowlist'}
        </Button>
      </CardContent>
    </Card>
  )
}
