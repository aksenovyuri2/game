import { describe, it, expect } from 'vitest'
import {
  calcVariableCostPerUnit,
  calcNewEquipment,
  calcDepreciation,
  calcStorageCost,
  calcProductionCost,
} from '../../../src/engine/costs'
import { DEFAULT_CONFIG } from '../../../src/engine/types'

const cfg = DEFAULT_CONFIG

// ─── calcVariableCostPerUnit ─────────────────────────────────────────────────

describe('calcVariableCostPerUnit', () => {
  it('returns baseVariableCost when equipment = 0', () => {
    const cost = calcVariableCostPerUnit(0, cfg)
    expect(cost).toBeCloseTo(cfg.baseVariableCost)
  })

  it('more equipment → lower variable cost per unit', () => {
    const lowCost = calcVariableCostPerUnit(100000, cfg)
    const highCost = calcVariableCostPerUnit(500000, cfg)
    expect(highCost).toBeLessThan(lowCost)
  })

  it('variable cost per unit is always positive', () => {
    expect(calcVariableCostPerUnit(0, cfg)).toBeGreaterThan(0)
    expect(calcVariableCostPerUnit(10_000_000, cfg)).toBeGreaterThan(0)
  })

  it('diminishing returns on equipment investment', () => {
    const reduction1 = calcVariableCostPerUnit(0, cfg) - calcVariableCostPerUnit(100000, cfg)
    const reduction2 = calcVariableCostPerUnit(100000, cfg) - calcVariableCostPerUnit(200000, cfg)
    expect(reduction1).toBeGreaterThan(reduction2)
  })
})

// ─── calcDepreciation ────────────────────────────────────────────────────────

describe('calcDepreciation', () => {
  it('depreciation = equipment * depreciationRate', () => {
    const depr = calcDepreciation(100000, cfg)
    expect(depr).toBeCloseTo(100000 * cfg.depreciationRate)
  })

  it('zero equipment → zero depreciation', () => {
    expect(calcDepreciation(0, cfg)).toBe(0)
  })
})

// ─── calcNewEquipment ────────────────────────────────────────────────────────

describe('calcNewEquipment', () => {
  it('equipment depreciates without investment', () => {
    const newEq = calcNewEquipment(100000, 0, cfg)
    expect(newEq).toBeCloseTo(100000 * (1 - cfg.depreciationRate))
  })

  it('investment increases equipment', () => {
    const withInvestment = calcNewEquipment(100000, 50000, cfg)
    const withoutInvestment = calcNewEquipment(100000, 0, cfg)
    expect(withInvestment).toBeGreaterThan(withoutInvestment)
  })

  it('equipment is never negative', () => {
    expect(calcNewEquipment(0, 0, cfg)).toBeGreaterThanOrEqual(0)
  })
})

// ─── calcStorageCost ─────────────────────────────────────────────────────────

describe('calcStorageCost', () => {
  it('storage cost = endInventory * storageCostPerUnit', () => {
    const cost = calcStorageCost(500, cfg)
    expect(cost).toBeCloseTo(500 * cfg.storageCostPerUnit)
  })

  it('zero inventory → zero storage cost', () => {
    expect(calcStorageCost(0, cfg)).toBe(0)
  })
})

// ─── calcProductionCost ──────────────────────────────────────────────────────

describe('calcProductionCost', () => {
  it('production cost = variableCostPerUnit * produced + fixedCosts', () => {
    const variableCost = 60
    const cost = calcProductionCost(1000, variableCost, cfg)
    expect(cost).toBeCloseTo(1000 * variableCost + cfg.fixedCosts)
  })

  it('zero production still has fixed costs', () => {
    const cost = calcProductionCost(0, 60, cfg)
    expect(cost).toBeCloseTo(cfg.fixedCosts)
  })

  it('more production → higher cost (linear variable part)', () => {
    const low = calcProductionCost(500, 60, cfg)
    const high = calcProductionCost(1500, 60, cfg)
    expect(high).toBeGreaterThan(low)
    expect(high - low).toBeCloseTo(1000 * 60) // exactly variable part difference
  })
})
