'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Mode = 'magic' | 'password'
type State = 'idle' | 'loading' | 'sent' | 'reset-sent' | 'error'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function switchMode(m: Mode) {
    setMode(m)
    setState('idle')
    setErrorMessage('')
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setErrorMessage(error.message); setState('error') }
    else setState('sent')
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setErrorMessage(error.message); setState('error') }
    else router.push('/')
  }

  async function handleForgotPassword() {
    if (!email) { setErrorMessage('Enter your email address first.'); setState('error'); return }
    setState('loading')
    setErrorMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    if (error) { setErrorMessage(error.message); setState('error') }
    else setState('reset-sent')
  }

  return (
    <div className="page-shell flex items-center justify-center">
      <section className="surface-primary w-full max-w-sm px-6 py-7">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal text-neutral-50">Dungeon &amp; Database</h1>
          <p className="max-w-sm text-sm leading-6 text-neutral-400">
            {mode === 'magic'
              ? 'Sign in with a one-time link sent to your email.'
              : 'Sign in with your email and password.'}
          </p>
        </div>
        <div className="mt-6 space-y-5">
          {state === 'sent' && (
            <div role="status" aria-live="polite" className="surface-section px-4 py-3">
              <p className="text-sm leading-6 text-neutral-200">
                Magic link sent to <strong>{email}</strong>. Check your inbox to continue.
              </p>
            </div>
          )}

          {state === 'reset-sent' && (
            <div role="status" aria-live="polite" className="surface-section px-4 py-3">
              <p className="text-sm leading-6 text-neutral-200">
                Password reset email sent to <strong>{email}</strong>.
              </p>
            </div>
          )}

          {state !== 'sent' && state !== 'reset-sent' && mode === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.form?.requestSubmit() }}
                  required
                  disabled={state === 'loading'}
                />
              </div>
              {state === 'error' && <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
              <Button type="submit" size="lg" className="w-full" disabled={state === 'loading'}>
                {state === 'loading' ? 'Sending…' : 'Send magic link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => switchMode('password')}
                disabled={state === 'loading'}
                className="w-full text-neutral-400"
              >
                Use password
              </Button>
            </form>
          )}

          {state !== 'sent' && state !== 'reset-sent' && mode === 'password' && (
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-pw" className="text-neutral-200">Email</Label>
                <Input
                  id="email-pw"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={state === 'loading'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={state === 'loading'}
                />
              </div>
              {state === 'error' && <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
              <Button type="submit" size="lg" className="w-full" disabled={state === 'loading'}>
                {state === 'loading' ? 'Signing in…' : 'Sign in'}
              </Button>
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleForgotPassword}
                  disabled={state === 'loading'}
                  className="w-full text-neutral-400"
                >
                  Reset password
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => switchMode('magic')}
                  disabled={state === 'loading'}
                  className="w-full text-neutral-400"
                >
                  Use magic link
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
