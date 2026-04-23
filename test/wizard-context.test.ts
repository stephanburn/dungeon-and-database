import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAllSourceRuleSets,
  resolveAllowedSources,
} from '@/lib/characters/wizard-context'

test('resolveAllowedSources returns explicit campaign allowlist when present', () => {
  const allowed = resolveAllowedSources(
    [{ source_key: 'PHB' }, { source_key: 'ERftLW' }],
    [
      { key: 'PHB', rule_set: '2014' },
      { key: 'ERftLW', rule_set: '2014' },
      { key: 'XGtE', rule_set: '2014' },
    ]
  )

  assert.deepEqual(allowed, ['PHB', 'ERftLW'])
})

test('resolveAllowedSources falls back to all known sources when campaign has no allowlist rows', () => {
  const allowed = resolveAllowedSources(
    [],
    [
      { key: 'PHB', rule_set: '2014' },
      { key: 'ERftLW', rule_set: '2014' },
    ]
  )

  assert.deepEqual(allowed, ['PHB', 'ERftLW'])
})

test('buildAllSourceRuleSets maps source keys to campaign compatibility data', () => {
  assert.deepEqual(
    buildAllSourceRuleSets([
      { key: 'PHB', rule_set: '2014' },
      { key: 'XPHB', rule_set: '2024' },
    ]),
    {
      PHB: '2014',
      XPHB: '2024',
    }
  )
})
