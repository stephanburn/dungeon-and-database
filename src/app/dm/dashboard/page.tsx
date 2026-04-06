import { createClient } from '@/lib/supabase/server'
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

  if (profile?.role !== 'dm') redirect('/')

  const [charactersResult, campaignsResult] = await Promise.all([
    supabase
      .from('characters')
      .select(`
        *,
        owner:user_id(display_name),
        campaign:campaign_id(id, name)
      `)
      .order('updated_at', { ascending: false }),
    supabase
      .from('campaigns')
      .select('*')
      .eq('dm_id', user.id)
      .order('created_at'),
  ])

  const characters = (charactersResult.data ?? []) as unknown as CharacterRow[]
  const campaigns = campaignsResult.data ?? []

  const rosterCharacters = characters.filter((c) => c.character_type !== 'test')
  const submitted = rosterCharacters.filter((c) => c.status === 'submitted')

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">DM Dashboard</h1>
            <p className="text-sm text-neutral-400 mt-1">Welcome, {profile.display_name}</p>
          </div>
          <div className="flex gap-3">
            <Button asChild size="sm">
              <Link href="/characters/new">+ New character</Link>
            </Button>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" type="submit" className="text-neutral-400 hover:text-neutral-200">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {/* Pending review banner */}
        {submitted.length > 0 && (
          <Card className="border-blue-700 bg-blue-950/30">
            <CardContent className="py-3 flex items-center gap-2">
              <Badge className="bg-blue-800 text-blue-200 border-0">{submitted.length}</Badge>
              <span className="text-blue-200 text-sm">
                {submitted.length === 1 ? 'character awaits' : 'characters await'} review
              </span>
            </CardContent>
          </Card>
        )}

        {/* Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-200">Campaigns</h2>
            <Button asChild size="sm" variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              <Link href="/dm/campaigns/new">+ New campaign</Link>
            </Button>
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
