import type { Decisions, GameConfig, MarketScenario } from './types'

/**
 * Рассчитывает конкурентные оценки для каждой компании.
 * Оценка = priceScore * marketingScore * rdScore
 */
export function calcCompetitiveScores(
  decisions: Decisions[],
  rdAccumulated: number[],
  cfg: GameConfig
): number[] {
  return decisions.map((d, i) => {
    const priceScore = Math.pow(cfg.basePrice / Math.max(d.price, 1), cfg.priceElasticity)
    const marketingScore = 1 + cfg.marketingAlpha * Math.sqrt(d.marketing / 10000)
    const rdScore = 1 + cfg.rdBeta * Math.sqrt((rdAccumulated[i] ?? 0) / 50000)
    return priceScore * marketingScore * rdScore
  })
}

/**
 * Рассчитывает рыночную долю каждой компании.
 * При нулевой сумме всех оценок — равные доли.
 */
export function calcMarketShares(scores: number[]): number[] {
  const total = scores.reduce((a, b) => a + b, 0)
  if (total === 0) {
    const equal = 1 / scores.length
    return scores.map(() => equal)
  }
  return scores.map((s) => s / total)
}

/**
 * Рассчитывает макроэкономический коэффициент.
 * @param seed - для детерминированного random (используется номер периода * seed)
 */
export function calcMacroFactor(scenario: MarketScenario, period: number, seed: number): number {
  switch (scenario) {
    case 'stable':
      return 1.0
    case 'growing':
      return 1.0 + 0.03 * period
    case 'crisis':
      return Math.max(0.4, 1.0 - 0.05 * period)
    case 'random': {
      // Детерминированный pseudo-random: sin-based
      const raw = Math.sin(seed * 9301 + period * 49297 + 233) * 0.5 + 0.5
      // Диапазон [0.7, 1.3]
      return 0.7 + raw * 0.6
    }
  }
}

/**
 * Рассчитывает спрос для каждой компании на период.
 */
export function calcDemandForCompanies(
  shares: number[],
  macroFactor: number,
  cfg: GameConfig
): number[] {
  const totalDemand = cfg.baseMarketSize * macroFactor
  return shares.map((s) => Math.max(0, totalDemand * s))
}

/**
 * Рассчитывает продажи и остаток на складе.
 */
export function calcSalesAndInventory(params: {
  prevInventory: number
  produced: number
  demand: number
}): { unitsSold: number; endInventory: number } {
  const available = Math.max(0, params.prevInventory) + Math.max(0, params.produced)
  const unitsSold = Math.min(available, Math.max(0, params.demand))
  const endInventory = Math.max(0, available - unitsSold)
  return { unitsSold, endInventory }
}
