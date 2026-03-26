import type {
  CompanyState,
  MarketState,
  PeriodResult,
  SimulationPeriodResult,
  InitialCompanyParams,
} from './types'
import { INITIAL_COMPANY_STATE, getStartingCash } from './types'
import { validateDecisions } from './validation'
import { calcEquipment, calcCapacity, calcRdAccumulated, calcUnitCost } from './production'
import { calcEconomicMultiplier, calcTotalMarketDemand } from './demand'
import {
  calcPriceScore,
  calcMarketingScore,
  calcQualityScore,
  calcBrandScore,
  calcCAS,
} from './cas'
import { distributeMarketDemand, calcSalesAndSpoilage, redistributeUnmetDemand } from './market'
import { calcPnL, calcCashAndLoans } from './financial'
import { calcBrandReputation } from './brand'
import { calcMPI } from './mpi'

/**
 * Создаёт начальное состояние компании.
 */
export function createInitialCompanyState(params: InitialCompanyParams): CompanyState {
  return {
    id: params.id,
    name: params.name,
    isAI: params.isAI ?? !(params.isHuman ?? false),
    isHuman: params.isHuman,
    aiCharacter: params.aiCharacter,
    decisions: params.decisions ?? {
      price: 35,
      production: 800,
      marketing: 5000,
      capex: 5000,
      rd: 3000,
    },
    cash: params.startingCash ? getStartingCash(params.startingCash) : INITIAL_COMPANY_STATE.cash,
    retainedEarnings: INITIAL_COMPANY_STATE.retainedEarnings,
    loanBalance: INITIAL_COMPANY_STATE.loanBalance,
    creditRating: INITIAL_COMPANY_STATE.creditRating,
    inventory: INITIAL_COMPANY_STATE.inventory,
    equipment: INITIAL_COMPANY_STATE.equipment,
    capacity: INITIAL_COMPANY_STATE.capacity,
    rdAccumulated: INITIAL_COMPANY_STATE.rdAccumulated,
    brandReputation: INITIAL_COMPANY_STATE.brandReputation,
    salesHistory: [...INITIAL_COMPANY_STATE.salesHistory],
    isBankrupt: INITIAL_COMPANY_STATE.isBankrupt,
  }
}

function makeZeroResult(c: CompanyState): PeriodResult {
  return {
    companyId: c.id,
    unitsSold: 0,
    endInventory: c.inventory,
    spoilage: 0,
    marketShare: 0,
    companyDemand: 0,
    unmetDemand: 0,
    unitCost: 0,
    variableCostPerUnit: 0,
    fixedCostPerUnit: 0,
    revenue: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    marketingExpense: 0,
    rdExpense: 0,
    depreciation: 0,
    holdingCost: 0,
    spoilageCost: 0,
    productionOverhead: 0,
    operatingProfit: 0,
    interestExpense: 0,
    profitBeforeTax: 0,
    tax: 0,
    netProfit: 0,
    newCash: c.cash,
    newEquipment: c.equipment,
    newCapacity: c.capacity,
    newRdAccumulated: c.rdAccumulated,
    newBrandReputation: c.brandReputation,
    newRetainedEarnings: c.retainedEarnings,
    newLoanBalance: c.loanBalance,
    newCreditRating: c.creditRating,
    cas: 0,
    priceScore: 0,
    marketingScore: 0,
    qualityScore: 0,
    brandScore: 0,
    mpi: 0,
  }
}

/**
 * Выполняет расчёт одного периода симуляции (10-этапный конвейер).
 */
export function simulatePeriod(
  companies: CompanyState[],
  market: MarketState
): SimulationPeriodResult {
  const { period, totalPeriods, scenario } = market
  const numberOfCompanies = market.numberOfCompanies ?? companies.length

  const prevMultiplier = market.economicMultiplier ?? market.macroFactor ?? 1.0
  const economicMultiplier = calcEconomicMultiplier(scenario, period, totalPeriods, prevMultiplier)
  const totalMarketDemand = calcTotalMarketDemand(numberOfCompanies, economicMultiplier)

  // Separate active vs bankrupt
  const activeIdx: number[] = []
  const bankruptIdx: number[] = []
  companies.forEach((c, i) => (c.isBankrupt ? bankruptIdx : activeIdx).push(i))

  // Build results array with placeholders
  const allResults: PeriodResult[] = companies.map((c) => makeZeroResult(c))
  const updatedStates: CompanyState[] = companies.map((c) => ({ ...c }))

  if (activeIdx.length === 0) {
    return {
      period,
      results: allResults,
      marketState: { ...market, economicMultiplier },
      updatedCompanyStates: updatedStates,
      totalMarketDemand,
      avgPrice: 0,
    }
  }

  const activeCompanies = activeIdx.map((i) => companies[i]!)

  // ─── Этап 1: Валидация решений ────────────────────────────────────────────
  const validatedDecisions = activeCompanies.map((c) =>
    validateDecisions(c.decisions, c.capacity, c.decisions, period)
  )

  // ─── Этап 2: Обновление активов ───────────────────────────────────────────
  const newEquipments = activeCompanies.map((c, i) =>
    calcEquipment(
      c.equipment,
      validatedDecisions[i]!.capex ?? validatedDecisions[i]!.capitalInvestment ?? 0
    )
  )
  const newCapacities = newEquipments.map((eq) => calcCapacity(eq))
  const newRdAccumulateds = activeCompanies.map((c, i) =>
    calcRdAccumulated(c.rdAccumulated, validatedDecisions[i]!.rd)
  )
  const unitCostResults = activeCompanies.map((c, i) =>
    calcUnitCost(validatedDecisions[i]!.production, c.capacity, c.equipment, c.rdAccumulated)
  )

  // ─── Этап 4: CAS для активных компаний ───────────────────────────────────
  const allPrices = validatedDecisions.map((d) => d.price)
  const allMarketings = validatedDecisions.map((d) => d.marketing)

  const priceScores = activeCompanies.map((_, i) => calcPriceScore(allPrices[i]!, allPrices))
  const marketingScores = activeCompanies.map((_, i) =>
    calcMarketingScore(allMarketings[i]!, allMarketings)
  )
  const qualityScores = activeCompanies.map((_, i) => calcQualityScore(newRdAccumulateds[i]!))
  const brandScores = activeCompanies.map((c) => calcBrandScore(c.brandReputation))
  const casValues = activeCompanies.map((_, i) =>
    calcCAS(priceScores[i]!, marketingScores[i]!, qualityScores[i]!, brandScores[i]!)
  )

  // ─── Этап 5: Распределение спроса ────────────────────────────────────────
  const companyDemands = distributeMarketDemand(casValues, totalMarketDemand)

  // ─── Этап 6: Продажи и перераспределение ─────────────────────────────────
  const salesResults = activeCompanies.map((c, i) =>
    calcSalesAndSpoilage(companyDemands[i]!, c.inventory, validatedDecisions[i]!.production)
  )

  const unmetDemands = salesResults.map((r) => r.unmetDemand)
  const postSaleInventories = salesResults.map((r) => r.newInventory)
  const extraSales = redistributeUnmetDemand(unmetDemands, casValues, postSaleInventories)

  const finalUnitsSold = salesResults.map((r, i) => r.unitsSold + (extraSales[i] ?? 0))
  const finalInventories = salesResults.map((r, i) => r.newInventory - (extraSales[i] ?? 0))

  // ─── Этап 7: P&L ─────────────────────────────────────────────────────────
  const pnlResults = activeCompanies.map((c, i) =>
    calcPnL({
      unitsSold: finalUnitsSold[i]!,
      unitCost: unitCostResults[i]!.unitCost,
      price: validatedDecisions[i]!.price,
      marketing: validatedDecisions[i]!.marketing,
      rd: validatedDecisions[i]!.rd,
      equipment: c.equipment,
      production: validatedDecisions[i]!.production,
      capacity: c.capacity,
      loanBalance: c.loanBalance,
      creditRating: c.creditRating,
      endInventory: finalInventories[i]!,
      spoilage: salesResults[i]!.spoilage,
    })
  )

  // ─── Этап 8: Баланс и автокредит ─────────────────────────────────────────
  const cashResults = activeCompanies.map((c, i) =>
    calcCashAndLoans({
      prevCash: c.cash,
      netProfit: pnlResults[i]!.netProfit,
      capex: validatedDecisions[i]!.capex ?? validatedDecisions[i]!.capitalInvestment ?? 0,
      prevLoanBalance: c.loanBalance,
      prevCreditRating: c.creditRating,
      equipment: newEquipments[i]!,
    })
  )

  // ─── Этап 9: Обновление бренда ────────────────────────────────────────────
  const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length
  const prevQualityScores = activeCompanies.map((c) => calcQualityScore(c.rdAccumulated))

  const newBrandReputations = activeCompanies.map((c, i) =>
    calcBrandReputation({
      prevBrand: c.brandReputation,
      marketingScore: marketingScores[i]!,
      qualityScore: qualityScores[i]!,
      prevQualityScore: prevQualityScores[i]!,
      fulfillmentRate: finalUnitsSold[i]! / Math.max(companyDemands[i]!, 1),
      price: validatedDecisions[i]!.price,
      avgPrice,
    })
  )

  // ─── Этап 10: MPI ─────────────────────────────────────────────────────────
  const totalUnitsSold = finalUnitsSold.reduce((a, b) => a + b, 0)
  const newRetainedEarnings = activeCompanies.map(
    (c, i) => c.retainedEarnings + pnlResults[i]!.netProfit
  )

  const supplyPotentials = activeCompanies.map(
    (_, i) => newCapacities[i]! * 0.7 + finalInventories[i]! * 0.3
  )
  const productivities = activeCompanies.map((_, i) => {
    const totalCosts = Math.max(
      1,
      pnlResults[i]!.costOfGoodsSold +
        pnlResults[i]!.marketingExpense +
        pnlResults[i]!.rdExpense +
        pnlResults[i]!.depreciation
    )
    return pnlResults[i]!.revenue / totalCosts
  })
  const prevRevenues = activeCompanies.map((c) => {
    const lastSale = c.salesHistory[c.salesHistory.length - 1] ?? 0
    return lastSale * (validatedDecisions[activeCompanies.indexOf(c)]?.price ?? 35)
  })

  const mpiValues = activeCompanies.map((_, i) =>
    calcMPI({
      retainedEarnings: newRetainedEarnings[i]!,
      cas: casValues[i]!,
      capacity: newCapacities[i]!,
      inventory: finalInventories[i]!,
      revenue: pnlResults[i]!.revenue,
      totalCosts: Math.max(
        1,
        pnlResults[i]!.costOfGoodsSold +
          pnlResults[i]!.marketingExpense +
          pnlResults[i]!.rdExpense +
          pnlResults[i]!.depreciation
      ),
      unitsSold: finalUnitsSold[i]!,
      totalUnitsSold,
      prevRevenue: prevRevenues[i]!,
      period,
      allRetainedEarnings: newRetainedEarnings,
      allCAS: casValues,
      allSupplyPotentials: supplyPotentials,
      allProductivities: productivities,
    })
  )

  // ─── Сборка результатов активных компаний ───────────────────────────────
  activeIdx.forEach((globalIdx, localIdx) => {
    const newCash = cashResults[localIdx]!.newCash
    allResults[globalIdx] = {
      companyId: companies[globalIdx]!.id,
      unitsSold: finalUnitsSold[localIdx]!,
      endInventory: finalInventories[localIdx]!,
      spoilage: salesResults[localIdx]!.spoilage,
      marketShare: finalUnitsSold[localIdx]! / Math.max(totalUnitsSold, 1),
      companyDemand: companyDemands[localIdx]!,
      unmetDemand: unmetDemands[localIdx]!,
      unitCost: unitCostResults[localIdx]!.unitCost,
      variableCostPerUnit: unitCostResults[localIdx]!.variableCostPerUnit,
      fixedCostPerUnit: unitCostResults[localIdx]!.fixedCostPerUnit,
      revenue: pnlResults[localIdx]!.revenue,
      costOfGoodsSold: pnlResults[localIdx]!.costOfGoodsSold,
      grossProfit: pnlResults[localIdx]!.grossProfit,
      marketingExpense: pnlResults[localIdx]!.marketingExpense,
      rdExpense: pnlResults[localIdx]!.rdExpense,
      depreciation: pnlResults[localIdx]!.depreciation,
      holdingCost: pnlResults[localIdx]!.holdingCost,
      spoilageCost: pnlResults[localIdx]!.spoilageCost,
      productionOverhead: pnlResults[localIdx]!.productionOverhead,
      operatingProfit: pnlResults[localIdx]!.operatingProfit,
      interestExpense: pnlResults[localIdx]!.interestExpense,
      profitBeforeTax: pnlResults[localIdx]!.profitBeforeTax,
      tax: pnlResults[localIdx]!.tax,
      netProfit: pnlResults[localIdx]!.netProfit,
      newCash,
      newEquipment: newEquipments[localIdx]!,
      newCapacity: newCapacities[localIdx]!,
      newRdAccumulated: newRdAccumulateds[localIdx]!,
      newBrandReputation: newBrandReputations[localIdx]!,
      newRetainedEarnings: newRetainedEarnings[localIdx]!,
      newLoanBalance: cashResults[localIdx]!.newLoanBalance,
      newCreditRating: cashResults[localIdx]!.newCreditRating,
      cas: casValues[localIdx]!,
      priceScore: priceScores[localIdx]!,
      marketingScore: marketingScores[localIdx]!,
      qualityScore: qualityScores[localIdx]!,
      brandScore: brandScores[localIdx]!,
      mpi: mpiValues[localIdx]!,
      // Совместимость
      cogs: pnlResults[localIdx]!.costOfGoodsSold,
      fixedCosts: pnlResults[localIdx]!.depreciation,
      storageCost: pnlResults[localIdx]!.holdingCost,
      ebit: pnlResults[localIdx]!.operatingProfit,
    }

    updatedStates[globalIdx] = {
      ...companies[globalIdx]!,
      decisions: validatedDecisions[localIdx]!,
      cash: newCash,
      retainedEarnings: newRetainedEarnings[localIdx]!,
      loanBalance: cashResults[localIdx]!.newLoanBalance,
      creditRating: cashResults[localIdx]!.newCreditRating,
      inventory: finalInventories[localIdx]!,
      equipment: newEquipments[localIdx]!,
      capacity: newCapacities[localIdx]!,
      rdAccumulated: newRdAccumulateds[localIdx]!,
      brandReputation: newBrandReputations[localIdx]!,
      salesHistory: [...companies[globalIdx]!.salesHistory, finalUnitsSold[localIdx]!],
      // isBankrupt: true when overdraft (cash = -1000 and couldn't get credit)
      isBankrupt: newCash <= 0,
    }
  })

  return {
    period,
    results: allResults,
    marketState: { ...market, economicMultiplier },
    updatedCompanyStates: updatedStates,
    totalMarketDemand,
    avgPrice,
  }
}

// ─── Backward-compatible exports ─────────────────────────────────────────────

/** @deprecated Use simulatePeriod */
export function runPeriod(
  companies: CompanyState[],
  market: MarketState,
  ...args: unknown[]
): SimulationPeriodResult {
  void args
  return simulatePeriod(companies, market)
}

/** Backward-compatible applyEventEffectsToConfig (used by events.test.ts) */
export function applyEventEffectsToConfig(
  cfg: Record<string, unknown>,
  effects: {
    variableCostMult?: number
    fixedCostMult?: number
    storageCostMult?: number
    priceElasticityMod?: number
    marketingAlphaMod?: number
    rdBetaMod?: number
    demandMultiplier?: number
  }
): Record<string, unknown> {
  const result = { ...cfg }
  if (effects.variableCostMult !== undefined && typeof cfg.baseVariableCost === 'number') {
    result.baseVariableCost = cfg.baseVariableCost * effects.variableCostMult
  }
  if (effects.fixedCostMult !== undefined && typeof cfg.fixedCosts === 'number') {
    result.fixedCosts = cfg.fixedCosts * effects.fixedCostMult
  }
  if (effects.storageCostMult !== undefined && typeof cfg.storageCostPerUnit === 'number') {
    result.storageCostPerUnit = cfg.storageCostPerUnit * effects.storageCostMult
  }
  if (effects.priceElasticityMod !== undefined && typeof cfg.priceElasticity === 'number') {
    result.priceElasticity = Math.max(0.1, cfg.priceElasticity + effects.priceElasticityMod)
  }
  if (effects.marketingAlphaMod !== undefined && typeof cfg.marketingAlpha === 'number') {
    result.marketingAlpha = Math.max(0, cfg.marketingAlpha + effects.marketingAlphaMod)
  }
  if (effects.rdBetaMod !== undefined && typeof cfg.rdBeta === 'number') {
    result.rdBeta = Math.max(0, cfg.rdBeta + effects.rdBetaMod)
  }
  return result
}
