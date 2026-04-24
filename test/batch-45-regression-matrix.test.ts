import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const files = {
  swapReplace: 'supabase/migrations/065_level_up_atomic_save_swap_replace.sql',
  skillOverlap: 'supabase/migrations/066_level_up_atomic_save_skill_overlap.sql',
  anchorSafety: 'supabase/migrations/067_level_up_preserved_provenance_anchor_safety.sql',
  concurrencyMigration: 'supabase/migrations/068_level_up_concurrency_guardrails.sql',
  routeConcurrency: 'test/character-route-concurrency-errors.test.ts',
  clientSafety: 'test/client-submit-safety.test.ts',
  serverRolls: 'test/server-side-rolled-stats.test.ts',
  closeout: 'output/batch-4-closeout-audit.md',
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

test('Batch 4.5 regression matrix pins every critical 2026-04-23 level-up data finding', () => {
  const coverage = [
    {
      finding: 'spell swaps replace outgoing class-scoped spell rows',
      file: files.swapReplace,
      patterns: [/DELETE FROM public\.character_spell_selections/i, /feat_spell:%/i, /feature_spell:%/i],
    },
    {
      finding: 'feat retrains upsert instead of orphaning outgoing rows',
      file: files.swapReplace,
      patterns: [/ON CONFLICT \(character_id, feat_id, choice_kind\)\s+DO UPDATE SET/i],
    },
    {
      finding: 'feature-option value changes update selected_value instead of unique-key failing',
      file: files.swapReplace,
      patterns: [/ON CONFLICT \(character_id, option_group_key, option_key, choice_order, source_feature_key\)\s+DO UPDATE SET/i, /selected_value = EXCLUDED\.selected_value/i],
    },
    {
      finding: 'overlapping multiclass skills merge expertise and preserve first-write provenance',
      file: files.skillOverlap,
      patterns: [/ON CONFLICT \(character_id, skill\)\s+DO UPDATE SET/i, /expertise = character_skill_proficiencies\.expertise OR EXCLUDED\.expertise/i],
    },
    {
      finding: 'preserved multiclass spell, feat, and feature anchors are not moved to the new level',
      file: files.anchorSafety,
      patterns: [/COALESCE\(incoming\.character_level_id, existing\.character_level_id, v_level_row_id\)/i, /ELSE NULL/i],
    },
    {
      finding: 'class-level sync no longer deletes valid per-level rows before reinserting them',
      file: files.anchorSafety,
      patterns: [/ON CONFLICT \(character_id, class_id, level_number\) DO UPDATE/i, /COALESCE\(existing\.id,/i],
    },
    {
      finding: 'concurrent trigger sync and level-up saves serialize on the character row',
      file: files.concurrencyMigration,
      patterns: [/FOR UPDATE/i, /Optimistic lock mismatch/i],
    },
    {
      finding: 'known RPC validation errors map to structured 4xx responses',
      file: files.routeConcurrency,
      patterns: [/stale_level_up/i, /invalid_level_up_increment/i, /duplicate_level_up_choice/i],
    },
  ]

  for (const item of coverage) {
    const source = read(item.file)
    for (const pattern of item.patterns) {
      assert.match(source, pattern, `${item.finding} must remain pinned by ${item.file}`)
    }
  }
})

test('Batch 4.5 regression matrix pins client-side hardening findings', () => {
  const clientSafety = read(files.clientSafety)
  const serverRolls = read(files.serverRolls)

  assert.match(clientSafety, /clears stale species, background, class, and subclass scoped state/i)
  assert.match(clientSafety, /gates step jumps and protects save submits/i)
  assert.match(clientSafety, /level-up final save is working-gated and abortable/i)
  assert.match(serverRolls, /server route with crypto randomness/i)
  assert.match(serverRolls, /non-DM character API responses strip DM-only fields/i)
})

test('Batch 4.5 closeout audit includes the overlap regression archetype and coverage list', () => {
  const closeout = read(files.closeout)

  assert.match(closeout, /4\.5 overlap regression/i)
  assert.match(closeout, /spell\/feat replacement/i)
  assert.match(closeout, /feature-option upsert/i)
  assert.match(closeout, /test\/batch-45-regression-matrix\.test\.ts/i)
})
