import { createClient } from '@/lib/supabase/server'
import { hasDmAccess, isAdminRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Character, User, Campaign } from '@/lib/types/database'

const STATUS_STYLE: Record<string, string> = {
  draft:             'bg-neutral-700 text-neutral-300',
  submitted:         'bg-blue-800 text-blue-200',
  approved:          'bg-green-800 text-green-200',
  changes_requested: 'bg-amber-800 text-amber-200',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted',
  approved: 'Approved', changes_requested: 'Changes Requested',
}

const TYPE_STYLE: Record<string, string> = {
  pc:   '',
  npc:  'bg-purple-800 text-purple-200 border-0 text-xs',
  test: 'bg-neutral-700 text-neutral-400 border-0 text-xs',
}

const TYPE_LABEL: Record<string, string> = {
  pc: 'PC', npc: 'NPC', test: 'Test',
}

interface CharacterRow extends Character {
  owner: Pick<User, 'display_name'> | null
  campaign: Pick<Campaign, 'id' | 'name'> | null
}

export default async function DmDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (!hasDmAccess(profile?.role)) redirect('/')

  const { data: campaignsData } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at')

  const campaigns = (isAdminRole(profile.role)
    ? campaignsData
    : (campaignsData ?? []).filter((campaign) => campaign.dm_id === user.id)) ?? []
  const campaignIds = campaigns.map((campaign) => campaign.id)

  const { data: charactersResult = [] } = campaignIds.length > 0
    ? await supabase
        .from('characters')
        .select(`
          *,
          owner:user_id(display_name),
          campaign:campaign_id(id, name)
        `)
        .in('campaign_id', campaignIds)
        .order('updated_at', { ascending: false })
    : { data: [] }

  const characters = charactersResult as unknown as CharacterRow[]

  const rosterCharacters = characters.filter((c) => c.character_type !== 'test')
  const submitted = rosterCharacters.filter((c) => c.status === 'submitted')
  const recentSubmitted = submitted.slice(0, 5)

  return (
    <div className="page-shell">
      <div className="page-container space-y-10">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">DM Dashboard</h1>
            <p className="page-subtitle">
              Welcome, {profile.display_name}. Review what needs attention, then manage campaigns and roster details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/characters/new">New character</Link>
            </Button>
            <details className="group relative">
              <summary className="list-none cursor-pointer rounded-xl px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-neutral-200">
                Account
              </summary>
              <div className="absolute right-0 mt-2 hidden w-48 rounded-2xl border border-white/10 bg-neutral-900 p-2 shadow-2xl shadow-black/30 group-open:block">
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="text-sm font-medium text-neutral-100">{profile.display_name}</p>
                  <p className="text-xs text-neutral-500">{isAdminRole(profile.role) ? 'Admin account' : 'DM account'}</p>
                </div>
                <form action="/api/auth/logout" method="POST" className="pt-2">
                  <Button
                    variant="ghost"
                    type="submit"
                    className="w-full justify-start"
                  >
                    Sign out
                  </Button>
                </form>
              </div>
            </details>
          </div>
        </div>

        {/* Pending review hero */}
        {submitted.length > 0 && (
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/12 via-blue-500/8 to-white/[0.03]">
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="border-0 bg-blue-400/20 text-blue-100">{submitted.length}</Badge>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Review Queue</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-neutral-100">
                    {submitted.length === 1 ? '1 character needs review' : `${submitted.length} characters need review`}
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-neutral-300">
                    Review the latest submitted sheets first so players are not blocked.
                  </p>
                </div>
                {recentSubmitted[0] && (
                  <Button asChild className="bg-blue-200 text-blue-950 hover:bg-blue-100">
                    <Link href={`/characters/${recentSubmitted[0].id}`}>Open next review</Link>
                  </Button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {recentSubmitted.map((char) => (
                  <Link key={char.id} href={`/characters/${char.id}`}>
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4 transition-colors hover:border-blue-300/30 hover:bg-black/15">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-100">{char.name}</p>
                          <p className="text-sm text-neutral-400">{char.owner?.display_name ?? 'Unknown player'}</p>
                        </div>
                        <Badge className="border-0 bg-blue-400/18 text-blue-100">Submitted</Badge>
                      </div>
                      <p className="mt-3 text-sm text-neutral-500">{char.campaign?.name ?? 'No campaign'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 flex-wrap">
          {isAdminRole(profile.role) && (
            <Button asChild size="sm" variant="outline">
              <Link href="/dm/users">Users</Link>
            </Button>
          )}
          {isAdminRole(profile.role) && (
            <Button asChild size="sm" variant="outline">
              <Link href="/dm/content">Content</Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href="/dm/campaigns/new">New campaign</Link>
          </Button>
        </div>

        {/* Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-200">Campaigns</h2>
          </div>
          {campaigns.length === 0 ? (
            <p className="text-neutral-500 text-sm">No campaigns yet. Create one from the settings page.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/dm/campaigns/${campaign.id}/settings`}>
                  <Card className="h-full border-white/10 bg-white/[0.03] transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-neutral-200 text-base">{campaign.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-neutral-500">Open campaign settings</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Character roster */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-200 mb-4">
            All Characters
            <span className="text-neutral-500 font-normal text-sm ml-2">
              ({rosterCharacters.length} active{characters.length > rosterCharacters.length ? `, ${characters.length - rosterCharacters.length} test` : ''})
            </span>
          </h2>
          {characters.length === 0 ? (
            <p className="text-neutral-500 text-sm">No characters yet.</p>
          ) : (
            <Card className="border-white/10 bg-white/[0.03]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-neutral-400">Character</TableHead>
                    <TableHead className="text-neutral-400">Player</TableHead>
                    <TableHead className="text-neutral-400">Campaign</TableHead>
                    <TableHead className="text-neutral-400">Status</TableHead>
                    <TableHead className="text-neutral-400">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((char) => (
                    <TableRow
                      key={char.id}
                      className={`cursor-pointer${char.character_type === 'test' ? ' opacity-55' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/characters/${char.id}`} className="text-neutral-100 hover:text-white font-medium">
                            {char.name}
                          </Link>
                          {char.character_type !== 'pc' && (
                            <Badge className={TYPE_STYLE[char.character_type]}>
                              {TYPE_LABEL[char.character_type]}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-400">
                        {char.owner?.display_name ?? '—'}
                      </TableCell>
                      <TableCell className="text-neutral-400">
                        {char.campaign?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_STYLE[char.status]} border-0 text-xs`}>
                          {STATUS_LABEL[char.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm">
                        {new Date(char.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
