import { describe, it, expect } from 'vitest'
import { applyNoise, clampDecisions, seededRandom } from '../../../src/ai/base'
import type { Decisions } from '../../../src/engine/types'

const baseDecisions: Decisions = {
  price: 100,
  production: 1000,
  marketing: 10000,
  capitalInvestment: 10000,
  rd: 5000,
}

// ─── seededRandom ────────────────────────────────────────────────────────────

describe('seededRandom', () => {
  it('returns a value in [0, 1)', () => {
    const r = seededRandom('company-1', 5)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThan(1)
  })

  it('is deterministic for the same inputs', () => {
    expect(seededRandom('company-1', 5)).toBe(seededRandom('company-1', 5))
  })

  it('produces different values for different seeds', () => {
    const r1 = seededRandom('company-1', 1)
    const r2 = seededRandom('company-1', 2)
    expect(r1).not.toBe(r2)
  })

  it('produces different values for different company ids', () => {
    const r1 = seededRandom('company-1', 1)
    const r2 = seededRandom('company-2', 1)
    expect(r1).not.toBe(r2)
  })
})

// ─── applyNoise ──────────────────────────────────────────────────────────────

describe('applyNoise', () => {
  it('noiseLevel=0 → decisions unchanged', () => {
    const result = applyNoise(baseDecisions, 0, 'company-1', 1)
    expect(result.price).toBeCloseTo(baseDecisions.price)
    expect(result.production).toBeCloseTo(baseDecisions.production)
    expect(result.marketing).toBeCloseTo(baseDecisions.marketing)
  })

  it('noiseLevel>0 → decisions change', () => {
    const result = applyNoise(baseDecisions, 0.3, 'company-1', 1)
    // At least one value should differ
    const changed =
      result.price !== baseDecisions.price ||
      result.production !== baseDecisions.production ||
      result.marketing !== baseDecisions.marketing
    expect(changed).toBe(true)
  })

  it('price after noise is still positive', () => {
    for (let period = 1; period <= 12; period++) {
      const result = applyNoise(baseDecisions, 0.3, 'company-1', period)
      expect(result.price).toBeGreaterThan(0)
    }
  })

  it('all values after noise are non-negative', () => {
    for (let period = 1; period <= 12; period++) {
      const result = applyNoise(baseDecisions, 0.3, `company-${period}`, period)
      expect(result.price).toBeGreaterThanOrEqual(0)
      expect(result.production).toBeGreaterThanOrEqual(0)
      expect(result.marketing).toBeGreaterThanOrEqual(0)
      expect(result.capitalInvestment).toBeGreaterThanOrEqual(0)
      expect(result.rd).toBeGreaterThanOrEqual(0)
    }
  })

  it('noise stays within ±noiseLevel * value', () => {
    const level = 0.3
    for (let period = 1; period <= 20; period++) {
      const result = applyNoise(baseDecisions, level, `ai-${period}`, period)
      expect(result.price).toBeGreaterThanOrEqual(baseDecisions.price * (1 - level))
      expect(result.price).toBeLessThanOrEqual(baseDecisions.price * (1 + level))
    }
  })
})

// ─── clampDecisions ──────────────────────────────────────────────────────────

describe('clampDecisions', () => {
  it('price is never below 1', () => {
    const d: Decisions = { ...baseDecisions, price: -10 }
    const result = clampDecisions(d, 200000)
    expect(result.price).toBeGreaterThanOrEqual(1)
  })

  it('production is never below 0', () => {
    const d: Decisions = { ...baseDecisions, production: -500 }
    const result = clampDecisions(d, 200000)
    expect(result.production).toBeGreaterThanOrEqual(0)
  })

  it('total spend (marketing + capex + rd) does not exceed 80% of cash', () => {
    const cash = 50000
    const d: Decisions = {
      price: 100,
      production: 0,
      marketing: 100000,
      capitalInvestment: 100000,
      rd: 100000,
    }
    const result = clampDecisions(d, cash)
    const totalSpend = result.marketing + result.capitalInvestment + result.rd
    expect(totalSpend).toBeLessThanOrEqual(cash * 0.8 + 0.01) // +epsilon для float
  })

  it('valid decisions pass through unchanged', () => {
    const result = clampDecisions(baseDecisions, 200000)
    expect(result.price).toBe(baseDecisions.price)
    expect(result.production).toBe(baseDecisions.production)
    expect(result.marketing).toBe(baseDecisions.marketing)
  })
})
