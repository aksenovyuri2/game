import type { Decisions } from '../engine/types'
import type { AIDecisionContext } from './types'
import { BaseAI, estimateVariableCost } from './base'

/**
 * BalancedAI — стратегия "Diversified Growth" (Диверсифицированный рост).
 *
 * Стратегия: равномерно инвестирует в оборудование, R&D и маркетинг.
 * Не лидирует ни в одном направлении, но не имеет слабых мест.
 * Постепенно наращивает все три конкурентных преимущества: цена (через capex),
 * quality (через R&D), awareness (через маркетинг).
 *
 * Фазы:
 * - Early: Равномерные инвестиции 12-15% в каждое направление, цена ≈ базовая
 * - Mid: Усиление маркетинга и снижение цены по мере роста преимуществ
 * - Late: Оптимальная эксплуатация всех накопленных преимуществ
 */
export class BalancedAI extends BaseAI {
  makeDecisions(ctx: AIDecisionContext): Decisions {
    const { companyState: s, cfg } = ctx
    const demand = this.estimateDemand(ctx)
    const phase = this.getPhase(ctx)
    const str = this.strength

    const totalPlayers = (cfg.aiCount ?? 3) + 1
    const baseVariableCost = cfg.baseVariableCost ?? 12.0
    const variableCost = estimateVariableCost(s.equipment, baseVariableCost)
    const costAdvantage = Math.max(0, 1 - variableCost / baseVariableCost)
    const rdAdvantage = Math.min(1, s.rdAccumulated / 80000)

    let priceMult: number
    let marketingRate: number
    let capexRate: number
    let rdRate: number
    let productionMult: number

    switch (phase) {
      case 'early':
        // Инвестиционная фаза: строим фундамент по всем направлениям
        priceMult = 0.97
        marketingRate = 0.12 * str
        capexRate = 0.14 * str
        rdRate = 0.14 * str
        productionMult = 0.95
        break
      case 'mid':
        // Наращиваем: используем накопленные преимущества
        priceMult = 0.93 - costAdvantage * 0.04 - rdAdvantage * 0.03
        marketingRate = 0.15 * str
        capexRate = 0.12 * str
        rdRate = 0.12 * str
        productionMult = 1.05
        break
      case 'late':
        // Максимизация: все три направления работают на нас
        priceMult = 0.9 - costAdvantage * 0.05 - rdAdvantage * 0.05
        marketingRate = 0.18 * str
        capexRate = 0.08 * str // поддержание
        rdRate = 0.08 * str // поддержание
        productionMult = 1.1
        break
    }

    const basePrice = cfg.basePrice ?? 35
    const price = Math.max(variableCost * 1.12, basePrice * priceMult)
    const estimatedShare = 1 / totalPlayers
    const production = Math.round(demand * estimatedShare * productionMult)

    // Адаптация к финансовому состоянию: если теряем деньги — больше маркетинга
    let marketingBoost = 1.0
    if (s.retainedEarnings < -20000) {
      marketingBoost = 1.15
    }

    const raw: Decisions = {
      price,
      production,
      marketing: s.cash * marketingRate * marketingBoost,
      capex: s.cash * capexRate,
      rd: s.cash * rdRate,
    }

    return this.finalize(raw, ctx)
  }
}
