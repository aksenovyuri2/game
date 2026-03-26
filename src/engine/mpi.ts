import { W_RE, W_DP, W_SP, W_PR, W_MS, W_GR } from './constants'

export interface MPIInput {
  retainedEarnings: number
  cas: number
  capacity: number
  inventory: number
  revenue: number
  totalCosts: number
  unitsSold: number
  totalUnitsSold: number
  prevRevenue: number
  period: number
  allRetainedEarnings: number[]
  allCAS: number[]
  allSupplyPotentials: number[]
  allProductivities: number[]
}

/**
 * Рассчитывает MPI (Management Performance Index) для одной компании.
 * Шкала: 0–1000.
 * Этап 10 конвейера.
 */
export function calcMPI(input: MPIInput): number {
  const {
    retainedEarnings,
    cas,
    capacity,
    inventory,
    revenue,
    totalCosts,
    unitsSold,
    totalUnitsSold,
    prevRevenue,
    period,
    allRetainedEarnings,
    allCAS,
    allSupplyPotentials,
    allProductivities,
  } = input

  // f_RE — Retained Earnings
  const maxRE = Math.max(...allRetainedEarnings)
  const minRE = Math.min(...allRetainedEarnings)
  let f_RE: number
  if (maxRE === minRE) {
    f_RE = 0.5
  } else {
    f_RE = (retainedEarnings - minRE) / (maxRE - minRE)
  }
  if (retainedEarnings < 0) {
    f_RE *= 0.8
  }

  // f_DP — Demand Potential (CAS relative)
  const maxCAS = Math.max(...allCAS)
  const f_DP = maxCAS > 0 ? cas / maxCAS : 0.5

  // f_SP — Supply Potential
  const supplyPotential = capacity * 0.7 + inventory * 0.3
  const maxSP = Math.max(...allSupplyPotentials)
  const f_SP = maxSP > 0 ? supplyPotential / maxSP : 0.5

  // f_PR — Productivity
  const productivity = revenue / Math.max(totalCosts, 1)
  const maxPR = Math.max(...allProductivities, 0.01)
  const f_PR = productivity / maxPR

  // f_MS — Market Share
  const f_MS = totalUnitsSold > 0 ? unitsSold / totalUnitsSold : 0

  // f_GR — Growth
  let f_GR: number
  if (period === 1) {
    f_GR = 0.5
  } else {
    const growthRatio = revenue / Math.max(prevRevenue, 1)
    f_GR = Math.max(0, Math.min(1, (growthRatio - 0.5) / 1.5))
  }

  const rawMPI = W_RE * f_RE + W_DP * f_DP + W_SP * f_SP + W_PR * f_PR + W_MS * f_MS + W_GR * f_GR

  return Math.max(0, Math.round(rawMPI * 1000))
}
