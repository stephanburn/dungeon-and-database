export type SkillKey =
  | 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation' | 'investigation'
  | 'medicine' | 'nature' | 'perception' | 'performance' | 'persuasion'
  | 'religion' | 'sleight_of_hand' | 'stealth' | 'survival'

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface SkillDef {
  key: SkillKey
  name: string
  ability: AbilityKey
}

export const SKILLS: SkillDef[] = [
  { key: 'acrobatics',     name: 'Acrobatics',     ability: 'dex' },
  { key: 'animal_handling',name: 'Animal Handling', ability: 'wis' },
  { key: 'arcana',         name: 'Arcana',          ability: 'int' },
  { key: 'athletics',      name: 'Athletics',       ability: 'str' },
  { key: 'deception',      name: 'Deception',       ability: 'cha' },
  { key: 'history',        name: 'History',         ability: 'int' },
  { key: 'insight',        name: 'Insight',         ability: 'wis' },
  { key: 'intimidation',   name: 'Intimidation',    ability: 'cha' },
  { key: 'investigation',  name: 'Investigation',   ability: 'int' },
  { key: 'medicine',       name: 'Medicine',        ability: 'wis' },
  { key: 'nature',         name: 'Nature',          ability: 'int' },
  { key: 'perception',     name: 'Perception',      ability: 'wis' },
  { key: 'performance',    name: 'Performance',     ability: 'cha' },
  { key: 'persuasion',     name: 'Persuasion',      ability: 'cha' },
  { key: 'religion',       name: 'Religion',        ability: 'int' },
  { key: 'sleight_of_hand',name: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth',        name: 'Stealth',         ability: 'dex' },
  { key: 'survival',       name: 'Survival',        ability: 'wis' },
]

export const SKILL_BY_KEY = Object.fromEntries(SKILLS.map((s) => [s.key, s])) as Record<SkillKey, SkillDef>

/** Normalises API kebab-case, title-case, or "skill-*" prefixed strings to a canonical SkillKey. */
export function normalizeSkillKey(raw: string): SkillKey {
  return raw.toLowerCase().replace(/^skill[-_]/, '').replace(/[\s-]/g, '_') as SkillKey
}

export const SAVING_THROW_NAMES: Record<AbilityKey, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}
