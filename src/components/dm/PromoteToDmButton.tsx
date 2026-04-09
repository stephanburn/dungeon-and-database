'use client'

import { useRouter } from 'next/navigation'
import { ConfirmActionButton } from '@/components/shared/ConfirmActionButton'
import { useToast } from '@/hooks/use-toast'

interface PromoteToDmButtonProps {
  userId: string
  displayName: string
}

export function PromoteToDmButton({ userId, displayName }: PromoteToDmButtonProps) {
  const router = useRouter()
  const { toast } = useToast()

  async function handlePromote() {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'dm' }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast({
        title: 'Could not promote user',
        description: json.error ?? 'Unknown error',
        variant: 'destructive',
      })
      return false
    }

    toast({ title: `${displayName} is now a DM` })
    router.refresh()
    return true
  }

  return (
    <ConfirmActionButton
      title="Promote to DM?"
      description={`${displayName} will gain DM access, including campaign management and content admin.`}
      triggerLabel="Make DM"
      confirmLabel="Promote"
      pendingLabel="Promoting…"
      onConfirm={handlePromote}
      size="sm"
      className="h-7 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
    />
  )
}
