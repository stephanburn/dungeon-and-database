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
    <div className="page-shell">
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/dm/dashboard">← Dashboard</Link>
        </Button>

        <Card className="border-white/10 bg-white/[0.04]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-neutral-50">New Campaign</CardTitle>
            <p className="max-w-lg text-sm leading-6 text-neutral-400">
              Start with the fundamentals. You can invite players and refine campaign rules on the next screen.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Campaign Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Embers of the Last War"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Rule Set</Label>
                  <Select value={ruleSet} onValueChange={(value) => setRuleSet(value as RuleSet)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2014" className="text-neutral-200">D&amp;D 5e 2014</SelectItem>
                      <SelectItem value="2024" className="text-neutral-200">D&amp;D 5e 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="panel-subtle p-5">
                <h2 className="section-heading text-base">What happens next</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-400">
                  After creation, you&apos;ll be able to invite members, choose allowed sourcebooks, and tune campaign rules.
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg" className="min-w-44" disabled={creating}>
                  {creating ? 'Creating…' : 'Create campaign'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
