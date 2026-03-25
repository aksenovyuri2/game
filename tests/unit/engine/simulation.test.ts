import { describe, it, expect } from 'vitest'
import { runPeriod, createInitialCompanyState } from '../../../src/engine/simulation'
import { DEFAULT_CONFIG, INITIAL_COMPANY_STATE } from '../../../src/engine/types'
import type { CompanyState, MarketState } from '../../../src/engine/types'

const cfg = DEFAULT_CONFIG

function makeCompany(id: string, overrides: Partial<CompanyState> = {}): CompanyState {
  return {
    id,
    name: `Company ${id}`,
    isHuman: id === 'player',
    cash: INITIAL_COMPANY_STATE.cash,
    retainedEarnings: INITIAL_COMPANY_STATE.retainedEarnings,
    inventory: INITIAL_COMPANY_STATE.inventory,
    equipment: INITIAL_COMPANY_STATE.equipment,
    rdAccumulated: INITIAL_COMPANY_STATE.rdAccumulated,
    decisions: { ...INITIAL_COMPANY_STATE.decisions },
    ...overrides,
  }
}

function makeMarketState(period = 1): MarketState {
  return {
    period,
    totalPeriods: cfg.totalPeriods,
    scenario: 'stable',
    macroFactor: 1.0,
    baseMarketSize: cfg.baseMarketSize,
  }
}

// ─── createInitialCompanyState ───────────────────────────────────────────────

describe('createInitialCompanyState', () => {
  it('creates company with correct initial values', () => {
    const company = createInitialCompanyState({ id: 'p1', name: 'Test', isHuman: true })
    expect(company.cash).toBe(INITIAL_COMPANY_STATE.cash)
    expect(company.equipment).toBe(INITIAL_COMPANY_STATE.equipment)
    expect(company.inventory).toBe(0)
    expect(company.rdAccumulated).toBe(0)
  })

  it('sets isHuman flag correctly', () => {
    const human = createInitialCompanyState({ id: 'h', name: 'Human', isHuman: true })
    const ai = createInitialCompanyState({
      id: 'ai',
      name: 'AI',
      isHuman: false,
      aiCharacter: 'balanced',
    })
    expect(human.isHuman).toBe(true)
    expect(ai.isHuman).toBe(false)
    expect(ai.aiCharacter).toBe('balanced')
  })
})

// ─── runPeriod ───────────────────────────────────────────────────────────────

describe('runPeriod', () => {
  it('returns a result for each company', () => {
    const companies = [makeCompany('p1'), makeCompany('ai1'), makeCompany('ai2')]
    const market = makeMarketState()
    const result = runPeriod(companies, market, cfg)
    expect(result.results).toHaveLength(3)
    expect(result.updatedCompanyStates).toHaveLength(3)
  })

  it('market shares sum to 1', () => {
    const companies = [makeCompany('p1'), makeCompany('ai1'), makeCompany('ai2')]
    const market = makeMarketState()
    const result = runPeriod(companies, market, cfg)
    const totalShare = result.results.reduce((sum, r) => sum + r.marketShare, 0)
    expect(totalShare).toBeCloseTo(1)
  })

  it('revenue = price * unitsSold', () => {
    const price = 110
    const company = makeCompany('p1', {
      decisions: { price, production: 2000, marketing: 10000, capitalInvestment: 0, rd: 0 },
    })
    const market = makeMarketState()
    const result = runPeriod([company, makeCompany('ai1')], market, cfg)
    const playerResult = result.results.find((r) => r.companyId === 'p1')!
    expect(playerResult.revenue).toBeCloseTo(price * playerResult.unitsSold)
  })

  it('end inventory is never negative', () => {
    const company = makeCompany('p1', {
      decisions: { price: 100, production: 0, marketing: 10000, capitalInvestment: 0, rd: 0 },
    })
    const market = makeMarketState()
    const result = runPeriod([company, makeCompany('ai1')], market, cfg)
    result.results.forEach((r) => {
      expect(r.endInventory).toBeGreaterThanOrEqual(0)
    })
  })

  it('tax is zero when EBIT is negative', () => {
    // Force loss: zero production but high expenses
    const company = makeCompany('p1', {
      decisions: { price: 100, production: 0, marketing: 100000, capitalInvestment: 0, rd: 0 },
    })
    const market = makeMarketState()
    const result = runPeriod([company, makeCompany('ai1')], market, cfg)
    const playerResult = result.results.find((r) => r.companyId === 'p1')!
    if (playerResult.ebit < 0) {
      expect(playerResult.tax).toBe(0)
    }
  })

  it('updated company states carry forward new values', () => {
    const companies = [makeCompany('p1'), makeCompany('ai1')]
    const market = makeMarketState()
    const result = runPeriod(companies, market, cfg)
    const updatedP1 = result.updatedCompanyStates.find((c) => c.id === 'p1')!
    const p1Result = result.results.find((r) => r.companyId === 'p1')!
    expect(updatedP1.cash).toBeCloseTo(p1Result.newCash)
    expect(updatedP1.equipment).toBeCloseTo(p1Result.newEquipment)
    expect(updatedP1.inventory).toBe(p1Result.endInventory)
    expect(updatedP1.retainedEarnings).toBeCloseTo(p1Result.newRetainedEarnings)
  })

  it('12-period simulation completes without NaN', () => {
    let companies = [makeCompany('player'), makeCompany('ai1'), makeCompany('ai2')]
    for (let period = 1; period <= 12; period++) {
      const market = makeMarketState(period)
      const result = runPeriod(companies, market, cfg)
      result.results.forEach((r) => {
        expect(isNaN(r.mpi)).toBe(false)
        expect(isNaN(r.netProfit)).toBe(false)
        expect(isNaN(r.revenue)).toBe(false)
      })
      companies = result.updatedCompanyStates
    }
  })

  it('mpi is in [0, 100] for all companies', () => {
    const companies = [makeCompany('p1'), makeCompany('ai1'), makeCompany('ai2')]
    const market = makeMarketState()
    const result = runPeriod(companies, market, cfg)
    result.results.forEach((r) => {
      expect(r.mpi).toBeGreaterThanOrEqual(0)
      expect(r.mpi).toBeLessThanOrEqual(100)
    })
  })
})
