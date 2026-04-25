'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmActionButton } from '@/components/shared/ConfirmActionButton'
import { useToast } from '@/hooks/use-toast'
import type { CharacterStatus } from '@/lib/types/database'

interface DmReviewPanelProps {
  characterId: string
  status: CharacterStatus
}

export function DmReviewPanel({ characterId, status }: DmReviewPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState<'approve' | 'changes' | null>(null)

  if (status !== 'submitted') return null

  async function handleApprove() {
    setLoading('approve')
    try {
      const res = await fetch(`/api/characters/${characterId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        toast({ title: 'Error', description: json.error, variant: 'destructive' })
        return false
      }
      toast({ title: 'Character approved' })
      router.refresh()
      return true
    } finally {
      setLoading(null)
    }
  }

  async function handleRequestChanges() {
    if (!notes.trim()) {
      toast({ title: 'Notes required', description: 'Add notes before requesting changes.', variant: 'destructive' })
      return
    }
    setLoading('changes')
    try {
      const res = await fetch(`/api/characters/${characterId}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast({ title: 'Error', description: json.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Changes requested' })
      setNotes('')
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="surface-section">
      <CardHeader>
        <CardTitle className="text-sm text-neutral-100">DM Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-neutral-300">Notes for player (required when requesting changes)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explain what needs to change…"
            className="bg-neutral-800 border-neutral-700 text-neutral-100 min-h-[80px]"
          />
        </div>
        <div className="flex gap-3">
          <ConfirmActionButton
            title="Approve this character?"
            description="This will mark the sheet approved and clear any outstanding change-request notes."
            triggerLabel={loading === 'approve' ? 'Approving…' : 'Approve'}
            confirmLabel="Approve"
            pendingLabel="Approving…"
            onConfirm={handleApprove}
            className="bg-emerald-500/90 text-neutral-950 hover:bg-emerald-400"
          />
          <Button
            variant="outline"
            onClick={handleRequestChanges}
            disabled={loading !== null}
            className="border-amber-400/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15"
          >
            {loading === 'changes' ? 'Sending…' : 'Request changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
