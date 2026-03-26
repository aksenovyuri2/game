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
  /** Амплитуда случайного шума [0, 1]. novice=0.25, medium=0.10, expert=0.03, master=0 */
  noiseLevel: number
  /** Может ли ИИ анализировать решения конкурентов */
  canAnalyzeCompetitors: boolean
  /** Использует ли ИИ долгосрочное планирование (фазы игры) */
  canUseLongTermPlanning: boolean
  /** Множитель силы ИИ: повышает эффективность расходов. novice=0.8, medium=1.0, expert=1.15, master=1.3 */
  strengthMultiplier: number
}

/** Фаза игры для стратегического планирования */
export type GamePhase = 'early' | 'mid' | 'late'

/** Допустимые диапазоны решений */
export interface DecisionLimits {
  minPrice: number
  maxPrice: number
  minProduction: number
  maxProduction: number
  maxTotalSpend: number // marketing + capex + rd не более этого
}
