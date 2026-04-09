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
    .eq('dm_id', user.id)
    .order('created_at')

  const campaigns = campaignsData ?? []
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
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">DM Dashboard</h1>
            <p className="text-sm text-neutral-400 mt-1">Welcome, {profile.display_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild size="sm">
              <Link href="/characters/new">+ New character</Link>
            </Button>
            <details className="group relative">
              <summary className="list-none cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200">
                Account
              </summary>
              <div className="absolute right-0 mt-2 hidden w-44 rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl group-open:block">
                <div className="border-b border-neutral-800 px-3 py-2">
                  <p className="text-sm font-medium text-neutral-100">{profile.display_name}</p>
                  <p className="text-xs text-neutral-500">{isAdminRole(profile.role) ? 'Admin account' : 'DM account'}</p>
                </div>
                <form action="/api/auth/logout" method="POST" className="pt-2">
                  <Button
                    variant="ghost"
                    type="submit"
                    className="w-full justify-start text-neutral-300 hover:bg-neutral-800 hover:text-white"
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
          <Card className="border-blue-700 bg-gradient-to-br from-blue-950/60 to-neutral-900">
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-800 text-blue-200 border-0">{submitted.length}</Badge>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Review Queue</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-neutral-100">
                    {submitted.length === 1 ? '1 character needs review' : `${submitted.length} characters need review`}
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Review the latest submitted sheets first so players are not blocked.
                  </p>
                </div>
                {recentSubmitted[0] && (
                  <Button asChild className="bg-blue-700 text-white hover:bg-blue-600">
                    <Link href={`/characters/${recentSubmitted[0].id}`}>Open next review</Link>
                  </Button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {recentSubmitted.map((char) => (
                  <Link key={char.id} href={`/characters/${char.id}`}>
                    <div className="rounded-xl border border-blue-900/70 bg-neutral-950/50 p-4 transition-colors hover:border-blue-600">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-100">{char.name}</p>
                          <p className="text-sm text-neutral-400">{char.owner?.display_name ?? 'Unknown player'}</p>
                        </div>
                        <Badge className="bg-blue-900/70 text-blue-200 border-0">Submitted</Badge>
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
            <Button asChild size="sm" variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              <Link href="/dm/users">Users</Link>
            </Button>
          )}
          {isAdminRole(profile.role) && (
            <Button asChild size="sm" variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              <Link href="/dm/content">Content</Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <Link href="/dm/campaigns/new">+ New campaign</Link>
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
            <div className="flex gap-3 flex-wrap">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/dm/campaigns/${campaign.id}/settings`}>
                  <Card className="bg-neutral-900 border-neutral-800 hover:border-neutral-600 transition-colors cursor-pointer w-60">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-neutral-200 text-base">{campaign.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-neutral-500">Settings →</p>
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
            <Card className="bg-neutral-900 border-neutral-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 hover:bg-transparent">
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
                      className={`border-neutral-800 hover:bg-neutral-800/50 cursor-pointer${char.character_type === 'test' ? ' opacity-50' : ''}`}
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
