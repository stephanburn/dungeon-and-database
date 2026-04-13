import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasDmAccess } from '@/lib/auth/roles'
import { LevelUpWizard } from '../LevelUpWizard'
import type {
  Background,
  Campaign,
  CharacterAbilityBonusChoice,
  Character,
  CharacterFeatChoice,
  CharacterLanguageChoice,
  CharacterLevel,
  CharacterSpellSelection,
  CharacterToolChoice,
  RuleSet,
  Species,
  Spell,
} from '@/lib/types/database'
import {
  extractFeatSpellChoiceMap,
  isFeatSpellSourceFeatureKey,
} from '@/lib/characters/feat-spell-options'

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

  const [speciesResult, backgroundResult, levelsResult, skillsResult, abilityBonusChoicesResult, languageChoicesResult, toolChoicesResult, typedSpellSelectionsResult, typedFeatChoicesResult, campaignResult, allowlistResult, sourcesResult] = await Promise.all([
    character.species_id
      ? supabase.from('species').select('*').eq('id', character.species_id).single()
      : Promise.resolve({ data: null }),
    character.background_id
      ? supabase.from('backgrounds').select('*').eq('id', character.background_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('character_levels').select('*').eq('character_id', character.id).order('taken_at'),
    supabase.from('character_skill_proficiencies').select('*').eq('character_id', character.id),
    supabase.from('character_ability_bonus_choices').select('*').eq('character_id', character.id),
    supabase.from('character_language_choices').select('*').eq('character_id', character.id),
    supabase.from('character_tool_choices').select('*').eq('character_id', character.id),
    supabase.from('character_spell_selections').select('*').eq('character_id', character.id),
    supabase.from('character_feat_choices').select('*').eq('character_id', character.id),
    supabase.from('campaigns').select('*').eq('id', character.campaign_id).single(),
    supabase.from('campaign_source_allowlist').select('source_key').eq('campaign_id', character.campaign_id),
    supabase.from('sources').select('key, rule_set'),
  ])

  const typedSpellSelections = (typedSpellSelectionsResult.data ?? []) as CharacterSpellSelection[]
  const initialSpellChoiceIds = typedSpellSelections
    .filter((row) => !isFeatSpellSourceFeatureKey(row.source_feature_key))
    .map((row) => row.spell_id)
    .filter((value): value is string => Boolean(value))

  const initialFeatChoices = ((typedFeatChoicesResult.data ?? []) as CharacterFeatChoice[])
    .map((row) => row.feat_id)
    .filter((value): value is string => Boolean(value))
  const initialLanguageChoices = ((languageChoicesResult.data ?? []) as CharacterLanguageChoice[])
    .map((row) => row.language)
    .filter((value): value is string => Boolean(value))
  const initialAbilityBonusChoices = ((abilityBonusChoicesResult.data ?? []) as CharacterAbilityBonusChoice[])
    .map((row) => row.ability)
    .filter((value): value is 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' => Boolean(value))
  const initialToolChoices = ((toolChoicesResult.data ?? []) as CharacterToolChoice[])
    .map((row) => row.tool)
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
          initialAbilityBonusChoices={initialAbilityBonusChoices}
          initialLanguageChoices={initialLanguageChoices}
          initialToolChoices={initialToolChoices}
          initialSpellChoices={initialSpellChoiceIds}
          initialFeatSpellChoices={extractFeatSpellChoiceMap(typedSpellSelections)}
          initialSpellSelections={(spellSelectionRows.data ?? []) as Spell[]}
          initialFeatChoices={initialFeatChoices}
          isDm={hasDmAccess(profile?.role)}
        />
      </div>
    </div>
  )
}
