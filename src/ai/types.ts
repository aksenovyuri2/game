import type { CompanyState, Decisions, GameConfig, MarketState } from '../engine/types'

/** Контекст для принятия решений ИИ */
export interface AIDecisionContext {
  companyState: CompanyState
  marketState: MarketState
  cfg: GameConfig
  /** Решения конкурентов за предыдущий период (для AdaptiveAI) */
  competitorDecisions?: Decisions[]
  /** История состояний своей компании (для адаптивных стратегий) */
  history?: CompanyState[]
}

/** Конфигурация уровня сложности */
export interface DifficultyConfig {
  /** Амплитуда случайного шума [0, 1]. novice=0.3, medium=0.15, expert=0.05, master=0 */
  noiseLevel: number
  /** Может ли ИИ анализировать решения конкурентов */
  canAnalyzeCompetitors: boolean
  /** Использует ли ИИ долгосрочное планирование */
  canUseLongTermPlanning: boolean
}

/** Допустимые диапазоны решений */
export interface DecisionLimits {
  minPrice: number
  maxPrice: number
  minProduction: number
  maxProduction: number
  maxTotalSpend: number // marketing + capex + rd не более этого
}
