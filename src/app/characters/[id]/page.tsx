import { createClient } from '@/lib/supabase/server'
import { hasDmAccess } from '@/lib/auth/roles'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CharacterSheet } from '@/components/character-sheet/CharacterSheet'
import { DmReviewPanel } from '@/components/dm/DmReviewPanel'
import { StaleProvenancePanel } from '@/components/dm/StaleProvenancePanel'
import { DeleteCharacterButton } from './DeleteCharacterButton'
import { loadCharacterState } from '@/lib/characters/load-character'

export default async function CharacterPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const loadedState = await loadCharacterState(supabase, params.id)
  if (loadedState.status === 'not_found') notFound()
  if (loadedState.status === 'error') {
    throw new Error(loadedState.error.message)
  }
  const state = loadedState.state
  const { character } = state

  // Players can only access their own characters
  if (!hasDmAccess(profile?.role) && character.user_id !== user.id) {
    redirect('/')
  }

  const isDm = hasDmAccess(profile?.role)

  const staleProvenance = isDm
    ? await supabase
        .from('character_stale_provenance')
        .select('*')
        .eq('character_id', params.id)
        .then(({ data }) => data ?? [])
    : []
  const isOwner = character.user_id === user.id
  const backHref = isDm ? '/dm/dashboard' : '/'
  const canEditCharacter = character.status === 'draft' || character.status === 'changes_requested' || isDm

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild className="text-neutral-400 hover:text-neutral-200 -ml-2">
            <Link href={backHref}>← Back</Link>
          </Button>
          <div className="flex items-center gap-2">
            {canEditCharacter && (
              <Button asChild variant="outline" className="border-blue-400/20 bg-blue-400/10 text-blue-50 hover:bg-blue-400/15">
                <Link href={`/characters/${character.id}/level-up`}>Level up</Link>
              </Button>
            )}
            {(isDm || isOwner) && (
              <DeleteCharacterButton characterId={character.id} backHref={backHref} />
            )}
          </div>
        </div>

        <CharacterSheet
          character={state.character}
          campaignId={character.campaign_id}
          initialSkillProficiencies={state.initialSkillProficiencies}
          initialTypedSkillProficiencies={state.initialTypedSkillProficiencies}
          initialAbilityBonusChoices={state.initialAbilityBonusChoices}
          initialAsiChoices={state.initialAsiChoices}
          initialLanguageChoices={state.initialLanguageChoices}
          initialTypedLanguageChoices={state.initialTypedLanguageChoices}
          initialToolChoices={state.initialToolChoices}
          initialTypedToolChoices={state.initialTypedToolChoices}
          initialSpellChoices={state.initialSpellChoices}
          initialSpellSelections={state.initialSpellSelections}
          initialSelectedSpells={state.initialSelectedSpells}
          initialFeatChoices={state.initialFeatChoices}
          initialTypedFeatChoices={state.initialTypedFeatChoices}
          initialFeatureOptionChoices={state.initialFeatureOptionChoices}
          initialEquipmentItems={state.initialEquipmentItems}
          initialLegalityResult={state.legality}
          readOnly={false}
          isDm={isDm}
        />

        {isDm && (
          <>
            <StaleProvenancePanel entries={staleProvenance} />
            <DmReviewPanel
              characterId={character.id}
              status={character.status}
            />
          </>
        )}
      </div>
    </div>
  )
}
