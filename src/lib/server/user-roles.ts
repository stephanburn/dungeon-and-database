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

export async function deleteUserById(userId: string) {
  const supabase = createAdminClient()
  return supabase.auth.admin.deleteUser(userId)
}

export async function getSingletonAdminUser() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, email, role')
    .eq('role', 'admin')
    .single()

  return { data, error }
}

export async function reassignOwnedCampaignsToAdmin(dmUserId: string) {
  const supabase = createAdminClient()
  const { data: adminUser, error: adminError } = await getSingletonAdminUser()

  if (adminError || !adminUser) {
    return { count: 0, error: adminError ?? new Error('Singleton admin not found') }
  }

  if (adminUser.id === dmUserId) {
    return { count: 0, error: new Error('Cannot reassign campaigns away from the singleton admin') }
  }

  const { data: campaigns, error: selectError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('dm_id', dmUserId)

  if (selectError) {
    return { count: 0, error: selectError }
  }

  if (!campaigns || campaigns.length === 0) {
    return { count: 0, error: null }
  }

  const { error: updateError } = await supabase
    .from('campaigns')
    .update({ dm_id: adminUser.id })
    .eq('dm_id', dmUserId)

  if (updateError) {
    return { count: 0, error: updateError }
  }

  return { count: campaigns.length, error: null, adminUser }
}
