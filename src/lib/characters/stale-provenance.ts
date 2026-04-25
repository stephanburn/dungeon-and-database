import type { StaleProvenanceRow } from '@/lib/types/database'

// Source categories that reference a known content table (and therefore can be
// checked). Unknown / 'manual' categories are assumed valid.
const CATEGORY_TABLE_MAP: Record<string, string> = {
  class: 'class',
  class_choice: 'class',
  class_feature: 'class',
  background: 'background',
  background_choice: 'background',
  background_feature: 'background',
  species: 'species',
  species_choice: 'species',
  species_feature: 'species',
  subclass: 'subclass',
  subclass_choice: 'subclass',
  subclass_feature: 'subclass',
  feat: 'feat',
  feat_choice: 'feat',
  package: 'starting_equipment_package',
  starting_equipment: 'starting_equipment_package',
  feature: 'feature_option',
}

export type KnownEntityIds = {
  class: Set<string>
  background: Set<string>
  species: Set<string>
  subclass: Set<string>
  feat: Set<string>
  starting_equipment_package: Set<string>
  feature_option: Set<string>
}

export type ProvenanceRow = {
  character_id: string
  choice_table: string
  choice_key: string
  source_category: string
  source_entity_id: string | null
  source_feature_key: string | null
}

// Pure in-memory equivalent of the character_stale_provenance SQL view.
// Used in tests and anywhere a live DB round-trip isn't available.
export function detectStaleProvenance(
  rows: ProvenanceRow[],
  known: KnownEntityIds,
): StaleProvenanceRow[] {
  const stale: StaleProvenanceRow[] = []

  for (const row of rows) {
    if (!row.source_entity_id) continue
    if (row.source_category === 'manual') continue

    const entityTable = CATEGORY_TABLE_MAP[row.source_category]
    if (!entityTable) continue

    const knownSet = known[entityTable as keyof KnownEntityIds]
    if (knownSet && !knownSet.has(row.source_entity_id)) {
      stale.push({
        character_id: row.character_id,
        choice_table: row.choice_table,
        choice_key: row.choice_key,
        source_category: row.source_category,
        source_entity_id: row.source_entity_id,
        source_feature_key: row.source_feature_key,
      })
    }
  }

  return stale
}

// Human-readable label for a choice_table value.
export function choiceTableLabel(table: string): string {
  const labels: Record<string, string> = {
    character_skill_proficiencies: 'Skill proficiency',
    character_language_choices: 'Language',
    character_tool_choices: 'Tool proficiency',
    character_ability_bonus_choices: 'Ability score bonus',
    character_feature_option_choices: 'Feature option',
    character_equipment_items: 'Equipment item',
  }
  return labels[table] ?? table
}

// Human-readable label for a source_category value.
export function sourceCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    class_choice: 'class',
    class_feature: 'class feature',
    background_choice: 'background',
    background_feature: 'background feature',
    species_choice: 'species',
    species_feature: 'species feature',
    subclass_choice: 'subclass',
    subclass_feature: 'subclass feature',
    feat: 'feat',
    feat_choice: 'feat',
    package: 'starting equipment package',
    starting_equipment: 'starting equipment package',
    feature: 'feature option',
  }
  return labels[category] ?? category
}
