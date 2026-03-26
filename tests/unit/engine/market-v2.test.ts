import { describe, it, expect } from 'vitest'
import { distributeMarketDemand } from '../../../src/engine/market'

describe('distributeMarketDemand v2 — нелинейное распределение (CAS^exp)', () => {
  it('равные CAS → равные доли', () => {
    const demands = distributeMarketDemand([30, 30, 30, 30], 4000)
    expect(demands[0]).toBe(1000)
    expect(demands[1]).toBe(1000)
    expect(demands[2]).toBe(1000)
    expect(demands[3]).toBe(1000)
  })

  it('лидер с CAS=50 vs аутсайдеры CAS=5 → лидер получает >80% рынка', () => {
    const demands = distributeMarketDemand([50, 5, 5, 5, 5], 5000)
    const leaderShare = demands[0]! / 5000
    expect(leaderShare).toBeGreaterThan(0.8)
  })

  it('лидер с CAS=100 vs остальные ~0.01 → ~100% рынка', () => {
    const demands = distributeMarketDemand([100, 0.01, 0.01, 0.01], 4000)
    const leaderShare = demands[0]! / 4000
    expect(leaderShare).toBeGreaterThan(0.99)
  })

  it('два равных лидера делят рынок пополам', () => {
    const demands = distributeMarketDemand([50, 50, 5, 5], 4000)
    // Лидеры: 50^2 = 2500 каждый, аутсайдеры: 5^2 = 25 каждый
    // Лидеры: 2500/(5050) ≈ 49.5% каждый
    expect(Math.abs(demands[0]! - demands[1]!)).toBeLessThan(10)
    expect(demands[0]!).toBeGreaterThan(demands[2]! * 5)
  })

  it('нелинейность усиливает разрыв по сравнению с линейным', () => {
    // CAS = [60, 40] → линейно: 60% vs 40%
    // С экспонентой 2: 3600 vs 1600 → 69.2% vs 30.8%
    const demands = distributeMarketDemand([60, 40], 10000)
    const leaderShare = demands[0]! / 10000
    expect(leaderShare).toBeGreaterThan(0.65) // больше линейного 60%
  })

  it('суммарный спрос сохраняется', () => {
    const demands = distributeMarketDemand([50, 30, 10, 5], 5000)
    const total = demands.reduce((a, b) => a + b, 0)
    expect(total).toBe(5000)
  })
})
