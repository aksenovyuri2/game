import type { Decisions } from './types'

export const DEFAULT_DECISIONS: Decisions = {
  price: 35,
  production: 800,
  marketing: 5000,
  capex: 5000,
  rd: 3000,
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

/**
 * Валидация и нормализация решений игрока.
 * @param raw — сырой ввод (может быть неполным)
 * @param capacity — текущая мощность компании
 * @param prevDecisions — решения предыдущего периода (для fallback при пропуске)
 * @param period — номер периода (1-based)
 */
export function validateDecisions(
  raw: Partial<Decisions> | undefined | null,
  capacity: number,
  prevDecisions?: Decisions,
  period = 1
): Decisions {
  if (!raw) return { ...DEFAULT_DECISIONS }
  const fallback = period === 1 ? DEFAULT_DECISIONS : (prevDecisions ?? DEFAULT_DECISIONS)

  const price = raw.price ?? fallback.price
  const production = raw.production ?? fallback.production
  const marketing = raw.marketing ?? fallback.marketing
  const capex = raw.capex ?? raw.capitalInvestment ?? fallback.capex ?? 5000
  const rd = raw.rd ?? fallback.rd

  const maxProduction = Math.floor(capacity * 1.5)

  return {
    price: Math.max(10, Math.min(100, price)),
    production: Math.max(0, Math.min(maxProduction, roundToStep(production, 10))),
    marketing: Math.max(0, Math.min(30000, roundToStep(marketing, 100))),
    capex: Math.max(0, Math.min(40000, roundToStep(capex, 100))),
    rd: Math.max(0, Math.min(30000, roundToStep(rd, 100))),
  }
}
