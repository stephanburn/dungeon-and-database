'use client'

import { useTransition } from 'react'
import { ConfirmActionButton } from '@/components/shared/ConfirmActionButton'
import { deleteCharacter } from './actions'

interface DeleteCharacterButtonProps {
  characterId: string
  backHref: string
}

export function DeleteCharacterButton({ characterId, backHref }: DeleteCharacterButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(() => deleteCharacter(characterId, backHref))
  }

  return (
    <ConfirmActionButton
      title="Delete character?"
      description="This permanently removes the character and its related level data. This action cannot be undone."
      triggerLabel={isPending ? 'Deleting…' : 'Delete character'}
      confirmLabel="Delete character"
      pendingLabel="Deleting…"
      onConfirm={handleConfirm}
      variant="ghost"
      size="sm"
      className="text-red-500 hover:text-red-400 hover:bg-red-950/30"
    />
  )
}
