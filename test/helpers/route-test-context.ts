import {
  buildCharacterAtomicSavePayload,
  buildCharacterLevelUpSavePayload,
} from '../../src/lib/characters/atomic-save'
import {
  planContentImport,
  type ContentImportPlan,
  type ContentImportSnapshot,
  type ContentImportSnapshotRow,
} from '../../scripts/content-import/import-workflow'
import type { ContentImportBundle } from '../../scripts/content-import/validator'
import type { CharacterStatus, CharacterType, StatMethod, UserRole } from '../../src/lib/types/database'

export const ROUTE_TEST_CONTENT_TABLES = [
  'languages',
  'tools',
  'feature_option_groups',
  'feature_options',
  'equipment_items',
  'weapons',
  'armor',
  'shields',
  'starting_equipment_packages',
] as const

export type RouteTestContentTable = typeof ROUTE_TEST_CONTENT_TABLES[number]

type RouteTestProfile = {
  id: string
  role: UserRole
}

type RouteTestCampaign = {
  id: string
  dm_id: string
  allowlist: string[]
}

export type RouteTestCharacter = {
  id: string
  user_id: string
  campaign_id: string
  name: string
  status: CharacterStatus
  stat_method: StatMethod
  character_type: CharacterType
  updated_at: string
  dm_notes: string | null
}

type RouteTestCharacterDetails = {
  levels: Array<Record<string, unknown>>
  spell_selections: Array<Record<string, unknown>>
  feat_choices: Array<Record<string, unknown>>
  skill_proficiencies: Array<Record<string, unknown>>
  language_choices: Array<Record<string, unknown>>
  tool_choices: Array<Record<string, unknown>>
  ability_bonus_choices: Array<Record<string, unknown>>
  asi_choices: Array<Record<string, unknown>>
  feature_option_choices: Array<Record<string, unknown>>
  equipment_items: Array<Record<string, unknown>>
  snapshots: Array<Record<string, unknown>>
}

type RouteTestResponse<T = unknown> = {
  status: number
  body: T
}

type RouteTestSaveBody = Record<string, unknown> & {
  expected_updated_at?: string
  save_mode?: 'replace' | 'level_up'
  level_up?: {
    class_id: string
    previous_level: number
    new_level: number
    subclass_id?: string | null
    hp_roll?: number | null
  }
}

type RouteTestLegality = {
  blocksSubmit: boolean
  result: Record<string, unknown>
}

type AuditLogRow = {
  actor_user_id: string
  action: string
  target_table: string
  target_id: string
  details: Record<string, unknown>
}

type CatalogRow = {
  key: string
  name: string
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isDmAccess(role: UserRole) {
  return role === 'dm' || role === 'admin'
}

function isAdmin(role: UserRole) {
  return role === 'admin'
}

function emptyCharacterDetails(): RouteTestCharacterDetails {
  return {
    levels: [],
    spell_selections: [],
    feat_choices: [],
    skill_proficiencies: [],
    language_choices: [],
    tool_choices: [],
    ability_bonus_choices: [],
    asi_choices: [],
    feature_option_choices: [],
    equipment_items: [],
    snapshots: [],
  }
}

export function createRouteTestContext() {
  return new RouteTestContext()
}

class RouteTestContext {
  readonly users = new Map<string, RouteTestProfile>()
  readonly campaigns = new Map<string, RouteTestCampaign>()
  readonly campaignMembers = new Set<string>()
  readonly characters = new Map<string, RouteTestCharacter>()
  readonly auditLogs: AuditLogRow[] = []

  private readonly characterDetails = new Map<string, RouteTestCharacterDetails>()
  private readonly legality = new Map<string, RouteTestLegality>()
  private readonly contentRows: Record<RouteTestContentTable, Array<Record<string, unknown>>> = {
    languages: [],
    tools: [],
    feature_option_groups: [],
    feature_options: [],
    equipment_items: [],
    weapons: [],
    armor: [],
    shields: [],
    starting_equipment_packages: [],
  }
  private languageCatalog: CatalogRow[] = []
  private toolCatalog: CatalogRow[] = []
  private nextCharacterNumber = 1
  private clock = 0

  addUser(input: { id: string; role: UserRole }) {
    const profile = { ...input }
    this.users.set(profile.id, profile)
    return clone(profile)
  }

  addCampaign(input: { id: string; dmId: string; allowlist?: string[] }) {
    const campaign = {
      id: input.id,
      dm_id: input.dmId,
      allowlist: [...(input.allowlist ?? [])],
    }
    this.campaigns.set(campaign.id, campaign)
    this.addCampaignMember(campaign.id, input.dmId)
    return clone(campaign)
  }

  addCampaignMember(campaignId: string, userId: string) {
    this.campaignMembers.add(this.memberKey(campaignId, userId))
  }

  seedCatalog(input: { languages?: CatalogRow[]; tools?: CatalogRow[] }) {
    this.languageCatalog = clone(input.languages ?? [])
    this.toolCatalog = clone(input.tools ?? [])
  }

  async createCharacter(input: {
    profile: RouteTestProfile
    body: {
      campaign_id: string
      name: string
      stat_method?: StatMethod
      character_type?: CharacterType
    }
  }): Promise<RouteTestResponse<RouteTestCharacter | { error: string }>> {
    const campaign = this.campaigns.get(input.body.campaign_id)
    if (!campaign) return { status: 403, body: { error: 'Forbidden' } }

    if (isDmAccess(input.profile.role)) {
      if (!this.canManageCampaign(input.profile, campaign.id)) {
        return { status: 403, body: { error: 'Forbidden' } }
      }
    } else if (!this.isCampaignMember(campaign.id, input.profile.id)) {
      return { status: 403, body: { error: 'Forbidden' } }
    }

    const character: RouteTestCharacter = {
      id: `character-${this.nextCharacterNumber++}`,
      user_id: input.profile.id,
      campaign_id: campaign.id,
      name: input.body.name,
      stat_method: input.body.stat_method ?? 'point_buy',
      status: 'draft',
      character_type: isDmAccess(input.profile.role) && input.body.character_type
        ? input.body.character_type
        : 'pc',
      updated_at: this.nextTimestamp(),
      dm_notes: null,
    }

    this.characters.set(character.id, character)
    this.characterDetails.set(character.id, emptyCharacterDetails())
    return { status: 201, body: clone(character) }
  }

  reloadCharacter(characterId: string) {
    const character = this.requireCharacter(characterId)
    const details = this.requireDetails(characterId)
    return clone({
      character,
      levels: details.levels,
      spell_selections: details.spell_selections,
      feat_choices: details.feat_choices,
      skill_proficiencies: details.skill_proficiencies,
      language_choices: details.language_choices,
      tool_choices: details.tool_choices,
      ability_bonus_choices: details.ability_bonus_choices,
      asi_choices: details.asi_choices,
      feature_option_choices: details.feature_option_choices,
      equipment_items: details.equipment_items,
      snapshots: details.snapshots,
    })
  }

  async saveCharacter(input: {
    profile: RouteTestProfile
    characterId: string
    body: RouteTestSaveBody
  }): Promise<RouteTestResponse> {
    const character = this.characters.get(input.characterId)
    if (!character || !this.canAccessCharacter(input.profile, character)) {
      return { status: 403, body: { error: 'Forbidden' } }
    }

    if (!input.body.expected_updated_at) {
      return {
        status: 428,
        body: {
          error: 'This character was saved without a current edit token. Refresh the character and try again.',
          code: 'optimistic_lock_required',
        },
      }
    }

    if (input.body.expected_updated_at !== character.updated_at) {
      return {
        status: 409,
        body: {
          error: 'This character changed in another tab or session. Refresh before saving again.',
          code: 'stale_character',
        },
      }
    }

    const { characterFields, choices } = this.splitSaveBody(input.body)
    if (character.status === 'approved') characterFields.status = 'draft'

    if (input.body.save_mode === 'level_up') {
      if (!input.body.level_up) return { status: 400, body: { error: 'Level-up payload is required' } }
      const currentLevel = this.currentClassLevel(input.characterId, input.body.level_up.class_id)
      if (currentLevel !== input.body.level_up.previous_level) {
        return {
          status: 409,
          body: {
            error: 'This level-up is based on an older character level. Refresh before saving again.',
            code: 'stale_level_up',
          },
        }
      }

      const payload = await buildCharacterLevelUpSavePayload(this.catalogSupabase(), {
        characterFields,
        level_up: input.body.level_up,
        skill_proficiencies: choices.skill_proficiencies,
        asi_choices: choices.asi_choices,
        feature_option_choices: choices.feature_option_choices,
        spell_choices: choices.spell_choices,
        feat_choices: choices.feat_choices,
      })
      this.applyLevelUpPayload(input.characterId, payload)
    } else {
      const payload = await buildCharacterAtomicSavePayload(this.catalogSupabase(), {
        characterFields,
        levels: choices.levels,
        stat_rolls: choices.stat_rolls,
        skill_proficiencies: choices.skill_proficiencies,
        ability_bonus_choices: choices.ability_bonus_choices,
        asi_choices: choices.asi_choices,
        feature_option_choices: choices.feature_option_choices,
        equipment_items: choices.equipment_items,
        language_choices: choices.language_choices,
        tool_choices: choices.tool_choices,
        spell_choices: choices.spell_choices,
        feat_choices: choices.feat_choices,
      })
      this.applyAtomicPayload(input.characterId, payload)
    }

    this.captureSnapshot(input.characterId, 'save')
    const reloaded = this.reloadCharacter(input.characterId)
    return {
      status: 200,
      body: {
        character: reloaded.character,
        legality: this.legality.get(input.characterId)?.result ?? null,
        derived: null,
        load_warnings: [],
      },
    }
  }

  setLegality(characterId: string, legality: RouteTestLegality) {
    this.legality.set(characterId, clone(legality))
  }

  async submitCharacter(input: {
    profile: RouteTestProfile
    characterId: string
  }): Promise<RouteTestResponse> {
    const character = this.characters.get(input.characterId)
    if (!character || character.user_id !== input.profile.id) {
      return { status: 403, body: { error: 'Forbidden' } }
    }
    if (character.status !== 'draft' && character.status !== 'changes_requested') {
      return { status: 400, body: { error: `Cannot submit a character with status "${character.status}"` } }
    }

    const legality = this.legality.get(input.characterId)
    if (legality?.blocksSubmit) {
      return {
        status: 400,
        body: {
          error: 'Character has blocking legality errors.',
          legality: legality.result,
        },
      }
    }

    character.status = 'submitted'
    character.updated_at = this.nextTimestamp()
    this.captureSnapshot(input.characterId, 'submit')
    return {
      status: 200,
      body: {
        character: clone(character),
        legality: legality?.result ?? null,
      },
    }
  }

  async approveCharacter(input: {
    profile: RouteTestProfile
    characterId: string
  }): Promise<RouteTestResponse> {
    const character = this.characters.get(input.characterId)
    if (!character || !this.canManageCharacter(input.profile, character)) {
      return { status: 403, body: { error: 'Forbidden' } }
    }
    if (character.status !== 'submitted') {
      return { status: 400, body: { error: `Cannot approve a character with status "${character.status}"` } }
    }

    character.status = 'approved'
    character.dm_notes = null
    character.updated_at = this.nextTimestamp()
    this.captureSnapshot(input.characterId, 'approve')
    return { status: 200, body: clone(character) }
  }

  async requestChanges(input: {
    profile: RouteTestProfile
    characterId: string
    notes: string
  }): Promise<RouteTestResponse> {
    const character = this.characters.get(input.characterId)
    if (!character || !this.canManageCharacter(input.profile, character)) {
      return { status: 403, body: { error: 'Forbidden' } }
    }
    if (character.status !== 'submitted') {
      return { status: 400, body: { error: `Cannot request changes on a character with status "${character.status}"` } }
    }

    character.status = 'changes_requested'
    character.dm_notes = input.notes
    character.updated_at = this.nextTimestamp()
    return { status: 200, body: clone(character) }
  }

  forceCharacterStatus(characterId: string, status: CharacterStatus) {
    const character = this.requireCharacter(characterId)
    character.status = status
    character.updated_at = this.nextTimestamp()
  }

  async replaceCampaignAllowlist(input: {
    profile: RouteTestProfile
    campaignId: string
    sourceKeys: string[]
  }): Promise<RouteTestResponse<string[] | { error: string }>> {
    const campaign = this.campaigns.get(input.campaignId)
    if (!campaign || !this.canManageCampaign(input.profile, campaign.id)) {
      return { status: 403, body: { error: 'Forbidden' } }
    }

    campaign.allowlist = [...input.sourceKeys]
    return { status: 200, body: [...campaign.allowlist] }
  }

  getCampaignAllowlist(campaignId: string) {
    return [...(this.campaigns.get(campaignId)?.allowlist ?? [])]
  }

  async adminCreateContent(input: {
    profile: RouteTestProfile
    table: RouteTestContentTable
    row: Record<string, unknown>
  }): Promise<RouteTestResponse> {
    if (!isAdmin(input.profile.role)) {
      return { status: 403, body: { error: 'Forbidden' } }
    }

    const row = clone(input.row)
    this.contentRows[input.table].push(row)
    this.auditLogs.push({
      actor_user_id: input.profile.id,
      action: `content.${input.table}_created`,
      target_table: input.table,
      target_id: this.rowTargetId(row, input.table),
      details: { key: row.key ?? row.id ?? row.item_id ?? null },
    })
    return { status: 201, body: clone(row) }
  }

  previewContentImport(bundle: ContentImportBundle): ContentImportPlan {
    return planContentImport(bundle, this.snapshotContentState(), { retireMissing: true })
  }

  snapshotContentState(): ContentImportSnapshot {
    return clone({
      languages: this.contentRows.languages.map(this.snapshotRow),
      tools: this.contentRows.tools.map(this.snapshotRow),
      equipment_items: this.contentRows.equipment_items.map(this.snapshotRow),
      feature_option_groups: this.contentRows.feature_option_groups.map(this.snapshotRow),
      feature_options: this.contentRows.feature_options.map(this.snapshotRow),
      starting_equipment_packages: this.contentRows.starting_equipment_packages.map(this.snapshotRow),
    })
  }

  private memberKey(campaignId: string, userId: string) {
    return `${campaignId}:${userId}`
  }

  private isCampaignMember(campaignId: string, userId: string) {
    return this.campaignMembers.has(this.memberKey(campaignId, userId))
  }

  private canManageCampaign(profile: RouteTestProfile, campaignId: string) {
    const campaign = this.campaigns.get(campaignId)
    return Boolean(campaign && (isAdmin(profile.role) || campaign.dm_id === profile.id))
  }

  private canManageCharacter(profile: RouteTestProfile, character: RouteTestCharacter) {
    return this.canManageCampaign(profile, character.campaign_id)
  }

  private canAccessCharacter(profile: RouteTestProfile, character: RouteTestCharacter) {
    return (
      isAdmin(profile.role) ||
      character.user_id === profile.id ||
      this.campaigns.get(character.campaign_id)?.dm_id === profile.id
    )
  }

  private nextTimestamp() {
    this.clock += 1
    return `2026-05-01T00:00:${String(this.clock).padStart(2, '0')}.000Z`
  }

  private requireCharacter(characterId: string) {
    const character = this.characters.get(characterId)
    if (!character) throw new Error(`Missing test character ${characterId}`)
    return character
  }

  private requireDetails(characterId: string) {
    const details = this.characterDetails.get(characterId)
    if (!details) throw new Error(`Missing test character details ${characterId}`)
    return details
  }

  private captureSnapshot(characterId: string, event: string) {
    const character = this.requireCharacter(characterId)
    const details = this.requireDetails(characterId)
    details.snapshots.push({
      character_id: characterId,
      level_total: details.levels.reduce((sum, level) => sum + Number(level.level ?? 0), 0),
      snapshot: {
        event,
        status: character.status,
        character: clone(character),
      },
    })
  }

  private currentClassLevel(characterId: string, classId: string) {
    const details = this.requireDetails(characterId)
    const level = details.levels.find((row) => row.class_id === classId)
    return Number(level?.level ?? 0)
  }

  private splitSaveBody(body: RouteTestSaveBody) {
    const {
      expected_updated_at: _expectedUpdatedAt,
      save_mode: _saveMode,
      levels,
      stat_rolls,
      skill_proficiencies,
      ability_bonus_choices,
      asi_choices,
      feature_option_choices,
      equipment_items,
      language_choices,
      tool_choices,
      spell_choices,
      feat_choices,
      level_up: _levelUp,
      ...characterFields
    } = body

    return {
      characterFields,
      choices: {
        levels: levels as Array<{ class_id: string; level: number; subclass_id?: string | null; hp_roll?: number | null }> | undefined,
        stat_rolls: stat_rolls as Array<{ assigned_to: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; roll_set: number[] }> | undefined,
        skill_proficiencies: skill_proficiencies as Parameters<typeof buildCharacterAtomicSavePayload>[1]['skill_proficiencies'],
        ability_bonus_choices: ability_bonus_choices as Parameters<typeof buildCharacterAtomicSavePayload>[1]['ability_bonus_choices'],
        asi_choices: asi_choices as Parameters<typeof buildCharacterAtomicSavePayload>[1]['asi_choices'],
        feature_option_choices: feature_option_choices as Parameters<typeof buildCharacterAtomicSavePayload>[1]['feature_option_choices'],
        equipment_items: equipment_items as Parameters<typeof buildCharacterAtomicSavePayload>[1]['equipment_items'],
        language_choices: language_choices as Parameters<typeof buildCharacterAtomicSavePayload>[1]['language_choices'],
        tool_choices: tool_choices as Parameters<typeof buildCharacterAtomicSavePayload>[1]['tool_choices'],
        spell_choices: spell_choices as Parameters<typeof buildCharacterAtomicSavePayload>[1]['spell_choices'],
        feat_choices: feat_choices as Parameters<typeof buildCharacterAtomicSavePayload>[1]['feat_choices'],
      },
    }
  }

  private applyAtomicPayload(characterId: string, payload: Record<string, unknown>) {
    const character = this.requireCharacter(characterId)
    const details = this.requireDetails(characterId)
    this.applyCharacterFields(character, payload)

    if (Array.isArray(payload.levels)) details.levels = clone(payload.levels as Array<Record<string, unknown>>)
    if (Array.isArray(payload.skill_proficiencies)) details.skill_proficiencies = clone(payload.skill_proficiencies as Array<Record<string, unknown>>)
    if (Array.isArray(payload.ability_bonus_choices)) details.ability_bonus_choices = clone(payload.ability_bonus_choices as Array<Record<string, unknown>>)
    if (Array.isArray(payload.asi_choices)) details.asi_choices = clone(payload.asi_choices as Array<Record<string, unknown>>)
    if (Array.isArray(payload.feature_option_choices)) details.feature_option_choices = clone(payload.feature_option_choices as Array<Record<string, unknown>>)
    if (Array.isArray(payload.equipment_items)) details.equipment_items = clone(payload.equipment_items as Array<Record<string, unknown>>)
    if (Array.isArray(payload.language_choices)) details.language_choices = clone(payload.language_choices as Array<Record<string, unknown>>)
    if (Array.isArray(payload.tool_choices)) details.tool_choices = clone(payload.tool_choices as Array<Record<string, unknown>>)
    if (Array.isArray(payload.spell_choices)) details.spell_selections = clone(payload.spell_choices as Array<Record<string, unknown>>)
    if (Array.isArray(payload.feat_choices)) details.feat_choices = clone(payload.feat_choices as Array<Record<string, unknown>>)
    character.updated_at = this.nextTimestamp()
  }

  private applyLevelUpPayload(characterId: string, payload: Record<string, unknown>) {
    const character = this.requireCharacter(characterId)
    const details = this.requireDetails(characterId)
    this.applyCharacterFields(character, payload)

    const levelUp = payload.level_up as { class_id: string; new_level: number; subclass_id?: string | null; hp_roll?: number | null } | undefined
    if (levelUp) {
      const existing = details.levels.find((row) => row.class_id === levelUp.class_id)
      if (existing) {
        existing.level = levelUp.new_level
        existing.subclass_id = levelUp.subclass_id ?? null
        existing.hp_roll = levelUp.hp_roll ?? null
      } else {
        details.levels.push({
          class_id: levelUp.class_id,
          level: levelUp.new_level,
          subclass_id: levelUp.subclass_id ?? null,
          hp_roll: levelUp.hp_roll ?? null,
        })
      }
    }

    if (Array.isArray(payload.skill_proficiencies)) {
      details.skill_proficiencies.push(...clone(payload.skill_proficiencies as Array<Record<string, unknown>>))
    }
    if (Array.isArray(payload.asi_choices)) details.asi_choices.push(...clone(payload.asi_choices as Array<Record<string, unknown>>))
    if (Array.isArray(payload.feature_option_choices)) details.feature_option_choices.push(...clone(payload.feature_option_choices as Array<Record<string, unknown>>))
    if (Array.isArray(payload.spell_choices)) details.spell_selections.push(...clone(payload.spell_choices as Array<Record<string, unknown>>))
    if (Array.isArray(payload.feat_choices)) details.feat_choices.push(...clone(payload.feat_choices as Array<Record<string, unknown>>))
    character.updated_at = this.nextTimestamp()
  }

  private applyCharacterFields(character: RouteTestCharacter, payload: Record<string, unknown>) {
    for (const [key, value] of Object.entries(payload)) {
      if ([
        'levels',
        'stat_rolls',
        'skill_proficiencies',
        'ability_bonus_choices',
        'asi_choices',
        'feature_option_choices',
        'equipment_items',
        'language_choices',
        'tool_choices',
        'spell_choices',
        'feat_choices',
        'level_up',
      ].includes(key)) continue

      if (key in character) {
        ;(character as unknown as Record<string, unknown>)[key] = value
      }
    }
  }

  private catalogSupabase() {
    return {
      from: (table: string) => ({
        select: async () => {
          if (table === 'languages') return { data: clone(this.languageCatalog), error: null }
          if (table === 'tools') return { data: clone(this.toolCatalog), error: null }
          return { data: [], error: null }
        },
      }),
    } as never
  }

  private rowTargetId(row: Record<string, unknown>, table: RouteTestContentTable) {
    return String(row.id ?? row.key ?? row.item_id ?? `${table}-${this.contentRows[table].length}`)
  }

  private snapshotRow(row: Record<string, unknown>): ContentImportSnapshotRow {
    return {
      ...clone(row),
      key: String(row.key ?? row.id ?? row.item_id),
      name: typeof row.name === 'string' ? row.name : undefined,
      source: typeof row.source === 'string' ? row.source : undefined,
    }
  }
}
