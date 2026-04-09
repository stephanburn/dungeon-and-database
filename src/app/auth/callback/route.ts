import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

const ROLE_DEFAULT_PATH: Record<'dm' | 'player', string> = {
  dm: '/dm/dashboard',
  player: '/',
}

const ROLE_ALLOWED_PATHS: Record<'dm' | 'player', string[]> = {
  dm: ['/dm/dashboard', '/'],
  player: ['/', '/auth/reset-password'],
}

function getWhitelistedRedirectPath(role: 'dm' | 'player', next: string | null): string {
  if (next && ROLE_ALLOWED_PATHS[role].includes(next)) {
    return next
  }

  return ROLE_DEFAULT_PATH[role]
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Determine redirect based on role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role === 'dm' ? 'dm' : 'player'
        const destination = getWhitelistedRedirectPath(role, next)
        return NextResponse.redirect(new URL(destination, origin))
      }
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))
}
