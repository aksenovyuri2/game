import type { Decisions } from '../engine/types'
import type { AIDecisionContext } from './types'
import { BaseAI } from './base'
import { BalancedAI } from './balanced'

/**
 * AdaptiveAI — адаптивная стратегия (Expert/Master).
 * Анализирует решения конкурентов и историю своей компании.
 * Без данных ведёт себя как BalancedAI.
 */
export class AdaptiveAI extends BaseAI {
  private fallback: BalancedAI

  constructor(difficulty: import('./types').DifficultyConfig) {
    super(difficulty)
    this.fallback = new BalancedAI(difficulty)
  }

  makeDecisions(ctx: AIDecisionContext): Decisions {
    const { companyState: s, cfg } = ctx
    const demand = this.estimateDemand(ctx)

    // Базовые параметры от BalancedAI
    const base = this.fallback.makeDecisions(ctx)

    // Если нет данных — возвращаем базу (finalize уже применён в fallback)
    if (!this.difficulty.canAnalyzeCompetitors) {
      return base
    }

    let targetPrice = cfg.basePrice * 0.95
    let marketingMultiplier = 1.0

    // Реакция на цены конкурентов: подрезаем среднюю цену конкурентов на 5%
    if (ctx.competitorDecisions && ctx.competitorDecisions.length > 0) {
      const avgCompetitorPrice =
        ctx.competitorDecisions.reduce((sum, d) => sum + d.price, 0) /
        ctx.competitorDecisions.length
      targetPrice = Math.max(1, avgCompetitorPrice * 0.95)
    }

    // Реакция на потери: при убытках усиливаем маркетинг
    if (ctx.companyState.retainedEarnings < 0) {
      marketingMultiplier = 1.2
    }

    const estimatedShare = 1 / 5
    const production = Math.round(demand * estimatedShare * 1.05)
    const estRevenue = targetPrice * production

    const raw: Decisions = {
      price: targetPrice,
      production,
      marketing: estRevenue * 0.12 * marketingMultiplier,
      capitalInvestment: s.equipment * cfg.depreciationRate * 1.2,
      rd: estRevenue * 0.08,
    }

    return this.finalize(raw, ctx)
  }
}
