import type { CheckSeverity } from '@/lib/types/database'
import type { CharacterBuildContext } from '@/lib/characters/build-context'
import type { DerivedCharacter } from '@/lib/characters/derived'

export interface LegalityCheck {
  key: string
  passed: boolean
  message: string
  severity: CheckSeverity
}

export interface LegalityResult {
  passed: boolean
  checks: LegalityCheck[]
  derived?: DerivedCharacter
}

export type LegalityInput = CharacterBuildContext
