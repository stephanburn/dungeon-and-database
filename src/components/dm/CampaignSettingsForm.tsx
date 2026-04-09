'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { Campaign, CampaignSettings } from '@/lib/types/database'

interface CampaignSettingsFormProps {
  campaign: Campaign
}

export function CampaignSettingsForm({ campaign }: CampaignSettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const settings = campaign.settings as CampaignSettings
  const [name, setName] = useState(campaign.name)
  const [ruleSet, setRuleSet] = useState(campaign.rule_set ?? '2014')
  const [statMethod, setStatMethod] = useState(settings.stat_method)
  const [maxLevel, setMaxLevel] = useState(settings.max_level)
  const [milestoneLevelling, setMilestoneLevelling] = useState(settings.milestone_levelling)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          rule_set: ruleSet,
          settings: { stat_method: statMethod, max_level: maxLevel, milestone_levelling: milestoneLevelling },
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast({ title: 'Error', description: json.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Campaign settings saved' })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-neutral-200">Campaign Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-neutral-300">Campaign Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Rule Set</Label>
            <Select value={ruleSet} onValueChange={(v) => setRuleSet(v as '2014' | '2024')}>
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

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_160px]">
          <div className="space-y-2">
            <Label className="text-neutral-300">Stat Generation Method</Label>
            <Select value={statMethod} onValueChange={(v) => setStatMethod(v as CampaignSettings['stat_method'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="point_buy" className="text-neutral-200">Point Buy</SelectItem>
                <SelectItem value="standard_array" className="text-neutral-200">Standard Array</SelectItem>
                <SelectItem value="rolled" className="text-neutral-200">Rolled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Maximum Level</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={maxLevel}
              onChange={(e) => setMaxLevel(parseInt(e.target.value, 10) || 20)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
          <Checkbox
            id="milestone"
            checked={milestoneLevelling}
            onChange={(e) => setMilestoneLevelling(e.target.checked)}
          />
          <Label htmlFor="milestone" className="text-neutral-300 cursor-pointer">
            Milestone levelling (ignore experience points)
          </Label>
        </div>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Turn this on if characters level through campaign progression rather than tracked XP.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </CardContent>
    </Card>
  )
}
