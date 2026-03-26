import { describe, it, expect } from 'vitest'
import { calcEconomicMultiplier, calcTotalMarketDemand } from '@/engine/demand'

describe('calcEconomicMultiplier', () => {
  describe('stable сценарий', () => {
    it('multiplier = 1.0 на всех периодах', () => {
      for (let period = 1; period <= 12; period++) {
        const result = calcEconomicMultiplier('stable', period, 12)
        expect(result).toBeCloseTo(1.0, 5)
      }
    })
  })

  describe('growing сценарий', () => {
    it('multiplier >= 1.0 на всех периодах', () => {
      for (let period = 1; period <= 12; period++) {
        const result = calcEconomicMultiplier('growing', period, 12)
        expect(result).toBeGreaterThanOrEqual(1.0)
      }
    })

    it('multiplier растёт в первой трети', () => {
      const m1 = calcEconomicMultiplier('growing', 1, 12)
      const m4 = calcEconomicMultiplier('growing', 4, 12)
      expect(m4).toBeGreaterThanOrEqual(m1)
    })
  })

  describe('crisis сценарий', () => {
    it('multiplier падает до ~0.60 в середине', () => {
      const crisisBottom = Math.floor(12 * 0.5) // period 6
      const result = calcEconomicMultiplier('crisis', crisisBottom, 12)
      expect(result).toBeCloseTo(0.6, 1)
    })

    it('multiplier = 1.0 в начале (до crisisStart)', () => {
      const result = calcEconomicMultiplier('crisis', 1, 12)
      expect(result).toBeCloseTo(1.0, 5)
    })

    it('multiplier ≈ 0.95 в конце', () => {
      const result = calcEconomicMultiplier('crisis', 12, 12)
      expect(result).toBeCloseTo(0.95, 1)
    })

    it('multiplier > 0 на всех периодах', () => {
      for (let period = 1; period <= 12; period++) {
        const result = calcEconomicMultiplier('crisis', period, 12)
        expect(result).toBeGreaterThan(0)
      }
    })
  })

  describe('random сценарий', () => {
    it('multiplier остаётся в диапазоне [0.45, 1.60]', () => {
      let prevMultiplier = 1.0
      for (let period = 1; period <= 12; period++) {
        const result = calcEconomicMultiplier('random', period, 12, prevMultiplier)
        expect(result).toBeGreaterThanOrEqual(0.45)
        expect(result).toBeLessThanOrEqual(1.6)
        prevMultiplier = result
      }
    })

    it('без prevMultiplier начинает с 1.0', () => {
      const result = calcEconomicMultiplier('random', 1, 12)
      expect(result).toBeGreaterThanOrEqual(0.45)
      expect(result).toBeLessThanOrEqual(1.6)
    })
  })
})

describe('calcTotalMarketDemand', () => {
  it('спрос = BASE_DEMAND × N при multiplier=1, noise=0', () => {
    const result = calcTotalMarketDemand(5, 1.0, 0)
    expect(result).toBe(5000) // 1000 × 5 × 1.0
  })

  it('спрос масштабируется с multiplier', () => {
    const result = calcTotalMarketDemand(5, 0.5, 0)
    expect(result).toBe(2500)
  })

  it('спрос масштабируется с количеством компаний', () => {
    const r2 = calcTotalMarketDemand(2, 1.0, 0)
    const r5 = calcTotalMarketDemand(5, 1.0, 0)
    expect(r5 / r2).toBeCloseTo(2.5, 5)
  })

  it('noise применяется: результат ≠ базовому', () => {
    // noise = 0.03 → 5000 × 1.03 = 5150
    const result = calcTotalMarketDemand(5, 1.0, 0.03)
    expect(result).toBeCloseTo(5150, 0)
  })

  it('при multiplier=0.45 и N=5: спрос = 2250', () => {
    const result = calcTotalMarketDemand(5, 0.45, 0)
    expect(result).toBeCloseTo(2250, 0)
  })

  it('при multiplier=1.60 и N=5: спрос = 8000', () => {
    const result = calcTotalMarketDemand(5, 1.6, 0)
    expect(result).toBeCloseTo(8000, 0)
  })

  it('дуополия (N=2): каждый игрок влияет сильнее', () => {
    const result = calcTotalMarketDemand(2, 1.0, 0)
    expect(result).toBe(2000)
  })

  it('спрос >= 0 при любых корректных входных данных', () => {
    expect(calcTotalMarketDemand(1, 0.45, -0.03)).toBeGreaterThanOrEqual(0)
  })
})
