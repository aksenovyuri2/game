import {
  TAX_RATE,
  INTEREST_RATE,
  MAX_LOAN_RATIO,
  LOAN_BUFFER,
  REPAYMENT_THRESHOLD,
  DEPRECIATION_RATE,
  HOLDING_COST_PER_UNIT,
  OVERTIME_FIXED_PENALTY,
} from './constants'

export interface PnLParams {
  unitsSold: number
  unitCost: number
  price: number
  marketing: number
  rd: number
  equipment: number
  production: number
  capacity: number
  loanBalance: number
  creditRating: number
  endInventory: number
  spoilage: number
}

export interface PnLResult {
  revenue: number
  costOfGoodsSold: number
  grossProfit: number
  marketingExpense: number
  rdExpense: number
  depreciation: number
  holdingCost: number
  spoilageCost: number
  productionOverhead: number
  operatingProfit: number
  interestExpense: number
  profitBeforeTax: number
  tax: number
  netProfit: number
}

export interface CashLoanParams {
  prevCash: number
  netProfit: number
  capex: number
  prevLoanBalance: number
  prevCreditRating: number
  equipment: number
}

export interface CashLoanResult {
  newCash: number
  newLoanBalance: number
  newCreditRating: number
  newRetainedEarnings?: number
}

/**
 * Рассчитывает P&L (отчёт о прибылях и убытках).
 * Этап 7 конвейера.
 */
export function calcPnL(params: PnLParams): PnLResult {
  const {
    unitsSold,
    unitCost,
    price,
    marketing,
    rd,
    equipment,
    production,
    capacity,
    loanBalance,
    creditRating,
    endInventory,
    spoilage,
  } = params

  const revenue = unitsSold * price
  const costOfGoodsSold = unitsSold * unitCost
  const grossProfit = revenue - costOfGoodsSold

  const marketingExpense = marketing
  const rdExpense = rd
  const depreciation = equipment * DEPRECIATION_RATE
  const holdingCost = endInventory * HOLDING_COST_PER_UNIT
  const spoilageCost = spoilage * unitCost * 0.5

  const productionOverhead =
    production > capacity ? (production - capacity) * OVERTIME_FIXED_PENALTY : 0

  const operatingProfit =
    grossProfit -
    marketingExpense -
    rdExpense -
    depreciation -
    holdingCost -
    spoilageCost -
    productionOverhead

  const interestExpense = loanBalance > 0 ? loanBalance * INTEREST_RATE * creditRating : 0

  const profitBeforeTax = operatingProfit - interestExpense
  const tax = profitBeforeTax > 0 ? profitBeforeTax * TAX_RATE : 0
  const netProfit = profitBeforeTax - tax

  return {
    revenue,
    costOfGoodsSold,
    grossProfit,
    marketingExpense,
    rdExpense,
    depreciation,
    holdingCost,
    spoilageCost,
    productionOverhead,
    operatingProfit,
    interestExpense,
    profitBeforeTax,
    tax,
    netProfit,
  }
}

/**
 * Рассчитывает денежный поток, автокредит и автопогашение.
 * Этап 8 конвейера.
 */
export function calcCashAndLoans(params: CashLoanParams): CashLoanResult {
  const { prevCash, netProfit, capex, prevLoanBalance, prevCreditRating, equipment } = params

  let cash = prevCash + netProfit - capex
  let loanBalance = prevLoanBalance
  let creditRating = prevCreditRating

  // Автокредит
  if (cash < 0) {
    const loanNeeded = Math.abs(cash) + LOAN_BUFFER
    const maxLoan = MAX_LOAN_RATIO * equipment
    const availableCredit = Math.max(0, maxLoan - loanBalance)
    const actualLoan = Math.min(loanNeeded, availableCredit)

    if (actualLoan < loanNeeded) {
      // Нет достаточного залога → овердрафт
      cash = -1000
    } else {
      loanBalance += actualLoan
      cash += actualLoan
    }

    // Ухудшение кредитного рейтинга
    creditRating = Math.min(2.0, creditRating + 0.1)
  }

  // Автопогашение
  if (cash > REPAYMENT_THRESHOLD && loanBalance > 0) {
    const repayment = Math.max(0, Math.min(loanBalance, cash - 15000))
    loanBalance -= repayment
    cash -= repayment

    if (loanBalance === 0) {
      // Восстановление рейтинга при полном погашении
      creditRating = Math.max(1.0, creditRating - 0.2)
    }
  }

  return {
    newCash: cash,
    newLoanBalance: loanBalance,
    newCreditRating: creditRating,
  }
}
