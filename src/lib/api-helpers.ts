import { createClient } from '@/lib/supabase/server'
import { hasDmAccess, isAdminRole } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'
import type { User } from '@/lib/types/database'

export async function requireAuth(): Promise<
  { user: import('@supabase/supabase-js').User; profile: User; supabase: Awaited<ReturnType<typeof createClient>> } | NextResponse
> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 401 })
  }

  return { user, profile, supabase }
}

export async function requireDm() {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result

  if (!hasDmAccess(result.profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return result
}

export async function requireAdmin() {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result

  if (!isAdminRole(result.profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return result
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function readJsonBody<T>(
  request: Request
): Promise<{ data: T } | { response: NextResponse }> {
  try {
    const data = (await request.json()) as T
    return { data }
  } catch {
    return { response: jsonError('Invalid JSON body', 400) }
  }
}
