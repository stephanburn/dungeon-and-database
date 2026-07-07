import { createAdminClient } from '@/lib/supabase/admin'

export async function checkDatabaseHealth(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('sources').select('key').limit(1)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
