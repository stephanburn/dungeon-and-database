import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

// Slice E1: lock the expected ERftLW player-option surface before Slices E2-E5
// add data. These assertions should FAIL today for the rows under "Missing"
// in `output/eberron-content-audit.md`, and PASS once the corresponding
// content migrations land. The "Present" assertions guard against accidental
// regressions of currently-supported ERftLW content.
//
// The test scans the full migration history rather than a single file, so
// later content slices can land their additions in a fresh migration without
// having to update file paths here.

const migrationsDir = path.join(process.cwd(), 'supabase/migrations')
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort()
const allMigrationsSql = migrationFiles
  .map((name) => fs.readFileSync(path.join(migrationsDir, name), 'utf8'))
  .join('\n')
const e3MigrationSql = migrationFiles
  .filter((name) => name === '071_eberron_e3_dragonmarked_cleanup.sql')
  .map((name) => fs.readFileSync(path.join(migrationsDir, name), 'utf8'))
  .join('\n')
const e4MigrationSql = migrationFiles
  .filter((name) => name === '072_eberron_e4_house_agent_revenant_blade.sql')
  .map((name) => fs.readFileSync(path.join(migrationsDir, name), 'utf8'))
  .join('\n')
const featureGrantsSource = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/characters/feature-grants.ts'),
  'utf8'
)
const languageToolProvenanceSource = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/characters/language-tool-provenance.ts'),
  'utf8'
)
const abilityBonusProvenanceSource = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/characters/species-ability-bonus-provenance.ts'),
  'utf8'
)

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function assertSeeded(value: string, expectations: { kind: string; pattern: RegExp; label: string }[]): void {
  for (const { kind, pattern, label } of expectations) {
    assert.match(
      value,
      pattern,
      `expected ${kind} seed for ${label} in supabase/migrations/*.sql`
    )
  }
}

test('ERftLW: registered as a source key', () => {
  assert.match(
    allMigrationsSql,
    /'ERftLW',\s*'Eberron: Rising from the Last War'/i,
    'ERftLW source row missing from migrations'
  )
})

test('ERftLW: Artificer class and ERftLW subclasses are present', () => {
  assertSeeded(allMigrationsSql, [
    {
      kind: 'class',
      pattern: /'Artificer',[\s\S]*?'ERftLW'/i,
      label: 'Artificer class',
    },
    {
      kind: 'subclass',
      pattern: /'Alchemist',[\s\S]*?'ERftLW'/i,
      label: 'Alchemist (Artificer subclass)',
    },
    {
      kind: 'subclass',
      pattern: /'Artillerist',[\s\S]*?'ERftLW'/i,
      label: 'Artillerist (Artificer subclass)',
    },
    {
      kind: 'subclass',
      pattern: /'Battle Smith',[\s\S]*?'ERftLW'/i,
      label: 'Battle Smith (Artificer subclass)',
    },
  ])
})

test('ERftLW: currently-supported species rows are present', () => {
  for (const name of ['Changeling', 'Warforged', 'Orc']) {
    assert.match(
      allMigrationsSql,
      new RegExp(`'${escapeRegex(name)}',[\\s\\S]*?'ERftLW'`),
      `expected ERftLW species seed for ${name}`
    )
  }
})

test('ERftLW: canonical dragonmarked species rows are present', () => {
  const canonicalDragonmarkRows = [
    'Half-Elf (Mark of Detection)',
    'Half-Elf (Mark of Storm)',
    'Half-Orc (Mark of Finding)',
    'Human (Mark of Finding)',
    'Human (Mark of Handling)',
    'Human (Mark of Making)',
    'Human (Mark of Passage)',
    'Human (Mark of Sentinel)',
    'Halfling (Mark of Healing)',
    'Halfling (Mark of Hospitality)',
    'Dwarf (Mark of Warding)',
    'Gnome (Mark of Scribing)',
    'Elf (Mark of Shadow)',
  ]
  for (const name of canonicalDragonmarkRows) {
    assert.match(
      allMigrationsSql,
      new RegExp(`'${escapeRegex(name)}'`),
      `expected canonical dragonmarked species row for ${name}`
    )
  }
})

test('ERftLW: Aberrant Dragonmark feat is present', () => {
  assert.match(
    allMigrationsSql,
    /'Aberrant Dragonmark'/,
    'Aberrant Dragonmark feat seed missing'
  )
})

// ---------------------------------------------------------------------------
// Cleanup: Slice E3 — dragonmarked species coherence.
// These should fail until E3 lands.
// ---------------------------------------------------------------------------

test('Slice E3 expected: canonical dragonmarked rows receive lineage metadata', () => {
  assert.match(
    e3MigrationSql,
    /UPDATE public\.species[\s\S]*lineage_key\s*=\s*CASE[\s\S]*variant_type\s*=\s*'variant'/i,
    'Slice E3 should update dragonmarked species lineage metadata'
  )

  for (const name of [
    'Half-Elf (Mark of Detection)',
    'Half-Elf (Mark of Storm)',
    'Half-Orc (Mark of Finding)',
    'Human (Mark of Finding)',
    'Human (Mark of Handling)',
    'Human (Mark of Making)',
    'Human (Mark of Passage)',
    'Human (Mark of Sentinel)',
    'Halfling (Mark of Healing)',
    'Halfling (Mark of Hospitality)',
    'Dwarf (Mark of Warding)',
    'Gnome (Mark of Scribing)',
    'Elf (Mark of Shadow)',
  ]) {
    assert.match(
      e3MigrationSql,
      new RegExp(`'${escapeRegex(name)}'`),
      `Slice E3 should carry canonical lineage metadata for ${name}`
    )
  }
})

test('Slice E3 expected: legacy dragonmarked rows and referring characters are purged', () => {
  assert.match(
    e3MigrationSql,
    /DELETE\s+FROM\s+public\.characters[\s\S]*legacy_dragonmarked_species/i,
    'Slice E3 should delete characters that refer to legacy dragonmarked species rows'
  )
  assert.match(
    e3MigrationSql,
    /DELETE\s+FROM\s+public\.species[\s\S]*legacy_dragonmarked_species/i,
    'Slice E3 should delete legacy dragonmarked species rows after dependent characters are removed'
  )
  assert.doesNotMatch(
    e3MigrationSql,
    /variant_type\s*=\s*'legacy'|Legacy compatibility dragonmarked row|lineage_key\s*=\s*'legacy_dragonmark'/i,
    'Slice E3 should purge legacy rows instead of retaining compatibility metadata'
  )
  assert.match(
    e3MigrationSql,
    /FROM\s+public\.character_ability_bonus_choices\s+csac/i,
    'Slice E3 should clean species ability-bonus provenance through the existing ability choice table'
  )
  assert.doesNotMatch(
    e3MigrationSql,
    /character_species_ability_choices/i,
    'Slice E3 should not reference the non-existent character_species_ability_choices table'
  )

  for (const name of [
    'Mark of Detection Half-Elf',
    'Mark of Finding Human',
    'Mark of Finding Half-Orc',
    'Mark of Handling Human',
    'Mark of Making Human',
    'Mark of Passage Human',
    'Mark of Sentinel Human',
    'Mark of Healing Halfling',
    'Mark of Hospitality Halfling',
    'Mark of Warding Dwarf',
    'Mark of Scribing Gnome',
    'Mark of Storm Half-Elf',
    'Mark of Shadow Elf',
  ]) {
    assert.match(
      e3MigrationSql,
      new RegExp(`'${escapeRegex(name)}'`),
      `Slice E3 should explicitly include legacy row ${name} in the purge set`
    )
  }
})

test('Slice E3 expected: runtime helpers stop accepting legacy dragonmarked names', () => {
  for (const name of [
    'Mark of Detection Half-Elf',
    'Mark of Finding Human',
    'Mark of Finding Half-Orc',
    'Mark of Handling Human',
    'Mark of Making Human',
    'Mark of Passage Human',
    'Mark of Sentinel Human',
    'Mark of Healing Halfling',
    'Mark of Hospitality Halfling',
    'Mark of Warding Dwarf',
    'Mark of Scribing Gnome',
    'Mark of Storm Half-Elf',
    'Mark of Shadow Elf',
  ]) {
    assert.doesNotMatch(
      featureGrantsSource,
      new RegExp(escapeRegex(name)),
      `feature grants should no longer accept legacy dragonmarked species ${name}`
    )
    assert.doesNotMatch(
      languageToolProvenanceSource,
      new RegExp(escapeRegex(name)),
      `language/tool provenance should no longer accept legacy dragonmarked species ${name}`
    )
    assert.doesNotMatch(
      abilityBonusProvenanceSource,
      new RegExp(escapeRegex(name)),
      `ability-bonus provenance should no longer accept legacy dragonmarked species ${name}`
    )
  }
})

test('Slice E3 expected: refreshed dragonmark notes avoid stale missing-choice claims', () => {
  assert.match(
    e3MigrationSql,
    /Choice persistence and static trait-granted spells already supported by the app are not listed as missing/i,
    'Slice E3 should document that implemented choice/spell support is no longer a missing-item caveat'
  )
  assert.doesNotMatch(
    e3MigrationSql,
    /still omits the inherited extra language choice|trait-granted casting remains unmodeled|trait-granted .* remain unmodeled/i,
    'Slice E3 migration should not reintroduce stale dragonmark caveats'
  )
})

test('Slice E3 expected: dragonmark spell-list expansion remains intact', () => {
  assert.match(
    e3MigrationSql,
    /species_bonus_spells/i,
    'Slice E3 should explicitly guard dragonmark species_bonus_spells rows'
  )
  assert.doesNotMatch(
    e3MigrationSql,
    /DELETE\s+FROM\s+public\.species_bonus_spells/i,
    'Slice E3 should not delete dragonmark spell-list expansion rows'
  )
})

// ---------------------------------------------------------------------------
// Missing: Slice E2 — species and lineages.
// These should fail until E2 lands.
// ---------------------------------------------------------------------------

test('Slice E2 expected: Kalashtar species seeded under ERftLW', () => {
  assert.match(
    allMigrationsSql,
    /'Kalashtar',[\s\S]*?'ERftLW'/i,
    'Kalashtar species row not yet seeded — owned by Slice E2'
  )
})

test('Slice E2 expected: Shifter parent and four subraces seeded under ERftLW', () => {
  for (const name of [
    'Shifter',
    'Beasthide Shifter',
    'Longtooth Shifter',
    'Swiftstride Shifter',
    'Wildhunt Shifter',
  ]) {
    assert.match(
      allMigrationsSql,
      new RegExp(`'${escapeRegex(name)}',[\\s\\S]*?'ERftLW'`, 'i'),
      `Shifter species row "${name}" not yet seeded — owned by Slice E2`
    )
  }
})

test('Slice E2 expected: Bugbear, Goblin, and Hobgoblin player species seeded under ERftLW', () => {
  for (const name of ['Bugbear', 'Goblin', 'Hobgoblin']) {
    assert.match(
      allMigrationsSql,
      new RegExp(`'${escapeRegex(name)}',[\\s\\S]*?'ERftLW'`, 'i'),
      `Goblinoid player species row "${name}" not yet seeded — owned by Slice E2`
    )
  }
})

// ---------------------------------------------------------------------------
// Missing: Slice E4 — backgrounds, feats, and required equipment.
// These should fail until E4 lands.
// ---------------------------------------------------------------------------

test('Slice E4 expected: House Agent background seeded under ERftLW', () => {
  assert.match(
    e4MigrationSql,
    /INSERT INTO public\.backgrounds[\s\S]*?'House Agent'[\s\S]*?'ERftLW'/i,
    'House Agent background not yet seeded — owned by Slice E4'
  )
  assert.match(
    e4MigrationSql,
    /'House Agent',\s*ARRAY\['Investigation',\s*'Persuasion'\]/i,
    'House Agent should grant Investigation and Persuasion'
  )
  assert.match(
    e4MigrationSql,
    /'House Connections:/i,
    'House Agent should include a concise House Connections feature summary'
  )
  assert.match(
    e4MigrationSql,
    /background:house_agent:erftlw/i,
    'House Agent should point at its starting equipment package'
  )
  assert.match(
    e4MigrationSql,
    /tool-or-language choice/i,
    'House Agent should document the ERftLW mixed tool-or-language choice'
  )
})

test('Slice E4 expected: Revenant Blade feat seeded under ERftLW', () => {
  assert.match(
    e4MigrationSql,
    /INSERT INTO public\.feats[\s\S]*?'Revenant Blade'[\s\S]*?'ERftLW'/i,
    'Revenant Blade feat not yet seeded — owned by Slice E4'
  )
  assert.match(
    e4MigrationSql,
    /"type"\s*:\s*"species"[\s\S]*"lineage"\s*:\s*"elf"/i,
    'Revenant Blade should carry its elf lineage prerequisite in structured data'
  )
  assert.match(
    e4MigrationSql,
    /ability_score_choice[\s\S]*"str"[\s\S]*"dex"/i,
    'Revenant Blade should expose its Strength-or-Dexterity increase as structured benefits'
  )
  assert.match(
    e4MigrationSql,
    /double_bladed_scimitar[\s\S]*finesse[\s\S]*ac_bonus/i,
    'Revenant Blade should describe its double-bladed scimitar riders in benefits'
  )
  assert.match(
    e4MigrationSql,
    /Ability choice, finesse, and AC bonus riders are descriptive until feat-option and equipment combat automation exist/i,
    'Revenant Blade should mark unautomated feat combat riders with a precise amendment note'
  )
})

test('Slice E4 expected: Double-bladed scimitar equipment seeded for Revenant Blade', () => {
  assert.match(
    e4MigrationSql,
    /'double_bladed_scimitar',\s*'Double-bladed Scimitar',\s*'weapon'/,
    'Double-bladed scimitar equipment not yet seeded — owned by Slice E4'
  )
  assert.match(
    e4MigrationSql,
    /'double_bladed_scimitar'\)[\s\S]*?'martial'[\s\S]*?'melee'[\s\S]*?'2d4'[\s\S]*?'slashing'[\s\S]*ARRAY\['special',\s*'two_handed'\]/i,
    'Double-bladed scimitar should be a special two-handed martial melee weapon with 2d4 slashing damage'
  )
})

// ---------------------------------------------------------------------------
// Missing: Slice E5 — artificer infusions as feature options.
// These should fail until E5 lands. The audit doc locks the infusion list;
// the test here only requires the feature-option scaffolding to exist so the
// content shape is committed before Slice E5 fills out the full roster.
// ---------------------------------------------------------------------------

test('Slice E5 expected: artificer infusion option group seeded as feature_option_groups row', () => {
  assert.match(
    allMigrationsSql,
    /INSERT INTO public\.feature_option_groups[\s\S]*?artificer[_-]?infusion/i,
    'Artificer infusion feature_option_groups row not yet seeded — owned by Slice E5'
  )
})

test('Slice E5 expected: representative infusions seeded as feature_options under ERftLW', () => {
  for (const name of [
    'Enhanced Defense',
    'Enhanced Weapon',
    'Enhanced Arcane Focus',
    'Bag of Holding',
    'Repeating Shot',
    'Homunculus Servant',
  ]) {
    assert.match(
      allMigrationsSql,
      new RegExp(`'${escapeRegex(name)}',[\\s\\S]*?'ERftLW'`, 'i'),
      `Infusion option row "${name}" not yet seeded — owned by Slice E5`
    )
  }
})
