import type { SimulationPeriodResult } from './types'

export interface StrategyProfile {
  companyId: string
  companyName: string
  avgPrice: number
  avgMarketing: number
  avgCapex: number
  avgRd: number
  avgProduction: number
  totalProfit: number
  avgMarketShare: number
}

export interface GameInsight {
  type: 'turning_point' | 'best_period' | 'worst_period' | 'trend'
  period?: number
  title: string
  description: string
  icon: string
}

export interface GameAnalysis {
  insights: GameInsight[]
  profiles: StrategyProfile[]
  turningPoint: number | null
  bestPeriod: number
  worstPeriod: number
}

export function analyzeGame(
  history: SimulationPeriodResult[],
  playerCompanyId: string
): GameAnalysis {
  if (history.length === 0) {
    return {
      insights: [],
      profiles: [],
      turningPoint: null,
      bestPeriod: 1,
      worstPeriod: 1,
    }
  }

  const insights: GameInsight[] = []

  // Build profiles
  const companyIds = history[0]!.results.map((r) => r.companyId)
  const profiles: StrategyProfile[] = companyIds.map((id) => {
    let totalPrice = 0
    let totalMktg = 0
    let totalCapex = 0
    let totalRd = 0
    let totalProd = 0
    let totalProfit = 0
    let totalMS = 0
    let count = 0

    for (const period of history) {
      const state = period.updatedCompanyStates.find((c) => c.id === id)
      const result = period.results.find((r) => r.companyId === id)
      if (!state || !result) continue
      totalPrice += state.decisions.price
      totalMktg += state.decisions.marketing
      totalCapex += state.decisions.capex ?? state.decisions.capitalInvestment ?? 0
      totalRd += state.decisions.rd
      totalProd += state.decisions.production
      totalProfit += result.netProfit
      totalMS += result.marketShare
      count++
    }

    const name = history[0]!.updatedCompanyStates.find((c) => c.id === id)?.name ?? id

    return {
      companyId: id,
      companyName: name,
      avgPrice: count > 0 ? totalPrice / count : 0,
      avgMarketing: count > 0 ? totalMktg / count : 0,
      avgCapex: count > 0 ? totalCapex / count : 0,
      avgRd: count > 0 ? totalRd / count : 0,
      avgProduction: count > 0 ? totalProd / count : 0,
      totalProfit,
      avgMarketShare: count > 0 ? totalMS / count : 0,
    }
  })

  // Find best/worst period for player
  let bestPeriod = 1
  let bestProfit = -Infinity
  let worstPeriod = 1
  let worstProfit = Infinity

  for (const period of history) {
    const result = period.results.find((r) => r.companyId === playerCompanyId)
    if (!result) continue
    if (result.netProfit > bestProfit) {
      bestProfit = result.netProfit
      bestPeriod = period.period
    }
    if (result.netProfit < worstProfit) {
      worstProfit = result.netProfit
      worstPeriod = period.period
    }
  }

  insights.push({
    type: 'best_period',
    period: bestPeriod,
    title: `Лучший период — П${bestPeriod}`,
    description: `Чистая прибыль ${Math.round(bestProfit)} УДЕ — ваш самый результативный период.`,
    icon: '🌟',
  })

  if (worstPeriod !== bestPeriod) {
    insights.push({
      type: 'worst_period',
      period: worstPeriod,
      title: `Сложный период — П${worstPeriod}`,
      description: `Чистая прибыль ${Math.round(worstProfit)} УДЕ — наименее успешный период.`,
      icon: '📉',
    })
  }

  // Find turning point: when the final winner first took the lead
  let turningPoint: number | null = null
  if (history.length > 1) {
    const lastPeriod = history[history.length - 1]!
    const winner = [...lastPeriod.results].sort((a, b) => b.mpi - a.mpi)[0]
    if (winner) {
      for (let i = 0; i < history.length; i++) {
        const period = history[i]!
        const sorted = [...period.results].sort((a, b) => b.mpi - a.mpi)
        if (sorted[0]?.companyId === winner.companyId) {
          turningPoint = period.period
          break
        }
      }
      if (turningPoint !== null) {
        const winnerName = lastPeriod.updatedCompanyStates.find(
          (c) => c.id === winner.companyId
        )?.name
        insights.push({
          type: 'turning_point',
          period: turningPoint,
          title: `Поворотный момент — П${turningPoint}`,
          description: `${winnerName ?? 'Победитель'} впервые возглавил рейтинг в этом периоде.`,
          icon: '🔄',
        })
      }
    }
  }

  // Strategy trend analysis for player
  const playerProfile = profiles.find((p) => p.companyId === playerCompanyId)
  if (playerProfile) {
    const maxSpend = Math.max(
      playerProfile.avgMarketing,
      playerProfile.avgCapex,
      playerProfile.avgRd
    )
    if (maxSpend === playerProfile.avgMarketing) {
      insights.push({
        type: 'trend',
        title: 'Стратегия: Маркетинговое доминирование',
        description:
          'Вы вкладывали больше всего в маркетинг. Это стратегия захвата рынка через узнаваемость бренда.',
        icon: '📢',
      })
    } else if (maxSpend === playerProfile.avgCapex) {
      insights.push({
        type: 'trend',
        title: 'Стратегия: Промышленное лидерство',
        description:
          'Основной фокус на оборудовании. Это путь к снижению себестоимости и масштабированию.',
        icon: '🏭',
      })
    } else {
      insights.push({
        type: 'trend',
        title: 'Стратегия: Инновационный путь',
        description:
          'Вы делали ставку на R&D. Это долгосрочная стратегия — качество продукции растёт с каждым периодом.',
        icon: '🔬',
      })
    }
  }

  return { insights, profiles, turningPoint, bestPeriod, worstPeriod }
}
