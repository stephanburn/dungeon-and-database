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
import { AddToCampaignButton } from '@/components/dm/AddToCampaignButton'
import type { User, Campaign, Character } from '@/lib/types/database'

interface UserRow extends User {
  campaignIds: string[]
  campaignNames: string[]
  characterCount: number
}

export default async function DmUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'dm') redirect('/')

  const [usersResult, membershipsResult, campaignsResult, charactersResult] = await Promise.all([
    supabase.from('users').select('*').order('created_at'),
    supabase.from('campaign_members').select('campaign_id, user_id'),
    supabase.from('campaigns').select('id, name').eq('dm_id', user.id).order('created_at'),
    supabase.from('characters').select('user_id').eq('character_type', 'pc'),
  ])

  const allUsers = (usersResult.data ?? []) as User[]
  const memberships = membershipsResult.data ?? []
  const campaigns = (campaignsResult.data ?? []) as Pick<Campaign, 'id' | 'name'>[]
  const characters = (charactersResult.data ?? []) as Pick<Character, 'user_id'>[]

  const campaignById = Object.fromEntries(campaigns.map((c) => [c.id, c.name]))

  const userRows: UserRow[] = allUsers.map((u) => {
    const userMemberships = memberships.filter((m) => m.user_id === u.id)
    const campaignIds = userMemberships.map((m) => m.campaign_id)
    const campaignNames = campaignIds.map((id) => campaignById[id]).filter(Boolean)
    const characterCount = characters.filter((c) => c.user_id === u.id).length
    return { ...u, campaignIds, campaignNames, characterCount }
  })

  const unassigned = userRows.filter((u) => u.role !== 'dm' && u.campaignIds.length === 0)
  const players = userRows.filter((u) => u.role !== 'dm' && u.campaignIds.length > 0)

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-neutral-400 hover:text-neutral-200 -ml-2">
            <Link href="/dm/dashboard">← Dashboard</Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Users</h1>
          <p className="text-sm text-neutral-400 mt-1">{allUsers.length} registered account{allUsers.length !== 1 ? 's' : ''}</p>
        </div>

        {unassigned.length > 0 && (
          <Card className="border-amber-700 bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-300 text-sm font-semibold flex items-center gap-2">
                <Badge className="bg-amber-800 text-amber-200 border-0">{unassigned.length}</Badge>
                {unassigned.length === 1 ? 'player is' : 'players are'} not in any campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unassigned.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-neutral-200 text-sm font-medium">{u.display_name}</span>
                    <span className="text-neutral-500 text-sm ml-2">{u.email}</span>
                  </div>
                  <AddToCampaignButton
                    userId={u.id}
                    campaigns={campaigns}
                    alreadyIn={u.campaignIds}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-semibold text-neutral-200 mb-4">Assigned Players</h2>
          {players.length === 0 ? (
            <p className="text-neutral-500 text-sm">No players are assigned to your campaigns yet.</p>
          ) : (
            <Card className="bg-neutral-900 border-neutral-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 hover:bg-transparent">
                    <TableHead className="text-neutral-400">Name</TableHead>
                    <TableHead className="text-neutral-400">Email</TableHead>
                    <TableHead className="text-neutral-400">Campaigns</TableHead>
                    <TableHead className="text-neutral-400">Characters</TableHead>
                    <TableHead className="text-neutral-400">Add to campaign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((u) => (
                    <TableRow key={u.id} className="border-neutral-800 hover:bg-neutral-800/30">
                      <TableCell className="text-neutral-200 font-medium">{u.display_name}</TableCell>
                      <TableCell className="text-neutral-400 text-sm">{u.email}</TableCell>
                      <TableCell className="text-neutral-400 text-sm">
                        {u.campaignNames.length > 0
                          ? u.campaignNames.join(', ')
                          : <span className="text-amber-500">None</span>}
                      </TableCell>
                      <TableCell className="text-neutral-400 text-sm">{u.characterCount}</TableCell>
                      <TableCell>
                        <AddToCampaignButton
                          userId={u.id}
                          campaigns={campaigns}
                          alreadyIn={u.campaignIds}
                        />
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
