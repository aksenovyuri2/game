import type { Decisions } from '../engine/types'
import type { AIDecisionContext } from './types'
import { BaseAI, estimateVariableCost } from './base'

/**
 * CautiousAI — стратегия "R&D Supremacy" (Технологическое превосходство).
 *
 * Стратегия: агрессивно инвестирует в НИОКР в начале игры, чтобы накопить
 * rdAccumulated и получить преимущество через rdScore в конкурентной формуле.
 * К середине игры R&D-преимущество даёт высокий competitive score даже при
 * умеренных ценах и маркетинге. В поздней фазе — максимизация прибыли.
 *
 * Фазы:
 * - Early: Тяжёлый R&D (25% cash), умеренная цена, минимальный маркетинг
 * - Mid: R&D снижается (15%), маркетинг растёт, цена чуть ниже базы
 * - Late: Пожинаем плоды R&D, премиальная цена, стабильный маркетинг
 */
export class CautiousAI extends BaseAI {
  makeDecisions(ctx: AIDecisionContext): Decisions {
    const { companyState: s, cfg } = ctx
    const demand = this.estimateDemand(ctx)
    const phase = this.getPhase(ctx)
    const str = this.strength

    const totalPlayers = cfg.aiCount + 1
    const variableCost = estimateVariableCost(s.equipment, cfg.baseVariableCost)

    // Стратегия ценообразования зависит от фазы и накопленного R&D
    const rdAdvantage = Math.min(1, s.rdAccumulated / 80000) // [0, 1]
    let priceMult: number
    let rdRate: number
    let marketingRate: number
    let capexRate: number
    let productionMult: number

    switch (phase) {
      case 'early':
        // Инвестиционная фаза: тяжёлый R&D, минимальный маркетинг
        priceMult = 1.0 // на уровне базы — не привлекать внимание
        rdRate = 0.25 * str // 25% кэша на R&D
        marketingRate = 0.06 * str // минимум маркетинга
        capexRate = 0.08 * str // лёгкое обновление оборудования
        productionMult = 0.85 // консервативное производство
        break
      case 'mid':
        // R&D начинает окупаться, наращиваем маркетинг
        priceMult = 0.97 - rdAdvantage * 0.03 // от 97% до 94% базы
        rdRate = 0.15 * str // ещё вкладываем, но меньше
        marketingRate = 0.12 * str // наращиваем
        capexRate = 0.1 * str
        productionMult = 0.95
        break
      case 'late':
        // Максимизация прибыли с R&D-преимуществом
        priceMult = 0.95 - rdAdvantage * 0.05 // с R&D можем позволить ниже
        rdRate = 0.08 * str // поддержка
        marketingRate = 0.15 * str // хороший маркетинг
        capexRate = 0.06 * str // поддержание
        productionMult = 1.0
        break
    }

    const price = Math.max(variableCost * 1.15, cfg.basePrice * priceMult)
    const estimatedShare = 1 / totalPlayers
    const production = Math.round(demand * estimatedShare * productionMult)
    const availableCash = s.cash

    const raw: Decisions = {
      price,
      production,
      marketing: availableCash * marketingRate,
      capitalInvestment: availableCash * capexRate,
      rd: availableCash * rdRate,
    }

    return this.finalize(raw, ctx)
  }
}
