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
  campaign: { dm_id: string } | null
}

export async function assertCampaignOwnedByDm(
  supabase: SupabaseClient<Database>,
  campaignId: string,
  dmId: string
): Promise<CampaignOwnershipRow | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, dm_id')
    .eq('id', campaignId)
    .eq('dm_id', dmId)
    .single()

  if (error || !data) return null
  return data
}

export async function assertCharacterInDmCampaign(
  supabase: SupabaseClient<Database>,
  characterId: string,
  dmId: string
): Promise<CharacterDmAccessRow | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, user_id, status, campaign_id, campaign:campaign_id(dm_id)')
    .eq('id', characterId)
    .single()

  const character = data as CharacterDmAccessRow | null
  if (error || !character || character.campaign?.dm_id !== dmId) return null
  return character
}
