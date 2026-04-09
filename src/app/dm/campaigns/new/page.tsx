'use client'

import { useState } from 'react'
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
import Link from 'next/link'
import type { RuleSet } from '@/lib/types/database'

export default function NewCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [ruleSet, setRuleSet] = useState<RuleSet>('2014')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rule_set: ruleSet }),
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
              <div className="space-y-2">
                <Label className="text-neutral-300">Rule Set</Label>
                <Select value={ruleSet} onValueChange={(value) => setRuleSet(value as RuleSet)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="2014" className="text-neutral-200">D&amp;D 5e 2014</SelectItem>
                    <SelectItem value="2024" className="text-neutral-200">D&amp;D 5e 2024</SelectItem>
                  </SelectContent>
                </Select>
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
