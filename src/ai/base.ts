import type { Decisions } from '../engine/types'
import type { AIDecisionContext, DifficultyConfig } from './types'

/**
 * Детерминированный PRNG на основе строкового ключа и числового сида.
 * Возвращает значение в [0, 1).
 */
export function seededRandom(companyId: string, period: number): number {
  let hash = period * 2654435761
  for (let i = 0; i < companyId.length; i++) {
    hash = Math.imul(hash ^ companyId.charCodeAt(i), 2246822519)
    hash = Math.imul(hash ^ (hash >>> 13), 3266489917)
  }
  hash ^= hash >>> 16
  // Нормализуем в [0, 1)
  return (hash >>> 0) / 4294967296
}

/**
 * Применяет симметричный мультипликативный шум к каждому решению.
 * Для каждого поля использует отдельное псевдослучайное число.
 */
export function applyNoise(
  d: Decisions,
  noiseLevel: number,
  companyId: string,
  period: number
): Decisions {
  if (noiseLevel === 0) return { ...d }

  const noiseFn = (base: number, fieldOffset: number): number => {
    const r = seededRandom(companyId + fieldOffset, period)
    const factor = 1 + (r * 2 - 1) * noiseLevel // [1-noise, 1+noise]
    return Math.max(0, base * factor)
  }

  return {
    price: Math.max(1, noiseFn(d.price, 1)),
    production: Math.round(Math.max(0, noiseFn(d.production, 2))),
    marketing: Math.max(0, noiseFn(d.marketing, 3)),
    capitalInvestment: Math.max(0, noiseFn(d.capitalInvestment, 4)),
    rd: Math.max(0, noiseFn(d.rd, 5)),
  }
}

/**
 * Клэмпит решения к допустимым диапазонам.
 * - price ≥ 1
 * - production ≥ 0
 * - marketing + capex + rd ≤ cash * 0.8
 */
export function clampDecisions(d: Decisions, cash: number): Decisions {
  const price = Math.max(1, d.price)
  const production = Math.max(0, d.production)

  const maxSpend = Math.max(0, cash * 0.8)
  const totalSpend = d.marketing + d.capitalInvestment + d.rd

  let marketing = Math.max(0, d.marketing)
  let capitalInvestment = Math.max(0, d.capitalInvestment)
  let rd = Math.max(0, d.rd)

  if (totalSpend > maxSpend && totalSpend > 0) {
    const ratio = maxSpend / totalSpend
    marketing = marketing * ratio
    capitalInvestment = capitalInvestment * ratio
    rd = rd * ratio
  }

  return { price, production, marketing, capitalInvestment, rd }
}

/** Абстрактный базовый класс для всех ИИ-стратегий */
export abstract class BaseAI {
  protected difficulty: DifficultyConfig

  constructor(difficulty: DifficultyConfig) {
    this.difficulty = difficulty
  }

  abstract makeDecisions(ctx: AIDecisionContext): Decisions

  protected finalize(raw: Decisions, ctx: AIDecisionContext): Decisions {
    const noisy = applyNoise(
      raw,
      this.difficulty.noiseLevel,
      ctx.companyState.id,
      ctx.marketState.period
    )
    return clampDecisions(noisy, ctx.companyState.cash)
  }

  /** Оценка спроса на основе базового рынка и макро-фактора */
  protected estimateDemand(ctx: AIDecisionContext): number {
    return ctx.cfg.baseMarketSize * ctx.marketState.macroFactor
  }
}
