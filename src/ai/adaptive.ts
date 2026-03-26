import type { Decisions } from '../engine/types'
import type { AIDecisionContext } from './types'
import { BaseAI, estimateVariableCost } from './base'

/**
 * AdaptiveAI — стратегия "Dynamic Counter-Strategy" (Контр-стратегия).
 *
 * Самый интеллектуальный ИИ. Анализирует решения конкурентов, историю своей
 * компании и динамику рынка. Выбирает оптимальную тактику в зависимости от:
 * 1. Средних цен конкурентов → undercut или premium
 * 2. Маркетинговых расходов конкурентов → counter-marketing или перенаправление в R&D
 * 3. Своего финансового состояния → агрессия при успехе, защита при потерях
 * 4. Фазы игры → инвестиции в начале, оптимизация в конце
 *
 * Без данных о конкурентах — ведёт улучшенную сбалансированную стратегию.
 */
export class AdaptiveAI extends BaseAI {
  makeDecisions(ctx: AIDecisionContext): Decisions {
    const { companyState: s, cfg } = ctx
    const demand = this.estimateDemand(ctx)
    const phase = this.getPhase(ctx)
    const str = this.strength
    const totalPlayers = (cfg.aiCount ?? 3) + 1
    const baseVariableCost = cfg.baseVariableCost ?? 12.0
    const variableCost = estimateVariableCost(s.equipment, baseVariableCost)

    // ── Анализ конкурентов ──────────────────────────────────────────────
    const hasCompetitorData =
      this.difficulty.canAnalyzeCompetitors &&
      ctx.competitorDecisions !== undefined &&
      ctx.competitorDecisions.length > 0

    const basePrice = cfg.basePrice ?? 35
    let avgCompPrice: number = basePrice
    let avgCompMarketing = 10000
    let competitorsInvestInRD = false

    if (hasCompetitorData) {
      const comps = ctx.competitorDecisions!
      avgCompPrice = comps.reduce((sum, d) => sum + d.price, 0) / comps.length
      avgCompMarketing = comps.reduce((sum, d) => sum + d.marketing, 0) / comps.length
      const avgCompRD = comps.reduce((sum, d) => sum + d.rd, 0) / comps.length
      competitorsInvestInRD = avgCompRD > 15000
    }

    // ── Анализ собственного состояния ────────────────────────────────────
    const isWinning = s.retainedEarnings > 10000
    const isLosing = s.retainedEarnings < -20000
    const hasCostAdvantage = variableCost < baseVariableCost * 0.85
    const hasRDAdvantage = s.rdAccumulated > 40000
    const rdAdvantage = Math.min(1, s.rdAccumulated / 80000)
    const costAdvantage = Math.max(0, 1 - variableCost / baseVariableCost)

    // ── Стратегия ценообразования ────────────────────────────────────────
    let targetPrice: number

    if (hasCompetitorData) {
      // Адаптивное: подрезаем среднюю цену конкурентов
      const undercutFactor = isWinning ? 0.94 : 0.92 // сильнее при потерях
      targetPrice = avgCompPrice * undercutFactor
    } else {
      // Без данных: агрессивная цена ниже базы
      targetPrice = basePrice * 0.93
    }

    // Корректировка по фазе
    switch (phase) {
      case 'early':
        targetPrice = Math.max(targetPrice, basePrice * 0.95) // не слишком низко в начале
        break
      case 'mid':
        targetPrice *= 1 - costAdvantage * 0.05 // используем преимущество по костам
        break
      case 'late':
        targetPrice *= 1 - costAdvantage * 0.08 - rdAdvantage * 0.05
        break
    }

    targetPrice = Math.max(variableCost * 1.1, targetPrice)

    // ── Стратегия инвестиций ─────────────────────────────────────────────
    let marketingRate: number
    let capexRate: number
    let rdRate: number
    let productionMult: number

    switch (phase) {
      case 'early':
        // Инвестиционная фаза: R&D + capex
        marketingRate = 0.1 * str
        capexRate = 0.18 * str
        rdRate = 0.18 * str
        productionMult = 0.95
        break
      case 'mid':
        // Адаптация под конкурентов
        if (hasCompetitorData && avgCompMarketing > 20000) {
          // Конкуренты тратят на маркетинг — контр-маркетинг + R&D
          marketingRate = 0.2 * str
          rdRate = 0.14 * str
          capexRate = 0.1 * str
        } else if (competitorsInvestInRD) {
          // Конкуренты вкладывают в R&D — контр через маркетинг и цену
          marketingRate = 0.22 * str
          rdRate = 0.08 * str
          capexRate = 0.14 * str
        } else {
          // Стандартная сбалансированная тактика
          marketingRate = 0.16 * str
          capexRate = 0.14 * str
          rdRate = 0.14 * str
        }
        productionMult = 1.1
        break
      case 'late':
        // Максимизация: акцент на маркетинг и объём
        marketingRate = 0.22 * str
        capexRate = 0.06 * str
        rdRate = 0.06 * str
        productionMult = 1.2
        break
    }

    // ── Коррекция при потерях ────────────────────────────────────────────
    if (isLosing) {
      marketingRate *= 1.25 // усиление маркетинга при убытках
      productionMult *= 0.9 // сокращение рисков перепроизводства
    }

    // ── Коррекция при успехе ─────────────────────────────────────────────
    if (isWinning && phase !== 'early') {
      // При успехе — более агрессивное расширение
      productionMult *= 1.1
      if (hasCostAdvantage) {
        // Используем преимущество: ещё ниже цена
        targetPrice *= 0.97
      }
      if (hasRDAdvantage) {
        // R&D преимущество: переключаемся на маркетинг
        rdRate *= 0.7
        marketingRate *= 1.2
      }
    }

    // ── Финальный расчёт ────────────────────────────────────────────────
    const targetShare = (1 / totalPlayers) * (1 + 0.2 * str)
    const production = Math.round(demand * targetShare * productionMult)

    const raw: Decisions = {
      price: targetPrice,
      production,
      marketing: s.cash * marketingRate,
      capex: s.cash * capexRate,
      rd: s.cash * rdRate,
    }

    return this.finalize(raw, ctx)
  }
}
