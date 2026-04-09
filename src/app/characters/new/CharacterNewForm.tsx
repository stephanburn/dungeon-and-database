'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { Campaign, StatMethod, CharacterType } from '@/lib/types/database'

interface CharacterNewFormProps {
  isDm: boolean
}

export function CharacterNewForm({ isDm }: CharacterNewFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [name, setName] = useState('')
  const [statMethod, setStatMethod] = useState<StatMethod>('point_buy')
  const [characterType, setCharacterType] = useState<CharacterType>('pc')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((data: Campaign[]) => {
        setCampaigns(data)
        if (data.length === 1) setCampaignId(data[0].id)
      })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!campaignId) {
      toast({ title: 'Select a campaign', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          name,
          stat_method: statMethod,
          ...(isDm ? { character_type: characterType } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: json.error, variant: 'destructive' })
        return
      }
      router.push(`/characters/${json.id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
            ← Back
          </Button>
        </div>

        <Card className="border-white/10 bg-white/[0.04]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-neutral-50">New Character</CardTitle>
            <p className="max-w-lg text-sm leading-6 text-neutral-400">
              Start with the essentials. You can fill in the full sheet after the character is created.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Campaign</Label>
                  <Select value={campaignId} onValueChange={setCampaignId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-neutral-500">
                          No campaigns available. Ask your DM to add you first.
                        </div>
                      ) : (
                        campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-neutral-200">{c.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">Character Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mira Stormborn"
                    required
                  />
                </div>
              </div>

              <div className="panel-subtle p-5">
                <div className="mb-4">
                  <h2 className="section-heading text-base">Starting Options</h2>
                  <p className="mt-1 text-sm text-neutral-500">These can be changed later if your campaign allows it.</p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Stat Method</Label>
                    <Select value={statMethod} onValueChange={(v) => setStatMethod(v as StatMethod)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="point_buy" className="text-neutral-200">Point Buy (recommended)</SelectItem>
                        <SelectItem value="standard_array" className="text-neutral-200">Standard Array</SelectItem>
                        <SelectItem value="rolled" className="text-neutral-200">Rolled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isDm && (
                    <div className="space-y-2">
                      <Label className="text-neutral-300">Character Type</Label>
                      <Select value={characterType} onValueChange={(v) => setCharacterType(v as CharacterType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pc" className="text-neutral-200">Player character</SelectItem>
                          <SelectItem value="npc" className="text-neutral-200">NPC</SelectItem>
                          <SelectItem value="test" className="text-neutral-200">Test character</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs leading-5 text-neutral-500">
                        NPCs stay hidden from players. Test characters stay out of roster counts.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button type="submit" size="lg" className="min-w-44" disabled={creating}>
                  {creating ? 'Creating…' : 'Create character'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
