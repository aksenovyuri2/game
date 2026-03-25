import { describe, it, expect } from 'vitest'
import {
  calcCompetitiveScores,
  calcMarketShares,
  calcMacroFactor,
  calcDemandForCompanies,
  calcSalesAndInventory,
} from '../../../src/engine/market'
import type { Decisions } from '../../../src/engine/types'
import { DEFAULT_CONFIG } from '../../../src/engine/types'

const cfg = DEFAULT_CONFIG

// ─── calcCompetitiveScores ───────────────────────────────────────────────────

describe('calcCompetitiveScores', () => {
  it('companies with identical decisions get identical scores', () => {
    const decisions: Decisions[] = [
      { price: 100, production: 1000, marketing: 10000, capitalInvestment: 0, rd: 0 },
      { price: 100, production: 1000, marketing: 10000, capitalInvestment: 0, rd: 0 },
    ]
    const rdAccumulated = [0, 0]
    const scores = calcCompetitiveScores(decisions, rdAccumulated, cfg)
    expect(scores[0]).toBeCloseTo(scores[1]!)
  })

  it('lower price → higher competitive score', () => {
    const decisions: Decisions[] = [
      { price: 80, production: 1000, marketing: 10000, capitalInvestment: 0, rd: 0 },
      { price: 120, production: 1000, marketing: 10000, capitalInvestment: 0, rd: 0 },
    ]
    const scores = calcCompetitiveScores(decisions, [0, 0], cfg)
    expect(scores[0]).toBeGreaterThan(scores[1]!)
  })

  it('higher marketing → higher competitive score', () => {
    const decisions: Decisions[] = [
      { price: 100, production: 1000, marketing: 30000, capitalInvestment: 0, rd: 0 },
      { price: 100, production: 1000, marketing: 5000, capitalInvestment: 0, rd: 0 },
    ]
    const scores = calcCompetitiveScores(decisions, [0, 0], cfg)
    expect(scores[0]).toBeGreaterThan(scores[1]!)
  })

  it('higher rdAccumulated → higher competitive score', () => {
    const decisions: Decisions[] = [
      { price: 100, production: 1000, marketing: 10000, capitalInvestment: 0, rd: 0 },
      { price: 100, production: 1000, marketing: 10000, capitalInvestment: 0, rd: 0 },
    ]
    const scores = calcCompetitiveScores(decisions, [100000, 0], cfg)
    expect(scores[0]).toBeGreaterThan(scores[1]!)
  })

  it('all scores are positive', () => {
    const decisions: Decisions[] = [
      { price: 200, production: 0, marketing: 0, capitalInvestment: 0, rd: 0 },
    ]
    const scores = calcCompetitiveScores(decisions, [0], cfg)
    expect(scores[0]).toBeGreaterThan(0)
  })
})

// ─── calcMarketShares ────────────────────────────────────────────────────────

describe('calcMarketShares', () => {
  it('market shares sum to 1', () => {
    const scores = [2.0, 1.5, 1.0, 0.8, 0.7]
    const shares = calcMarketShares(scores)
    const total = shares.reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1)
  })

  it('equal scores → equal shares', () => {
    const scores = [1.0, 1.0, 1.0, 1.0]
    const shares = calcMarketShares(scores)
    shares.forEach((s) => expect(s).toBeCloseTo(0.25))
  })

  it('all-zero scores → equal shares (no division by zero)', () => {
    const shares = calcMarketShares([0, 0, 0])
    const total = shares.reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1)
    shares.forEach((s) => expect(s).toBeCloseTo(1 / 3))
  })

  it('shares are in [0, 1]', () => {
    const scores = [5, 1, 0.1]
    const shares = calcMarketShares(scores)
    shares.forEach((s) => {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(1)
    })
  })
})

// ─── calcMacroFactor ─────────────────────────────────────────────────────────

describe('calcMacroFactor', () => {
  it('stable scenario returns 1.0 regardless of period', () => {
    expect(calcMacroFactor('stable', 1, 0)).toBeCloseTo(1.0)
    expect(calcMacroFactor('stable', 10, 0)).toBeCloseTo(1.0)
  })

  it('growing scenario increases over time', () => {
    const early = calcMacroFactor('growing', 1, 0)
    const late = calcMacroFactor('growing', 10, 0)
    expect(late).toBeGreaterThan(early)
  })

  it('crisis scenario decreases over time but stays above 0.4', () => {
    const macro = calcMacroFactor('crisis', 12, 0)
    expect(macro).toBeGreaterThanOrEqual(0.4)
    expect(macro).toBeLessThan(calcMacroFactor('crisis', 1, 0))
  })

  it('random scenario uses seed and is in reasonable range', () => {
    const macro = calcMacroFactor('random', 1, 42)
    expect(macro).toBeGreaterThan(0.5)
    expect(macro).toBeLessThan(2.0)
  })
})

// ─── calcDemandForCompanies ──────────────────────────────────────────────────

describe('calcDemandForCompanies', () => {
  it('total demand equals baseMarketSize * macro', () => {
    const shares = [0.25, 0.25, 0.25, 0.25]
    const macroFactor = 1.0
    const demands = calcDemandForCompanies(shares, macroFactor, cfg)
    const total = demands.reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(cfg.baseMarketSize)
  })

  it('higher market share → more demand', () => {
    const shares = [0.6, 0.4]
    const demands = calcDemandForCompanies(shares, 1.0, cfg)
    expect(demands[0]).toBeGreaterThan(demands[1]!)
  })

  it('macro > 1 increases total demand', () => {
    const shares = [0.5, 0.5]
    const normalDemand = calcDemandForCompanies(shares, 1.0, cfg)
    const boostedDemand = calcDemandForCompanies(shares, 1.5, cfg)
    const totalNormal = normalDemand.reduce((a, b) => a + b, 0)
    const totalBoosted = boostedDemand.reduce((a, b) => a + b, 0)
    expect(totalBoosted).toBeGreaterThan(totalNormal)
  })
})

// ─── calcSalesAndInventory ───────────────────────────────────────────────────

describe('calcSalesAndInventory', () => {
  it('sells all demand when supply is sufficient', () => {
    const result = calcSalesAndInventory({
      prevInventory: 500,
      produced: 1000,
      demand: 800,
    })
    expect(result.unitsSold).toBe(800)
    expect(result.endInventory).toBe(700) // 500 + 1000 - 800
  })

  it('is supply-constrained when demand > available', () => {
    const result = calcSalesAndInventory({
      prevInventory: 100,
      produced: 200,
      demand: 500,
    })
    expect(result.unitsSold).toBe(300) // inventory + produced
    expect(result.endInventory).toBe(0)
  })

  it('endInventory is never negative', () => {
    const result = calcSalesAndInventory({
      prevInventory: 0,
      produced: 100,
      demand: 1000,
    })
    expect(result.endInventory).toBeGreaterThanOrEqual(0)
  })

  it('zero production and zero inventory → zero sales', () => {
    const result = calcSalesAndInventory({
      prevInventory: 0,
      produced: 0,
      demand: 500,
    })
    expect(result.unitsSold).toBe(0)
    expect(result.endInventory).toBe(0)
  })
})
