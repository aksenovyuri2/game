import {
  W_PRICE,
  W_MKT,
  W_QUALITY,
  W_BRAND,
  ELASTICITY_EXPONENT,
  MKTG_MAX,
  RELATIVE_MKT_WEIGHT,
  Q_MAX,
  Q_HALF,
  PRICE_OPTIMAL,
  PRICE_ELASTICITY_K,
  PRICE_ABSOLUTE_WEIGHT,
  PRICE_RELATIVE_WEIGHT,
  MKTG_THRESHOLD,
  MKTG_MIDPOINT,
  MKTG_STEEPNESS,
} from './constants'

/**
 * Рассчитывает priceScore для компании i.
 * Гибрид: абсолютная (гауссова кривая вокруг PRICE_OPTIMAL) + относительная компонента.
 */
export function calcPriceScore(price: number, allPrices: number[]): number {
  // Абсолютная компонента: гауссова кривая, максимум при PRICE_OPTIMAL
  const deviation = price - PRICE_OPTIMAL
  const absoluteScore = 100 * Math.exp(-PRICE_ELASTICITY_K * deviation * deviation)

  // Относительная компонента (как раньше)
  const maxPrice = Math.max(...allPrices)
  const minPrice = Math.min(...allPrices)
  let relativeScore: number
  if (maxPrice === minPrice) {
    relativeScore = 50.0
  } else {
    const rawScore = (100 * (maxPrice - price)) / (maxPrice - minPrice)
    relativeScore = Math.min(100, Math.pow(rawScore, ELASTICITY_EXPONENT))
  }

  const combined = PRICE_ABSOLUTE_WEIGHT * absoluteScore + PRICE_RELATIVE_WEIGHT * relativeScore
  return Math.max(0, Math.min(100, combined))
}

/**
 * Рассчитывает marketingScore для компании i.
 * Логистическая S-кривая с порогом: ниже MKTG_THRESHOLD — почти нет эффекта.
 */
export function calcMarketingScore(marketing: number, allMarketings: number[]): number {
  let baseScore: number

  if (marketing < MKTG_THRESHOLD) {
    // Ниже порога — линейный рост до ~10 баллов
    baseScore = (marketing / MKTG_THRESHOLD) * 10
  } else {
    // Логистическая S-кривая
    baseScore = MKTG_MAX / (1 + Math.exp(-MKTG_STEEPNESS * (marketing - MKTG_MIDPOINT)))
  }

  // Относительный бонус/штраф
  const avgMarketing = allMarketings.reduce((a, b) => a + b, 0) / allMarketings.length
  let relativeBonus = 0
  if (avgMarketing > 0) {
    relativeBonus = RELATIVE_MKT_WEIGHT * (marketing / avgMarketing - 1)
    relativeBonus = Math.max(-15, Math.min(15, relativeBonus))
  }

  return Math.max(0, Math.min(100, baseScore + relativeBonus))
}

/**
 * Рассчитывает qualityScore на основе накопленного R&D.
 * qualityScore = Q_MAX × rdAccumulated / (rdAccumulated + Q_HALF)
 */
export function calcQualityScore(rdAccumulated: number): number {
  if (rdAccumulated <= 0) return 0
  return (Q_MAX * rdAccumulated) / (rdAccumulated + Q_HALF)
}

/**
 * Рассчитывает brandScore.
 * brandScore = brandReputation (0–100)
 */
export function calcBrandScore(brandReputation: number): number {
  return brandReputation
}

/**
 * Рассчитывает итоговый CAS (Competitive Attractiveness Score).
 * CAS = W_PRICE × priceScore + W_MKT × marketingScore + W_QUALITY × qualityScore + W_BRAND × brandScore
 * CAS >= 0.01 (минимум)
 */
export function calcCAS(
  priceScore: number,
  marketingScore: number,
  qualityScore: number,
  brandScore: number
): number {
  const raw =
    W_PRICE * priceScore + W_MKT * marketingScore + W_QUALITY * qualityScore + W_BRAND * brandScore
  return Math.max(0.01, raw)
}
