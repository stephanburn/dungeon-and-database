'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Campaign } from '@/lib/types/database'

interface AddToCampaignButtonProps {
  userId: string
  campaigns: Pick<Campaign, 'id' | 'name'>[]
  alreadyIn: string[]
}

export function AddToCampaignButton({ userId, campaigns, alreadyIn: initialAlreadyIn }: AddToCampaignButtonProps) {
  const [alreadyIn, setAlreadyIn] = useState(initialAlreadyIn)
  const [campaignId, setCampaignId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const available = campaigns.filter((c) => !alreadyIn.includes(c.id))

  if (available.length === 0) return <span className="text-neutral-600 text-xs">In all campaigns</span>

  async function handleAdd() {
    if (!campaignId) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/campaigns/${campaignId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to add')
    } else {
      setAlreadyIn((prev) => [...prev, campaignId])
      setCampaignId('')
    }
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={campaignId} onValueChange={setCampaignId}>
        <SelectTrigger className="h-7 text-xs bg-neutral-800 border-neutral-700 text-neutral-300 w-40">
          <SelectValue placeholder="Add to campaign…" />
        </SelectTrigger>
        <SelectContent className="bg-neutral-800 border-neutral-700">
          {available.map((c) => (
            <SelectItem key={c.id} value={c.id} className="text-neutral-200 text-xs">{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-neutral-700 text-neutral-300 hover:bg-neutral-800"
        disabled={!campaignId || saving}
        onClick={handleAdd}
      >
        {saving ? '…' : 'Add'}
      </Button>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
}
