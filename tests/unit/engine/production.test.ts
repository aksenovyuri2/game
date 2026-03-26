import { describe, it, expect } from 'vitest'
import { calcEquipment, calcCapacity, calcRdAccumulated, calcUnitCost } from '@/engine/production'

describe('calcEquipment', () => {
  it('оборудование уменьшается при capex=0', () => {
    const result = calcEquipment(100000, 0)
    expect(result).toBeCloseTo(100000 * (1 - 0.08), 5) // 92000
  })

  it('оборудование растёт при capex > amortization', () => {
    const result = calcEquipment(100000, 40000)
    expect(result).toBeCloseTo(100000 * 0.92 + 40000, 5) // 132000
  })

  it('оборудование не может быть < 0', () => {
    const result = calcEquipment(100, 0)
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('деградация 10 периодов при capex=0 корректна', () => {
    let equipment = 100000
    for (let i = 0; i < 10; i++) {
      equipment = calcEquipment(equipment, 0)
    }
    // 100000 × 0.92^10 ≈ 43439
    expect(equipment).toBeCloseTo(100000 * Math.pow(0.92, 10), 0)
  })
})

describe('calcCapacity', () => {
  it('при начальном equipment=100000 → capacity = 1000', () => {
    const result = calcCapacity(100000)
    // ln(100000/100000) = ln(1) = 0, multiplier = 1.0 → capacity = 1000
    expect(result).toBe(1000)
  })

  it('при equipment=0 → capacity = минимальный (S-кривая)', () => {
    const result = calcCapacity(0)
    // S-кривая при 0 → значение ниже midpoint, но clamp ≥ 200
    expect(result).toBeGreaterThanOrEqual(200)
    expect(result).toBeLessThan(600)
  })

  it('при equipment очень малом → capacity = 200 (clamp min)', () => {
    const result = calcCapacity(1)
    expect(result).toBeGreaterThanOrEqual(200)
  })

  it('при большом equipment → capacity растёт, но не превышает 3000', () => {
    const result = calcCapacity(10000000)
    expect(result).toBeLessThanOrEqual(3000)
  })

  it('capacity всегда в диапазоне [200, 3000]', () => {
    const testValues = [0, 1, 1000, 50000, 100000, 500000, 10000000]
    for (const eq of testValues) {
      const cap = calcCapacity(eq)
      expect(cap).toBeGreaterThanOrEqual(200)
      expect(cap).toBeLessThanOrEqual(3000)
    }
  })

  it('деградация equipment при capex=0: capacity падает постепенно', () => {
    let equipment = 100000
    const cap0 = calcCapacity(equipment)
    for (let i = 0; i < 10; i++) {
      equipment = calcEquipment(equipment, 0) // из production.ts
    }
    const cap10 = calcCapacity(equipment)
    // После 10 периодов без capex, capacity должна упасть
    expect(cap10).toBeLessThan(cap0)
    // Но не ниже 200
    expect(cap10).toBeGreaterThanOrEqual(200)
  })
})

describe('calcRdAccumulated', () => {
  it('R&D накапливается с затуханием 5%', () => {
    const result = calcRdAccumulated(1000, 10000)
    expect(result).toBeCloseTo(1000 * 0.95 + 10000, 5) // 10950
  })

  it('без инвестиций rdAccumulated уменьшается', () => {
    const result = calcRdAccumulated(10000, 0)
    expect(result).toBeCloseTo(10000 * 0.95, 5) // 9500
  })

  it('не может быть < 0', () => {
    const result = calcRdAccumulated(0, 0)
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('деградация за 12 периодов без R&D: 1000 → ~540', () => {
    let rd = 1000
    for (let i = 0; i < 12; i++) {
      rd = calcRdAccumulated(rd, 0)
    }
    expect(rd).toBeCloseTo(1000 * Math.pow(0.95, 12), 0) // ≈ 540
  })

  it('R&D стабилизируется при постоянных инвестициях', () => {
    let rd = 1000
    // При rd=30000: стабилизация → 30000/0.05 = 600000
    for (let i = 0; i < 300; i++) {
      rd = calcRdAccumulated(rd, 30000)
    }
    // После 300 периодов: 600000 × (1 - 0.95^300) ≈ 600000
    expect(rd).toBeCloseTo(600000, -2) // точность: разница < 5000
  })
})

describe('calcUnitCost', () => {
  describe('нормальные значения', () => {
    it('при полной загрузке (production=capacity): scale discount = 20%', () => {
      const result = calcUnitCost(1000, 1000, 100000, 1000)
      // rdEfficiency = min(0.3, 1000/100000) = 0.01
      // rawVariableCost = 12 × (1 - 0.01) = 11.88
      // scaleDiscount = 20% (полная загрузка)
      // variableCost = 11.88 × 0.80 × 1.0 = 9.504
      // fixedCostPerUnit = (8000 + 100000×0.02) / 1000 = 10
      // unitCost ≈ 19.5
      expect(result.unitCost).toBeCloseTo(19.5, 0)
      expect(result.overtimePenalty).toBe(1.0)
    })

    it('unitCost >= 1.0 всегда', () => {
      const result = calcUnitCost(1, 1000, 0, 0)
      expect(result.unitCost).toBeGreaterThanOrEqual(1.0)
    })

    it('production = 0: fixedCostPerUnit = totalFixedCosts (делитель = 1)', () => {
      const result = calcUnitCost(0, 1000, 100000, 1000)
      // fixedCostPerUnit = (8000 + 2000) / 1 = 10000
      expect(result.fixedCostPerUnit).toBeCloseTo(10000, 0)
    })
  })

  describe('сверхурочные', () => {
    it('production = capacity × 1.5: overtimePenalty = 1.25', () => {
      const result = calcUnitCost(1500, 1000, 100000, 1000)
      // overtimeRatio = 0.5
      // overtimePenalty = 1 + 0.5 × 0.5 = 1.25
      expect(result.overtimePenalty).toBeCloseTo(1.25, 5)
    })

    it('production > capacity: overtimePenalty > 1.0', () => {
      const result = calcUnitCost(1100, 1000, 100000, 1000)
      expect(result.overtimePenalty).toBeGreaterThan(1.0)
    })

    it('production <= capacity: overtimePenalty = 1.0', () => {
      const result = calcUnitCost(900, 1000, 100000, 1000)
      expect(result.overtimePenalty).toBe(1.0)
    })
  })

  describe('R&D эффективность', () => {
    it('высокий rdAccumulated снижает rawVariableCost', () => {
      const low = calcUnitCost(1000, 1000, 100000, 1000)
      const high = calcUnitCost(1000, 1000, 100000, 100000)
      expect(high.variableCostPerUnit).toBeLessThan(low.variableCostPerUnit)
    })

    it('MAX_RD_EFFICIENCY = 30%: снижение переменных затрат не более 30%', () => {
      const result = calcUnitCost(1000, 1000, 100000, 10000000)
      // rdEfficiency capped at 0.3 → variableCost still > 0
      expect(result.variableCostPerUnit).toBeGreaterThan(0)
    })
  })

  describe('инварианты', () => {
    it('unitCost = fixedCostPerUnit + variableCostPerUnit', () => {
      const result = calcUnitCost(800, 1000, 100000, 5000)
      expect(result.unitCost).toBeCloseTo(result.fixedCostPerUnit + result.variableCostPerUnit, 5)
    })

    it('все значения > 0 при нормальных входных данных', () => {
      const result = calcUnitCost(800, 1000, 100000, 5000)
      expect(result.unitCost).toBeGreaterThan(0)
      expect(result.variableCostPerUnit).toBeGreaterThan(0)
      expect(result.fixedCostPerUnit).toBeGreaterThan(0)
    })
  })
})
