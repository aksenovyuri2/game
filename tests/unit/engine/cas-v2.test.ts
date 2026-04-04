import { describe, it, expect } from 'vitest'
import { calcPriceScore, calcMarketingScore } from '../../../src/engine/cas'

describe('calcPriceScore — относительная ценовая эластичность', () => {
  it('при одинаковых ценах → priceScore = 50 для всех', () => {
    const score = calcPriceScore(35, [35, 35, 35])
    expect(score).toBe(50)
  })

  it('самая низкая цена получает 100 (с экспонентой 1.3)', () => {
    const score = calcPriceScore(10, [10, 50, 50, 50])
    // rawScore = 100 × (50-10)/(50-10) = 100, 100^1.3 = 100 (capped)
    expect(score).toBe(100)
  })

  it('самая высокая цена получает 0', () => {
    const score = calcPriceScore(90, [10, 50, 90])
    expect(score).toBe(0)
  })

  it('средняя цена получает промежуточный score', () => {
    const scores = [20, 35, 50, 70].map((p) => calcPriceScore(p, [20, 35, 50, 70]))
    // Чем ниже цена, тем выше score (с capping при экспоненте 1.3)
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]!)
    expect(scores[1]).toBeGreaterThanOrEqual(scores[2]!)
    expect(scores[2]).toBeGreaterThan(scores[3]!)
    expect(scores[3]).toBe(0) // самая дорогая → 0
  })

  it('экспонента 1.3 усиливает преимущество дешёвых цен', () => {
    // rawScore = 100 × (70-35) / (70-20) = 70
    // priceScore = 70^1.3 ≈ 136.5, capped at 100
    const score = calcPriceScore(35, [20, 35, 50, 70])
    expect(score).toBeGreaterThan(60)
  })
})

describe('calcMarketingScore — экспоненциальная формула', () => {
  const allMkt = [5000, 5000, 5000, 5000]

  it('marketing = 0 → score = 0', () => {
    const score = calcMarketingScore(0, allMkt)
    expect(score).toBe(0)
  })

  it('marketing = 3000 → baseScore ≈ 39', () => {
    // 100 × (1 - exp(-3000/6000)) = 100 × (1 - exp(-0.5)) ≈ 39.3
    const score = calcMarketingScore(3000, [3000, 3000, 3000, 3000])
    expect(score).toBeGreaterThan(30)
    expect(score).toBeLessThan(50)
  })

  it('marketing = 6000 → baseScore ≈ 63 (halfpoint)', () => {
    const score = calcMarketingScore(6000, [6000, 6000, 6000, 6000])
    expect(score).toBeGreaterThan(55)
    expect(score).toBeLessThan(75)
  })

  it('marketing = 18000 → baseScore ≈ 95', () => {
    const score = calcMarketingScore(18000, [18000, 18000, 18000, 18000])
    expect(score).toBeGreaterThan(85)
  })

  it('монотонно возрастает', () => {
    const same = [10000, 10000, 10000, 10000]
    const s0 = calcMarketingScore(0, same)
    const s3k = calcMarketingScore(3000, same)
    const s8k = calcMarketingScore(8000, same)
    const s20k = calcMarketingScore(20000, same)
    expect(s3k).toBeGreaterThan(s0)
    expect(s8k).toBeGreaterThan(s3k)
    expect(s20k).toBeGreaterThan(s8k)
  })
})
