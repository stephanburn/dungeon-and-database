'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteCharacter } from './actions'

interface DeleteCharacterButtonProps {
  characterId: string
  backHref: string
}

export function DeleteCharacterButton({ characterId, backHref }: DeleteCharacterButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this character? This cannot be undone.')) return
    startTransition(() => deleteCharacter(characterId, backHref))
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="text-red-500 hover:text-red-400 hover:bg-red-950/30"
    >
      {isPending ? 'Deleting…' : 'Delete character'}
    </Button>
  )
}
