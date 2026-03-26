import { describe, it, expect } from 'vitest'
import { runPeriod, createInitialCompanyState } from '@/engine/simulation'
import { DEFAULT_CONFIG, type CompanyState, type MarketState } from '@/engine/types'

function makeMarket(overrides?: Partial<MarketState>): MarketState {
  return {
    period: 1,
    totalPeriods: 12,
    scenario: 'stable',
    macroFactor: 1.0,
    baseMarketSize: 10000,
    ...overrides,
  }
}

function makeCompany(id: string, overrides?: Partial<CompanyState>): CompanyState {
  return {
    ...createInitialCompanyState({ id, name: `Company ${id}`, isHuman: id === 'player' }),
    ...overrides,
  }
}

describe('Bankruptcy detection', () => {
  it('should mark company as bankrupt when cash drops to 0 or below', () => {
    // Компания с очень маленьким кешем и высокими расходами
    const poorCompany = makeCompany('poor', {
      cash: 1000, // Очень мало денег
      equipment: 5000, // Малое оборудование → малый лимит кредита
      decisions: {
        price: 30, // Убыточная цена
        production: 2000,
        marketing: 50000,
        capitalInvestment: 50000,
        rd: 50000,
      },
    })
    const normalCompany = makeCompany('normal')

    const result = runPeriod([poorCompany, normalCompany], makeMarket(), DEFAULT_CONFIG)

    const poorState = result.updatedCompanyStates.find((c) => c.id === 'poor')!
    const normalState = result.updatedCompanyStates.find((c) => c.id === 'normal')!

    // Бедная компания должна стать банкротом (cash <= 0)
    expect(poorState.cash).toBeLessThanOrEqual(0)
    expect(poorState.isBankrupt).toBe(true)

    // Нормальная компания не банкрот
    expect(normalState.isBankrupt).toBe(false)
  })

  it('should set isBankrupt to false for companies with positive cash', () => {
    const company = makeCompany('rich', {
      cash: 500000,
      decisions: {
        price: 120,
        production: 500,
        marketing: 5000,
        capitalInvestment: 5000,
        rd: 2000,
      },
    })

    const result = runPeriod([company, makeCompany('other')], makeMarket(), DEFAULT_CONFIG)
    const richState = result.updatedCompanyStates.find((c) => c.id === 'rich')!

    expect(richState.cash).toBeGreaterThan(0)
    expect(richState.isBankrupt).toBe(false)
  })

  it('should exclude bankrupt companies from future period calculations', () => {
    // Банкрот не должен участвовать в расчёте рыночных долей
    const bankruptCompany = makeCompany('bankrupt', {
      isBankrupt: true,
      cash: -5000,
    })
    const activeCompany = makeCompany('active')

    const result = runPeriod([bankruptCompany, activeCompany], makeMarket(), DEFAULT_CONFIG)

    const bankruptResult = result.results.find((r) => r.companyId === 'bankrupt')!
    const activeResult = result.results.find((r) => r.companyId === 'active')!

    // Банкрот не продаёт и не получает долю рынка
    expect(bankruptResult.unitsSold).toBe(0)
    expect(bankruptResult.marketShare).toBe(0)
    expect(bankruptResult.revenue).toBe(0)

    // Активная компания получает весь рынок
    expect(activeResult.marketShare).toBe(1)
  })

  it('should keep bankrupt flag across periods', () => {
    const bankruptCompany = makeCompany('bankrupt', {
      isBankrupt: true,
      cash: -5000,
    })
    const activeCompany = makeCompany('active')

    const result = runPeriod([bankruptCompany, activeCompany], makeMarket(), DEFAULT_CONFIG)
    const bankruptState = result.updatedCompanyStates.find((c) => c.id === 'bankrupt')!

    expect(bankruptState.isBankrupt).toBe(true)
  })
})
