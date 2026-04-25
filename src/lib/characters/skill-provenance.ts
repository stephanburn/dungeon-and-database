import type { Background, CharacterSkillProficiency, Class, Feat, Species, Subclass } from '@/lib/types/database'
import type { SkillProficiencyInput } from '@/lib/characters/choice-persistence'
import { SKILLS, normalizeSkillKey, type SkillKey } from '@/lib/skills'

type SkillChoiceBucketsArgs = {
  skillProficiencies: string[]
  background: Background | null
  selectedClass: Class | null
  species: Species | null
}

type SpeciesSkillChoiceConfig = {
  count: number
  from: Set<SkillKey>
  sourceFeatureKey: string
}

type SubclassSkillChoiceConfig = {
  count: number
  from: Set<SkillKey>
  sourceFeatureKey: string
  expertise: boolean
}

export type SkillChoiceBuckets = {
  bgAutoSkills: Set<SkillKey>
  bgChoiceFrom: Set<SkillKey>
  bgChoiceCount: number
  classChoiceFrom: Set<SkillKey>
  classChoiceCount: number
  speciesChoiceFrom: Set<SkillKey>
  speciesChoiceCount: number
  bgChosen: Set<SkillKey>
  classChosen: Set<SkillKey>
  speciesChosen: Set<SkillKey>
  manualChosen: Set<SkillKey>
}

export type SkillSourceRowLike = Pick<
  CharacterSkillProficiency,
  'skill' | 'expertise' | 'source_category' | 'source_entity_id' | 'source_feature_key'
>

export type SkillDisplaySource = {
  label: string
  category: string
  expertise: boolean
}

export type SkillDisplaySummary = {
  sources: SkillDisplaySource[]
  expertise: boolean
}

type SkillPoolName = 'class' | 'background' | 'species'

export function getSpeciesSkillChoiceConfig(species: Species | null): SpeciesSkillChoiceConfig | null {
  if (!species) return null

  if (species.name === 'Orc' && species.source === 'ERftLW') {
    return {
      count: 2,
      from: new Set<SkillKey>([
        'animal_handling',
        'insight',
        'intimidation',
        'medicine',
        'nature',
        'perception',
        'survival',
      ]),
      sourceFeatureKey: 'species_trait:primal_intuition',
    }
  }

  if (species.name === 'Changeling' && species.source === 'ERftLW') {
    return {
      count: 2,
      from: new Set<SkillKey>([
        'deception',
        'insight',
        'intimidation',
        'persuasion',
      ]),
      sourceFeatureKey: 'species_trait:changeling_instincts',
    }
  }

  if (species.name === 'Warforged' && species.source === 'ERftLW') {
    return {
      count: 1,
      from: new Set<SkillKey>(SKILLS.map((skill) => skill.key)),
      sourceFeatureKey: 'species_trait:specialized_design',
    }
  }

  if (species.name === 'Half-Elf' && species.source === 'PHB') {
    return {
      count: 2,
      from: new Set<SkillKey>(SKILLS.map((skill) => skill.key)),
      sourceFeatureKey: 'species_trait:skill_versatility',
    }
  }

  if (species.name === 'Variant Human' && species.source === 'PHB') {
    return {
      count: 1,
      from: new Set<SkillKey>(SKILLS.map((skill) => skill.key)),
      sourceFeatureKey: 'species_trait:variant_human_skill',
    }
  }

  return null
}

export function getSubclassSkillChoiceConfig(subclass: Subclass | null): SubclassSkillChoiceConfig | null {
  if (!subclass) return null

  if (subclass.name === 'Knowledge Domain' && subclass.source === 'PHB') {
    return {
      count: 2,
      from: new Set<SkillKey>(['arcana', 'history', 'nature', 'religion']),
      sourceFeatureKey: 'subclass_feature:knowledge_domain:blessings_of_knowledge',
      expertise: true,
    }
  }

  return null
}

export function allocateSkillChoices(args: {
  chosenSkills: SkillKey[]
  classChoiceFrom: Set<SkillKey>
  classChoiceCount: number
  bgChoiceFrom: Set<SkillKey>
  bgChoiceCount: number
  speciesChoiceFrom: Set<SkillKey>
  speciesChoiceCount: number
}) {
  const normalizedChosen = Array.from(new Set(args.chosenSkills))
  const orderedSkills = [...normalizedChosen].sort((left, right) => {
    const leftCandidates = Number(args.classChoiceFrom.has(left)) + Number(args.bgChoiceFrom.has(left)) + Number(args.speciesChoiceFrom.has(left))
    const rightCandidates = Number(args.classChoiceFrom.has(right)) + Number(args.bgChoiceFrom.has(right)) + Number(args.speciesChoiceFrom.has(right))
    if (leftCandidates !== rightCandidates) return leftCandidates - rightCandidates
    return left.localeCompare(right)
  })

  const initialAssignment = {
    classChosen: new Set<SkillKey>(),
    bgChosen: new Set<SkillKey>(),
    speciesChosen: new Set<SkillKey>(),
    manualChosen: new Set<SkillKey>(),
  }

  let best = initialAssignment
  let bestScore: [number, number, number, number] = [-1, -1, -1, -1]

  function score(assignment: typeof initialAssignment): [number, number, number, number] {
    return [
      assignment.classChosen.size + assignment.bgChosen.size + assignment.speciesChosen.size,
      assignment.classChosen.size,
      assignment.bgChosen.size,
      assignment.speciesChosen.size,
    ]
  }

  function compareScore(left: [number, number, number, number], right: [number, number, number, number]) {
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return left[index] - right[index]
    }
    return 0
  }

  function recurse(index: number, assignment: typeof initialAssignment) {
    if (index >= orderedSkills.length) {
      const nextScore = score(assignment)
      if (compareScore(nextScore, bestScore) > 0) {
        bestScore = nextScore
        best = {
          classChosen: new Set(assignment.classChosen),
          bgChosen: new Set(assignment.bgChosen),
          speciesChosen: new Set(assignment.speciesChosen),
          manualChosen: new Set(assignment.manualChosen),
        }
      }
      return
    }

    const skill = orderedSkills[index]
    const candidates: SkillPoolName[] = []
    if (args.classChoiceFrom.has(skill) && assignment.classChosen.size < args.classChoiceCount) candidates.push('class')
    if (args.bgChoiceFrom.has(skill) && assignment.bgChosen.size < args.bgChoiceCount) candidates.push('background')
    if (args.speciesChoiceFrom.has(skill) && assignment.speciesChosen.size < args.speciesChoiceCount) candidates.push('species')

    for (const candidate of candidates) {
      const nextAssignment = {
        classChosen: new Set(assignment.classChosen),
        bgChosen: new Set(assignment.bgChosen),
        speciesChosen: new Set(assignment.speciesChosen),
        manualChosen: new Set(assignment.manualChosen),
      }
      if (candidate === 'class') nextAssignment.classChosen.add(skill)
      if (candidate === 'background') nextAssignment.bgChosen.add(skill)
      if (candidate === 'species') nextAssignment.speciesChosen.add(skill)
      recurse(index + 1, nextAssignment)
    }

    const manualAssignment = {
      classChosen: new Set(assignment.classChosen),
      bgChosen: new Set(assignment.bgChosen),
      speciesChosen: new Set(assignment.speciesChosen),
      manualChosen: new Set(assignment.manualChosen),
    }
    manualAssignment.manualChosen.add(skill)
    recurse(index + 1, manualAssignment)
  }

  recurse(0, initialAssignment)
  return best
}

export function deriveSkillChoiceBuckets({
  skillProficiencies,
  background,
  selectedClass,
  species,
}: SkillChoiceBucketsArgs): SkillChoiceBuckets {
  const bgAutoSkills = new Set(
    (background?.skill_proficiencies ?? []).map((skill) => normalizeSkillKey(skill))
  )
  const bgChoiceFrom = new Set(
    (background?.skill_choice_from ?? []).map((skill) => normalizeSkillKey(skill))
  )
  const bgChoiceCount = background?.skill_choice_count ?? 0

  const rawClassChoices = selectedClass?.skill_choices as { count?: number; from?: string[] } | null
  const classChoiceFrom = new Set((rawClassChoices?.from ?? []).map(normalizeSkillKey))
  const classChoiceCount = rawClassChoices?.count ?? 0

  const speciesConfig = getSpeciesSkillChoiceConfig(species)
  const speciesChoiceFrom = speciesConfig?.from ?? new Set<SkillKey>()
  const speciesChoiceCount = speciesConfig?.count ?? 0

  const chosen = Array.from(
    new Set(skillProficiencies.map((skill) => normalizeSkillKey(skill)).filter((skill) => !bgAutoSkills.has(skill)))
  )
  const {
    classChosen,
    bgChosen,
    speciesChosen,
    manualChosen,
  } = allocateSkillChoices({
    chosenSkills: chosen,
    classChoiceFrom,
    classChoiceCount,
    bgChoiceFrom,
    bgChoiceCount,
    speciesChoiceFrom,
    speciesChoiceCount,
  })

  return {
    bgAutoSkills,
    bgChoiceFrom,
    bgChoiceCount,
    classChoiceFrom,
    classChoiceCount,
    speciesChoiceFrom,
    speciesChoiceCount,
    bgChosen,
    classChosen,
    speciesChosen,
    manualChosen,
  }
}

export function buildTypedSkillProficiencies(args: SkillChoiceBucketsArgs): SkillProficiencyInput[] {
  const { skillProficiencies, background, selectedClass, species } = args
  const buckets = deriveSkillChoiceBuckets(args)
  const speciesConfig = getSpeciesSkillChoiceConfig(species)

  return Array.from(
    new Set(skillProficiencies.map((skill) => normalizeSkillKey(skill)))
  ).map((skill) => {
    if (buckets.classChosen.has(skill)) {
      return {
        skill,
        expertise: false,
        character_level_id: null,
        source_category: 'class_choice',
        source_entity_id: selectedClass?.id ?? null,
        source_feature_key: null,
      }
    }

    if (buckets.bgChosen.has(skill)) {
      return {
        skill,
        expertise: false,
        character_level_id: null,
        source_category: 'background_choice',
        source_entity_id: background?.id ?? null,
        source_feature_key: null,
      }
    }

    if (buckets.speciesChosen.has(skill)) {
      return {
        skill,
        expertise: false,
        character_level_id: null,
        source_category: 'species_choice',
        source_entity_id: species?.id ?? null,
        source_feature_key: speciesConfig?.sourceFeatureKey ?? null,
      }
    }

    return {
      skill,
      expertise: false,
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    }
  })
}

export function buildSkillDisplaySummaries(args: {
  rows: SkillSourceRowLike[]
  background: Background | null
  species: Species | null
  classes?: Array<Pick<Class, 'id' | 'name'>>
  subclasses?: Array<Pick<Subclass, 'id' | 'name'>>
  feats?: Array<Pick<Feat, 'id' | 'name'>>
}): Map<SkillKey, SkillDisplaySummary> {
  const summaries = new Map<SkillKey, SkillDisplaySummary>()
  const classNameById = new Map((args.classes ?? []).map((entry) => [entry.id, entry.name]))
  const subclassNameById = new Map((args.subclasses ?? []).map((entry) => [entry.id, entry.name]))
  const featNameById = new Map((args.feats ?? []).map((entry) => [entry.id, entry.name]))

  function addSource(skill: SkillKey, source: SkillDisplaySource) {
    const existing = summaries.get(skill) ?? { sources: [], expertise: false }
    const match = existing.sources.find((entry) => entry.label === source.label && entry.category === source.category)
    if (match) {
      match.expertise = match.expertise || source.expertise
    } else {
      existing.sources.push(source)
    }
    existing.expertise = existing.expertise || source.expertise
    summaries.set(skill, existing)
  }

  for (const skill of (args.background?.skill_proficiencies ?? []).map((entry) => normalizeSkillKey(entry))) {
    addSource(skill, {
      label: args.background?.name ?? 'Background',
      category: 'background_auto',
      expertise: false,
    })
  }

  for (const row of args.rows) {
    const skill = normalizeSkillKey(row.skill)
    addSource(skill, {
      label: resolveSkillSourceLabel({
        row,
        background: args.background,
        species: args.species,
        classNameById,
        subclassNameById,
        featNameById,
      }),
      category: row.source_category,
      expertise: row.expertise,
    })
  }

  return summaries
}

function resolveSkillSourceLabel(args: {
  row: SkillSourceRowLike
  background: Background | null
  species: Species | null
  classNameById: Map<string, string>
  subclassNameById: Map<string, string>
  featNameById: Map<string, string>
}) {
  const { row } = args
  const sourceEntityId = row.source_entity_id ?? ''

  switch (row.source_category) {
    case 'class_choice':
    case 'class_feature':
      return args.classNameById.get(sourceEntityId) ?? 'Class'
    case 'background_choice':
    case 'background_feature':
      return args.background?.name ?? 'Background'
    case 'species_choice':
    case 'species_feature':
      return args.species?.name ?? 'Species'
    case 'subclass_choice':
    case 'subclass_feature':
      return args.subclassNameById.get(sourceEntityId) ?? 'Subclass'
    case 'feat':
    case 'feat_choice':
      return args.featNameById.get(sourceEntityId) ?? 'Feat'
    default:
      return 'Manual'
  }
}
