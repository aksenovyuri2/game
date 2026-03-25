import { describe, it, expect } from 'vitest'
import { calcMPI, calcMPIFactors } from '../../../src/engine/mpi'
import type { PeriodResult } from '../../../src/engine/types'

function makePeriodResult(overrides: Partial<PeriodResult> = {}): PeriodResult {
  return {
    companyId: 'test',
    unitsSold: 1000,
    endInventory: 0,
    marketShare: 0.2,
    revenue: 100000,
    cogs: 60000,
    grossProfit: 40000,
    fixedCosts: 50000,
    marketingExpense: 10000,
    rdExpense: 5000,
    depreciation: 15000,
    storageCost: 0,
    ebit: -40000,
    tax: 0,
    netProfit: -40000,
    newCash: 160000,
    newEquipment: 95000,
    newRdAccumulated: 4500,
    newRetainedEarnings: -40000,
    mpi: 0,
    variableCostPerUnit: 60,
    ...overrides,
  }
}

// ─── calcMPIFactors ──────────────────────────────────────────────────────────

describe('calcMPIFactors', () => {
  it('all factors are in [0, 100]', () => {
    const result = makePeriodResult()
    const factors = calcMPIFactors(result)
    Object.values(factors).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    })
  })

  it('higher retained earnings → higher retainedEarnings factor', () => {
    const low = calcMPIFactors(makePeriodResult({ newRetainedEarnings: 50000 }))
    const high = calcMPIFactors(makePeriodResult({ newRetainedEarnings: 400000 }))
    expect(high.retainedEarnings).toBeGreaterThan(low.retainedEarnings)
  })

  it('higher market share → higher marketShare factor', () => {
    const low = calcMPIFactors(makePeriodResult({ marketShare: 0.1 }))
    const high = calcMPIFactors(makePeriodResult({ marketShare: 0.5 }))
    expect(high.marketShare).toBeGreaterThan(low.marketShare)
  })

  it('has exactly 6 factors', () => {
    const factors = calcMPIFactors(makePeriodResult())
    expect(Object.keys(factors)).toHaveLength(6)
  })
})

// ─── calcMPI ─────────────────────────────────────────────────────────────────

describe('calcMPI', () => {
  it('MPI is in [0, 100]', () => {
    const result = makePeriodResult()
    const mpi = calcMPI(result)
    expect(mpi).toBeGreaterThanOrEqual(0)
    expect(mpi).toBeLessThanOrEqual(100)
  })

  it('better performance → higher MPI', () => {
    const poor = makePeriodResult({
      newRetainedEarnings: -100000,
      marketShare: 0.05,
      netProfit: -100000,
      revenue: 50000,
    })
    const good = makePeriodResult({
      newRetainedEarnings: 500000,
      marketShare: 0.35,
      netProfit: 80000,
      revenue: 180000,
    })
    expect(calcMPI(good)).toBeGreaterThan(calcMPI(poor))
  })

  it('MPI is deterministic for the same input', () => {
    const result = makePeriodResult({ newRetainedEarnings: 100000 })
    expect(calcMPI(result)).toBe(calcMPI(result))
  })
})
