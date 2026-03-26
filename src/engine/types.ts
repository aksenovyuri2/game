// Типы и интерфейсы Simulation Engine v2.0

export type Difficulty = 'novice' | 'medium' | 'expert' | 'master'
export type AICharacter = 'cautious' | 'aggressive' | 'balanced' | 'adaptive'
export type MarketScenario = 'stable' | 'growing' | 'crisis' | 'random'

/** Решения компании на период */
export interface Decisions {
  price: number // Цена за единицу [10–100], шаг 1
  production: number // Объём производства [0–capacity×1.5], шаг 10
  marketing: number // Бюджет на маркетинг [0–30000], шаг 100
  capex?: number // Капитальные инвестиции [0–40000], шаг 100
  rd: number // НИОКР [0–30000], шаг 100
  // Алиас для обратной совместимости
  capitalInvestment?: number
}

/** Состояние компании между периодами */
export interface CompanyState {
  id: string
  name: string
  isAI: boolean
  // Совместимость со старым кодом
  isHuman?: boolean
  aiCharacter?: AICharacter

  // Решения текущего периода
  decisions: Decisions

  // Финансы
  cash: number
  retainedEarnings: number
  loanBalance: number
  creditRating: number // 1.0 = норма, 2.0 = плохо

  // Производство
  inventory: number
  equipment: number
  capacity: number
  rdAccumulated: number

  // Бренд
  brandReputation: number // 0–100

  // История
  salesHistory: number[]

  // Статус
  isBankrupt: boolean
}

/** Результаты периода для одной компании */
export interface PeriodResult {
  companyId: string

  // Продажи
  unitsSold: number
  endInventory: number
  spoilage: number
  marketShare: number // [0, 1]
  companyDemand: number
  unmetDemand: number

  // Себестоимость
  unitCost: number
  variableCostPerUnit: number
  fixedCostPerUnit: number

  // P&L
  revenue: number
  costOfGoodsSold: number
  grossProfit: number
  marketingExpense: number
  rdExpense: number
  depreciation: number
  holdingCost: number
  spoilageCost: number
  productionOverhead: number
  operatingProfit: number
  interestExpense: number
  profitBeforeTax: number
  tax: number
  netProfit: number

  // Баланс
  newCash: number
  newEquipment: number
  newCapacity: number
  newRdAccumulated: number
  newBrandReputation: number
  newRetainedEarnings: number
  newLoanBalance: number
  newCreditRating: number

  // Конкурентность
  cas: number
  priceScore: number
  marketingScore: number
  qualityScore: number
  brandScore: number

  // Итог
  mpi: number

  // Поля для совместимости с UI
  cogs?: number
  grossProfitCompat?: number
  fixedCosts?: number
  storageCost?: number
  ebit?: number
  newRdAccumulatedCompat?: number
  newRetainedEarningsCompat?: number
}

/** Рыночное состояние */
export interface MarketState {
  period: number
  totalPeriods: number
  scenario: MarketScenario
  economicMultiplier: number
  numberOfCompanies: number
  // Совместимость
  macroFactor?: number
  baseMarketSize?: number
}

/** Результат полного периода симуляции */
export interface SimulationPeriodResult {
  period: number
  results: PeriodResult[]
  marketState: MarketState
  updatedCompanyStates: CompanyState[]
  totalMarketDemand: number
  avgPrice: number
}

// ─── Система событий ─────────────────────────────────────────────────────────

export type EventCategory = 'economy' | 'technology' | 'social' | 'regulation' | 'industry'

export interface EventEffects {
  demandMultiplier: number
  priceElasticityMod: number
  marketingAlphaMod: number
  rdBetaMod: number
  variableCostMult: number
  fixedCostMult: number
  storageCostMult: number
}

export interface MarketEventDef {
  id: string
  category: EventCategory
  title: string
  description: string
  effects: Partial<EventEffects>
  minDuration: number
  maxDuration: number
}

export interface ActiveEvent {
  eventId: string
  title: string
  description: string
  effects: Partial<EventEffects>
  remainingPeriods: number
  startPeriod: number
}

export type CombinedEffects = EventEffects

export type StartingCashPreset = 'low' | 'medium' | 'high'

export function getStartingCash(preset: StartingCashPreset): number {
  switch (preset) {
    case 'low':
      return 30000
    case 'medium':
      return 50000
    case 'high':
      return 80000
  }
}

/** Начальные параметры новой компании */
export interface InitialCompanyParams {
  id: string
  name: string
  isAI?: boolean
  isHuman?: boolean
  aiCharacter?: AICharacter
  decisions?: Decisions
  startingCash?: StartingCashPreset
}

/** Начальное состояние компании (v2.0) */
export const INITIAL_COMPANY_STATE = {
  cash: 50000,
  retainedEarnings: 0,
  loanBalance: 0,
  creditRating: 1.0,
  inventory: 600,
  equipment: 100000,
  capacity: 1000,
  rdAccumulated: 1000,
  brandReputation: 50.0,
  salesHistory: [600],
  isBankrupt: false,
} as const

/** Конфигурация игры */
export interface GameConfig {
  difficulty: Difficulty
  scenario: MarketScenario
  totalPeriods: number
  aiCount: number
  // Устаревшие поля (для обратной совместимости с событиями и старым кодом)
  taxRate?: number
  baseMarketSize?: number
  basePrice?: number
  baseVariableCost?: number
  fixedCosts?: number
  depreciationRate?: number
  storageCostPerUnit?: number
  priceElasticity?: number
  marketingAlpha?: number
  rdBeta?: number
  rdDecayRate?: number
}

export const DEFAULT_CONFIG: GameConfig = {
  difficulty: 'medium',
  scenario: 'stable',
  totalPeriods: 12,
  aiCount: 4,
  // Поля для обратной совместимости
  taxRate: 0.25,
  baseMarketSize: 5000,
  basePrice: 35,
  baseVariableCost: 12.0,
  fixedCosts: 8000,
  depreciationRate: 0.08,
  storageCostPerUnit: 1.5,
  priceElasticity: 1.5,
  marketingAlpha: 0.3,
  rdBeta: 0.2,
  rdDecayRate: 0.05,
}
