import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ContentAdmin from '@/components/dm/ContentAdmin'

export default async function DmContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) redirect('/dm/dashboard')

  return (
    <div className="page-shell">
      <div className="page-container space-y-8">
        <div>
          <Link href="/dm/dashboard" className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">
            ← Dashboard
          </Link>
          <h1 className="page-title mt-3">Content Library</h1>
          <p className="page-subtitle">
            Manage the canonical content available to campaigns. Keep sources and core entities tidy, consistent, and easy to scan.
          </p>
        </div>
        <ContentAdmin />
      </div>
    </div>
  )
}
