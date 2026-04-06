'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Member {
  id: string
  display_name: string
  email: string
  role: string
}

interface CampaignMembersProps {
  campaignId: string
  dmId: string
}

export function CampaignMembers({ campaignId, dmId }: CampaignMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/members`)
      .then((r) => r.json())
      .then(setMembers)
  }, [campaignId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError('')
    const res = await fetch(`/api/campaigns/${campaignId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error)
    } else {
      setMembers((prev) =>
        prev.some((m) => m.id === json.id)
          ? prev
          : [...prev, { id: json.id, display_name: json.display_name, email, role: 'player' }]
      )
      setEmail('')
    }
    setAdding(false)
  }

  async function handleRemove(userId: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== userId))
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-neutral-100 text-base">Campaign Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm">
              <span className="text-neutral-200">
                {m.display_name}
                <span className="text-neutral-500 ml-2">{m.email}</span>
              </span>
              {m.id !== dmId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(m.id)}
                  className="text-neutral-500 hover:text-red-400 h-6 px-2"
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
          {members.length === 0 && (
            <li className="text-neutral-500 text-sm">No members yet.</li>
          )}
        </ul>

        <form onSubmit={handleAdd} className="space-y-2">
          <Label className="text-neutral-300 text-sm">Add player by email</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={adding}
              className="bg-neutral-800 border-neutral-700 text-neutral-100 h-8 text-sm"
            />
            <Button type="submit" size="sm" disabled={adding}>
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </form>
      </CardContent>
    </Card>
  )
}
