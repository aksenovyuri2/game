import { describe, it, expect } from 'vitest'
import { calcPriceScore, calcMarketingScore } from '../../../src/engine/cas'

describe('calcPriceScore v2 — абсолютная ценовая эластичность (PRICE_OPTIMAL=40)', () => {
  it('при оптимальной цене 40 — максимальный абсолютный компонент', () => {
    const score = calcPriceScore(40, [20, 40, 50])
    // price=40 → абсолютная компонента ~100, относительная ~50
    // Итого: 0.6*100 + 0.4*~50 = ~80
    expect(score).toBeGreaterThan(70)
  })

  it('при одинаковых высоких ценах (90) — низкий абсолютный score для всех', () => {
    const score = calcPriceScore(90, [90, 90, 90, 90])
    // Абсолютный: exp(-0.04*(90-40)^2) = exp(-100) ≈ 0 → абсолютная ~0
    // Относительный: все равны → 50
    // Итого: 0.6*~0 + 0.4*50 = ~20
    expect(score).toBeLessThan(30)
  })

  it('при одинаковых низких ценах (10) — абсолютный score средний', () => {
    const score = calcPriceScore(10, [10, 10, 10])
    // Абсолютный: exp(-0.04*(10-40)^2) = exp(-36) ≈ 0 → ~0
    // Относительный: все равны → 50
    expect(score).toBeLessThan(30)
  })

  it('гибрид absolute+relative — оптимальная цена имеет преимущество', () => {
    const scores = [20, 40, 50, 70].map((p) => calcPriceScore(p, [20, 40, 50, 70]))
    // price=40 должна быть лучшей (оптимальная цена + хорошая относительная)
    expect(scores[1]).toBeGreaterThan(scores[0]!) // 40 > 20 (20 далека от оптимума)
    expect(scores[1]).toBeGreaterThan(scores[2]!) // 40 > 50
    expect(scores[1]).toBeGreaterThan(scores[3]!) // 40 > 70
  })

  it('абсолютный компонент создаёт колоколообразную кривую вокруг оптимума', () => {
    // Цены симметрично вокруг 40
    const s30 = calcPriceScore(30, [30])
    const s40 = calcPriceScore(40, [40])
    const s50 = calcPriceScore(50, [50])
    // s40 > s30 ≈ s50 (симметрия)
    expect(s40).toBeGreaterThan(s30)
    expect(s40).toBeGreaterThan(s50)
  })
})

describe('calcMarketingScore v2 — S-кривая с порогом', () => {
  const allMkt = [5000, 5000, 5000, 5000]

  it('ниже порога (< 2000) — эффект минимальный', () => {
    const score = calcMarketingScore(1000, allMkt)
    expect(score).toBeLessThan(15)
  })

  it('на пороге (2000) — начинает расти', () => {
    // Используем равные бюджеты чтобы relative bonus = 0
    const score = calcMarketingScore(2000, [2000, 2000, 2000, 2000])
    expect(score).toBeGreaterThan(3)
    expect(score).toBeLessThan(30)
  })

  it('на midpoint (8000) — примерно 50', () => {
    const score = calcMarketingScore(8000, [8000, 8000, 8000, 8000])
    expect(score).toBeGreaterThan(35)
    expect(score).toBeLessThan(70)
  })

  it('при максимуме (30000) — близко к 100', () => {
    const score = calcMarketingScore(30000, [30000, 30000, 30000, 30000])
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
