import { createClient } from '@/lib/supabase/server'
import { hasDmAccess } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Character, Campaign } from '@/lib/types/database'

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

interface CharacterWithCampaign extends Character {
  campaign: Campaign | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (hasDmAccess(profile?.role)) redirect('/dm/dashboard')

  const { data: characters } = await supabase
    .from('characters')
    .select('*, campaign:campaign_id(id, name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const typedCharacters = (characters ?? []) as unknown as CharacterWithCampaign[]

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">My Characters</h1>
            <p className="text-sm text-neutral-400 mt-1">Welcome, {profile?.display_name}</p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/characters/new">New character</Link>
            </Button>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" type="submit" className="text-neutral-400 hover:text-neutral-200">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {typedCharacters.length === 0 ? (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="py-12 text-center">
              <p className="text-neutral-400 mb-4">No characters yet.</p>
              <Button asChild>
                <Link href="/characters/new">Create your first character</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {typedCharacters.map((char) => (
              <Link key={char.id} href={`/characters/${char.id}`} className="block">
                <Card className="bg-neutral-900 border-neutral-800 hover:border-neutral-600 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-neutral-100">{char.name}</CardTitle>
                      <Badge className={`${STATUS_STYLE[char.status]} border-0 shrink-0`}>
                        {STATUS_LABEL[char.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-400">
                      {(char.campaign as Campaign | null)?.name ?? 'No campaign'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
