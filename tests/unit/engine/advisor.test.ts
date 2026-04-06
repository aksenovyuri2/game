import { describe, it, expect } from 'vitest'
import { generateAdvisorTips } from '@/engine/advisor'
import type { PeriodResult, CompanyState } from '@/engine/types'

function makePeriodResult(overrides: Partial<PeriodResult> = {}): PeriodResult {
  return {
    companyId: 'player',
    unitsSold: 500,
    endInventory: 100,
    spoilage: 0,
    marketShare: 0.25,
    companyDemand: 500,
    unmetDemand: 0,
    unitCost: 20,
    variableCostPerUnit: 12,
    fixedCostPerUnit: 8,
    revenue: 17500,
    costOfGoodsSold: 10000,
    grossProfit: 7500,
    marketingExpense: 3000,
    rdExpense: 2000,
    depreciation: 8000,
    holdingCost: 150,
    spoilageCost: 0,
    productionOverhead: 0,
    operatingProfit: 4350,
    interestExpense: 0,
    profitBeforeTax: 4350,
    tax: 1087,
    netProfit: 3263,
    newCash: 40000,
    newEquipment: 92000,
    newCapacity: 920,
    newRdAccumulated: 3000,
    newBrandReputation: 52,
    newRetainedEarnings: 3263,
    newLoanBalance: 0,
    newCreditRating: 1.0,
    cas: 60,
    priceScore: 0.5,
    marketingScore: 0.5,
    qualityScore: 0.5,
    brandScore: 0.5,
    mpi: 500,
    ...overrides,
  }
}

function makeCompanyState(overrides: Partial<CompanyState> = {}): CompanyState {
  return {
    id: 'player',
    name: 'Test Co',
    isAI: false,
    isHuman: true,
    decisions: { price: 35, production: 500, marketing: 3000, capex: 5000, rd: 2000 },
    cash: 40000,
    retainedEarnings: 3263,
    loanBalance: 0,
    creditRating: 1.0,
    inventory: 100,
    equipment: 92000,
    capacity: 920,
    rdAccumulated: 3000,
    brandReputation: 52,
    salesHistory: [500],
    isBankrupt: false,
    ...overrides,
  }
}

describe('generateAdvisorTips', () => {
  it('returns tips sorted by priority descending', () => {
    const result = makePeriodResult()
    const state = makeCompanyState()
    const tips = generateAdvisorTips(result, state, [result])
    expect(tips.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < tips.length; i++) {
      expect(tips[i]!.priority).toBeLessThanOrEqual(tips[i - 1]!.priority)
    }
  })

  it('returns at most 3 tips', () => {
    const result = makePeriodResult({
      marketShare: 0.05,
      endInventory: 2000,
      newCash: 5000,
      newLoanBalance: 10000,
    })
    const state = makeCompanyState({
      decisions: { price: 80, production: 500, marketing: 3000, capex: 5000, rd: 2000 },
    })
    const tips = generateAdvisorTips(result, state, [result])
    expect(tips.length).toBeLessThanOrEqual(3)
  })

  it('warns about market share drop', () => {
    const prev = makePeriodResult({ marketShare: 0.35 })
    const current = makePeriodResult({ marketShare: 0.2 })
    const state = makeCompanyState()
    const tips = generateAdvisorTips(current, state, [current], prev)
    expect(tips.some((t) => t.category === 'market' && t.type === 'warning')).toBe(true)
  })

  it('celebrates market share gain', () => {
    const prev = makePeriodResult({ marketShare: 0.15 })
    const current = makePeriodResult({ marketShare: 0.3 })
    const state = makeCompanyState()
    const tips = generateAdvisorTips(current, state, [current], prev)
    expect(tips.some((t) => t.category === 'market' && t.type === 'success')).toBe(true)
  })

  it('warns about inventory overstock', () => {
    const result = makePeriodResult({ endInventory: 1500, unitsSold: 500 })
    const state = makeCompanyState()
    const tips = generateAdvisorTips(result, state, [result])
    expect(tips.some((t) => t.category === 'production' && t.type === 'warning')).toBe(true)
  })

  it('warns about unmet demand', () => {
    const result = makePeriodResult({ unmetDemand: 300, unitsSold: 500 })
    const state = makeCompanyState()
    const tips = generateAdvisorTips(result, state, [result])
    expect(tips.some((t) => t.category === 'production' && t.type === 'warning')).toBe(true)
  })

  it('warns about low cash', () => {
    const result = makePeriodResult({ newCash: 3000 })
    const state = makeCompanyState({
      decisions: { price: 35, production: 500, marketing: 3000, capex: 5000, rd: 2000 },
    })
    const tips = generateAdvisorTips(result, state, [result])
    expect(tips.some((t) => t.category === 'finance' && t.type === 'warning')).toBe(true)
  })

  it('celebrates profit recovery', () => {
    const prev = makePeriodResult({ netProfit: -5000 })
    const current = makePeriodResult({ netProfit: 2000 })
    const state = makeCompanyState()
    const tips = generateAdvisorTips(current, state, [current], prev)
    expect(tips.some((t) => t.category === 'finance' && t.type === 'success')).toBe(true)
  })

  it('gives first period guidance when no prev result', () => {
    const result = makePeriodResult()
    const state = makeCompanyState()
    const tips = generateAdvisorTips(result, state, [result])
    expect(tips.some((t) => t.type === 'info')).toBe(true)
  })

  it('warns about loan', () => {
    const result = makePeriodResult({ newLoanBalance: 15000, newCreditRating: 1.5 })
    const state = makeCompanyState()
    const tips = generateAdvisorTips(result, state, [result])
    expect(tips.some((t) => t.category === 'finance' && t.message.includes('кредит'))).toBe(true)
  })

  it('detects R&D milestone', () => {
    const prev = makePeriodResult({ newRdAccumulated: 24000 })
    const current = makePeriodResult({ newRdAccumulated: 26000 })
    const state = makeCompanyState()
    const tips = generateAdvisorTips(current, state, [current], prev)
    expect(tips.some((t) => t.category === 'rd' && t.type === 'success')).toBe(true)
  })
})
