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
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="text-neutral-400 hover:text-neutral-200 -ml-2">
            ← Back
          </Button>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-100">New Character</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-5">
              {isDm && (
                <div className="space-y-2">
                  <Label className="text-neutral-300">Character Type</Label>
                  <Select value={characterType} onValueChange={(v) => setCharacterType(v as CharacterType)}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="pc" className="text-neutral-200">PC — Player character</SelectItem>
                      <SelectItem value="npc" className="text-neutral-200">NPC — DM only, hidden from players</SelectItem>
                      <SelectItem value="test" className="text-neutral-200">Test — excluded from roster counts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-neutral-300">Campaign</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {campaigns.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-neutral-500">
                        No campaigns available — ask your DM to add you.
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
                  placeholder="Enter character name"
                  required
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">Stat Generation Method</Label>
                <Select value={statMethod} onValueChange={(v) => setStatMethod(v as StatMethod)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="point_buy" className="text-neutral-200">Point Buy (27 points)</SelectItem>
                    <SelectItem value="standard_array" className="text-neutral-200">Standard Array (15/14/13/12/10/8)</SelectItem>
                    <SelectItem value="rolled" className="text-neutral-200">Rolled (4d6 drop lowest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'Creating…' : 'Create character'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
