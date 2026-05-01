import { createClient } from '@supabase/supabase-js'
import { validateContentImport, type ContentImportBundle } from './content-import/validator'
import type { CharacterStatus, Database, UserRole } from '../src/lib/types/database'

const SUPABASE_URL = requiredEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE_KEY = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')

const DEMO_PASSWORD = 'DemoPassw0rd!'

const DEMO_USERS = {
  admin: {
    email: 'demo-admin@dungeon-and-database.local',
    displayName: 'Demo Admin',
    role: 'admin' as UserRole,
  },
  dm: {
    email: 'demo-dm@dungeon-and-database.local',
    displayName: 'Demo DM',
    role: 'dm' as UserRole,
  },
  player: {
    email: 'demo-player@dungeon-and-database.local',
    displayName: 'Demo Player',
    role: 'player' as UserRole,
  },
}

const DEMO_CAMPAIGN_NAME = 'Demo QA Campaign'

const DEMO_CHARACTERS: Array<{
  name: string
  status: CharacterStatus
  dmNotes: string | null
}> = [
  { name: 'Demo Draft Character', status: 'draft', dmNotes: null },
  { name: 'Demo Submitted Character', status: 'submitted', dmNotes: null },
  {
    name: 'Demo Changes Requested Character',
    status: 'changes_requested',
    dmNotes: 'Demo QA note: adjust one choice, then resubmit.',
  },
]

const DEMO_REJECTED_IMPORT_FIXTURE: ContentImportBundle = {
  sources: [
    { key: 'PHB', name: "Player's Handbook" },
    { key: 'PHB', name: 'Duplicate Player Handbook' },
  ],
  languages: [
    { key: 'common', name: 'Common', source: 'PHB' },
    { key: 'common', name: 'Duplicate Common', source: 'PHB' },
  ],
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

type DemoAuthUser = {
  id: string
  email?: string
}

function requiredEnv(key: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[key]
  if (!value || isPlaceholder(value)) {
    throw new Error(`${key} is missing or still uses the .env.example placeholder.`)
  }
  return value
}

function isPlaceholder(value: string) {
  return (
    value.includes('your-project-ref') ||
    value.includes('replace-with-') ||
    value.includes('paste-your-')
  )
}

function log(message: string) {
  console.log(`[seed-demo] ${message}`)
}

async function findAuthUserByEmail(email: string): Promise<DemoAuthUser | null> {
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (match) return { id: match.id, email: match.email ?? email }
    if (data.users.length < 1000) return null
    page += 1
  }
}

async function ensureAuthUser(email: string, displayName: string) {
  const existing = await findAuthUserByEmail(email)
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      user_metadata: { display_name: displayName },
    })
    if (error) throw error
    return existing
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })
  if (error) throw error
  if (!data.user) throw new Error(`Supabase did not return a user for ${email}.`)

  return { id: data.user.id, email: data.user.email ?? email }
}

async function currentAdminProfile() {
  const { data, error } = await supabase
    .from('users')
    .select('id,email,role')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

async function ensureProfile(
  user: DemoAuthUser,
  email: string,
  displayName: string,
  requestedRole: UserRole
) {
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id,role')
    .eq('id', user.id)
    .maybeSingle()
  if (existingError) throw existingError

  let role = existing?.role === 'admin' ? 'admin' : requestedRole

  if (requestedRole === 'admin') {
    const currentAdmin = await currentAdminProfile()
    if (currentAdmin && currentAdmin.id !== user.id) {
      role = 'dm'
      log('A singleton admin already exists, so demo-admin remains DM-capable. Use the existing admin account for /dm/content.')
    }
  }

  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email,
      display_name: displayName,
      role,
    },
    { onConflict: 'id' }
  )
  if (error) throw error

  return { id: user.id, email, displayName, role }
}

async function ensureDemoUsers() {
  const entries = await Promise.all(
    Object.values(DEMO_USERS).map(async (demoUser) => {
      const authUser = await ensureAuthUser(demoUser.email, demoUser.displayName)
      return ensureProfile(authUser, demoUser.email, demoUser.displayName, demoUser.role)
    })
  )

  const byEmail = new Map(entries.map((entry) => [entry.email, entry]))
  return {
    admin: byEmail.get(DEMO_USERS.admin.email)!,
    dm: byEmail.get(DEMO_USERS.dm.email)!,
    player: byEmail.get(DEMO_USERS.player.email)!,
  }
}

async function resolveAdminQaAccess(demoAdmin: { email: string; role: UserRole }) {
  if (demoAdmin.role === 'admin') {
    return {
      kind: 'password' as const,
      email: demoAdmin.email,
      detail: `${demoAdmin.email} / ${DEMO_PASSWORD}`,
    }
  }

  const admin = await currentAdminProfile()
  if (!admin?.email) {
    return {
      kind: 'unavailable' as const,
      email: null,
      detail: 'No admin profile was available for /dm/content QA.',
    }
  }

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: admin.email,
  })

  if (error) {
    return {
      kind: 'unavailable' as const,
      email: admin.email,
      detail: `Existing admin is ${admin.email}; magic-link generation failed: ${error.message}`,
    }
  }

  return {
    kind: 'magic_link' as const,
    email: admin.email,
    detail: data.properties?.action_link ?? `Magic link generated for ${admin.email}, but Supabase did not return an action link.`,
  }
}

async function ensureSources() {
  const { error } = await supabase.from('sources').upsert(
    [
      { key: 'PHB', full_name: "Player's Handbook", is_srd: false, rule_set: '2014' },
      { key: 'ERftLW', full_name: 'Eberron: Rising from the Last War', is_srd: false, rule_set: '2014' },
    ],
    { onConflict: 'key' }
  )
  if (error) throw error
}

async function ensureCampaign(dmId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('name', DEMO_CAMPAIGN_NAME)
    .eq('dm_id', dmId)
    .limit(1)
    .maybeSingle()
  if (existingError) throw existingError

  const campaignFields = {
    name: DEMO_CAMPAIGN_NAME,
    dm_id: dmId,
    rule_set: '2014' as const,
    settings: {
      stat_method: 'point_buy' as const,
      max_level: 20,
      milestone_levelling: false,
    },
  }

  if (existing) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(campaignFields)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaignFields)
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function ensureCampaignFixture(campaignId: string, dmId: string, playerId: string) {
  const { error: memberError } = await supabase.from('campaign_members').upsert(
    [
      { campaign_id: campaignId, user_id: dmId },
      { campaign_id: campaignId, user_id: playerId },
    ],
    { onConflict: 'campaign_id,user_id' }
  )
  if (memberError) throw memberError

  const { error: allowlistError } = await supabase.from('campaign_source_allowlist').upsert(
    [
      { campaign_id: campaignId, source_key: 'PHB' },
      { campaign_id: campaignId, source_key: 'ERftLW' },
    ],
    { onConflict: 'campaign_id,source_key' }
  )
  if (allowlistError) throw allowlistError
}

async function findDemoClassId() {
  const { data, error } = await supabase
    .from('classes')
    .select('id,name,source')
    .eq('name', 'Fighter')
    .in('source', ['PHB', 'SRD', 'srd'])
    .limit(1)

  if (error) throw error
  const classRow = data?.[0]
  if (!classRow) {
    throw new Error('Demo character class not found. Run npm run seed-srd before npm run seed-demo.')
  }
  return classRow.id
}

async function ensureCharacter(
  userId: string,
  campaignId: string,
  name: string,
  status: CharacterStatus,
  classId: string,
  dmNotes: string | null = null
) {
  const { data: existing, error: existingError } = await supabase
    .from('characters')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('name', name)
    .limit(1)
    .maybeSingle()
  if (existingError) throw existingError

  const characterFields = {
    user_id: userId,
    campaign_id: campaignId,
    name,
    status,
    stat_method: 'standard_array' as const,
    base_str: 15,
    base_dex: 14,
    base_con: 13,
    base_int: 10,
    base_wis: 12,
    base_cha: 8,
    hp_max: 12,
    character_type: 'pc' as const,
    dm_notes: dmNotes,
  }

  const character = existing
    ? await updateCharacter(existing.id, characterFields)
    : await insertCharacter(characterFields)

  await ensureCharacterLevel(character.id, classId)
  await ensureSnapshot(character.id, status)
  return character
}

async function updateCharacter(
  characterId: string,
  characterFields: Parameters<typeof insertCharacter>[0]
) {
  const { data, error } = await supabase
    .from('characters')
    .update(characterFields)
    .eq('id', characterId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function insertCharacter(characterFields: {
  user_id: string
  campaign_id: string
  name: string
  status: CharacterStatus
  stat_method: 'standard_array'
  base_str: number
  base_dex: number
  base_con: number
  base_int: number
  base_wis: number
  base_cha: number
  hp_max: number
  character_type: 'pc'
  dm_notes: string | null
}) {
  const { data, error } = await supabase
    .from('characters')
    .insert(characterFields)
    .select('*')
    .single()
  if (error) throw error
  return data
}

async function ensureCharacterLevel(characterId: string, classId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('character_levels')
    .select('id')
    .eq('character_id', characterId)
    .eq('class_id', classId)
    .limit(1)
    .maybeSingle()
  if (existingError) throw existingError

  if (existing) {
    const { error } = await supabase
      .from('character_levels')
      .update({ level: 1, subclass_id: null, hp_roll: null })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('character_levels').insert({
    character_id: characterId,
    class_id: classId,
    level: 1,
    subclass_id: null,
    hp_roll: null,
  })
  if (error) throw error
}

async function ensureSnapshot(characterId: string, status: CharacterStatus) {
  const { data: existing, error: existingError } = await supabase
    .from('character_snapshots')
    .select('id')
    .eq('character_id', characterId)
    .limit(1)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return

  const { error } = await supabase.from('character_snapshots').insert({
    character_id: characterId,
    level_total: 1,
    snapshot: {
      source: 'seed-demo',
      status,
      note: 'Minimal deterministic QA snapshot. Full snapshots are captured by app submit/review flows.',
    },
  })
  if (error) throw error
}

function validateRejectedImportFixture() {
  const preview = validateContentImport(DEMO_REJECTED_IMPORT_FIXTURE)
  if (preview.ok || !preview.errors.some((error) => error.code === 'duplicate_record')) {
    throw new Error('Demo rejected import fixture no longer produces a duplicate_record validation finding.')
  }
  return preview
}

async function main() {
  log('Creating demo users, campaign, allowlist, and character review states.')
  const users = await ensureDemoUsers()
  const adminQaAccess = await resolveAdminQaAccess(users.admin)
  await ensureSources()

  const campaign = await ensureCampaign(users.dm.id)
  await ensureCampaignFixture(campaign.id, users.dm.id, users.player.id)

  const classId = await findDemoClassId()
  const [draft, submitted, review] = await Promise.all(
    DEMO_CHARACTERS.map((character) => (
      ensureCharacter(
        users.player.id,
        campaign.id,
        character.name,
        character.status,
        classId,
        character.dmNotes
      )
    ))
  )

  const rejectedImportPreview = validateRejectedImportFixture()

  log('Demo credentials:')
  if (adminQaAccess.kind === 'password') {
    log(`  admin: ${adminQaAccess.detail}`)
  } else if (adminQaAccess.kind === 'magic_link') {
    log(`  admin: existing singleton admin ${adminQaAccess.email}; use this generated magic link for /dm/content:`)
    log(`  ${adminQaAccess.detail}`)
  } else {
    log(`  admin: ${adminQaAccess.detail}`)
  }
  log(`  dm: ${DEMO_USERS.dm.email} / ${DEMO_PASSWORD}`)
  log(`  player: ${DEMO_USERS.player.email} / ${DEMO_PASSWORD}`)
  log('Known QA routes:')
  log('  /login')
  log('  /dm/dashboard')
  log('  /dm/content')
  log('  /characters/new')
  log(`  /characters/${draft.id}`)
  log(`  /characters/${submitted.id}`)
  log(`  /characters/${review.id}`)
  log('Rejected import preview fixture for /dm/content:')
  log(JSON.stringify(DEMO_REJECTED_IMPORT_FIXTURE, null, 2))
  log(`Rejected fixture findings: ${rejectedImportPreview.errors.map((error) => error.code).join(', ')}`)
}

main().catch((error) => {
  console.error('[seed-demo] Fatal error:', error)
  process.exit(1)
})
