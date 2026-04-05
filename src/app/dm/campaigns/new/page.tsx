'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function NewCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: json.error, variant: 'destructive' })
        return
      }
      router.push(`/dm/campaigns/${json.id}/settings`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" asChild className="text-neutral-400 hover:text-neutral-200 -ml-2">
          <Link href="/dm/dashboard">← Dashboard</Link>
        </Button>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-100">New Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Campaign Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Embers of the Last War"
                  required
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'Creating…' : 'Create campaign'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
