import { createAdminClient } from '@/lib/supabase/admin'

type AuditLogInput = {
  actorUserId: string | null
  action: string
  targetTable: string
  targetId: string
  details?: Record<string, unknown>
  succeeded?: boolean
}

export async function writeAuditLog({
  actorUserId,
  action,
  targetTable,
  targetId,
  details = {},
  succeeded = true,
}: AuditLogInput) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('audit_logs').insert({
    actor_user_id: actorUserId,
    action,
    target_table: targetTable,
    target_id: targetId,
    details,
    succeeded,
  })

  if (error) {
    console.error('Failed to write audit log', {
      action,
      targetTable,
      targetId,
      error: error.message,
    })
  }
}
