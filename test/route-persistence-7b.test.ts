import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createRouteTestContext,
  ROUTE_TEST_CONTENT_TABLES,
  type RouteTestCharacter,
  type RouteTestContentTable,
} from './helpers/route-test-context'

const ROOT = process.cwd()
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')
const characterBody = (body: unknown) => body as RouteTestCharacter
const saveBody = (body: unknown) => body as { character: RouteTestCharacter }
const errorBody = (body: unknown) => body as { error: string; code?: string }

test('slice 7b player character creation requires campaign membership and reloads the created row', async () => {
  const ctx = createRouteTestContext()
  const dm = ctx.addUser({ id: 'dm-1', role: 'dm' })
  const player = ctx.addUser({ id: 'player-1', role: 'player' })
  const campaign = ctx.addCampaign({ id: 'campaign-1', dmId: dm.id, allowlist: ['PHB', 'ERftLW'] })

  const forbidden = await ctx.createCharacter({
    profile: player,
    body: { campaign_id: campaign.id, name: 'Not Yet Joined', character_type: 'npc' },
  })

  assert.equal(forbidden.status, 403)
  assert.equal(ctx.characters.size, 0)

  ctx.addCampaignMember(campaign.id, player.id)
  const created = await ctx.createCharacter({
    profile: player,
    body: { campaign_id: campaign.id, name: 'Joined Player', character_type: 'npc' },
  })
  const createdCharacter = characterBody(created.body)

  assert.equal(created.status, 201)
  assert.equal(createdCharacter.name, 'Joined Player')
  assert.equal(createdCharacter.user_id, player.id)
  assert.equal(createdCharacter.status, 'draft')
  assert.equal(createdCharacter.character_type, 'pc')

  const reloaded = ctx.reloadCharacter(createdCharacter.id)
  assert.deepEqual(reloaded, {
    character: createdCharacter,
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
  })
})

test('slice 7b DM and admin character creation follows campaign ownership helpers', async () => {
  const ctx = createRouteTestContext()
  const ownerDm = ctx.addUser({ id: 'dm-owner', role: 'dm' })
  const otherDm = ctx.addUser({ id: 'dm-other', role: 'dm' })
  const admin = ctx.addUser({ id: 'admin-1', role: 'admin' })
  const campaign = ctx.addCampaign({ id: 'campaign-owned', dmId: ownerDm.id })

  const dmCreated = await ctx.createCharacter({
    profile: ownerDm,
    body: { campaign_id: campaign.id, name: 'DM Test NPC', character_type: 'npc' },
  })
  assert.equal(dmCreated.status, 201)
  assert.equal(characterBody(dmCreated.body).character_type, 'npc')

  const otherDmBlocked = await ctx.createCharacter({
    profile: otherDm,
    body: { campaign_id: campaign.id, name: 'Wrong Campaign' },
  })
  assert.equal(otherDmBlocked.status, 403)

  const adminCreated = await ctx.createCharacter({
    profile: admin,
    body: { campaign_id: campaign.id, name: 'Admin Test Character', character_type: 'test' },
  })
  assert.equal(adminCreated.status, 201)
  assert.equal(characterBody(adminCreated.body).character_type, 'test')
})

test('slice 7b save draft persists typed atomic choices and verifies reload shape', async () => {
  const ctx = createRouteTestContext()
  const dm = ctx.addUser({ id: 'dm-1', role: 'dm' })
  const player = ctx.addUser({ id: 'player-1', role: 'player' })
  const campaign = ctx.addCampaign({ id: 'campaign-1', dmId: dm.id })
  ctx.addCampaignMember(campaign.id, player.id)
  ctx.seedCatalog({
    languages: [{ key: 'common', name: 'Common' }],
    tools: [{ key: 'smiths_tools', name: "Smith's Tools" }],
  })

  const created = await ctx.createCharacter({
    profile: player,
    body: { campaign_id: campaign.id, name: 'Atomic Save Target' },
  })
  const createdCharacter = characterBody(created.body)

  const saved = await ctx.saveCharacter({
    profile: player,
    characterId: createdCharacter.id,
    body: {
      expected_updated_at: createdCharacter.updated_at,
      name: 'Atomic Save Complete',
      levels: [{ class_id: 'class-fighter', level: 1, subclass_id: null, hp_roll: 10 }],
      spell_choices: [{
        spell_id: 'spell-fire-bolt',
        owning_class_id: 'class-wizard',
        acquisition_mode: 'known',
      }],
      feat_choices: [{ feat_id: 'feat-alert', choice_kind: 'feat' }],
      skill_proficiencies: [{ skill: 'Perception', source_category: 'class', source_entity_id: 'class-fighter' }],
      language_choices: [{ language: 'Common', source_category: 'background', source_entity_id: 'background-acolyte' }],
      tool_choices: [{ tool: "Smith's Tools", source_category: 'class', source_entity_id: 'class-artificer' }],
      ability_bonus_choices: [{ ability: 'str', bonus: 1, source_category: 'species', source_entity_id: 'species-human' }],
      asi_choices: [{ slot_index: 0, ability: 'str', bonus: 2 }],
      feature_option_choices: [{
        option_group_key: 'fighter_fighting_style',
        option_key: 'defense',
        selected_value: { label: 'Defense' },
        source_category: 'class',
        source_entity_id: 'class-fighter',
      }],
      equipment_items: [{
        item_id: 'equipment-chain-mail',
        quantity: 1,
        equipped: true,
        source_category: 'starting_equipment',
        source_entity_id: 'package-fighter',
      }],
    },
  })
  const savedBody = saveBody(saved.body)

  assert.equal(saved.status, 200)
  assert.equal(savedBody.character.name, 'Atomic Save Complete')

  const reloaded = ctx.reloadCharacter(createdCharacter.id)
  assert.equal(reloaded.character.updated_at, savedBody.character.updated_at)
  assert.deepEqual(reloaded.levels, [{ class_id: 'class-fighter', level: 1, subclass_id: null, hp_roll: 10 }])
  assert.equal(reloaded.spell_selections[0].spell_id, 'spell-fire-bolt')
  assert.equal(reloaded.spell_selections[0].counts_against_selection_limit, true)
  assert.equal(reloaded.feat_choices[0].feat_id, 'feat-alert')
  assert.equal(reloaded.language_choices[0].language_key, 'common')
  assert.equal(reloaded.language_choices[0].language, 'Common')
  assert.equal(reloaded.tool_choices[0].tool_key, 'smiths_tools')
  assert.equal(reloaded.asi_choices[0].bonus, 2)
  assert.equal(reloaded.ability_bonus_choices[0].source_category, 'species')
  assert.equal(reloaded.feature_option_choices[0].option_key, 'defense')
  assert.equal(reloaded.equipment_items[0].equipped, true)
  assert.equal(reloaded.snapshots.length, 1)
})

test('slice 7b save draft returns stable conflict responses for stale edit and level-up tokens', async () => {
  const ctx = createRouteTestContext()
  const dm = ctx.addUser({ id: 'dm-1', role: 'dm' })
  const player = ctx.addUser({ id: 'player-1', role: 'player' })
  const campaign = ctx.addCampaign({ id: 'campaign-1', dmId: dm.id })
  ctx.addCampaignMember(campaign.id, player.id)
  const created = await ctx.createCharacter({ profile: player, body: { campaign_id: campaign.id, name: 'Conflict Target' } })
  const createdCharacter = characterBody(created.body)

  const missingToken = await ctx.saveCharacter({
    profile: player,
    characterId: createdCharacter.id,
    body: { name: 'Missing Token' },
  })
  assert.deepEqual(missingToken, {
    status: 428,
    body: {
      error: 'This character was saved without a current edit token. Refresh the character and try again.',
      code: 'optimistic_lock_required',
    },
  })

  const staleToken = await ctx.saveCharacter({
    profile: player,
    characterId: createdCharacter.id,
    body: { expected_updated_at: 'older-token', name: 'Stale Token' },
  })
  assert.equal(staleToken.status, 409)
  assert.equal(errorBody(staleToken.body).code, 'stale_character')

  const staleLevelUp = await ctx.saveCharacter({
    profile: player,
    characterId: createdCharacter.id,
    body: {
      save_mode: 'level_up',
      expected_updated_at: createdCharacter.updated_at,
      level_up: { class_id: 'class-fighter', previous_level: 1, new_level: 2 },
    },
  })
  assert.equal(staleLevelUp.status, 409)
  assert.equal(errorBody(staleLevelUp.body).code, 'stale_level_up')
})

test('slice 7b submit blocks illegal characters and captures snapshot on success', async () => {
  const ctx = createRouteTestContext()
  const dm = ctx.addUser({ id: 'dm-1', role: 'dm' })
  const player = ctx.addUser({ id: 'player-1', role: 'player' })
  const campaign = ctx.addCampaign({ id: 'campaign-1', dmId: dm.id })
  ctx.addCampaignMember(campaign.id, player.id)
  const created = await ctx.createCharacter({ profile: player, body: { campaign_id: campaign.id, name: 'Submit Target' } })
  const createdCharacter = characterBody(created.body)

  ctx.setLegality(createdCharacter.id, {
    blocksSubmit: true,
    result: { issues: [{ severity: 'error', message: 'Choose a class.' }] },
  })
  const blocked = await ctx.submitCharacter({ profile: player, characterId: createdCharacter.id })
  assert.equal(blocked.status, 400)
  assert.equal(ctx.reloadCharacter(createdCharacter.id).character.status, 'draft')
  assert.equal(ctx.reloadCharacter(createdCharacter.id).snapshots.length, 0)

  ctx.setLegality(createdCharacter.id, {
    blocksSubmit: false,
    result: { issues: [] },
  })
  const submitted = await ctx.submitCharacter({ profile: player, characterId: createdCharacter.id })
  assert.equal(submitted.status, 200)
  assert.equal(saveBody(submitted.body).character.status, 'submitted')
  assert.equal(ctx.reloadCharacter(createdCharacter.id).snapshots.length, 1)
})

test('slice 7b approve and request-changes enforce DM ownership and capture review state', async () => {
  const ctx = createRouteTestContext()
  const ownerDm = ctx.addUser({ id: 'dm-owner', role: 'dm' })
  const otherDm = ctx.addUser({ id: 'dm-other', role: 'dm' })
  const player = ctx.addUser({ id: 'player-1', role: 'player' })
  const campaign = ctx.addCampaign({ id: 'campaign-1', dmId: ownerDm.id })
  ctx.addCampaignMember(campaign.id, player.id)
  const created = await ctx.createCharacter({ profile: player, body: { campaign_id: campaign.id, name: 'Review Target' } })
  const createdCharacter = characterBody(created.body)
  ctx.forceCharacterStatus(createdCharacter.id, 'submitted')

  const blocked = await ctx.requestChanges({
    profile: otherDm,
    characterId: createdCharacter.id,
    notes: 'Wrong DM.',
  })
  assert.equal(blocked.status, 403)

  const changes = await ctx.requestChanges({
    profile: ownerDm,
    characterId: createdCharacter.id,
    notes: 'Pick a legal spell.',
  })
  assert.equal(changes.status, 200)
  assert.equal(characterBody(changes.body).status, 'changes_requested')
  assert.equal(characterBody(changes.body).dm_notes, 'Pick a legal spell.')

  ctx.forceCharacterStatus(createdCharacter.id, 'submitted')
  const approved = await ctx.approveCharacter({ profile: ownerDm, characterId: createdCharacter.id })
  assert.equal(approved.status, 200)
  assert.equal(characterBody(approved.body).status, 'approved')
  assert.equal(characterBody(approved.body).dm_notes, null)
  assert.equal(ctx.reloadCharacter(createdCharacter.id).snapshots.length, 1)
})

test('slice 7b source allowlist replacement deletes missing rows, inserts requested rows, and rejects unauthorized writes', async () => {
  const ctx = createRouteTestContext()
  const ownerDm = ctx.addUser({ id: 'dm-owner', role: 'dm' })
  const otherDm = ctx.addUser({ id: 'dm-other', role: 'dm' })
  const admin = ctx.addUser({ id: 'admin-1', role: 'admin' })
  const campaign = ctx.addCampaign({ id: 'campaign-1', dmId: ownerDm.id, allowlist: ['PHB', 'ERftLW'] })

  const blocked = await ctx.replaceCampaignAllowlist({
    profile: otherDm,
    campaignId: campaign.id,
    sourceKeys: ['PHB'],
  })
  assert.equal(blocked.status, 403)
  assert.deepEqual(ctx.getCampaignAllowlist(campaign.id), ['PHB', 'ERftLW'])

  const replaced = await ctx.replaceCampaignAllowlist({
    profile: ownerDm,
    campaignId: campaign.id,
    sourceKeys: ['PHB', 'Homebrew'],
  })
  assert.equal(replaced.status, 200)
  assert.deepEqual(replaced.body, ['PHB', 'Homebrew'])
  assert.deepEqual(ctx.getCampaignAllowlist(campaign.id), ['PHB', 'Homebrew'])

  const adminReplaced = await ctx.replaceCampaignAllowlist({
    profile: admin,
    campaignId: campaign.id,
    sourceKeys: ['ERftLW'],
  })
  assert.equal(adminReplaced.status, 200)
  assert.deepEqual(ctx.getCampaignAllowlist(campaign.id), ['ERftLW'])
})

test('slice 7b admin content actions write audit rows and rejected import previews do not mutate state', async () => {
  const ctx = createRouteTestContext()
  const admin = ctx.addUser({ id: 'admin-1', role: 'admin' })
  const player = ctx.addUser({ id: 'player-1', role: 'player' })

  const blocked = await ctx.adminCreateContent({
    profile: player,
    table: 'languages',
    row: { key: 'giant', name: 'Giant', source: 'PHB' },
  })
  assert.equal(blocked.status, 403)

  for (const table of ROUTE_TEST_CONTENT_TABLES) {
    const row = contentRowFor(table)
    const created = await ctx.adminCreateContent({ profile: admin, table, row })
    assert.equal(created.status, 201, table)
    assert.ok(ctx.auditLogs.some((audit) => audit.target_table === table && audit.action.endsWith('_created')), table)
  }

  const before = ctx.snapshotContentState()
  const preview = ctx.previewContentImport({
    sources: [
      { key: 'PHB', name: "Player's Handbook" },
      { key: 'PHB', name: 'Duplicate PHB' },
    ],
  })

  assert.equal(preview.ok, false)
  assert.ok(preview.validation.errors.some((error) => error.code === 'duplicate_record'))
  assert.deepEqual(ctx.snapshotContentState(), before)
})

test('slice 7b route source files stay wired to auth, persistence, snapshots, and audit helpers', () => {
  assert.ok(existsSync(join(ROOT, 'test/helpers/route-test-context.ts')))

  const characterCreateRoute = read('src/app/api/characters/route.ts')
  assert.match(characterCreateRoute, /assertCampaignManageableByUser/)
  assert.match(characterCreateRoute, /campaign_members/)

  const characterRoute = read('src/app/api/characters/[id]/route.ts')
  assert.match(characterRoute, /assertCharacterAccessibleByUser/)
  assert.match(characterRoute, /saveCharacterAtomic/)
  assert.match(characterRoute, /saveCharacterLevelUpAtomic/)
  assert.match(characterRoute, /captureSnapshot/)
  assert.match(characterRoute, /loadCharacterState/)
  assert.match(characterRoute, /optimistic_lock_required/)
  assert.match(characterRoute, /stale_level_up/)

  const submitRoute = read('src/app/api/characters/[id]/submit/route.ts')
  assert.match(submitRoute, /assertCharacterOwnedByUser/)
  assert.match(submitRoute, /shouldBlockCharacterSubmit/)
  assert.match(submitRoute, /captureSnapshot/)

  const approveRoute = read('src/app/api/characters/[id]/approve/route.ts')
  assert.match(approveRoute, /assertCharacterManageableByUser/)
  assert.match(approveRoute, /captureSnapshot/)

  const requestChangesRoute = read('src/app/api/characters/[id]/request-changes/route.ts')
  assert.match(requestChangesRoute, /assertCharacterManageableByUser/)
  assert.match(requestChangesRoute, /dm_notes/)

  const allowlistRoute = read('src/app/api/campaigns/[id]/allowlist/route.ts')
  assert.match(allowlistRoute, /assertCampaignManageableByUser/)
  assert.match(allowlistRoute, /delete\(\)/)
  assert.match(allowlistRoute, /insert\(rows\)/)

  for (const routePath of [
    'languages',
    'tools',
    'feature-option-groups',
    'feature-options',
    'equipment-items',
    'weapons',
    'armor',
    'shields',
    'starting-equipment-packages',
  ]) {
    const route = read(`src/app/api/content/${routePath}/route.ts`)
    assert.match(route, /requireAdmin/)
    assert.match(route, /writeAuditLog/)
  }
})

function contentRowFor(table: RouteTestContentTable): Record<string, unknown> {
  switch (table) {
    case 'languages':
      return { key: 'giant', name: 'Giant', source: 'PHB' }
    case 'tools':
      return { key: 'smiths_tools', name: "Smith's Tools", source: 'PHB' }
    case 'feature_option_groups':
      return { key: 'fighter_fighting_style', label: 'Fighting Style', source: 'PHB' }
    case 'feature_options':
      return { key: 'defense', group_key: 'fighter_fighting_style', label: 'Defense', source: 'PHB' }
    case 'equipment_items':
      return { id: 'equipment-chain-mail', key: 'chain_mail', name: 'Chain Mail', source: 'PHB' }
    case 'weapons':
      return { item_id: 'weapon-longsword', key: 'longsword', name: 'Longsword', source: 'PHB' }
    case 'armor':
      return { item_id: 'armor-chain-mail', key: 'chain_mail_armor', name: 'Chain Mail', source: 'PHB' }
    case 'shields':
      return { item_id: 'shield-basic', key: 'shield', name: 'Shield', source: 'PHB' }
    case 'starting_equipment_packages':
      return { id: 'package-fighter', key: 'fighter_default', name: 'Fighter Default', source: 'PHB' }
  }
}
