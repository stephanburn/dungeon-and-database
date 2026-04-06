import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CampaignAllowlist } from '@/components/dm/CampaignAllowlist'
import { CampaignSettingsForm } from '@/components/dm/CampaignSettingsForm'
import { CampaignMembers } from '@/components/dm/CampaignMembers'

export default async function CampaignSettingsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'dm') redirect('/')

  const [campaignResult, allowlistResult] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', params.id).single(),
    supabase
      .from('campaign_source_allowlist')
      .select('source_key')
      .eq('campaign_id', params.id),
  ])

  if (!campaignResult.data) notFound()

  const campaign = campaignResult.data
  const allowlist = (allowlistResult.data ?? []).map((r) => r.source_key)

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-neutral-400 hover:text-neutral-200 -ml-2">
            <Link href="/dm/dashboard">← Dashboard</Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-neutral-100">{campaign.name}</h1>
          <p className="text-sm text-neutral-400 mt-1">Campaign settings</p>
        </div>

        <CampaignMembers campaignId={params.id} dmId={campaign.dm_id} />
        <CampaignSettingsForm campaign={campaign} />
        <CampaignAllowlist campaignId={params.id} initialAllowlist={allowlist} />
      </div>
    </div>
  )
}
