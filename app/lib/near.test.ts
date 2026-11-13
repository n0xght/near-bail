import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addNearStrings,
  bailRetries,
  formatHalfPoolNear,
  hasEnoughForBail,
  isCorrectPayoutGuess,
  nearToYocto,
  staleSnapshotYocto,
  subNearStrings,
  yoctoToNearString,
} from './near.ts'

describe('yocto conversions', () => {
  it('keeps amounts smaller than 0.0001 NEAR', () => {
    assert.equal(yoctoToNearString(1n), '0.000000000000000000000001')
    assert.equal(nearToYocto('0.000000000000000000000001'), 1n)
  })

  it('round-trips values that are not 4 decimal places', () => {
    const yocto = 1_234_567_890_123_456_789_012_345n
    const near = yoctoToNearString(yocto)
    assert.equal(nearToYocto(near), yocto)
    assert.notEqual(near, '1.2345')
  })

  it('subtracts a bail without rounding 0.05 up to 0.1', () => {
    assert.equal(subNearStrings('0.15', '0.1'), '0.05')
    assert.equal(addNearStrings('1.5', '0.5'), '2.0')
  })

  it('counts retries from exact yocto instead of binary floats', () => {
    assert.equal(bailRetries('0.3'), 3)
    assert.equal(bailRetries('0.05'), 0)
    assert.equal(hasEnoughForBail('0.1'), true)
    assert.equal(hasEnoughForBail('0.0999'), false)
  })
})

describe('release payout math', () => {
  it('does not turn a 10 NEAR payout into 1 NEAR', () => {
    assert.equal(formatHalfPoolNear('20'), '10.0')
    assert.equal(formatHalfPoolNear('20.00'), '10.0')
    assert.equal(formatHalfPoolNear('1.5'), '0.75')
    assert.equal(formatHalfPoolNear('0'), '0.0')
  })

  it('accepts a zero payout guess when the pool is empty', () => {
    assert.equal(isCorrectPayoutGuess('0', '0'), true)
    assert.equal(isCorrectPayoutGuess('0.0', '0'), true)
    assert.equal(isCorrectPayoutGuess('0', '1500000000000000000000000'), false)
  })

  it('matches integer half of the canonical pool, including odd yocto', () => {
    assert.equal(
      isCorrectPayoutGuess('0.75', '1500000000000000000000000'),
      true,
    )
    assert.equal(
      isCorrectPayoutGuess('0.750 NEAR', '1500000000000000000000000'),
      true,
    )
    assert.equal(isCorrectPayoutGuess('0.000000000000000000000001', '3'), true)
    assert.equal(isCorrectPayoutGuess('0.000000000000000000000002', '3'), false)
  })

  it('keeps the stale snapshot 0.5 NEAR above the canonical yocto', () => {
    const canonical = '1500000000000000000000000'
    const stale = staleSnapshotYocto(canonical)
    assert.equal(
      BigInt(stale) - BigInt(canonical),
      500_000_000_000_000_000_000_000n,
    )
    assert.notEqual(stale, canonical)
  })
})
