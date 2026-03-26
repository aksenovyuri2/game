import type { Decisions } from '../engine/types'
import type { AIDecisionContext } from './types'
import { BaseAI, estimateVariableCost } from './base'

/**
 * AggressiveAI — стратегия "Cost Leadership" (Лидерство по издержкам).
 *
 * Стратегия: тяжёлые капитальные инвестиции в начале для снижения переменных
 * затрат (equipment снижает baseVariableCost). Затем — агрессивно низкие цены
 * и высокий маркетинг для захвата рынка. Маржа на единицу низкая, но объём
 * компенсирует.
 *
 * Фазы:
 * - Early: Тяжёлый capex (30% cash), маркетинг (15%), цена на уровне базы
 * - Mid: Capex снижается, цена резко падает (используем преимущество по костам),
 *         маркетинг максимальный, производство с запасом
 * - Late: Ценовая война — минимальные цены, максимальный объём, доминирование
 */
export class AggressiveAI extends BaseAI {
  makeDecisions(ctx: AIDecisionContext): Decisions {
    const { companyState: s, cfg } = ctx
    const demand = this.estimateDemand(ctx)
    const phase = this.getPhase(ctx)
    const str = this.strength

    const totalPlayers = cfg.aiCount + 1
    const baseVariableCost = cfg.baseVariableCost ?? 12.0
    const variableCost = estimateVariableCost(s.equipment, baseVariableCost)
    // Преимущество по издержкам: чем ниже variableCost vs base, тем сильнее
    const costAdvantage = Math.max(0, 1 - variableCost / baseVariableCost) // [0, ~0.4]

    let priceMult: number
    let marketingRate: number
    let capexRate: number
    let rdRate: number
    let productionMult: number

    switch (phase) {
      case 'early':
        // Инвестиционная фаза: строим оборудование
        priceMult = 0.96 // лёгкий дисконт для привлечения
        marketingRate = 0.14 * str
        capexRate = 0.3 * str // тяжёлые инвестиции!
        rdRate = 0.03 * str // минимальный R&D
        productionMult = 1.05
        break
      case 'mid':
        // Оборудование построено — используем ценовое преимущество
        priceMult = 0.88 - costAdvantage * 0.08 // от 88% до 80%
        marketingRate = 0.22 * str // агрессивный маркетинг
        capexRate = 0.15 * str // продолжаем инвестировать
        rdRate = 0.02 * str
        productionMult = 1.2 // с запасом
        break
      case 'late':
        // Ценовая война: максимальный захват рынка
        priceMult = 0.82 - costAdvantage * 0.1 // от 82% до 72%
        marketingRate = 0.25 * str // максимальный маркетинг
        capexRate = 0.08 * str // поддержание
        rdRate = 0.02 * str
        productionMult = 1.35 // агрессивное производство
        break
    }

    const basePrice = cfg.basePrice ?? 35
    const price = Math.max(variableCost * 1.08, basePrice * priceMult)
    // Агрессивный: целится на долю больше средней
    const targetShare = (1 / totalPlayers) * (1 + 0.3 * str)
    const production = Math.round(demand * targetShare * productionMult)

    const raw: Decisions = {
      price,
      production,
      marketing: s.cash * marketingRate,
      capex: s.cash * capexRate,
      rd: s.cash * rdRate,
    }

    return this.finalize(raw, ctx)
  }
}
