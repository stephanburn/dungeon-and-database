import { createClient } from '@/lib/supabase/server'
import { hasDmAccess, isAdminRole } from '@/lib/auth/roles'
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

  if (!hasDmAccess(profile?.role)) redirect('/')

  const [campaignResult, allowlistResult] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', params.id).single(),
    supabase
      .from('campaign_source_allowlist')
      .select('source_key')
      .eq('campaign_id', params.id),
  ])

  if (!campaignResult.data) notFound()

  const campaign = campaignResult.data
  if (!isAdminRole(profile?.role) && campaign.dm_id !== user.id) notFound()

  const allowlist = (allowlistResult.data ?? []).map((r) => r.source_key)

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/dm/dashboard">← Dashboard</Link>
          </Button>
        </div>

        <div>
          <h1 className="page-title">{campaign.name}</h1>
          <p className="page-subtitle">
            Configure membership, campaign rules, and available source material in one place.
          </p>
        </div>

        <CampaignMembers campaignId={params.id} dmId={campaign.dm_id} />
        <CampaignSettingsForm campaign={campaign} />
        <CampaignAllowlist campaignId={params.id} initialAllowlist={allowlist} />
      </div>
    </div>
  )
}
