import {
  W_PRICE,
  W_MKT,
  W_QUALITY,
  W_BRAND,
  ELASTICITY_EXPONENT,
  MKTG_MAX,
  MKTG_HALF,
  RELATIVE_MKT_WEIGHT,
  Q_MAX,
  Q_HALF,
} from './constants'

/**
 * Рассчитывает priceScore для компании i.
 * Относительная формула: чем ниже цена относительно конкурентов, тем выше score.
 * priceScore = (100 × (maxPrice - price) / (maxPrice - minPrice)) ^ ELASTICITY_EXPONENT
 */
export function calcPriceScore(price: number, allPrices: number[]): number {
  const maxPrice = Math.max(...allPrices)
  const minPrice = Math.min(...allPrices)

  if (maxPrice === minPrice) {
    return 50.0
  }

  const rawScore = (100 * (maxPrice - price)) / (maxPrice - minPrice)
  return Math.min(100, Math.pow(rawScore, ELASTICITY_EXPONENT))
}

/**
 * Рассчитывает marketingScore для компании i.
 * Экспоненциальная формула с убывающей отдачей + относительный бонус.
 * marketingScore = MKTG_MAX × (1 - e^(-marketing / MKTG_HALF))
 */
export function calcMarketingScore(marketing: number, allMarketings: number[]): number {
  const baseScore = MKTG_MAX * (1 - Math.exp(-marketing / MKTG_HALF))

  // Бонус за превышение среднего
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
