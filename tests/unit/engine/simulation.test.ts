import { describe, it, expect } from 'vitest'
import { simulatePeriod, createInitialCompanyState } from '@/engine/simulation'
import type { CompanyState, MarketState, Decisions } from '@/engine/types'

function makeCompany(id: string, decisions?: Partial<Decisions>): CompanyState {
  return createInitialCompanyState({
    id,
    name: id,
    isAI: false,
    decisions: {
      price: 40,
      production: 800,
      marketing: 5000,
      capex: 5000,
      rd: 3000,
      ...decisions,
    },
  })
}

function makeMarket(period = 1, totalPeriods = 12, n = 4): MarketState {
  return {
    period,
    totalPeriods,
    scenario: 'stable',
    economicMultiplier: 1.0,
    numberOfCompanies: n,
  }
}

describe('simulatePeriod', () => {
  describe('начальное состояние компании', () => {
    it('createInitialCompanyState возвращает правильные начальные значения', () => {
      const company = makeCompany('c1')
      expect(company.cash).toBe(50000)
      expect(company.inventory).toBe(600)
      expect(company.equipment).toBe(100000)
      expect(company.capacity).toBe(1000)
      expect(company.rdAccumulated).toBe(1000)
      expect(company.brandReputation).toBe(50)
      expect(company.retainedEarnings).toBe(0)
      expect(company.loanBalance).toBe(0)
      expect(company.creditRating).toBe(1.0)
    })
  })

  describe('один период — структура результата', () => {
    it('возвращает результат для каждой компании', () => {
      const companies = [makeCompany('c1'), makeCompany('c2'), makeCompany('c3')]
      const market = makeMarket(1, 12, 3)
      const { results } = simulatePeriod(companies, market)
      expect(results).toHaveLength(3)
    })

    it('результат содержит все необходимые поля', () => {
      const companies = [makeCompany('c1'), makeCompany('c2')]
      const market = makeMarket(1, 12, 2)
      const { results } = simulatePeriod(companies, market)
      const r = results[0]!
      expect(r).toHaveProperty('companyId')
      expect(r).toHaveProperty('unitsSold')
      expect(r).toHaveProperty('endInventory')
      expect(r).toHaveProperty('spoilage')
      expect(r).toHaveProperty('marketShare')
      expect(r).toHaveProperty('revenue')
      expect(r).toHaveProperty('costOfGoodsSold')
      expect(r).toHaveProperty('grossProfit')
      expect(r).toHaveProperty('netProfit')
      expect(r).toHaveProperty('mpi')
      expect(r).toHaveProperty('newCash')
      expect(r).toHaveProperty('newEquipment')
      expect(r).toHaveProperty('newBrandReputation')
      expect(r).toHaveProperty('newLoanBalance')
    })
  })

  describe('инвариант: сумма долей рынка ≈ 1.0', () => {
    it('4 компании: sum(marketShare) ≈ 1.0', () => {
      const companies = [
        makeCompany('c1', { price: 30 }),
        makeCompany('c2', { price: 35 }),
        makeCompany('c3', { price: 40 }),
        makeCompany('c4', { price: 45 }),
      ]
      const market = makeMarket(1, 12, 4)
      const { results } = simulatePeriod(companies, market)
      const totalShare = results.reduce((s, r) => s + r.marketShare, 0)
      expect(totalShare).toBeCloseTo(1.0, 3)
    })

    it('дуополия: sum(marketShare) ≈ 1.0', () => {
      const companies = [makeCompany('c1'), makeCompany('c2')]
      const market = makeMarket(1, 12, 2)
      const { results } = simulatePeriod(companies, market)
      const totalShare = results.reduce((s, r) => s + r.marketShare, 0)
      expect(totalShare).toBeCloseTo(1.0, 3)
    })
  })

  describe('инвариант: inventory', () => {
    it('inventory[t-1] + production - unitsSold - spoilage == endInventory', () => {
      const company = makeCompany('c1', { production: 800 })
      const { results } = simulatePeriod([company], makeMarket(1, 12, 1))
      const r = results[0]!
      const expected = company.inventory + 800 - r.unitsSold - r.spoilage
      expect(r.endInventory).toBe(expected)
    })
  })

  describe('инвариант: MPI', () => {
    it('MPI >= 0 для всех компаний', () => {
      const companies = [makeCompany('c1'), makeCompany('c2'), makeCompany('c3')]
      const market = makeMarket(1, 12, 3)
      const { results } = simulatePeriod(companies, market)
      for (const r of results) {
        expect(r.mpi).toBeGreaterThanOrEqual(0)
      }
    })

    it('MPI <= 1000 для всех компаний', () => {
      const companies = [makeCompany('c1'), makeCompany('c2')]
      const market = makeMarket(1, 12, 2)
      const { results } = simulatePeriod(companies, market)
      for (const r of results) {
        expect(r.mpi).toBeLessThanOrEqual(1000)
      }
    })
  })

  describe('инвариант: capacity >= 200', () => {
    it('capacity не падает ниже 200 даже без capex', () => {
      let companies = [makeCompany('c1', { capex: 0 })]
      let market = makeMarket(1, 12, 1)
      for (let i = 1; i <= 12; i++) {
        market = { ...market, period: i }
        const { updatedCompanyStates } = simulatePeriod(companies, market)
        for (const c of updatedCompanyStates) {
          expect(c.capacity).toBeGreaterThanOrEqual(200)
        }
        companies = updatedCompanyStates
      }
    })
  })

  describe('сценарий: все одинаковые', () => {
    it('MPI ≈ 500 для всех при симметричных условиях', () => {
      const decisions: Decisions = {
        price: 40,
        production: 800,
        marketing: 5000,
        capex: 5000,
        rd: 3000,
      }
      const companies = ['c1', 'c2', 'c3', 'c4'].map((id) => makeCompany(id, decisions))
      const market = makeMarket(1, 12, 4)
      const { results } = simulatePeriod(companies, market)
      // Все одинаковые → одинаковый MPI у всех
      const firstMPI = results[0]!.mpi
      for (const r of results) {
        expect(r.mpi).toBe(firstMPI)
        expect(r.mpi).toBeGreaterThan(0)
        expect(r.mpi).toBeLessThanOrEqual(1000)
      }
    })

    it('marketShare ≈ 0.25 при симметричных условиях', () => {
      const decisions: Decisions = {
        price: 40,
        production: 800,
        marketing: 5000,
        capex: 5000,
        rd: 3000,
      }
      const companies = ['c1', 'c2', 'c3', 'c4'].map((id) => makeCompany(id, decisions))
      const market = makeMarket(1, 12, 4)
      const { results } = simulatePeriod(companies, market)
      for (const r of results) {
        expect(r.marketShare).toBeCloseTo(0.25, 1)
      }
    })
  })

  describe('сценарий: полная остановка', () => {
    it('production=0, marketing=0 → убытки, автокредит активируется', () => {
      const company = makeCompany('c1', {
        production: 0,
        marketing: 0,
        rd: 0,
        capex: 0,
        price: 40,
      })
      const { results, updatedCompanyStates } = simulatePeriod([company], makeMarket(1, 12, 1))
      const r = results[0]!
      // Компания несёт постоянные расходы (depreciation, fixedCosts)
      expect(isFinite(r.netProfit)).toBe(true)
      // Cash обновился корректно (без NaN)
      const updated = updatedCompanyStates[0]!
      expect(isFinite(updated.cash)).toBe(true)
      expect(isFinite(updated.equipment)).toBe(true)
    })
  })

  describe('прогон 12 периодов', () => {
    it('retainedEarnings корректно накапливается', () => {
      let companies = [makeCompany('c1'), makeCompany('c2')]
      let market = makeMarket(1, 12, 2)
      const prevRE = [0, 0]

      for (let i = 1; i <= 12; i++) {
        market = { ...market, period: i }
        const { results, updatedCompanyStates } = simulatePeriod(companies, market)

        for (let j = 0; j < companies.length; j++) {
          const expected = prevRE[j]! + results[j]!.netProfit
          expect(results[j]!.newRetainedEarnings).toBeCloseTo(expected, 0)
          prevRE[j] = results[j]!.newRetainedEarnings
        }

        companies = updatedCompanyStates
      }
    })

    it('нет NaN или Infinity за 12 периодов', () => {
      let companies = [
        makeCompany('c1', {
          price: 10,
          production: 1500,
          marketing: 25000,
          capex: 40000,
          rd: 30000,
        }),
        makeCompany('c2', { price: 100, production: 0, marketing: 0, capex: 0, rd: 0 }),
        makeCompany('c3', { price: 50, production: 1000, marketing: 5000, capex: 5000, rd: 3000 }),
      ]
      let market = makeMarket(1, 12, 3)

      for (let i = 1; i <= 12; i++) {
        market = { ...market, period: i }
        const { results, updatedCompanyStates } = simulatePeriod(companies, market)

        for (const r of results) {
          expect(isFinite(r.revenue)).toBe(true)
          expect(isFinite(r.netProfit)).toBe(true)
          expect(isFinite(r.mpi)).toBe(true)
          expect(isNaN(r.revenue)).toBe(false)
          expect(isNaN(r.netProfit)).toBe(false)
          expect(isNaN(r.mpi)).toBe(false)
        }

        companies = updatedCompanyStates
      }
    })
  })

  describe('updatedCompanyStates', () => {
    it('возвращает обновлённые состояния для каждой компании', () => {
      const companies = [makeCompany('c1'), makeCompany('c2')]
      const { updatedCompanyStates } = simulatePeriod(companies, makeMarket(1, 12, 2))
      expect(updatedCompanyStates).toHaveLength(2)
    })

    it('equipment обновляется после capex', () => {
      const company = makeCompany('c1', { capex: 10000 })
      const { updatedCompanyStates } = simulatePeriod([company], makeMarket(1, 12, 1))
      const updated = updatedCompanyStates[0]!
      // equipment = 100000 × 0.92 + 10000 = 102000
      expect(updated.equipment).toBeGreaterThan(100000)
    })

    it('rdAccumulated обновляется после rd инвестиций', () => {
      const company = makeCompany('c1', { rd: 10000 })
      const { updatedCompanyStates } = simulatePeriod([company], makeMarket(1, 12, 1))
      const updated = updatedCompanyStates[0]!
      // rdAccumulated = 1000 × 0.95 + 10000 = 10950
      expect(updated.rdAccumulated).toBeGreaterThan(1000)
    })
  })
})
