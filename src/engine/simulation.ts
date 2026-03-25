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
    isBankrupt: INITIAL_COMPANY_STATE.isBankrupt,
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
  // Определяем активных (не банкротов) и банкротов
  const activeIndices = companies.map((c, i) => (!c.isBankrupt ? i : -1)).filter((i) => i >= 0)
  const activeDecisions = activeIndices.map((i) => companies[i]!.decisions)
  const activeRdAccumulated = activeIndices.map((i) => companies[i]!.rdAccumulated)

  // 1. Рыночная доля (только для активных компаний)
  const activeScores = calcCompetitiveScores(activeDecisions, activeRdAccumulated, cfg)
  const activeShares = calcMarketShares(activeScores)

  // 2. Спрос для активных компаний
  const activeDemands = calcDemandForCompanies(activeShares, market.macroFactor, cfg)

  // Маппинг: для каждой компании её доля и спрос (банкроты = 0)
  const shares = companies.map(() => 0)
  const demands = companies.map(() => 0)
  activeIndices.forEach((companyIdx, activeIdx) => {
    shares[companyIdx] = activeShares[activeIdx] ?? 0
    demands[companyIdx] = activeDemands[activeIdx] ?? 0
  })

  // 3. Расчёт результатов для каждой компании
  const results: PeriodResult[] = companies.map((company, i) => {
    // Банкроты — нулевые результаты, состояние не меняется
    if (company.isBankrupt) {
      return {
        companyId: company.id,
        unitsSold: 0,
        endInventory: company.inventory,
        marketShare: 0,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        fixedCosts: 0,
        marketingExpense: 0,
        rdExpense: 0,
        depreciation: 0,
        storageCost: 0,
        ebit: 0,
        tax: 0,
        netProfit: 0,
        newCash: company.cash,
        newEquipment: company.equipment,
        newRdAccumulated: company.rdAccumulated,
        newRetainedEarnings: company.retainedEarnings,
        mpi: 0,
        variableCostPerUnit: 0,
      }
    }

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

  // 4. Обновлённые состояния компаний (с определением банкротства)
  const updatedCompanyStates: CompanyState[] = companies.map((company, i) => {
    const result = results[i]!

    // Банкрот остаётся банкротом
    if (company.isBankrupt) {
      return { ...company }
    }

    const newCash = result.newCash
    return {
      ...company,
      cash: newCash,
      retainedEarnings: result.newRetainedEarnings,
      inventory: result.endInventory,
      equipment: result.newEquipment,
      rdAccumulated: result.newRdAccumulated,
      isBankrupt: newCash <= 0,
    }
  })

  return {
    period: market.period,
    results,
    marketState: market,
    updatedCompanyStates,
  }
}
