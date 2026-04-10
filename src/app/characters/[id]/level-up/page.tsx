import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasDmAccess } from '@/lib/auth/roles'
import { LevelUpWizard } from '../LevelUpWizard'
import type {
  Background,
  Campaign,
  Character,
  CharacterLevel,
  RuleSet,
  Species,
  Spell,
} from '@/lib/types/database'

interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

export default async function CharacterLevelUpPage({ params }: { params: { id: string } }) {
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
  if (!hasDmAccess(profile?.role) && character.user_id !== user.id) {
    redirect('/')
  }

  const canEdit = character.status === 'draft' || character.status === 'changes_requested' || hasDmAccess(profile?.role)
  if (!canEdit) {
    redirect(`/characters/${params.id}`)
  }

  const [speciesResult, backgroundResult, levelsResult, skillsResult, spellsResult, featResult, campaignResult, allowlistResult, sourcesResult] = await Promise.all([
    character.species_id
      ? supabase.from('species').select('*').eq('id', character.species_id).single()
      : Promise.resolve({ data: null }),
    character.background_id
      ? supabase.from('backgrounds').select('*').eq('id', character.background_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('character_levels').select('*').eq('character_id', character.id).order('taken_at'),
    supabase.from('character_skill_proficiencies').select('skill').eq('character_id', character.id),
    supabase.from('character_choices').select('choice_value').eq('character_id', character.id).eq('choice_type', 'spell_known'),
    supabase.from('character_choices').select('choice_value').eq('character_id', character.id).eq('choice_type', 'feat'),
    supabase.from('campaigns').select('*').eq('id', character.campaign_id).single(),
    supabase.from('campaign_source_allowlist').select('source_key').eq('campaign_id', character.campaign_id),
    supabase.from('sources').select('key, rule_set'),
  ])

  const initialSpellChoiceIds = (spellsResult.data ?? [])
    .map((row) => (row.choice_value as { spell_id?: string }).spell_id)
    .filter((value): value is string => Boolean(value))

  const initialFeatChoices = (featResult.data ?? [])
    .map((row) => (row.choice_value as { feat_id?: string }).feat_id)
    .filter((value): value is string => Boolean(value))

  const spellSelectionRows = initialSpellChoiceIds.length > 0
    ? await supabase.from('spells').select('*').in('id', initialSpellChoiceIds)
    : { data: [] as Spell[] }

  const characterWithRelations: CharacterWithRelations = {
    ...character,
    species: speciesResult.data ?? null,
    background: backgroundResult.data ?? null,
    character_levels: levelsResult.data ?? [],
  }

  const campaign = campaignResult.data as Campaign | null
  if (!campaign) notFound()

  const allSourceRuleSets = Object.fromEntries(
    (sourcesResult.data ?? []).map((source) => [source.key, source.rule_set as RuleSet])
  )

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <LevelUpWizard
          character={characterWithRelations}
          campaign={campaign}
          allowedSources={(allowlistResult.data ?? []).map((row) => row.source_key)}
          allSourceRuleSets={allSourceRuleSets}
          initialSkillProficiencies={(skillsResult.data ?? []).map((row) => row.skill)}
          initialSpellChoices={initialSpellChoiceIds}
          initialSpellSelections={(spellSelectionRows.data ?? []) as Spell[]}
          initialFeatChoices={initialFeatChoices}
          isDm={hasDmAccess(profile?.role)}
        />
      </div>
    </div>
  )
}
