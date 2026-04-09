'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="w-full max-w-md border-white/10 bg-white/[0.04]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-[2rem] text-neutral-50">Dungeon &amp; Database</CardTitle>
          <CardDescription className="max-w-sm text-sm leading-6 text-neutral-400">
            {mode === 'magic'
              ? 'Sign in with a one-time link sent to your email.'
              : 'Sign in with your email and password.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {state === 'sent' && (
            <Alert>
              <AlertDescription className="text-neutral-200">
                Magic link sent to <strong>{email}</strong>. Check your inbox to continue.
              </AlertDescription>
            </Alert>
          )}

          {state === 'reset-sent' && (
            <Alert>
              <AlertDescription className="text-neutral-200">
                Password reset email sent to <strong>{email}</strong>.
              </AlertDescription>
            </Alert>
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
              <button
                type="button"
                onClick={() => switchMode('password')}
                disabled={state === 'loading'}
                className="w-full text-sm text-neutral-500 transition-colors hover:text-neutral-200"
              >
                Use password instead
              </button>
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
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={state === 'loading'}
                className="w-full text-sm text-neutral-500 transition-colors hover:text-neutral-200"
              >
                Reset or set password
              </button>
              <button
                type="button"
                onClick={() => switchMode('magic')}
                disabled={state === 'loading'}
                className="w-full text-sm text-neutral-500 transition-colors hover:text-neutral-200"
              >
                Use magic link instead
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
