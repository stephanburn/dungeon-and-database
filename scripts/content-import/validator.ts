export type ContentImportSource = {
  key: string
  name: string
}

export type ContentImportClass = {
  key: string
  name: string
  source: string
  progression: Array<{
    level: number
    proficiency_bonus: number
    asi_available?: boolean
  }>
  language_keys?: string[]
  tool_keys?: string[]
}

export type ContentImportSubclass = {
  key: string
  name: string
  class_key: string
  source: string
  choice_level: number
}

export type ContentImportSpell = {
  key: string
  name: string
  level: number
  source: string
  class_keys: string[]
}

export type ContentImportKeyedRow = {
  key: string
  name: string
  source: string
  amended?: boolean
  amendment_note?: string | null
}

export type ContentImportEquipmentItem = ContentImportKeyedRow & {
  item_category: string
}

export type ContentImportFeatureOptionGroup = {
  key: string
  label: string
  source: string
  amended?: boolean
  amendment_note?: string | null
  owner_table: 'classes' | 'subclasses' | 'species' | 'backgrounds'
  owner_key: string
}

export type ContentImportFeatureOption = {
  key: string
  group_key: string
  label: string
  source: string
  amended?: boolean
  amendment_note?: string | null
}

export type ContentImportFeatureSpellGrant = {
  feature_key: string
  spell_key: string
  source: string
}

export type ContentImportStartingEquipmentPackage = {
  key: string
  name: string
  source: string
  amended?: boolean
  amendment_note?: string | null
  items: Array<{
    item_key: string
    quantity: number
  }>
}

export type ContentImportBundle = {
  sources?: ContentImportSource[]
  classes?: ContentImportClass[]
  subclasses?: ContentImportSubclass[]
  spells?: ContentImportSpell[]
  languages?: ContentImportKeyedRow[]
  tools?: ContentImportKeyedRow[]
  equipmentItems?: ContentImportEquipmentItem[]
  featureOptionGroups?: ContentImportFeatureOptionGroup[]
  featureOptions?: ContentImportFeatureOption[]
  featureSpellGrants?: ContentImportFeatureSpellGrant[]
  startingEquipmentPackages?: ContentImportStartingEquipmentPackage[]
}

export type ContentImportValidationError = {
  code:
    | 'duplicate_record'
    | 'missing_reference'
    | 'invalid_progression'
    | 'orphaned_option_group'
    | 'orphaned_option'
    | 'spell_list_mismatch'
    | 'ambiguous_spell_reference'
  table: string
  entityKey: string
  message: string
  ownerSlice: '6e'
}

export type ContentImportValidationResult = {
  ok: boolean
  errors: ContentImportValidationError[]
}

function keySet(rows: Array<{ key: string }> = []): Set<string> {
  return new Set(rows.map((row) => row.key))
}

function addError(
  errors: ContentImportValidationError[],
  code: ContentImportValidationError['code'],
  table: string,
  entityKey: string,
  message: string
) {
  errors.push({ code, table, entityKey, message, ownerSlice: '6e' })
}

function recordDuplicates(
  errors: ContentImportValidationError[],
  table: string,
  rows: Array<{ key: string }> = []
) {
  const seen = new Set<string>()
  const emitted = new Set<string>()

  for (const row of rows) {
    if (!seen.has(row.key)) {
      seen.add(row.key)
      continue
    }

    if (emitted.has(row.key)) continue
    emitted.add(row.key)
    addError(errors, 'duplicate_record', table, row.key, `${table}.${row.key} appears more than once in the import bundle.`)
  }
}

function validateProgression(
  errors: ContentImportValidationError[],
  row: ContentImportClass
) {
  if (row.progression.length === 0) {
    addError(errors, 'invalid_progression', 'classes', row.key, 'Class progression must include at least level 1.')
    return
  }

  const levels = new Set<number>()
  for (let index = 0; index < row.progression.length; index += 1) {
    const entry = row.progression[index]
    const expectedLevel = index + 1

    if (
      entry.level !== expectedLevel ||
      levels.has(entry.level) ||
      entry.proficiency_bonus < 2 ||
      entry.proficiency_bonus > 6
    ) {
      addError(errors, 'invalid_progression', 'classes', row.key, 'Class progression must be contiguous from level 1 with valid proficiency bonuses.')
      return
    }

    levels.add(entry.level)
  }
}

function validateRequiredKeys(
  errors: ContentImportValidationError[],
  table: string,
  entityKey: string,
  referencedTable: string,
  available: Set<string>,
  keys: string[] = []
) {
  for (const key of keys) {
    if (!available.has(key)) {
      addError(errors, 'missing_reference', table, entityKey, `${table}.${entityKey} references missing ${referencedTable}.${key}.`)
    }
  }
}

function validateSpellLists(
  errors: ContentImportValidationError[],
  spell: ContentImportSpell,
  classKeys: Set<string>
) {
  validateRequiredKeys(errors, 'spells', spell.key, 'classes', classKeys, spell.class_keys)

  if (spell.class_keys.length === 0) {
    addError(errors, 'spell_list_mismatch', 'spells', spell.key, 'Spell rows must list at least one owning class for picker validation.')
    return
  }

  if (spell.class_keys.some((classKey) => !classKeys.has(classKey))) return

  if (spell.level > 0 && spell.class_keys.some((classKey) => classKey === 'fighter' || classKey === 'rogue')) {
    addError(errors, 'spell_list_mismatch', 'spells', spell.key, 'Leveled fighter/rogue spell access should be represented by subclass restriction rules, not the base spell list.')
  }
}

function validateFeatureSpellGrants(
  errors: ContentImportValidationError[],
  grants: ContentImportFeatureSpellGrant[] = [],
  spells: ContentImportSpell[] = []
) {
  const spellCounts = new Map<string, number>()
  for (const spell of spells) {
    spellCounts.set(spell.key, (spellCounts.get(spell.key) ?? 0) + 1)
  }

  for (const grant of grants) {
    const count = spellCounts.get(grant.spell_key) ?? 0
    if (count === 0) {
      addError(errors, 'missing_reference', 'feature_spell_grants', grant.feature_key, `Feature spell grant references missing spell ${grant.spell_key}.`)
    } else if (count > 1) {
      addError(errors, 'ambiguous_spell_reference', 'feature_spell_grants', grant.feature_key, `Feature spell grant ${grant.feature_key} resolves ${grant.spell_key} to ${count} spell rows.`)
    }
  }
}

export function validateContentImport(bundle: ContentImportBundle): ContentImportValidationResult {
  const errors: ContentImportValidationError[] = []

  const classes = bundle.classes ?? []
  const subclasses = bundle.subclasses ?? []
  const spells = bundle.spells ?? []
  const languages = bundle.languages ?? []
  const tools = bundle.tools ?? []
  const equipmentItems = bundle.equipmentItems ?? []
  const featureOptionGroups = bundle.featureOptionGroups ?? []
  const featureOptions = bundle.featureOptions ?? []
  const startingEquipmentPackages = bundle.startingEquipmentPackages ?? []

  recordDuplicates(errors, 'sources', bundle.sources ?? [])
  recordDuplicates(errors, 'classes', classes)
  recordDuplicates(errors, 'subclasses', subclasses)
  recordDuplicates(errors, 'spells', spells)
  recordDuplicates(errors, 'languages', languages)
  recordDuplicates(errors, 'tools', tools)
  recordDuplicates(errors, 'equipment_items', equipmentItems)
  recordDuplicates(errors, 'feature_option_groups', featureOptionGroups)
  recordDuplicates(errors, 'feature_options', featureOptions)
  recordDuplicates(errors, 'starting_equipment_packages', startingEquipmentPackages)

  const classKeys = keySet(classes)
  const subclassKeys = keySet(subclasses)
  const languageKeys = keySet(languages)
  const toolKeys = keySet(tools)
  const equipmentKeys = keySet(equipmentItems)
  const groupKeys = keySet(featureOptionGroups)

  for (const row of classes) {
    validateProgression(errors, row)
    validateRequiredKeys(errors, 'classes', row.key, 'languages', languageKeys, row.language_keys)
    validateRequiredKeys(errors, 'classes', row.key, 'tools', toolKeys, row.tool_keys)
  }

  for (const row of subclasses) {
    validateRequiredKeys(errors, 'subclasses', row.key, 'classes', classKeys, [row.class_key])
  }

  for (const spell of spells) {
    validateSpellLists(errors, spell, classKeys)
  }

  for (const group of featureOptionGroups) {
    const ownerKeys = group.owner_table === 'classes'
      ? classKeys
      : group.owner_table === 'subclasses'
        ? subclassKeys
        : new Set<string>()

    if (!ownerKeys.has(group.owner_key)) {
      addError(errors, 'orphaned_option_group', 'feature_option_groups', group.key, `Feature option group ${group.key} references missing ${group.owner_table}.${group.owner_key}.`)
    }
  }

  for (const option of featureOptions) {
    if (!groupKeys.has(option.group_key)) {
      addError(errors, 'orphaned_option', 'feature_options', option.key, `Feature option ${option.key} references missing group ${option.group_key}.`)
    }
  }

  validateFeatureSpellGrants(errors, bundle.featureSpellGrants, spells)

  for (const equipmentPackage of startingEquipmentPackages) {
    for (const item of equipmentPackage.items) {
      if (!equipmentKeys.has(item.item_key)) {
        addError(
          errors,
          'missing_reference',
          'starting_equipment_packages',
          equipmentPackage.key,
          `Starting equipment package ${equipmentPackage.key} references missing equipment_items.${item.item_key}.`
        )
      }
    }
  }

  return { ok: errors.length === 0, errors }
}
