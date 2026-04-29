import { isAdminRole } from '@/lib/auth/roles'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type CampaignOwnershipRow = {
  id: string
  dm_id: string
}

type CharacterDmAccessRow = {
  id: string
  user_id: string
  status: Database['public']['Tables']['characters']['Row']['status']
  campaign_id: string
  updated_at: string
  campaign: { dm_id: string } | null
}

export async function assertCampaignManageableByUser(
  supabase: SupabaseClient<Database>,
  campaignId: string,
  userId: string,
  role: Database['public']['Tables']['users']['Row']['role']
): Promise<CampaignOwnershipRow | null> {
  let query = supabase
    .from('campaigns')
    .select('id, dm_id')
    .eq('id', campaignId)

  if (!isAdminRole(role)) {
    query = query.eq('dm_id', userId)
  }

  const { data, error } = await query.single()

  if (error || !data) return null
  return data
}

export async function assertCharacterManageableByUser(
  supabase: SupabaseClient<Database>,
  characterId: string,
  userId: string,
  role: Database['public']['Tables']['users']['Row']['role']
): Promise<CharacterDmAccessRow | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, user_id, status, campaign_id, updated_at, campaign:campaign_id(dm_id)')
    .eq('id', characterId)
    .single()

  const character = data as CharacterDmAccessRow | null
  if (
    error ||
    !character ||
    (!isAdminRole(role) && character.campaign?.dm_id !== userId)
  ) return null
  return character
}

export async function assertCharacterAccessibleByUser(
  supabase: SupabaseClient<Database>,
  characterId: string,
  userId: string,
  role: Database['public']['Tables']['users']['Row']['role']
): Promise<CharacterDmAccessRow | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, user_id, status, campaign_id, updated_at, campaign:campaign_id(dm_id)')
    .eq('id', characterId)
    .single()

  const character = data as CharacterDmAccessRow | null
  if (
    error ||
    !character ||
    (!isAdminRole(role) &&
      character.user_id !== userId &&
      character.campaign?.dm_id !== userId)
  ) return null
  return character
}

export async function assertCharacterOwnedByUser(
  supabase: SupabaseClient<Database>,
  characterId: string,
  userId: string
): Promise<CharacterDmAccessRow | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, user_id, status, campaign_id, updated_at, campaign:campaign_id(dm_id)')
    .eq('id', characterId)
    .single()

  const character = data as CharacterDmAccessRow | null
  if (error || !character || character.user_id !== userId) return null
  return character
}
