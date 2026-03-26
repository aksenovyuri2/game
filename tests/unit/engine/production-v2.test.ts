import { describe, it, expect } from 'vitest'
import { calcCapacity, calcUnitCost } from '../../../src/engine/production'

describe('calcCapacity v2 — S-кривая', () => {
  it('при малом equipment (30000) — мощность ниже базовой', () => {
    const cap = calcCapacity(30000)
    expect(cap).toBeLessThan(800)
    expect(cap).toBeGreaterThanOrEqual(200)
  })

  it('при стандартном equipment (100000) — мощность ~1000', () => {
    const cap = calcCapacity(100000)
    expect(cap).toBeGreaterThan(800)
    expect(cap).toBeLessThan(1200)
  })

  it('при высоком equipment (200000) — мощность растёт', () => {
    const cap = calcCapacity(200000)
    expect(cap).toBeGreaterThan(1200)
  })

  it('при очень высоком equipment (500000) — рост замедляется (S-кривая)', () => {
    const cap200 = calcCapacity(200000)
    const cap350 = calcCapacity(350000)
    const cap500 = calcCapacity(500000)
    // Прирост 200→350 > прирост 350→500 (убывающая отдача)
    const gain1 = cap350 - cap200
    const gain2 = cap500 - cap350
    expect(gain2).toBeLessThan(gain1)
  })

  it('не выходит за пределы [200, 3000]', () => {
    expect(calcCapacity(0)).toBeGreaterThanOrEqual(200)
    expect(calcCapacity(1000000)).toBeLessThanOrEqual(3000)
  })
})

describe('calcUnitCost v2 — R&D с S-кривой и минимальным шагом', () => {
  it('при малом rdAccumulated — rdEfficiency >= 0.1% (MIN_RD_STEP)', () => {
    const result = calcUnitCost(500, 1000, 100000, 100)
    expect(result.rdEfficiency).toBeGreaterThanOrEqual(0.001)
  })

  it('при rdAccumulated=0 — rdEfficiency = 0', () => {
    const result = calcUnitCost(500, 1000, 100000, 0)
    expect(result.rdEfficiency).toBe(0)
  })

  it('при среднем rdAccumulated (50000) — rdEfficiency ~15%', () => {
    const result = calcUnitCost(500, 1000, 100000, 50000)
    expect(result.rdEfficiency).toBeGreaterThan(0.1)
    expect(result.rdEfficiency).toBeLessThan(0.22)
  })

  it('при высоком rdAccumulated (200000) — rdEfficiency близка к максимуму', () => {
    const result = calcUnitCost(500, 1000, 100000, 200000)
    expect(result.rdEfficiency).toBeGreaterThan(0.25)
    expect(result.rdEfficiency).toBeLessThanOrEqual(0.3)
  })

  it('S-кривая: темп роста сначала увеличивается, потом замедляется', () => {
    const eff50k = calcUnitCost(500, 1000, 100000, 50000).rdEfficiency
    const eff100k = calcUnitCost(500, 1000, 100000, 100000).rdEfficiency
    const eff200k = calcUnitCost(500, 1000, 100000, 200000).rdEfficiency

    // Прирост 50k→100k vs 100k→200k (второй должен быть меньше — S-кривая)
    const gain1 = eff100k - eff50k
    const gain2 = eff200k - eff100k
    expect(gain2).toBeLessThan(gain1)
  })
})
