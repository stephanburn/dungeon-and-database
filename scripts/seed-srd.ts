/**
 * SRD Import Script
 *
 * Fetches from the 5e-bits API (https://www.dnd5eapi.co/api) and transforms
 * each entity into the application schema, then upserts into Supabase.
 *
 * Run: npm run seed-srd
 *
 * The script is idempotent — safe to run multiple times.
 * All records receive source: "SRD", amended: false.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const API_BASE = 'https://www.dnd5eapi.co'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Run: source .env.local before executing this script, or set env vars.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ────────────────────────────────────────────────

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`)
  return res.json()
}

async function listAll(endpoint: string): Promise<string[]> {
  const data = await apiFetch(`/api/${endpoint}`)
  return data.results.map((r: { index: string }) => `/api/${endpoint}/${r.index}`)
}

function log(msg: string) {
  console.log(`[seed-srd] ${msg}`)
}

// ── Species (races) ────────────────────────────────────────

async function seedSpecies() {
  log('Seeding species…')
  const paths = await listAll('races')

  for (const path of paths) {
    const race = await apiFetch(path)

    // Upsert traits as species_traits first
    const traitUuids: string[] = []
    for (const traitRef of race.traits ?? []) {
      const trait = await apiFetch(traitRef.url)
      const { data } = await supabase
        .from('species_traits')
        .upsert(
          {
            name: trait.name,
            description: trait.desc?.join('\n') ?? '',
            source: 'SRD',
            amended: false,
          },
          { onConflict: 'name,source', ignoreDuplicates: false }
        )
        .select('id')
        .single()
      if (data) traitUuids.push(data.id)
    }

    // Map ability score bonuses
    const abilityScoreBonuses = (race.ability_bonuses ?? []).map(
      (b: { ability_score: { index: string }; bonus: number }) => ({
        ability: b.ability_score.index,
        bonus: b.bonus,
      })
    )

    const sizeMap: Record<string, string> = {
      Small: 'small', Medium: 'medium', Large: 'large', Tiny: 'tiny',
    }

    await supabase
      .from('species')
      .upsert(
        {
          name: race.name,
          size: sizeMap[race.size] ?? 'medium',
          speed: race.speed ?? 30,
          ability_score_bonuses: abilityScoreBonuses,
          languages: (race.languages ?? []).map((l: { name: string }) => l.name),
          traits: traitUuids,
          source: 'SRD',
          amended: false,
        },
        { onConflict: 'name,source', ignoreDuplicates: false }
      )

    log(`  Species: ${race.name}`)
  }
  log('Species done.')
}

// ── Backgrounds ────────────────────────────────────────────

async function seedBackgrounds() {
  log('Seeding backgrounds…')
  const paths = await listAll('backgrounds')

  for (const path of paths) {
    const bg = await apiFetch(path)

    const skillProfs: string[] = []
    const toolProfs: string[] = []

    for (const prof of bg.starting_proficiencies ?? []) {
      if (prof.type === 'Skills') {
        skillProfs.push(prof.name.replace('Skill: ', ''))
      } else {
        toolProfs.push(prof.name)
      }
    }

    await supabase
      .from('backgrounds')
      .upsert(
        {
          name: bg.name,
          skill_proficiencies: skillProfs,
          tool_proficiencies: toolProfs,
          languages: [],
          starting_equipment: (bg.starting_equipment ?? []).map(
            (e: { equipment: { name: string }; quantity: number }) => ({
              item: e.equipment.name,
              quantity: e.quantity,
            })
          ),
          source: 'SRD',
          amended: false,
        },
        { onConflict: 'name,source', ignoreDuplicates: false }
      )

    log(`  Background: ${bg.name}`)
  }
  log('Backgrounds done.')
}

// ── Classes ────────────────────────────────────────────────

const SPELLCASTING_MAP: Record<string, string> = {
  Bard: 'full', Cleric: 'full', Druid: 'full', Sorcerer: 'full', Wizard: 'full',
  Warlock: 'pact',
  Paladin: 'half', Ranger: 'half',
  'Eldritch Knight': 'third', 'Arcane Trickster': 'third',
  Artificer: 'half',
}

async function seedClasses() {
  log('Seeding classes…')
  const paths = await listAll('classes')

  for (const path of paths) {
    const cls = await apiFetch(path)

    const spellcastingType = SPELLCASTING_MAP[cls.name] ?? null

    const { data: classRow } = await supabase
      .from('classes')
      .upsert(
        {
          name: cls.name,
          hit_die: cls.hit_die,
          primary_ability: cls.saving_throws?.map((s: { index: string }) => s.index) ?? [],
          saving_throw_proficiencies: cls.saving_throws?.map((s: { index: string }) => s.index) ?? [],
          armor_proficiencies: (cls.proficiencies ?? [])
            .filter((p: { type: string }) => p.type === 'Armor')
            .map((p: { name: string }) => p.name),
          weapon_proficiencies: (cls.proficiencies ?? [])
            .filter((p: { type: string }) => p.type === 'Weapons')
            .map((p: { name: string }) => p.name),
          tool_proficiencies: {},
          skill_choices: {
            count: cls.proficiency_choices?.[0]?.choose ?? 2,
            from: (cls.proficiency_choices?.[0]?.from?.options ?? [])
              .map((o: { item: { index: string } }) => o.item?.index)
              .filter(Boolean),
          },
          multiclass_prereqs: [],
          multiclass_proficiencies: {},
          spellcasting_type: spellcastingType,
          source: 'SRD',
          amended: false,
        },
        { onConflict: 'name,source', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (!classRow) continue
    const classId = classRow.id

    // Seed class feature progression
    const levels = await apiFetch(`/api/classes/${cls.index}/levels`)
    const profBonus = [2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6]

    for (const levelData of levels) {
      const lvl: number = levelData.level

      // Upsert features for this level
      const featureUuids: string[] = []
      for (const feat of levelData.features ?? []) {
        const feature = await apiFetch(feat.url)
        const { data } = await supabase
          .from('class_features')
          .upsert(
            {
              name: feature.name,
              description: feature.desc?.join('\n') ?? '',
              source: 'SRD',
              amended: false,
            },
            { onConflict: 'name,source', ignoreDuplicates: false }
          )
          .select('id')
          .single()
        if (data) featureUuids.push(data.id)
      }

      const asiLevels = [4, 8, 12, 16, 19]
      // Fighters and Rogues get extra ASIs — keep it simple for SRD
      const asiAvailable = asiLevels.includes(lvl)

      await supabase
        .from('class_feature_progression')
        .upsert(
          {
            class_id: classId,
            level: lvl,
            features: featureUuids,
            asi_available: asiAvailable,
            proficiency_bonus: profBonus[lvl - 1],
          },
          { onConflict: 'class_id,level', ignoreDuplicates: false }
        )

      // Seed spell slots for spellcasting classes
      if (levelData.spellcasting) {
        const sc = levelData.spellcasting
        const slots = [
          sc.spell_slots_level_1 ?? 0,
          sc.spell_slots_level_2 ?? 0,
          sc.spell_slots_level_3 ?? 0,
          sc.spell_slots_level_4 ?? 0,
          sc.spell_slots_level_5 ?? 0,
          sc.spell_slots_level_6 ?? 0,
          sc.spell_slots_level_7 ?? 0,
          sc.spell_slots_level_8 ?? 0,
          sc.spell_slots_level_9 ?? 0,
        ]

        await supabase
          .from('spell_slot_tables')
          .upsert(
            { class_id: classId, level: lvl, slots_by_spell_level: slots },
            { onConflict: 'class_id,level', ignoreDuplicates: false }
          )
      }
    }

    log(`  Class: ${cls.name}`)
  }
  log('Classes done.')
}

// ── Subclasses ─────────────────────────────────────────────

async function seedSubclasses() {
  log('Seeding subclasses…')
  const paths = await listAll('subclasses')

  for (const path of paths) {
    const sc = await apiFetch(path)

    // Find class by name
    const { data: classRow } = await supabase
      .from('classes')
      .select('id')
      .eq('name', sc.class.name)
      .eq('source', 'SRD')
      .single()

    if (!classRow) {
      log(`  Skipping subclass ${sc.name}: parent class not found`)
      continue
    }

    const { data: subclassRow } = await supabase
      .from('subclasses')
      .upsert(
        {
          name: sc.name,
          class_id: classRow.id,
          choice_level: 3, // SRD default; varies by class but 3 is most common
          source: 'SRD',
          amended: false,
        },
        { onConflict: 'name,class_id,source', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (!subclassRow) continue

    // Seed subclass features
    const subLevels = await apiFetch(`/api/subclasses/${sc.index}/levels`)
    for (const levelData of subLevels) {
      for (const featRef of levelData.features ?? []) {
        const feature = await apiFetch(featRef.url)
        await supabase
          .from('subclass_features')
          .upsert(
            {
              subclass_id: subclassRow.id,
              name: feature.name,
              level: levelData.level,
              description: feature.desc?.join('\n') ?? '',
              source: 'SRD',
              amended: false,
            },
            { onConflict: 'subclass_id,name,level', ignoreDuplicates: false }
          )
      }
    }

    log(`  Subclass: ${sc.name}`)
  }
  log('Subclasses done.')
}

// ── Spells ─────────────────────────────────────────────────

async function seedSpells() {
  log('Seeding spells…')
  const paths = await listAll('spells')

  for (const path of paths) {
    const spell = await apiFetch(path)

    // Parse components
    const compStr: string[] = spell.components ?? []
    const components = {
      verbal: compStr.includes('V'),
      somatic: compStr.includes('S'),
      material: compStr.includes('M'),
      material_description: spell.material ?? undefined,
    }

    // We'll fill class UUIDs after all classes are seeded
    // For now store empty array and update in a second pass if needed.
    // Actually: we need class IDs. Resolve via names.
    const classUuids: string[] = []
    for (const cls of spell.classes ?? []) {
      const { data } = await supabase
        .from('classes')
        .select('id')
        .eq('name', cls.name)
        .eq('source', 'SRD')
        .single()
      if (data) classUuids.push(data.id)
    }

    await supabase
      .from('spells')
      .upsert(
        {
          name: spell.name,
          level: spell.level,
          school: spell.school?.name?.toLowerCase() ?? 'unknown',
          casting_time: spell.casting_time ?? '',
          range: spell.range ?? '',
          components,
          duration: spell.duration ?? '',
          concentration: spell.concentration ?? false,
          ritual: spell.ritual ?? false,
          description: spell.desc?.join('\n') ?? '',
          classes: classUuids,
          source: 'SRD',
          amended: false,
        },
        { onConflict: 'name,source', ignoreDuplicates: false }
      )

    log(`  Spell: ${spell.name}`)
  }
  log('Spells done.')
}

// ── Feats ──────────────────────────────────────────────────

async function seedFeats() {
  log('Seeding feats…')
  const paths = await listAll('feats')

  for (const path of paths) {
    const feat = await apiFetch(path)

    const prerequisites = (feat.prerequisites ?? []).map(
      (p: { type: string; ability_score?: { index: string }; minimum_score?: number; feature?: { name: string } }) => {
        if (p.type === 'ability-score') {
          return { type: 'ability', ability: p.ability_score?.index, min: p.minimum_score }
        }
        if (p.type === 'proficiency') {
          return { type: 'proficiency', feature: p.feature?.name }
        }
        return { type: p.type }
      }
    )

    await supabase
      .from('feats')
      .upsert(
        {
          name: feat.name,
          prerequisites,
          description: feat.desc?.join('\n') ?? '',
          benefits: {},
          source: 'SRD',
          amended: false,
        },
        { onConflict: 'name,source', ignoreDuplicates: false }
      )

    log(`  Feat: ${feat.name}`)
  }
  log('Feats done.')
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  log('Starting SRD import…')
  log(`Target: ${SUPABASE_URL}`)

  try {
    await seedSpecies()
    await seedBackgrounds()
    await seedClasses()
    await seedSubclasses()
    await seedSpells()
    await seedFeats()
    log('SRD import complete.')
  } catch (err) {
    console.error('[seed-srd] Fatal error:', err)
    process.exit(1)
  }
}

main()
