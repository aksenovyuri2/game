import type { Decisions } from '../engine/types'
import type { AIDecisionContext } from './types'
import { BaseAI } from './base'

/**
 * BalancedAI — сбалансированная стратегия.
 * Умеренные цены, равномерные инвестиции во все направления.
 */
export class BalancedAI extends BaseAI {
  makeDecisions(ctx: AIDecisionContext): Decisions {
    const { cfg } = ctx
    const demand = this.estimateDemand(ctx)

    const estimatedShare = 1 / 5
    const production = Math.round(demand * estimatedShare * 1.0)

    const estRevenue = cfg.basePrice * 0.95 * production

    const raw: Decisions = {
      price: cfg.basePrice * 0.95, // чуть ниже базы
      production,
      marketing: estRevenue * 0.1, // 10% на маркетинг
      capitalInvestment: estRevenue * 0.1, // 10% на оборудование
      rd: estRevenue * 0.1, // 10% на R&D
    }

    return this.finalize(raw, ctx)
  }
}
