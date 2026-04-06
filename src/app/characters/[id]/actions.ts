'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteCharacter(characterId: string, backHref: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: character } = await supabase
    .from('characters')
    .select('user_id')
    .eq('id', characterId)
    .single()

  if (!character) redirect(backHref)

  // DMs can delete any character; players can only delete their own
  const canDelete = profile?.role === 'dm' || character.user_id === user.id
  if (!canDelete) redirect(backHref)

  await supabase.from('character_levels').delete().eq('character_id', characterId)
  await supabase.from('characters').delete().eq('id', characterId)

  redirect(backHref)
}
