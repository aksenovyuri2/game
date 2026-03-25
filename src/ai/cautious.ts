import type { Decisions } from '../engine/types'
import type { AIDecisionContext } from './types'
import { BaseAI } from './base'

/**
 * CautiousAI — осторожная стратегия.
 * Держит цены у базы, минимальные риски, консервативное производство.
 */
export class CautiousAI extends BaseAI {
  makeDecisions(ctx: AIDecisionContext): Decisions {
    const { companyState: s, cfg } = ctx
    const demand = this.estimateDemand(ctx)

    // Консервативный объём = спрос / число игроков * 0.85
    const estimatedShare = 0.85 / 5
    const production = Math.round(demand * estimatedShare * 0.85)

    // Ожидаемая выручка для расчёта расходов
    const estRevenue = cfg.basePrice * production

    const raw: Decisions = {
      price: cfg.basePrice * 1.02, // чуть выше базы
      production,
      marketing: estRevenue * 0.09, // 9% от выручки
      capitalInvestment: s.equipment * cfg.depreciationRate, // покрыть амортизацию
      rd: estRevenue * 0.025, // минимальный R&D
    }

    return this.finalize(raw, ctx)
  }
}
