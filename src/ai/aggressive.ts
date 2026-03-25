import type { Decisions } from '../engine/types'
import type { AIDecisionContext } from './types'
import { BaseAI } from './base'

/**
 * AggressiveAI — агрессивная стратегия.
 * Низкие цены, высокий маркетинг, завышенное производство.
 */
export class AggressiveAI extends BaseAI {
  makeDecisions(ctx: AIDecisionContext): Decisions {
    const { cfg } = ctx
    const demand = this.estimateDemand(ctx)

    const estimatedShare = 1 / 5
    const production = Math.round(demand * estimatedShare * 1.2) // с запасом

    const estRevenue = cfg.basePrice * 0.88 * production

    const raw: Decisions = {
      price: cfg.basePrice * 0.88, // на 12% ниже базы
      production,
      marketing: estRevenue * 0.22, // 22% от выручки
      capitalInvestment: estRevenue * 0.12, // агрессивные инвестиции
      rd: estRevenue * 0.02, // минимальный R&D
    }

    return this.finalize(raw, ctx)
  }
}
