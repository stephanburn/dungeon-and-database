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
      description={`${displayName} will gain DM access for campaign management and player review.`}
      triggerLabel="Make DM"
      confirmLabel="Promote"
      pendingLabel="Promoting…"
      onConfirm={handlePromote}
      size="sm"
      className="h-7 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
    />
  )
}

interface PromoteToAdminButtonProps {
  userId: string
  displayName: string
}

export function PromoteToAdminButton({ userId, displayName }: PromoteToAdminButtonProps) {
  const router = useRouter()
  const { toast } = useToast()

  async function handlePromote() {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
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

    toast({ title: `${displayName} is now an admin` })
    router.refresh()
    return true
  }

  return (
    <ConfirmActionButton
      title="Promote to admin?"
      description={`${displayName} will be able to manage users, roles, and shared content in addition to DM access.`}
      triggerLabel="Make admin"
      confirmLabel="Promote"
      pendingLabel="Promoting…"
      onConfirm={handlePromote}
      size="sm"
      className="h-7 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
    />
  )
}

interface DemoteToPlayerButtonProps {
  userId: string
  displayName: string
}

export function DemoteToPlayerButton({ userId, displayName }: DemoteToPlayerButtonProps) {
  const router = useRouter()
  const { toast } = useToast()

  async function handleDemote() {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'player' }),
    })

    if (res.status === 204) {
      router.refresh()
      return true
    }

    const json = await res.json()
    if (!res.ok) {
      toast({
        title: 'Could not demote user',
        description: json.error ?? 'Unknown error',
        variant: 'destructive',
      })
      return false
    }

    toast({ title: `${displayName} is now a player` })
    router.refresh()
    return true
  }

  return (
    <ConfirmActionButton
      title="Demote to player?"
      description={`${displayName} will lose DM access and keep only normal player permissions.`}
      triggerLabel="Demote"
      confirmLabel="Demote"
      pendingLabel="Demoting…"
      onConfirm={handleDemote}
      size="sm"
      className="h-7 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
    />
  )
}

interface DemoteToDmButtonProps {
  userId: string
  displayName: string
}

export function DemoteToDmButton({ userId, displayName }: DemoteToDmButtonProps) {
  const router = useRouter()
  const { toast } = useToast()

  async function handleDemote() {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'dm' }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast({
        title: 'Could not demote admin',
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
      title="Demote to DM?"
      description={`${displayName} will lose admin controls but keep DM access for campaign management.`}
      triggerLabel="Make DM"
      confirmLabel="Demote"
      pendingLabel="Updating…"
      onConfirm={handleDemote}
      size="sm"
      className="h-7 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
    />
  )
}

interface DeleteUserButtonProps {
  userId: string
  displayName: string
}

export function DeleteUserButton({ userId, displayName }: DeleteUserButtonProps) {
  const router = useRouter()
  const { toast } = useToast()

  async function handleDelete() {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast({
        title: 'Could not delete user',
        description: json.error ?? 'Unknown error',
        variant: 'destructive',
      })
      return false
    }

    toast({ title: `${displayName} was deleted` })
    router.refresh()
    return true
  }

  return (
    <ConfirmActionButton
      title="Delete user?"
      description={`${displayName}'s account and related auth record will be deleted. This cannot be undone.`}
      triggerLabel="Delete"
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      onConfirm={handleDelete}
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-red-400 hover:bg-red-950/30 hover:text-red-300"
    />
  )
}
