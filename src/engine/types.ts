// Типы и интерфейсы Simulation Engine

export type Difficulty = 'novice' | 'medium' | 'expert' | 'master'
export type AICharacter = 'cautious' | 'aggressive' | 'balanced' | 'adaptive'
export type MarketScenario = 'stable' | 'growing' | 'crisis' | 'random'

/** Решения компании на период */
export interface Decisions {
  price: number // Цена за единицу (УДЕ), min 1
  production: number // Объём производства (шт.), min 0
  marketing: number // Бюджет на маркетинг (УДЕ), min 0
  capitalInvestment: number // Капитальные инвестиции (УДЕ), min 0
  rd: number // НИОКР (УДЕ), min 0
}

/** Состояние компании между периодами */
export interface CompanyState {
  id: string
  name: string
  isHuman: boolean
  aiCharacter?: AICharacter

  // Финансы
  cash: number // Денежные средства
  retainedEarnings: number // Нераспределённая прибыль (накопленная)

  // Производство
  inventory: number // Остаток продукции на складе (шт.)
  equipment: number // Стоимость оборудования (УДЕ)
  rdAccumulated: number // Накопленный R&D-актив (УДЕ)

  // Банкротство
  isBankrupt: boolean

  // Решения текущего периода
  decisions: Decisions
}

/** Результаты периода для одной компании */
export interface PeriodResult {
  companyId: string

  // Продажи
  unitsSold: number
  endInventory: number
  marketShare: number // Доля рынка [0, 1]

  // Финансы
  revenue: number
  cogs: number // Себестоимость реализованной продукции
  grossProfit: number
  fixedCosts: number
  marketingExpense: number
  rdExpense: number
  depreciation: number
  storageCost: number
  ebit: number // Прибыль до налогов
  tax: number
  netProfit: number

  // Баланс
  newCash: number
  newEquipment: number
  newRdAccumulated: number
  newRetainedEarnings: number

  // Индексы
  mpi: number
  variableCostPerUnit: number
}

/** Рыночное состояние на начало периода (общее для всех) */
export interface MarketState {
  period: number
  totalPeriods: number
  scenario: MarketScenario
  macroFactor: number // Макроэкономический коэффициент
  baseMarketSize: number
}

/** Результат полного периода симуляции */
export interface SimulationPeriodResult {
  period: number
  results: PeriodResult[]
  marketState: MarketState
  // Обновлённые состояния компаний (готовы к следующему периоду)
  updatedCompanyStates: CompanyState[]
}

/** Конфигурация игры */
export interface GameConfig {
  difficulty: Difficulty
  scenario: MarketScenario
  totalPeriods: number
  aiCount: number
  taxRate: number
  // Экономические константы
  baseMarketSize: number
  basePrice: number
  baseVariableCost: number
  fixedCosts: number
  depreciationRate: number
  storageCostPerUnit: number
  priceElasticity: number
  marketingAlpha: number
  rdBeta: number
  rdDecayRate: number
}

/** Начальные параметры новой компании */
export interface InitialCompanyParams {
  id: string
  name: string
  isHuman: boolean
  aiCharacter?: AICharacter
}

/** Конфигурация по умолчанию */
export const DEFAULT_CONFIG: GameConfig = {
  difficulty: 'medium',
  scenario: 'stable',
  totalPeriods: 12,
  aiCount: 4,
  taxRate: 0.2,
  baseMarketSize: 10000,
  basePrice: 100,
  baseVariableCost: 60,
  fixedCosts: 50000,
  depreciationRate: 0.15,
  storageCostPerUnit: 2,
  priceElasticity: 1.5,
  marketingAlpha: 0.3,
  rdBeta: 0.2,
  rdDecayRate: 0.1,
}

/** Начальное состояние компании */
export const INITIAL_COMPANY_STATE = {
  cash: 200000,
  retainedEarnings: 0,
  inventory: 0,
  equipment: 100000,
  rdAccumulated: 0,
  isBankrupt: false,
  decisions: {
    price: 100,
    production: 1000,
    marketing: 10000,
    capitalInvestment: 10000,
    rd: 5000,
  } satisfies Decisions,
} as const
