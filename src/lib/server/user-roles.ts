import { createAdminClient } from '@/lib/supabase/admin'

export async function updateUserRoleById(userId: string, role: 'player' | 'dm') {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select('id, role, display_name')
    .single()

  return { data, error }
}
