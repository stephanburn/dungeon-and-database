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
    <div className="page-shell">
      <div className="page-container max-w-4xl space-y-8">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Characters</h1>
            <p className="page-subtitle">
              Welcome back, {profile?.display_name}. Pick up where you left off or start a new sheet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild size="lg">
              <Link href="/characters/new">New character</Link>
            </Button>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {typedCharacters.length === 0 ? (
          <Card className="border-white/10 bg-white/[0.04]">
            <CardContent className="py-16 text-center">
              <p className="text-base text-neutral-200">No characters yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">
                Create your first character to start building within your campaign&apos;s rules.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/characters/new">Create your first character</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {typedCharacters.map((char) => (
              <Link key={char.id} href={`/characters/${char.id}`} className="block">
                <Card className="border-white/10 bg-white/[0.03] transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-lg text-neutral-100">{char.name}</CardTitle>
                      <Badge className={`${STATUS_STYLE[char.status]} border-0 shrink-0`}>
                        {STATUS_LABEL[char.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pt-1">
                    <p className="text-sm text-neutral-400">
                      {(char.campaign as Campaign | null)?.name ?? 'No campaign'}
                    </p>
                    <p className="text-sm text-neutral-500">Open</p>
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
