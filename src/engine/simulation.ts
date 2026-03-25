import type {
  CompanyState,
  GameConfig,
  InitialCompanyParams,
  MarketState,
  PeriodResult,
  SimulationPeriodResult,
} from './types'
import { INITIAL_COMPANY_STATE } from './types'
import {
  calcCompetitiveScores,
  calcMarketShares,
  calcDemandForCompanies,
  calcSalesAndInventory,
} from './market'
import {
  calcVariableCostPerUnit,
  calcDepreciation,
  calcNewEquipment,
  calcStorageCost,
} from './costs'
import { calcMPI } from './mpi'

/**
 * Создаёт начальное состояние компании.
 */
export function createInitialCompanyState(params: InitialCompanyParams): CompanyState {
  return {
    ...params,
    cash: INITIAL_COMPANY_STATE.cash,
    retainedEarnings: INITIAL_COMPANY_STATE.retainedEarnings,
    inventory: INITIAL_COMPANY_STATE.inventory,
    equipment: INITIAL_COMPANY_STATE.equipment,
    rdAccumulated: INITIAL_COMPANY_STATE.rdAccumulated,
    decisions: { ...INITIAL_COMPANY_STATE.decisions },
  }
}

/**
 * Выполняет расчёт одного периода симуляции.
 * Принимает состояния всех компаний и рыночное состояние,
 * возвращает результаты периода и обновлённые состояния.
 */
export function runPeriod(
  companies: CompanyState[],
  market: MarketState,
  cfg: GameConfig
): SimulationPeriodResult {
  const decisions = companies.map((c) => c.decisions)
  const rdAccumulated = companies.map((c) => c.rdAccumulated)

  // 1. Рыночная доля
  const scores = calcCompetitiveScores(decisions, rdAccumulated, cfg)
  const shares = calcMarketShares(scores)

  // 2. Спрос для каждой компании
  const demands = calcDemandForCompanies(shares, market.macroFactor, cfg)

  // 3. Расчёт результатов для каждой компании
  const results: PeriodResult[] = companies.map((company, i) => {
    const { decisions: d } = company
    const share = shares[i] ?? 0
    const demand = demands[i] ?? 0

    // Продажи и склад
    const { unitsSold, endInventory } = calcSalesAndInventory({
      prevInventory: company.inventory,
      produced: d.production,
      demand,
    })

    // Затраты
    const variableCostPerUnit = calcVariableCostPerUnit(company.equipment, cfg)
    const depreciation = calcDepreciation(company.equipment, cfg)
    const storageCost = calcStorageCost(endInventory, cfg)
    const newEquipment = calcNewEquipment(company.equipment, d.capitalInvestment, cfg)

    // R&D: накопление с затуханием
    const newRdAccumulated = company.rdAccumulated * (1 - cfg.rdDecayRate) + d.rd

    // Финансы
    const revenue = d.price * unitsSold
    const cogs = variableCostPerUnit * unitsSold
    const grossProfit = revenue - cogs

    const fixedCosts = cfg.fixedCosts
    const marketingExpense = d.marketing
    const rdExpense = d.rd

    const ebit =
      grossProfit - fixedCosts - marketingExpense - rdExpense - depreciation - storageCost
    const tax = ebit > 0 ? ebit * cfg.taxRate : 0
    const netProfit = ebit - tax

    const newCash = company.cash + netProfit - d.capitalInvestment
    const newRetainedEarnings = company.retainedEarnings + netProfit

    // Собираем PeriodResult без mpi (посчитаем ниже)
    const partialResult: Omit<PeriodResult, 'mpi'> = {
      companyId: company.id,
      unitsSold,
      endInventory,
      marketShare: share,
      revenue,
      cogs,
      grossProfit,
      fixedCosts,
      marketingExpense,
      rdExpense,
      depreciation,
      storageCost,
      ebit,
      tax,
      netProfit,
      newCash,
      newEquipment,
      newRdAccumulated,
      newRetainedEarnings,
      variableCostPerUnit,
    }

    const mpi = calcMPI({ ...partialResult, mpi: 0 })

    return { ...partialResult, mpi }
  })

  // 4. Обновлённые состояния компаний
  const updatedCompanyStates: CompanyState[] = companies.map((company, i) => {
    const result = results[i]!
    return {
      ...company,
      cash: result.newCash,
      retainedEarnings: result.newRetainedEarnings,
      inventory: result.endInventory,
      equipment: result.newEquipment,
      rdAccumulated: result.newRdAccumulated,
    }
  })

  return {
    period: market.period,
    results,
    marketState: market,
    updatedCompanyStates,
  }
}
