import { describe, it, expect } from 'vitest'
import { distributeMarketDemand } from '../../../src/engine/market'

describe('distributeMarketDemand — линейное распределение из ТЗ', () => {
  it('равные CAS → равные доли', () => {
    const demands = distributeMarketDemand([30, 30, 30, 30], 4000)
    expect(demands[0]).toBe(1000)
    expect(demands[1]).toBe(1000)
    expect(demands[2]).toBe(1000)
    expect(demands[3]).toBe(1000)
  })

  it('пропорциональное линейное распределение', () => {
    // CAS = [80, 40] → доли 2:1
    const demands = distributeMarketDemand([80, 40], 6000)
    expect(demands[0]! / demands[1]!).toBeCloseTo(2.0, 0)
  })

  it('дуополия CAS[0]=80, CAS[1]=40 → доли 66.7% и 33.3%', () => {
    const demands = distributeMarketDemand([80, 40], 3000)
    // Линейное: 80/120 = 66.7%, 40/120 = 33.3%
    expect(demands[0]).toBeCloseTo(2000, -1)
    expect(demands[1]).toBeCloseTo(1000, -1)
  })

  it('одна компания с CAS=0.01 (минимум) почти не получает спроса', () => {
    const demands = distributeMarketDemand([60, 60, 60, 0.01], 4000)
    expect(demands[3]).toBeLessThan(10)
  })

  it('sum(demands) == totalMarketDemand (инвариант)', () => {
    const cas = [30, 50, 20, 80, 10]
    const total = 7777
    const demands = distributeMarketDemand(cas, total)
    expect(demands.reduce((a, b) => a + b, 0)).toBe(total)
  })

  it('все CAS = 0 → равное распределение', () => {
    const demands = distributeMarketDemand([0, 0, 0], 3000)
    expect(demands[0]).toBe(1000)
  })
})
