import { REDISTRIBUTION_RATE, SPOILAGE_RATE, CAS_DOMINANCE_EXPONENT } from './constants'
import type { Decisions, GameConfig, MarketScenario } from './types'

export interface SalesResult {
  unitsSold: number
  newInventory: number
  spoilage: number
  unmetDemand: number
}

/**
 * Распределяет рыночный спрос по компаниям пропорционально их CAS.
 * Этап 5 конвейера.
 * Коррекция остатка: sum(companyDemand) == totalMarketDemand
 */
export function distributeMarketDemand(cas: number[], totalMarketDemand: number): number[] {
  // Нелинейное распределение: CAS^exp усиливает разрыв между лидером и аутсайдерами
  const adjustedCAS = cas.map((c) => Math.pow(Math.max(c, 0), CAS_DOMINANCE_EXPONENT))
  const totalCAS = adjustedCAS.reduce((a, b) => a + b, 0)
  if (totalCAS <= 0) {
    const equal = Math.floor(totalMarketDemand / cas.length)
    return cas.map(() => equal)
  }

  // Базовое деление
  const demands = adjustedCAS.map((c) => Math.floor((totalMarketDemand * c) / totalCAS))
  const sum = demands.reduce((a, b) => a + b, 0)
  let remainder = totalMarketDemand - sum

  // Распределяем остаток по компаниям с наибольшим CAS
  if (remainder > 0) {
    const indexed = cas.map((c, i) => ({ c, i })).sort((a, b) => b.c - a.c)
    for (const { i } of indexed) {
      if (remainder <= 0) break
      demands[i]! += 1
      remainder -= 1
    }
  }

  return demands
}

/**
 * Рассчитывает продажи, запасы и порчу для одной компании.
 * Этап 6 конвейера.
 */
export function calcSalesAndSpoilage(
  demand: number,
  prevInventory: number,
  production: number
): SalesResult {
  const available = prevInventory + production
  const unitsSold = Math.min(demand, available)
  const unmetDemand = Math.max(0, demand - available)
  const rawInventory = available - unitsSold

  const spoilage = Math.floor(rawInventory * SPOILAGE_RATE)
  const newInventory = rawInventory - spoilage

  return { unitsSold, newInventory, spoilage, unmetDemand }
}

/**
 * Перераспределяет неудовлетворённый спрос к компаниям с запасами.
 * 60% неудовлетворённого спроса → компании с surplus, пропорционально CAS.
 * Этап 6 конвейера.
 */
export function redistributeUnmetDemand(
  unmetDemand: number[],
  cas: number[],
  inventories: number[]
): number[] {
  const totalUnmet = unmetDemand.reduce((a, b) => a + b, 0)
  if (totalUnmet <= 0) return unmetDemand.map(() => 0)

  const redistributed = totalUnmet * REDISTRIBUTION_RATE

  // Компании с запасами
  const surplusIndices = inventories.map((inv, i) => (inv > 0 ? i : -1)).filter((i) => i >= 0)
  if (surplusIndices.length === 0) return unmetDemand.map(() => 0)

  const totalSurplusCAS = surplusIndices.reduce((s, i) => s + (cas[i] ?? 0), 0)
  if (totalSurplusCAS <= 0) return unmetDemand.map(() => 0)

  const extraSales = unmetDemand.map(() => 0)

  for (const i of surplusIndices) {
    const share = (cas[i] ?? 0) / totalSurplusCAS
    const extraDemand = Math.floor(redistributed * share)
    const extraSold = Math.min(extraDemand, inventories[i] ?? 0)
    extraSales[i] = extraSold
  }

  return extraSales
}

// ─── Устаревшие функции (совместимость со старым кодом) ───────────────────────

/** @deprecated Use calcCAS from cas.ts */
export function calcCompetitiveScores(
  decisions: Array<Decisions>,
  rdAccumulated: number[],
  cfg: GameConfig
): number[] {
  void cfg
  const prices = decisions.map((d) => d.price)
  const marketings = decisions.map((d) => d.marketing ?? 0)
  const totalMkt = marketings.reduce((a, b) => a + b, 0)
  const totalRd = rdAccumulated.reduce((a, b) => a + b, 0)
  return decisions.map((d, i) => {
    const maxPrice = Math.max(...prices)
    const priceFactor = maxPrice > 0 ? (maxPrice - d.price) / maxPrice + 0.5 : 0.5
    const mktFactor = totalMkt > 0 ? ((d.marketing ?? 0) / totalMkt) * decisions.length : 1
    const rdFactor = totalRd > 0 ? ((rdAccumulated[i] ?? 0) / totalRd) * decisions.length : 1
    return Math.max(0.01, priceFactor * 0.5 + mktFactor * 0.3 + rdFactor * 0.2)
  })
}

/** @deprecated Use distributeMarketDemand */
export function calcMarketShares(scores: number[]): number[] {
  const total = scores.reduce((a, b) => a + b, 0)
  if (total <= 0) return scores.map(() => 1 / scores.length)
  return scores.map((s) => s / total)
}

/** @deprecated Use calcTotalMarketDemand from demand.ts */
export function calcDemandForCompanies(
  shares: number[],
  macroFactor: number,
  cfg: GameConfig
): number[] {
  const base = cfg.baseMarketSize ?? 10000
  return shares.map((s) => Math.round(base * s * macroFactor))
}

/** @deprecated Use calcSalesAndSpoilage */
export function calcSalesAndInventory(params: {
  prevInventory: number
  produced: number
  demand: number
}): { unitsSold: number; endInventory: number } {
  const available = params.prevInventory + params.produced
  const unitsSold = Math.min(params.demand, available)
  const endInventory = available - unitsSold
  return { unitsSold, endInventory }
}

/** @deprecated */
export function calcMacroFactor(
  scenario: MarketScenario,
  period: number,
  totalPeriods: number,
  prevFactor?: number
): number {
  void prevFactor
  if (scenario === 'crisis') {
    const effectivePeriods = totalPeriods > 0 ? totalPeriods : 12
    const crisisBottom = Math.floor(effectivePeriods * 0.5)
    if (crisisBottom <= 0 || period >= crisisBottom) return 0.7
    return 1.0 - 0.3 * (period / crisisBottom)
  }
  if (scenario === 'growing') return 1.0 + 0.03 * period
  return 1.0
}
