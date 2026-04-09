import { createAdminClient } from '@/lib/supabase/admin'

export async function updateUserRoleById(userId: string, role: 'player' | 'dm' | 'admin') {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select('id, role, display_name')
    .single()

  return { data, error }
}

export async function deleteUserById(userId: string) {
  const supabase = createAdminClient()
  return supabase.auth.admin.deleteUser(userId)
}
