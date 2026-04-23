import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getContiguouslyCompletedSteps,
  hasCompletedStep,
} from '@/lib/characters/wizard-step-helpers'

test('getContiguouslyCompletedSteps stops at the first incomplete step', () => {
  const steps = getContiguouslyCompletedSteps(
    ['identity', 'species', 'background', 'classes'] as const,
    {
      identity: true,
      species: true,
      background: false,
      classes: true,
    }
  )

  assert.deepEqual(steps, ['identity', 'species'])
})

test('hasCompletedStep checks whether a step survived draft-safe truncation', () => {
  const completed = ['identity', 'species', 'background'] as const

  assert.equal(hasCompletedStep(completed, 'background'), true)
  assert.equal(hasCompletedStep(completed, 'classes'), false)
})
