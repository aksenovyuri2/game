import { describe, it, expect } from 'vitest'
import { analyzeGame } from '@/engine/analytics'
import type {
  SimulationPeriodResult,
  PeriodResult,
  CompanyState,
  MarketState,
} from '@/engine/types'

function makePeriodResult(companyId: string, overrides: Partial<PeriodResult> = {}): PeriodResult {
  return {
    companyId,
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

function makeCompanyState(
  id: string,
  name: string,
  overrides: Partial<CompanyState> = {}
): CompanyState {
  return {
    id,
    name,
    isAI: id !== 'player',
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

function makeMarketState(period: number): MarketState {
  return {
    period,
    totalPeriods: 12,
    scenario: 'stable',
    economicMultiplier: 1.0,
    numberOfCompanies: 2,
  }
}

function makeSimPeriod(
  period: number,
  results: PeriodResult[],
  companies: CompanyState[]
): SimulationPeriodResult {
  return {
    period,
    results,
    marketState: makeMarketState(period),
    updatedCompanyStates: companies,
    totalMarketDemand: 2000,
    avgPrice: 35,
  }
}

describe('analyzeGame', () => {
  it('returns empty analysis for empty history', () => {
    const result = analyzeGame([], 'player')
    expect(result.insights).toEqual([])
    expect(result.profiles).toEqual([])
    expect(result.turningPoint).toBeNull()
  })

  it('identifies best and worst periods', () => {
    const companies = [makeCompanyState('player', 'Player Co'), makeCompanyState('ai-0', 'AI Corp')]

    const history: SimulationPeriodResult[] = [
      makeSimPeriod(
        1,
        [
          makePeriodResult('player', { netProfit: 5000, mpi: 600 }),
          makePeriodResult('ai-0', { netProfit: 3000, mpi: 400 }),
        ],
        companies
      ),
      makeSimPeriod(
        2,
        [
          makePeriodResult('player', { netProfit: -2000, mpi: 300 }),
          makePeriodResult('ai-0', { netProfit: 4000, mpi: 500 }),
        ],
        companies
      ),
      makeSimPeriod(
        3,
        [
          makePeriodResult('player', { netProfit: 8000, mpi: 700 }),
          makePeriodResult('ai-0', { netProfit: 2000, mpi: 350 }),
        ],
        companies
      ),
    ]

    const result = analyzeGame(history, 'player')
    expect(result.bestPeriod).toBe(3)
    expect(result.worstPeriod).toBe(2)
  })

  it('builds strategy profiles for all companies', () => {
    const companies = [
      makeCompanyState('player', 'Player Co', {
        decisions: { price: 40, production: 600, marketing: 5000, capex: 3000, rd: 1000 },
      }),
      makeCompanyState('ai-0', 'AI Corp', {
        decisions: { price: 30, production: 400, marketing: 2000, capex: 8000, rd: 4000 },
      }),
    ]

    const history: SimulationPeriodResult[] = [
      makeSimPeriod(
        1,
        [makePeriodResult('player', { mpi: 500 }), makePeriodResult('ai-0', { mpi: 450 })],
        companies
      ),
    ]

    const result = analyzeGame(history, 'player')
    expect(result.profiles).toHaveLength(2)

    const playerProfile = result.profiles.find((p) => p.companyId === 'player')
    expect(playerProfile).toBeDefined()
    expect(playerProfile!.avgMarketing).toBe(5000)
    expect(playerProfile!.companyName).toBe('Player Co')
  })

  it('includes strategy trend insight', () => {
    const companies = [
      makeCompanyState('player', 'Player Co', {
        decisions: { price: 35, production: 500, marketing: 10000, capex: 2000, rd: 1000 },
      }),
      makeCompanyState('ai-0', 'AI Corp'),
    ]

    const history: SimulationPeriodResult[] = [
      makeSimPeriod(
        1,
        [makePeriodResult('player', { mpi: 500 }), makePeriodResult('ai-0', { mpi: 450 })],
        companies
      ),
    ]

    const result = analyzeGame(history, 'player')
    expect(result.insights.some((i) => i.type === 'trend')).toBe(true)
  })

  it('detects turning point', () => {
    const companies = [makeCompanyState('player', 'Player Co'), makeCompanyState('ai-0', 'AI Corp')]

    const history: SimulationPeriodResult[] = [
      makeSimPeriod(
        1,
        [makePeriodResult('player', { mpi: 600 }), makePeriodResult('ai-0', { mpi: 400 })],
        companies
      ),
      makeSimPeriod(
        2,
        [makePeriodResult('player', { mpi: 400 }), makePeriodResult('ai-0', { mpi: 700 })],
        companies
      ),
      makeSimPeriod(
        3,
        [makePeriodResult('player', { mpi: 350 }), makePeriodResult('ai-0', { mpi: 750 })],
        companies
      ),
    ]

    const result = analyzeGame(history, 'player')
    // AI-0 won, first led in period 2
    expect(result.turningPoint).toBe(2)
  })
})
