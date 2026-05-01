export type SpellOptionLike = {
  id: string
}

function stableStringify(value: unknown) {
  return JSON.stringify(value)
}

function sameSpellOption(left: SpellOptionLike, right: SpellOptionLike) {
  return stableStringify(left) === stableStringify(right)
}

export function replaceSpellOptionsStable<TSpell extends SpellOptionLike>(
  current: TSpell[],
  next: TSpell[]
) {
  if (
    current.length === next.length
    && current.every((spell, index) => {
      const nextSpell = next[index]
      return Boolean(nextSpell && spell.id === nextSpell.id && sameSpellOption(spell, nextSpell))
    })
  ) {
    return current
  }

  return next
}

export function mergeSpellOptionsStable<TSpell extends SpellOptionLike>(
  current: TSpell[],
  incoming: TSpell[]
) {
  if (incoming.length === 0) return current

  const mergedById = new Map(current.map((spell) => [spell.id, spell]))
  let changed = false

  for (const spell of incoming) {
    const existing = mergedById.get(spell.id)
    if (!existing || !sameSpellOption(existing, spell)) {
      mergedById.set(spell.id, spell)
      changed = true
    }
  }

  if (!changed) return current
  return Array.from(mergedById.values())
}
