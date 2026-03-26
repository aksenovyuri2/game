import { describe, it, expect } from 'vitest'
import { calcBrandReputation } from '@/engine/brand'

describe('calcBrandReputation', () => {
  const baseParams = {
    prevBrand: 50,
    marketingScore: 63, // mkt=6000
    qualityScore: 50, // rdAcc=15000
    prevQualityScore: 50,
    fulfillmentRate: 1.0,
    price: 35,
    avgPrice: 35,
  }

  describe('нормальные значения', () => {
    it('бренд сохраняется при полном выполнении, средних расходах', () => {
      const result = calcBrandReputation(baseParams)
      // brandBase = 50 × 0.9 = 45
      // brandFromMarketing = (63/100) × 3.0 ≈ 1.89
      // brandFromQuality = (50/100) × 2.0 = 1.0
      // brandFromFulfillment = 1.0
      // brandDamage = 0
      // result ≈ 45 + 1.89 + 1.0 + 1.0 = 48.89
      expect(result).toBeGreaterThan(45)
      expect(result).toBeLessThan(55)
    })

    it('стабильный mkt=10000, rd=8000 → бренд ≈ стабилен (~49.6)', () => {
      // marketingScore ≈ 100×(1-e^(-10000/6000)) ≈ 81
      // qualityScore = 100×8000/(8000+15000) ≈ 34.8
      const marketingScore = 100 * (1 - Math.exp(-10000 / 6000))
      const qualityScore = (100 * 8000) / (8000 + 15000)
      const result = calcBrandReputation({
        prevBrand: 50,
        marketingScore,
        qualityScore,
        prevQualityScore: qualityScore,
        fulfillmentRate: 1.0,
        price: 35,
        avgPrice: 35,
      })
      expect(result).toBeCloseTo(49.6, 0)
    })
  })

  describe('нет поддержки (marketing=0, rd=0)', () => {
    it('бренд деградирует за 12 периодов до ~14.1', () => {
      let brand = 50
      for (let i = 0; i < 12; i++) {
        brand = calcBrandReputation({
          prevBrand: brand,
          marketingScore: 0,
          qualityScore: 0,
          prevQualityScore: 0,
          // fulfillmentRate < 0.95 → brandFromFulfillment = 0 (чистое затухание)
          fulfillmentRate: 0.9,
          price: 35,
          avgPrice: 35,
        })
      }
      // 50 × 0.9^12 ≈ 14.3
      expect(brand).toBeCloseTo(14, 0)
    })
  })

  describe('дефицит (stockout)', () => {
    it('brandFromFulfillment = 1.0 при fulfillmentRate >= 0.95', () => {
      const r1 = calcBrandReputation({ ...baseParams, fulfillmentRate: 0.95 })
      const r2 = calcBrandReputation({ ...baseParams, fulfillmentRate: 1.0 })
      // Оба получают brandFromFulfillment = 1.0, результат одинаков
      expect(r1).toBeCloseTo(r2, 5)
    })

    it('brandDamage при fulfillmentRate < 0.75', () => {
      const goodResult = calcBrandReputation({ ...baseParams, fulfillmentRate: 1.0 })
      const badResult = calcBrandReputation({ ...baseParams, fulfillmentRate: 0.5 })
      expect(badResult).toBeLessThan(goodResult)
    })

    it('полный дефицит 2 периода: 50 → ~30 → ~12', () => {
      let brand = 50
      for (let i = 0; i < 2; i++) {
        brand = calcBrandReputation({
          prevBrand: brand,
          marketingScore: 0,
          qualityScore: 0,
          prevQualityScore: 0,
          fulfillmentRate: 0,
          price: 35,
          avgPrice: 35,
        })
      }
      // Период 1: 50×0.9 - 15×1 = 45 - 15 = 30
      // Период 2: 30×0.9 - 15×1 = 27 - 15 = 12
      expect(brand).toBeCloseTo(12, 0)
    })
  })

  describe('штраф за завышение цены', () => {
    it('price > avgPrice × 1.4 → brandDamage', () => {
      const normal = calcBrandReputation({ ...baseParams, price: 35, avgPrice: 35 })
      const overpriced = calcBrandReputation({ ...baseParams, price: 60, avgPrice: 35 })
      // 60 > 35 × 1.4 = 49 → штраф
      expect(overpriced).toBeLessThan(normal)
    })

    it('price <= avgPrice × 1.4 → нет штрафа за цену', () => {
      const result = calcBrandReputation({ ...baseParams, price: 48, avgPrice: 35 })
      // 48 ≈ 35 × 1.37 < 1.4 → нет штрафа
      const normalResult = calcBrandReputation({ ...baseParams })
      expect(result).toBeCloseTo(normalResult, 0)
    })
  })

  describe('штраф за падение качества', () => {
    it('qualityScore падает более чем на 30% → brandDamage += 3.0', () => {
      const normal = calcBrandReputation({ ...baseParams, qualityScore: 50, prevQualityScore: 50 })
      const dropped = calcBrandReputation({
        ...baseParams,
        qualityScore: 30, // < 50 × 0.7 = 35
        prevQualityScore: 50,
      })
      expect(dropped).toBeLessThan(normal)
    })

    it('qualityScore падает менее чем на 30% → нет штрафа', () => {
      const result = calcBrandReputation({
        ...baseParams,
        qualityScore: 40, // > 50 × 0.7 = 35
        prevQualityScore: 50,
      })
      // Нет штрафа за падение
      expect(result).toBeGreaterThan(40)
    })
  })

  describe('инварианты', () => {
    it('brandReputation остаётся в [0, 100]', () => {
      const testCases = [
        { ...baseParams, prevBrand: 0, fulfillmentRate: 0 },
        { ...baseParams, prevBrand: 100, marketingScore: 100, qualityScore: 100 },
        { ...baseParams, prevBrand: 50, fulfillmentRate: 0, price: 100, avgPrice: 10 },
      ]
      for (const tc of testCases) {
        const result = calcBrandReputation(tc)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(100)
      }
    })

    it('результат является конечным числом', () => {
      const result = calcBrandReputation(baseParams)
      expect(isFinite(result)).toBe(true)
      expect(isNaN(result)).toBe(false)
    })
  })
})
