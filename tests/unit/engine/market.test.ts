import { describe, it, expect } from 'vitest'
import {
  distributeMarketDemand,
  calcSalesAndSpoilage,
  redistributeUnmetDemand,
} from '@/engine/market'

describe('distributeMarketDemand', () => {
  it('все CAS одинаковые → равное деление спроса', () => {
    const cas = [50, 50, 50, 50]
    const totalDemand = 4000
    const result = distributeMarketDemand(cas, totalDemand)
    for (const d of result) {
      expect(d).toBeCloseTo(1000, 0)
    }
  })

  it('sum(companyDemand) == totalMarketDemand', () => {
    const cas = [80, 40, 60, 20]
    const totalDemand = 5000
    const result = distributeMarketDemand(cas, totalDemand)
    const sum = result.reduce((a, b) => a + b, 0)
    expect(sum).toBe(totalDemand)
  })

  it('высокий CAS → больше спроса', () => {
    const cas = [80, 40]
    const totalDemand = 1200
    const result = distributeMarketDemand(cas, totalDemand)
    expect(result[0]).toBeGreaterThan(result[1]!)
  })

  it('дуополия CAS[0]=80, CAS[1]=40 → нелинейные доли (~80% / ~20%)', () => {
    const cas = [80, 40]
    const totalDemand = 1200
    const result = distributeMarketDemand(cas, totalDemand)
    // С CAS^2: 6400 vs 1600 → 80% vs 20%
    expect(result[0]! / totalDemand).toBeCloseTo(0.8, 1)
    expect(result[1]! / totalDemand).toBeCloseTo(0.2, 1)
  })

  it('один CAS=0.01, остальные ~60 → минимальный спрос', () => {
    const cas = [0.01, 60, 60, 60]
    const totalDemand = 4000
    const result = distributeMarketDemand(cas, totalDemand)
    expect(result[0]).toBeLessThan(5) // практически 0
  })

  it('коррекция остатка: sum точно равна totalDemand', () => {
    const cas = [33, 67, 50, 80, 45]
    const totalDemand = 3007
    const result = distributeMarketDemand(cas, totalDemand)
    expect(result.reduce((a, b) => a + b, 0)).toBe(3007)
  })

  it('доли рынка в сумме ≈ 1.0', () => {
    const cas = [40, 60, 55, 35]
    const totalDemand = 5000
    const demands = distributeMarketDemand(cas, totalDemand)
    const shares = demands.map((d) => d / totalDemand)
    const sum = shares.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 3)
  })
})

describe('calcSalesAndSpoilage', () => {
  describe('базовые продажи', () => {
    it('unitsSold = min(demand, available)', () => {
      const result = calcSalesAndSpoilage(800, 600, 1000)
      // available = 600 + 1000 = 1600, demand = 800
      expect(result.unitsSold).toBe(800)
    })

    it('дефицит: unitsSold = available, unmetDemand > 0', () => {
      const result = calcSalesAndSpoilage(2000, 0, 500)
      // available = 500, demand = 2000
      expect(result.unitsSold).toBe(500)
      expect(result.unmetDemand).toBe(1500)
    })

    it('production=0, inventory=0 → unitsSold = 0', () => {
      const result = calcSalesAndSpoilage(1000, 0, 0)
      expect(result.unitsSold).toBe(0)
      expect(result.unmetDemand).toBe(1000)
    })

    it('перепроизводство: newInventory > 0, unmetDemand = 0', () => {
      const result = calcSalesAndSpoilage(200, 0, 1500)
      expect(result.unmetDemand).toBe(0)
      expect(result.newInventory).toBeGreaterThan(0)
    })
  })

  describe('inventory инвариант', () => {
    it('inventory[t-1] + production - unitsSold - spoilage == endInventory', () => {
      const prevInventory = 300
      const production = 1000
      const demand = 800
      const result = calcSalesAndSpoilage(demand, prevInventory, production)
      const expected = prevInventory + production - result.unitsSold - result.spoilage
      expect(result.newInventory).toBe(expected)
    })
  })

  describe('spoilage', () => {
    it('spoilage = floor(newInventory × SPOILAGE_RATE)', () => {
      // available = 0 + 1500 = 1500, demand = 200
      // newInventory before spoilage = 1300
      // spoilage = floor(1300 × 0.05) = 65
      const result = calcSalesAndSpoilage(200, 0, 1500)
      expect(result.spoilage).toBe(65)
    })

    it('нет запасов → spoilage = 0', () => {
      const result = calcSalesAndSpoilage(1000, 0, 1000)
      expect(result.spoilage).toBe(0)
    })

    it('spoilage >= 0', () => {
      const result = calcSalesAndSpoilage(500, 100, 300)
      expect(result.spoilage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('инварианты', () => {
    it('unitsSold >= 0', () => {
      const result = calcSalesAndSpoilage(0, 0, 0)
      expect(result.unitsSold).toBeGreaterThanOrEqual(0)
    })

    it('newInventory >= 0', () => {
      const result = calcSalesAndSpoilage(5000, 100, 200)
      expect(result.newInventory).toBeGreaterThanOrEqual(0)
    })

    it('unmetDemand >= 0', () => {
      const result = calcSalesAndSpoilage(100, 0, 500)
      expect(result.unmetDemand).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('redistributeUnmetDemand', () => {
  it('перераспределяет 60% неудовлетворённого спроса', () => {
    const unmetDemand = [1000, 0]
    const cas = [60, 60]
    const inventories = [0, 500]
    const extraSales = redistributeUnmetDemand(unmetDemand, cas, inventories)
    // redistributed = 1000 × 0.60 = 600
    // Company 1 имеет запас, продаёт до 500 (ограничено запасами)
    expect(extraSales[1]).toBeLessThanOrEqual(500)
    expect(extraSales[0]).toBe(0)
  })

  it('без дефицита → нет дополнительных продаж', () => {
    const unmetDemand = [0, 0, 0]
    const cas = [50, 50, 50]
    const inventories = [100, 100, 100]
    const extraSales = redistributeUnmetDemand(unmetDemand, cas, inventories)
    expect(extraSales.every((s) => s === 0)).toBe(true)
  })

  it('без запасов у конкурентов → нет перераспределения', () => {
    const unmetDemand = [500, 0, 0]
    const cas = [60, 60, 60]
    const inventories = [0, 0, 0]
    const extraSales = redistributeUnmetDemand(unmetDemand, cas, inventories)
    expect(extraSales.every((s) => s === 0)).toBe(true)
  })

  it('extraSales не превышают доступные запасы', () => {
    const unmetDemand = [5000, 0]
    const cas = [60, 60]
    const inventories = [0, 200]
    const extraSales = redistributeUnmetDemand(unmetDemand, cas, inventories)
    expect(extraSales[1]).toBeLessThanOrEqual(200)
  })

  it('extraSales >= 0 для всех компаний', () => {
    const unmetDemand = [300, 200, 0]
    const cas = [40, 60, 80]
    const inventories = [0, 0, 500]
    const extraSales = redistributeUnmetDemand(unmetDemand, cas, inventories)
    for (const s of extraSales) {
      expect(s).toBeGreaterThanOrEqual(0)
    }
  })
})
