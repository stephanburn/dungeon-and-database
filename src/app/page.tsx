import { createClient } from '@/lib/supabase/server'
import { hasDmAccess } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
              Welcome back, {profile?.display_name}. Continue a character or start a new one.
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
          <Card className="surface-primary">
            <CardContent className="py-16 text-center">
              <p className="text-base text-neutral-200">No characters yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">
                Start a character within your campaign&apos;s rules.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/characters/new">Create character</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {typedCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.id}`}
                aria-label={`Open ${char.name}`}
                className="surface-row flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-medium text-neutral-100">{char.name}</p>
                  <p className="truncate text-sm text-neutral-400">
                    {(char.campaign as Campaign | null)?.name ?? 'No campaign'}
                  </p>
                </div>
                <Badge className={`${STATUS_STYLE[char.status]} shrink-0 border-0`}>
                  {STATUS_LABEL[char.status]}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
