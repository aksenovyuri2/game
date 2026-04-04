import { describe, it, expect } from 'vitest'
import { calcPnL, calcCashAndLoans } from '@/engine/financial'

describe('calcPnL', () => {
  const baseParams = {
    unitsSold: 800,
    unitCost: 20,
    price: 35,
    marketing: 5000,
    rd: 3000,
    equipment: 100000,
    production: 800,
    capacity: 1000,
    loanBalance: 0,
    creditRating: 1.0,
    endInventory: 200,
    spoilage: 10,
  }

  it('revenue = unitsSold × price', () => {
    const result = calcPnL(baseParams)
    expect(result.revenue).toBe(800 * 35) // 28000
  })

  it('costOfGoodsSold = unitsSold × unitCost', () => {
    const result = calcPnL(baseParams)
    expect(result.costOfGoodsSold).toBe(800 * 20) // 16000
  })

  it('grossProfit = revenue - costOfGoodsSold', () => {
    const result = calcPnL(baseParams)
    expect(result.grossProfit).toBe(result.revenue - result.costOfGoodsSold)
  })

  it('depreciation = equipment × DEPRECIATION_RATE', () => {
    const result = calcPnL(baseParams)
    expect(result.depreciation).toBeCloseTo(100000 * 0.08, 5) // 8000
  })

  it('holdingCost = endInventory × HOLDING_COST_PER_UNIT', () => {
    const result = calcPnL(baseParams)
    expect(result.holdingCost).toBeCloseTo(200 * 1.5, 5) // 300
  })

  it('spoilageCost = spoilage × unitCost × 0.5', () => {
    const result = calcPnL(baseParams)
    expect(result.spoilageCost).toBeCloseTo(10 * 20 * 0.5, 5) // 100
  })

  it('productionOverhead = 0 при production <= capacity', () => {
    const result = calcPnL(baseParams)
    expect(result.productionOverhead).toBe(0)
  })

  it('productionOverhead > 0 при production > capacity', () => {
    const result = calcPnL({ ...baseParams, production: 1100, capacity: 1000 })
    // (1100 - 1000) × 3.0 = 300
    expect(result.productionOverhead).toBeCloseTo(300, 5)
  })

  it('tax = 0 при отрицательном profitBeforeTax', () => {
    // unitsSold=0 → много расходов, нет дохода
    const result = calcPnL({ ...baseParams, unitsSold: 0, endInventory: 800 })
    expect(result.tax).toBe(0)
    expect(result.profitBeforeTax).toBeLessThan(0)
  })

  it('tax = profitBeforeTax × 0.25 при положительной прибыли', () => {
    const result = calcPnL(baseParams)
    if (result.profitBeforeTax > 0) {
      expect(result.tax).toBeCloseTo(result.profitBeforeTax * 0.25, 5)
    }
  })

  it('netProfit = profitBeforeTax - tax', () => {
    const result = calcPnL(baseParams)
    expect(result.netProfit).toBeCloseTo(result.profitBeforeTax - result.tax, 5)
  })

  it('interestExpense = 0 при loanBalance = 0', () => {
    const result = calcPnL(baseParams)
    expect(result.interestExpense).toBe(0)
  })

  it('interestExpense = loanBalance × INTEREST_RATE × creditRating', () => {
    const result = calcPnL({ ...baseParams, loanBalance: 10000, creditRating: 1.0 })
    expect(result.interestExpense).toBeCloseTo(10000 * 0.06 * 1.0, 5) // 600
  })

  it('плохой кредитный рейтинг увеличивает процентные расходы', () => {
    const r1 = calcPnL({ ...baseParams, loanBalance: 10000, creditRating: 1.0 })
    const r2 = calcPnL({ ...baseParams, loanBalance: 10000, creditRating: 2.0 })
    expect(r2.interestExpense).toBeGreaterThan(r1.interestExpense)
  })

  describe('краевые случаи', () => {
    it('unitsSold=0: revenue=0, COGS=0, но расходы остаются → убыток', () => {
      const result = calcPnL({ ...baseParams, unitsSold: 0, endInventory: 800 })
      expect(result.revenue).toBe(0)
      expect(result.costOfGoodsSold).toBe(0)
      expect(result.netProfit).toBeLessThan(0)
    })

    it('все расходы=0, production=0 → убыток из-за fixedCosts', () => {
      const result = calcPnL({
        unitsSold: 0,
        unitCost: 20,
        price: 0,
        marketing: 0,
        rd: 0,
        equipment: 100000,
        production: 0,
        capacity: 1000,
        loanBalance: 0,
        creditRating: 1.0,
        endInventory: 0,
        spoilage: 0,
      })
      expect(result.netProfit).toBeLessThan(0)
    })

    it('глубокий убыток не вызывает NaN/Infinity', () => {
      const result = calcPnL({
        unitsSold: 0,
        unitCost: 100,
        price: 10,
        marketing: 30000,
        rd: 30000,
        equipment: 100000,
        production: 0,
        capacity: 1000,
        loanBalance: 100000,
        creditRating: 2.0,
        endInventory: 0,
        spoilage: 0,
      })
      expect(isFinite(result.netProfit)).toBe(true)
      expect(isNaN(result.netProfit)).toBe(false)
    })
  })
})

describe('calcCashAndLoans (прямой метод из ТЗ)', () => {
  const baseCashParams = {
    prevCash: 50000,
    revenue: 35000,
    productionCost: 16000, // production × unitCost
    marketing: 5000,
    rd: 3000,
    capex: 5000,
    tax: 0,
    interestExpense: 0,
    holdingCost: 300,
    spoilageCost: 100,
    productionOverhead: 0,
    prevLoanBalance: 0,
    prevCreditRating: 1.0,
    equipment: 100000,
  }

  it('cash = prevCash + revenue - totalOutflow (прямой метод)', () => {
    const result = calcCashAndLoans(baseCashParams)
    // totalOutflow = 16000+5000+3000+5000+0+0+300+100+0 = 29400
    // cash = 50000 + 35000 - 29400 = 55600
    expect(result.newCash).toBeCloseTo(50000 + 35000 - 29400, 5)
    expect(result.newLoanBalance).toBe(0)
    expect(result.newCreditRating).toBe(1.0)
  })

  it('автокредит: cash < 0 → выдаётся кредит', () => {
    const result = calcCashAndLoans({
      ...baseCashParams,
      prevCash: 5000,
      revenue: 0, // нет дохода
    })
    // totalOutflow = 29400, cash = 5000 + 0 - 29400 = -24400 < 0
    expect(result.newCash).toBeGreaterThanOrEqual(0)
    expect(result.newLoanBalance).toBeGreaterThan(0)
  })

  it('кредитный рейтинг ухудшается при взятии кредита', () => {
    const result = calcCashAndLoans({
      ...baseCashParams,
      prevCash: 5000,
      revenue: 0,
    })
    expect(result.newCreditRating).toBeGreaterThan(1.0)
  })

  it('кредитный рейтинг не превышает 2.0', () => {
    const result = calcCashAndLoans({
      ...baseCashParams,
      prevCash: 5000,
      revenue: 0,
      prevCreditRating: 1.9,
      prevLoanBalance: 50000,
    })
    expect(result.newCreditRating).toBeLessThanOrEqual(2.0)
  })

  it('автопогашение: cash > 20000 и loanBalance > 0 → погашение', () => {
    const result = calcCashAndLoans({
      ...baseCashParams,
      prevCash: 30000,
      revenue: 40000,
      prevLoanBalance: 10000,
      prevCreditRating: 1.2,
    })
    // cash = 30000 + 40000 - 29400 = 40600 > 20000 → repayment
    expect(result.newLoanBalance).toBeLessThan(10000)
  })

  it('погашение кредита улучшает creditRating', () => {
    const result = calcCashAndLoans({
      ...baseCashParams,
      prevCash: 100000,
      prevLoanBalance: 5000,
      prevCreditRating: 1.4,
    })
    if (result.newLoanBalance === 0) {
      expect(result.newCreditRating).toBeLessThan(1.4)
      expect(result.newCreditRating).toBeGreaterThanOrEqual(1.0)
    }
  })

  it('creditRating не падает ниже 1.0', () => {
    const result = calcCashAndLoans({
      ...baseCashParams,
      prevCash: 200000,
      prevLoanBalance: 1000,
      prevCreditRating: 1.0,
    })
    expect(result.newCreditRating).toBeGreaterThanOrEqual(1.0)
  })

  it('овердрафт: equipment≈0, нет залога → cash = -1000', () => {
    const result = calcCashAndLoans({
      ...baseCashParams,
      prevCash: 1000,
      revenue: 0,
      equipment: 100, // очень мало залога
    })
    // maxLoan = 100 × 0.8 = 80, loanNeeded >> 80 → овердрафт
    expect(result.newCash).toBe(-1000)
  })

  it('newCash и newLoanBalance — конечные числа', () => {
    const result = calcCashAndLoans({
      ...baseCashParams,
      prevCash: 50000,
      revenue: 0,
      productionCost: 100000,
      prevLoanBalance: 20000,
      prevCreditRating: 1.5,
      equipment: 80000,
    })
    expect(isFinite(result.newCash)).toBe(true)
    expect(isFinite(result.newLoanBalance)).toBe(true)
  })
})
