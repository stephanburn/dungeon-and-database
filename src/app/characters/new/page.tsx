import { createClient } from '@/lib/supabase/server'
import { hasDmAccess } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import { CharacterNewForm } from './CharacterNewForm'

export default async function CharacterNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return <CharacterNewForm isDm={hasDmAccess(profile?.role)} />
}
