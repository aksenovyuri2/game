import { describe, it, expect } from 'vitest'
import { calcCapacity, calcUnitCost } from '../../../src/engine/production'

describe('calcCapacity — логарифмическая формула из ТЗ', () => {
  it('при начальном equipment=100000 → capacity = 1000', () => {
    // capitalRatio = 1.0, ln(1) = 0, multiplier = 1.0
    const cap = calcCapacity(100000)
    expect(cap).toBe(1000)
  })

  it('при малом equipment (30000) → capacity ниже 1000', () => {
    const cap = calcCapacity(30000)
    expect(cap).toBeLessThan(1000)
    expect(cap).toBeGreaterThanOrEqual(200)
  })

  it('при высоком equipment (200000) → capacity растёт (убывающая отдача)', () => {
    const cap = calcCapacity(200000)
    expect(cap).toBeGreaterThan(1000)
  })

  it('убывающая отдача: прирост от 100K→200K > прирост от 200K→300K', () => {
    const cap100 = calcCapacity(100000)
    const cap200 = calcCapacity(200000)
    const cap300 = calcCapacity(300000)
    const gain1 = cap200 - cap100
    const gain2 = cap300 - cap200
    expect(gain2).toBeLessThan(gain1)
  })

  it('не выходит за пределы [200, 3000]', () => {
    expect(calcCapacity(0)).toBeGreaterThanOrEqual(200)
    expect(calcCapacity(1000000)).toBeLessThanOrEqual(3000)
  })
})

describe('calcUnitCost — линейная R&D эффективность', () => {
  it('rdEfficiency = rdAccumulated / RD_EFFICIENCY_SCALE (линейно)', () => {
    // rdAccumulated=10000 → rdEfficiency = 10000/100000 = 0.10
    const result = calcUnitCost(500, 1000, 100000, 10000)
    expect(result.rdEfficiency).toBeCloseTo(0.1, 5)
  })

  it('при rdAccumulated=0 — rdEfficiency = 0', () => {
    const result = calcUnitCost(500, 1000, 100000, 0)
    expect(result.rdEfficiency).toBe(0)
  })

  it('rdEfficiency capped at MAX_RD_EFFICIENCY = 0.30', () => {
    // rdAccumulated = 500000 → 500000/100000 = 5.0, capped at 0.30
    const result = calcUnitCost(500, 1000, 100000, 500000)
    expect(result.rdEfficiency).toBe(0.3)
  })

  it('высокий rdAccumulated снижает variableCostPerUnit', () => {
    const low = calcUnitCost(1000, 1000, 100000, 1000)
    const high = calcUnitCost(1000, 1000, 100000, 100000)
    expect(high.variableCostPerUnit).toBeLessThan(low.variableCostPerUnit)
  })

  it('линейная формула: удвоение rdAccumulated удваивает эффект', () => {
    const eff10k = calcUnitCost(500, 1000, 100000, 10000).rdEfficiency
    const eff20k = calcUnitCost(500, 1000, 100000, 20000).rdEfficiency
    expect(eff20k).toBeCloseTo(eff10k * 2, 5)
  })
})
