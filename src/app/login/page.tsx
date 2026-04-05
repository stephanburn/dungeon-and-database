'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMessage(error.message)
      setState('error')
    } else {
      setState('sent')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <Card className="w-full max-w-sm bg-neutral-900 border-neutral-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-neutral-100">Dungeon &amp; Database</CardTitle>
          <CardDescription className="text-neutral-400">
            Enter your email to receive a magic link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state === 'sent' ? (
            <Alert className="border-neutral-700 bg-neutral-800">
              <AlertDescription className="text-neutral-200">
                Check your email — a magic link is on its way to <strong>{email}</strong>.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={state === 'loading'}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500"
                />
              </div>

              {state === 'error' && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={state === 'loading'}
              >
                {state === 'loading' ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
