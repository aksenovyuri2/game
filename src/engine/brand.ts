import {
  BRAND_RETENTION,
  BRAND_MKT_CAP,
  BRAND_QUALITY_CAP,
  DAMAGE_STOCKOUT,
  DAMAGE_OVERPRICE,
  DAMAGE_QUALITY_DROP,
} from './constants'

export interface BrandParams {
  prevBrand: number
  marketingScore: number // 0–100
  qualityScore: number // 0–100
  prevQualityScore: number
  fulfillmentRate: number // unitsSold / companyDemand
  price: number
  avgPrice: number
}

/**
 * Обновляет репутацию бренда компании.
 * Этап 9 конвейера.
 */
export function calcBrandReputation(params: BrandParams): number {
  const {
    prevBrand,
    marketingScore,
    qualityScore,
    prevQualityScore,
    fulfillmentRate,
    price,
    avgPrice,
  } = params

  const brandBase = prevBrand * BRAND_RETENTION

  // Прирост
  const brandFromMarketing = (marketingScore / 100) * BRAND_MKT_CAP
  const brandFromQuality = (qualityScore / 100) * BRAND_QUALITY_CAP
  const brandFromFulfillment = fulfillmentRate >= 0.95 ? 1.0 : 0.0

  // Штрафы
  let brandDamage = 0

  if (fulfillmentRate < 0.75) {
    brandDamage += DAMAGE_STOCKOUT * (1 - fulfillmentRate)
  }

  if (avgPrice > 0 && price > avgPrice * 1.4) {
    const priceExcess = Math.min((price / avgPrice - 1.4) / 0.6, 1.0)
    brandDamage += DAMAGE_OVERPRICE * priceExcess
  }

  if (prevQualityScore > 0 && qualityScore < prevQualityScore * 0.7) {
    brandDamage += DAMAGE_QUALITY_DROP
  }

  const newBrand =
    brandBase + brandFromMarketing + brandFromQuality + brandFromFulfillment - brandDamage

  return Math.max(0, Math.min(100, newBrand))
}
