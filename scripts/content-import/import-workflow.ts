import {
  validateContentImport,
  type ContentImportBundle,
  type ContentImportValidationResult,
} from './validator'

export type ContentImportTable =
  | 'sources'
  | 'languages'
  | 'tools'
  | 'equipment_items'
  | 'feature_option_groups'
  | 'feature_options'
  | 'starting_equipment_packages'

export type ContentImportSnapshotRow = {
  key: string
  name?: string
  label?: string
  full_name?: string
  source?: string
  amended?: boolean
  amendment_note?: string | null
  retired?: boolean
  [key: string]: unknown
}

export type ContentImportSnapshot = Partial<Record<ContentImportTable, ContentImportSnapshotRow[]>>

export type ContentImportDiffStatus = 'create' | 'update' | 'retire' | 'no-op'

export type ContentImportDiffRow = {
  table: ContentImportTable
  key: string
  label: string
  source: string | null
  status: ContentImportDiffStatus
  amended: boolean
  amendmentNote: string | null
  changedFields: string[]
  nextRow: ContentImportSnapshotRow | null
}

export type ContentImportPlanSummary = {
  create: number
  update: number
  retire: number
  noOp: number
}

export type ContentImportPlan = {
  ok: boolean
  validation: ContentImportValidationResult
  summary: ContentImportPlanSummary
  rows: ContentImportDiffRow[]
}

export type ContentImportPlanOptions = {
  retireMissing?: boolean
}

export type ContentImportApplyResult = {
  ok: boolean
  validation: ContentImportValidationResult
  plan: ContentImportPlan
  nextSnapshot: ContentImportSnapshot
  appliedRows: ContentImportDiffRow[]
}

const TABLE_ORDER: ContentImportTable[] = [
  'sources',
  'languages',
  'tools',
  'equipment_items',
  'feature_option_groups',
  'feature_options',
  'starting_equipment_packages',
]

const STATUS_LABELS: Record<ContentImportDiffStatus, string> = {
  create: 'Create',
  update: 'Update',
  retire: 'Retire',
  'no-op': 'No change',
}

function sortByKey<T extends { key: string }>(rows: T[] = []) {
  return [...rows].sort((left, right) => left.key.localeCompare(right.key))
}

function normalizeRow(row: ContentImportSnapshotRow): ContentImportSnapshotRow {
  const normalized = Object.fromEntries(
    Object.entries(row)
      .filter(([, value]) => value !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
  ) as ContentImportSnapshotRow

  normalized.amended = Boolean(row.amended)
  normalized.amendment_note = row.amendment_note ?? null
  return normalized
}

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map((entry) => stableValue(entry)))
  if (value && typeof value === 'object') {
    return JSON.stringify(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)))
  }
  return JSON.stringify(value ?? null)
}

function changedFields(
  existing: ContentImportSnapshotRow | undefined,
  next: ContentImportSnapshotRow
) {
  if (!existing) return []
  const existingNormalized = normalizeRow(existing)
  const nextNormalized = normalizeRow(next)
  const keys = new Set([
    ...Object.keys(existingNormalized),
    ...Object.keys(nextNormalized),
  ])
  keys.delete('retired')
  return Array.from(keys)
    .filter((key) => stableValue(existingNormalized[key]) !== stableValue(nextNormalized[key]))
    .sort()
}

function rowLabel(row: ContentImportSnapshotRow) {
  return String(row.name ?? row.label ?? row.full_name ?? row.key)
}

function rowSource(row: ContentImportSnapshotRow) {
  return typeof row.source === 'string' ? row.source : null
}

function addBundleRows(
  rowsByTable: Map<ContentImportTable, ContentImportSnapshotRow[]>,
  table: ContentImportTable,
  rows: ContentImportSnapshotRow[] = []
) {
  rowsByTable.set(table, sortByKey(rows.map(normalizeRow)))
}

function bundleRows(bundle: ContentImportBundle) {
  const rowsByTable = new Map<ContentImportTable, ContentImportSnapshotRow[]>()

  addBundleRows(rowsByTable, 'sources', (bundle.sources ?? []).map((row) => ({
    key: row.key,
    name: row.name,
  })))
  addBundleRows(rowsByTable, 'languages', bundle.languages ?? [])
  addBundleRows(rowsByTable, 'tools', bundle.tools ?? [])
  addBundleRows(rowsByTable, 'equipment_items', bundle.equipmentItems ?? [])
  addBundleRows(rowsByTable, 'feature_option_groups', (bundle.featureOptionGroups ?? []).map((row) => ({
    ...row,
    name: row.label,
  })))
  addBundleRows(rowsByTable, 'feature_options', (bundle.featureOptions ?? []).map((row) => ({
    ...row,
    name: row.label,
  })))
  addBundleRows(rowsByTable, 'starting_equipment_packages', bundle.startingEquipmentPackages ?? [])

  return rowsByTable
}

function snapshotMap(rows: ContentImportSnapshotRow[] = []) {
  return new Map(rows.map((row) => [row.key, normalizeRow(row)]))
}

function emptySummary(): ContentImportPlanSummary {
  return { create: 0, update: 0, retire: 0, noOp: 0 }
}

export function planContentImport(
  bundle: ContentImportBundle,
  existingSnapshot: ContentImportSnapshot = {},
  options: ContentImportPlanOptions = {}
): ContentImportPlan {
  const validation = validateContentImport(bundle)
  const summary = emptySummary()
  if (!validation.ok) return { ok: false, validation, summary, rows: [] }

  const importedSources = new Set((bundle.sources ?? []).map((source) => source.key))
  const nextRowsByTable = bundleRows(bundle)
  const rows: ContentImportDiffRow[] = []

  for (const table of TABLE_ORDER) {
    const importedRows = nextRowsByTable.get(table) ?? []
    const existingByKey = snapshotMap(existingSnapshot[table])
    const importedKeys = new Set(importedRows.map((row) => row.key))

    for (const nextRow of importedRows) {
      const existing = existingByKey.get(nextRow.key)
      const changes = changedFields(existing, nextRow)
      const status: ContentImportDiffStatus = !existing
        ? 'create'
        : changes.length > 0 || existing.retired === true
          ? 'update'
          : 'no-op'

      summary[status === 'no-op' ? 'noOp' : status] += 1
      rows.push({
        table,
        key: nextRow.key,
        label: rowLabel(nextRow),
        source: rowSource(nextRow),
        status,
        amended: Boolean(nextRow.amended),
        amendmentNote: nextRow.amendment_note ?? null,
        changedFields: changes,
        nextRow,
      })
    }

    if (!options.retireMissing || table === 'sources') continue
    for (const existing of sortByKey(existingSnapshot[table] ?? [])) {
      if (importedKeys.has(existing.key) || existing.retired === true) continue
      const source = rowSource(existing)
      if (source && importedSources.size > 0 && !importedSources.has(source)) continue
      summary.retire += 1
      rows.push({
        table,
        key: existing.key,
        label: rowLabel(existing),
        source,
        status: 'retire',
        amended: Boolean(existing.amended),
        amendmentNote: existing.amendment_note ?? null,
        changedFields: ['retired'],
        nextRow: { ...normalizeRow(existing), retired: true },
      })
    }
  }

  return { ok: true, validation, summary, rows }
}

function cloneSnapshot(snapshot: ContentImportSnapshot): ContentImportSnapshot {
  return Object.fromEntries(
    (Object.keys(snapshot) as ContentImportTable[]).map((table) => [
      table,
      (snapshot[table] ?? []).map((row) => ({ ...row })),
    ])
  ) as ContentImportSnapshot
}

export function applyContentImportPlan(
  bundle: ContentImportBundle,
  existingSnapshot: ContentImportSnapshot = {},
  options: ContentImportPlanOptions = {}
): ContentImportApplyResult {
  const plan = planContentImport(bundle, existingSnapshot, options)
  if (!plan.ok) {
    return {
      ok: false,
      validation: plan.validation,
      plan,
      nextSnapshot: cloneSnapshot(existingSnapshot),
      appliedRows: [],
    }
  }

  const nextSnapshot = cloneSnapshot(existingSnapshot)
  for (const row of plan.rows) {
    if (!row.nextRow || row.status === 'no-op') continue
    const rows = nextSnapshot[row.table] ?? []
    const index = rows.findIndex((existing) => existing.key === row.key)
    if (index === -1) {
      rows.push({ ...row.nextRow })
    } else {
      rows[index] = { ...row.nextRow }
    }
    nextSnapshot[row.table] = sortByKey(rows)
  }

  return {
    ok: true,
    validation: plan.validation,
    plan,
    nextSnapshot,
    appliedRows: plan.rows,
  }
}

export function formatContentImportPlan(plan: ContentImportPlan) {
  if (!plan.ok) {
    const errors = plan.validation.errors
      .map((error) => `${error.table} ${error.entityKey}: ${error.message}`)
      .join('\n')
    return `Import rejected\n${errors}`
  }

  const header = [
    `Create ${plan.summary.create}`,
    `Update ${plan.summary.update}`,
    `No change ${plan.summary.noOp}`,
    `Retire ${plan.summary.retire}`,
  ].join(' | ')

  const rows = plan.rows.map((row) => [
    STATUS_LABELS[row.status],
    row.table,
    row.key,
    row.label,
    row.source ?? '-',
    row.amended ? 'amended' : 'canonical',
    row.changedFields.length > 0 ? row.changedFields.join(',') : '-',
  ].join('\t'))

  return [header, ...rows].join('\n')
}

export { STATUS_LABELS as CONTENT_IMPORT_STATUS_LABELS }
