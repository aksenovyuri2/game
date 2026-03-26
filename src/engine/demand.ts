import { BASE_DEMAND_PER_COMPANY } from './constants'
import type { MarketScenario } from './types'

/**
 * Рассчитывает экономический мультипликатор для текущего периода.
 * Этап 3 конвейера.
 */
export function calcEconomicMultiplier(
  scenario: MarketScenario,
  period: number,
  totalPeriods: number,
  prevMultiplier = 1.0,
  noise = 0
): number {
  switch (scenario) {
    case 'stable':
      return 1.0

    case 'growing': {
      const T = totalPeriods
      const t = period
      if (t <= T / 3) {
        return 1.0 + 0.03 * t
      } else if (t <= (2 * T) / 3) {
        return 1.0 + 0.02 * (t - T / 3)
      } else {
        // plateau × 0.99
        const plateau = 1.0 + 0.02 * (T / 3)
        return plateau * 0.99
      }
    }

    case 'crisis': {
      const T = totalPeriods
      const t = period
      const crisisStart = Math.floor(T * 0.2)
      const crisisBottom = Math.floor(T * 0.5)
      const recoveryEnd = Math.floor(T * 0.85)

      if (t < crisisStart) {
        return 1.0
      } else if (t < crisisBottom) {
        const progress = (t - crisisStart) / (crisisBottom - crisisStart)
        return 1.0 - 0.4 * progress // падение до 0.60
      } else if (t < recoveryEnd) {
        const progress = (t - crisisBottom) / (recoveryEnd - crisisBottom)
        return 0.6 + 0.35 * progress * progress // квадратичное восстановление
      } else {
        return 0.95 // «новая нормальность»
      }
    }

    case 'random': {
      // mean reversion к 1.0
      const meanReversionForce = 0.1 * (1.0 - prevMultiplier)
      const shock = noise + meanReversionForce
      const newMultiplier = prevMultiplier + shock
      return Math.max(0.45, Math.min(1.6, newMultiplier))
    }

    default:
      return 1.0
  }
}

/**
 * Рассчитывает общий рыночный спрос.
 * totalMarketDemand = BASE_DEMAND_PER_COMPANY × N × economicMultiplier × (1 + noise)
 */
export function calcTotalMarketDemand(
  numberOfCompanies: number,
  economicMultiplier: number,
  noise = 0
): number {
  return Math.max(
    0,
    Math.round(BASE_DEMAND_PER_COMPANY * numberOfCompanies * economicMultiplier * (1 + noise))
  )
}
