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
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/dm/dashboard" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-neutral-100 mt-2">Content Library</h1>
          <p className="text-sm text-neutral-400 mt-1">Add and manage game content available to players.</p>
        </div>
        <ContentAdmin />
      </div>
    </div>
  )
}
