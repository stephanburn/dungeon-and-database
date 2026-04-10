import { createClient } from '@/lib/supabase/server'
import { hasDmAccess } from '@/lib/auth/roles'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CharacterSheet } from '@/components/character-sheet/CharacterSheet'
import { DmReviewPanel } from '@/components/dm/DmReviewPanel'
import { DeleteCharacterButton } from './DeleteCharacterButton'
import type { Character, CharacterLevel, Species, Background } from '@/lib/types/database'

interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

export default async function CharacterPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!character) notFound()

  // Players can only access their own characters
  if (!hasDmAccess(profile?.role) && character.user_id !== user.id) {
    redirect('/')
  }

  const [speciesResult, backgroundResult, levelsResult, skillsResult, spellsResult, featResult] = await Promise.all([
    character.species_id
      ? supabase.from('species').select('*').eq('id', character.species_id).single()
      : Promise.resolve({ data: null }),
    character.background_id
      ? supabase.from('backgrounds').select('*').eq('id', character.background_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('character_levels').select('*').eq('character_id', character.id),
    supabase.from('character_skill_proficiencies').select('skill').eq('character_id', character.id),
    supabase.from('character_choices').select('choice_value')
      .eq('character_id', character.id).eq('choice_type', 'spell_known'),
    supabase.from('character_choices').select('choice_value')
      .eq('character_id', character.id).eq('choice_type', 'feat'),
  ])

  const characterWithRelations: CharacterWithRelations = {
    ...character,
    species: speciesResult.data ?? null,
    background: backgroundResult.data ?? null,
    character_levels: levelsResult.data ?? [],
  }

  const initialSkillProficiencies = (skillsResult.data ?? []).map((r) => r.skill)
  const initialSpellChoices = (spellsResult.data ?? [])
    .map((r) => (r.choice_value as { spell_id: string }).spell_id)
    .filter(Boolean)
  const initialFeatChoices = (featResult.data ?? [])
    .map((r) => (r.choice_value as { feat_id: string }).feat_id)
    .filter(Boolean)

  const isDm = hasDmAccess(profile?.role)
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
          character={characterWithRelations}
          campaignId={character.campaign_id}
          initialSkillProficiencies={initialSkillProficiencies}
          initialSpellChoices={initialSpellChoices}
          initialFeatChoices={initialFeatChoices}
          readOnly={false}
          isDm={isDm}
        />

        {isDm && (
          <DmReviewPanel
            characterId={character.id}
            status={character.status}
          />
        )}
      </div>
    </div>
  )
}
