import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasDmAccess } from '@/lib/auth/roles'
import { LevelUpWizard } from '../LevelUpWizard'
import { buildAsiSelectionsFromRows } from '@/lib/characters/asi-provenance'
import { aggregateCharacterLevels, sortCharacterClassLevels } from '@/lib/characters/class-levels'
import type { SpellOption } from '@/lib/characters/wizard-helpers'
import { loadCampaignWizardContext } from '@/lib/characters/wizard-context'
import type {
  Background,
  CharacterAbilityBonusChoice,
  CharacterAsiChoice,
  Character,
  CharacterClassLevel,
  CharacterFeatChoice,
  CharacterFeatureOptionChoice,
  CharacterLanguageChoice,
  CharacterLevel,
  CharacterSpellSelection,
  CharacterToolChoice,
  Species,
  Spell,
} from '@/lib/types/database'

interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
  character_class_levels: CharacterClassLevel[]
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

  const [speciesResult, backgroundResult, classLevelsResult, skillsResult, abilityBonusChoicesResult, asiChoicesResult, languageChoicesResult, toolChoicesResult, featureOptionChoicesResult, typedSpellSelectionsResult, typedFeatChoicesResult, campaignContext] = await Promise.all([
    character.species_id
      ? supabase.from('species').select('*').eq('id', character.species_id).single()
      : Promise.resolve({ data: null }),
    character.background_id
      ? supabase.from('backgrounds').select('*').eq('id', character.background_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('character_class_levels').select('*').eq('character_id', character.id),
    supabase.from('character_skill_proficiencies').select('*').eq('character_id', character.id),
    supabase.from('character_ability_bonus_choices').select('*').eq('character_id', character.id),
    supabase.from('character_asi_choices').select('*').eq('character_id', character.id),
    supabase.from('character_language_choices').select('*').eq('character_id', character.id),
    supabase.from('character_tool_choices').select('*').eq('character_id', character.id),
    supabase.from('character_feature_option_choices').select('*').eq('character_id', character.id),
    supabase.from('character_spell_selections').select('*').eq('character_id', character.id),
    supabase.from('character_feat_choices').select('*').eq('character_id', character.id),
    loadCampaignWizardContext(supabase, character.campaign_id),
  ])

  const initialSpellChoiceIds = ((typedSpellSelectionsResult.data ?? []) as CharacterSpellSelection[])
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
  const initialAsiChoices = buildAsiSelectionsFromRows((asiChoicesResult.data ?? []) as CharacterAsiChoice[])
  const initialToolChoices = ((toolChoicesResult.data ?? []) as CharacterToolChoice[])
    .map((row) => row.tool)
    .filter((value): value is string => Boolean(value))
  const initialFeatureOptionChoices = (featureOptionChoicesResult.data ?? []) as CharacterFeatureOptionChoice[]

  const spellSelectionRows = initialSpellChoiceIds.length > 0
    ? await supabase.from('spells').select('*').in('id', initialSpellChoiceIds)
    : { data: [] as Spell[] }
  const selectedSpellRowsById = new Map(
    (((typedSpellSelectionsResult.data ?? []) as CharacterSpellSelection[]).map((row) => [row.spell_id, row]))
  )
  const initialSelectedSpells = ((spellSelectionRows.data ?? []) as Spell[]).map((spell) => {
    const selection = selectedSpellRowsById.get(spell.id)
    return {
      ...spell,
      granted_by_subclasses: selection?.granting_subclass_id ? [selection.granting_subclass_id] : [],
      counts_against_selection_limit: selection?.counts_against_selection_limit ?? true,
      source_feature_key: selection?.source_feature_key ?? null,
    } satisfies SpellOption
  })

  const sortedClassLevels = sortCharacterClassLevels((classLevelsResult.data ?? []) as CharacterClassLevel[])
  const characterWithRelations: CharacterWithRelations = {
    ...character,
    species: speciesResult.data ?? null,
    background: backgroundResult.data ?? null,
    character_levels: aggregateCharacterLevels(sortedClassLevels),
    character_class_levels: sortedClassLevels,
  }

  if (!campaignContext) notFound()

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <LevelUpWizard
          character={characterWithRelations}
          campaign={campaignContext.campaign}
          allowedSources={campaignContext.allowedSources}
          allSourceRuleSets={campaignContext.allSourceRuleSets}
          initialSkillProficiencies={(skillsResult.data ?? []).map((row) => row.skill)}
          initialAbilityBonusChoices={initialAbilityBonusChoices}
          initialAsiChoices={initialAsiChoices}
          initialLanguageChoices={initialLanguageChoices}
          initialToolChoices={initialToolChoices}
          initialFeatureOptionChoices={initialFeatureOptionChoices}
          initialSpellChoices={initialSpellChoiceIds}
          initialSpellSelections={(typedSpellSelectionsResult.data ?? []) as CharacterSpellSelection[]}
          initialSelectedSpells={initialSelectedSpells}
          initialFeatChoices={initialFeatChoices}
          isDm={hasDmAccess(profile?.role)}
        />
      </div>
    </div>
  )
}
