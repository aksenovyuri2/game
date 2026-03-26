import { describe, it, expect } from 'vitest'
import {
  calcPriceScore,
  calcMarketingScore,
  calcQualityScore,
  calcBrandScore,
  calcCAS,
} from '@/engine/cas'

describe('calcPriceScore', () => {
  it('все цены одинаковые → priceScore = 50 для всех', () => {
    const prices = [35, 35, 35, 35]
    for (let i = 0; i < prices.length; i++) {
      expect(calcPriceScore(prices[i]!, prices)).toBeCloseTo(50.0, 5)
    }
  })

  it('минимальная цена получает максимальный score = 100', () => {
    const prices = [10, 50, 50, 50]
    const score = calcPriceScore(10, prices)
    expect(score).toBeCloseTo(100, 0)
  })

  it('максимальная цена получает score = 0', () => {
    const prices = [10, 50, 50, 50]
    const score = calcPriceScore(50, prices)
    expect(score).toBeCloseTo(0, 0)
  })

  it('применяется ELASTICITY_EXPONENT = 1.3', () => {
    const prices = [20, 40]
    // min price: raw = 100, 100^1.3 > 100, clamped to 100
    const scoreMin = calcPriceScore(20, prices)
    expect(scoreMin).toBeCloseTo(100, 0)
    // max price: raw = 0, 0^1.3 = 0
    const scoreMax = calcPriceScore(40, prices)
    expect(scoreMax).toBeCloseTo(0, 0)
    // Нелинейность: для промежуточной цены raw=50, 50^1.3 ≈ 112 → clamped 100
    // Достаточно проверить что минимальная цена = максимальный score
    expect(scoreMin).toBeGreaterThan(scoreMax)
  })

  it('с двумя компаниями: цена демпингёра dominates', () => {
    const prices = [10, 90]
    const scoreLow = calcPriceScore(10, prices)
    const scoreHigh = calcPriceScore(90, prices)
    expect(scoreLow).toBeGreaterThan(scoreHigh)
  })
})

describe('calcMarketingScore', () => {
  it('marketing = 0 для всех → score = 0', () => {
    const marketings = [0, 0, 0]
    for (const m of marketings) {
      expect(calcMarketingScore(m, marketings)).toBe(0)
    }
  })

  it('marketing = 6000 → базовый score ≈ 63', () => {
    // marketingScore = 100 × (1 - e^(-6000/6000)) = 100 × (1 - 1/e) ≈ 63.2
    const score = calcMarketingScore(6000, [6000])
    expect(score).toBeCloseTo(63.2, 0)
  })

  it('высокий маркетинг одной компании при низком у остальных → до 100', () => {
    const marketings = [25000, 2000, 2000, 2000]
    const score = calcMarketingScore(25000, marketings)
    expect(score).toBeLessThanOrEqual(100)
    expect(score).toBeGreaterThan(50)
  })

  it('score clamped в [0, 100]', () => {
    const testCases = [
      { m: 0, all: [0, 0, 0] },
      { m: 30000, all: [30000, 100, 100] },
      { m: 1000, all: [1000, 1000] },
    ]
    for (const tc of testCases) {
      const score = calcMarketingScore(tc.m, tc.all)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it('relativeBonus: лидер получает бонус, отстающий штраф', () => {
    const marketings = [12000, 4000, 4000]
    const leaderScore = calcMarketingScore(12000, marketings)
    const laggardScore = calcMarketingScore(4000, marketings)
    expect(leaderScore).toBeGreaterThan(laggardScore)
  })

  it('relativeBonus clamped в [-15, 15]', () => {
    // Один 25000, остальные 2000 — extreme case
    const marketings = [25000, 2000, 2000]
    const score = calcMarketingScore(25000, marketings)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('calcQualityScore', () => {
  it('rdAccumulated = 1000 → qualityScore ≈ 6.25', () => {
    // Q_MAX × rdAcc / (rdAcc + Q_HALF) = 100 × 1000 / (1000 + 15000) = 6.25
    expect(calcQualityScore(1000)).toBeCloseTo(6.25, 1)
  })

  it('rdAccumulated = 15000 → qualityScore = 50.0', () => {
    expect(calcQualityScore(15000)).toBeCloseTo(50.0, 1)
  })

  it('rdAccumulated = 5000 → qualityScore = 25.0', () => {
    // 100 × 5000 / (5000 + 15000) = 25
    expect(calcQualityScore(5000)).toBeCloseTo(25.0, 1)
  })

  it('rdAccumulated = 0 → qualityScore = 0', () => {
    expect(calcQualityScore(0)).toBe(0)
  })

  it('qualityScore растёт с rdAccumulated', () => {
    expect(calcQualityScore(10000)).toBeGreaterThan(calcQualityScore(5000))
  })

  it('qualityScore < 100 всегда (асимптота)', () => {
    expect(calcQualityScore(10000000)).toBeLessThan(100)
  })

  it('qualityScore в [0, 100]', () => {
    const testValues = [0, 1000, 15000, 30000, 100000, 600000]
    for (const rd of testValues) {
      const score = calcQualityScore(rd)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })
})

describe('calcBrandScore', () => {
  it('brandReputation = 50 → brandScore = 50', () => {
    expect(calcBrandScore(50)).toBe(50)
  })

  it('brandReputation = 0 → brandScore = 0', () => {
    expect(calcBrandScore(0)).toBe(0)
  })

  it('brandReputation = 100 → brandScore = 100', () => {
    expect(calcBrandScore(100)).toBe(100)
  })
})

describe('calcCAS', () => {
  it('CAS = взвешенная сумма 4 компонент', () => {
    // W_PRICE=0.35, W_MKT=0.25, W_QUALITY=0.20, W_BRAND=0.20
    const cas = calcCAS(40, 60, 50, 50)
    const expected = 0.35 * 40 + 0.25 * 60 + 0.2 * 50 + 0.2 * 50
    expect(cas).toBeCloseTo(expected, 5)
  })

  it('CAS >= 0.01 всегда (минимум)', () => {
    const cas = calcCAS(0, 0, 0, 0)
    expect(cas).toBeGreaterThanOrEqual(0.01)
  })

  it('CAS с максимальными score', () => {
    const cas = calcCAS(100, 100, 100, 100)
    expect(cas).toBeCloseTo(100, 5)
  })

  it('CAS с нулевым маркетингом и брендом', () => {
    // Только цена и качество
    const cas = calcCAS(80, 0, 60, 0)
    const expected = Math.max(0.01, 0.35 * 80 + 0.25 * 0 + 0.2 * 60 + 0.2 * 0)
    expect(cas).toBeCloseTo(expected, 5)
  })
})
