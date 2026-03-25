import type { PeriodResult } from './types'

export interface MPIFactors {
  retainedEarnings: number // [0, 100]
  demandPotential: number // [0, 100]
  supplyPotential: number // [0, 100]
  productivity: number // [0, 100]
  marketShare: number // [0, 100]
  growth: number // [0, 100]
}

const WEIGHTS: Record<keyof MPIFactors, number> = {
  retainedEarnings: 0.35,
  demandPotential: 0.15,
  supplyPotential: 0.15,
  productivity: 0.15,
  marketShare: 0.1,
  growth: 0.1,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Рассчитывает 6 факторов MPI, каждый в диапазоне [0, 100].
 */
export function calcMPIFactors(result: PeriodResult): MPIFactors {
  const retainedEarnings = clamp((result.newRetainedEarnings / 500000) * 100, 0, 100)

  // demandPotential: насколько компания привлекательна для рынка
  const marketingNorm = clamp(result.marketingExpense / 50000, 0, 3)
  const rdNorm = clamp(result.newRdAccumulated / 100000, 0, 3)
  const demandPotential = clamp(
    (1 + 0.3 * Math.sqrt(marketingNorm)) * (1 + 0.2 * Math.sqrt(rdNorm)) * 40,
    0,
    100
  )

  // supplyPotential: производственный потенциал
  const supplyPotential = clamp((result.newEquipment / 200000) * 100, 0, 100)

  // productivity: эффективность (revenue / totalCosts ratio)
  const totalCosts =
    result.cogs +
    result.fixedCosts +
    result.marketingExpense +
    result.rdExpense +
    result.depreciation +
    result.storageCost
  const productivity =
    totalCosts > 0 ? clamp((result.revenue / (result.revenue + totalCosts)) * 200, 0, 100) : 0

  // marketShare: доля рынка в %
  const marketShare = clamp(result.marketShare * 100, 0, 100)

  // growth: прибыльность периода
  const growth = clamp(50 + (result.netProfit / 50000) * 50, 0, 100)

  return {
    retainedEarnings,
    demandPotential,
    supplyPotential,
    productivity,
    marketShare,
    growth,
  }
}

/**
 * Рассчитывает итоговый MPI [0, 100] как взвешенную сумму 6 факторов.
 */
export function calcMPI(result: PeriodResult): number {
  const factors = calcMPIFactors(result)
  const mpi = (Object.keys(WEIGHTS) as (keyof MPIFactors)[]).reduce(
    (sum, key) => sum + factors[key] * WEIGHTS[key],
    0
  )
  return clamp(mpi, 0, 100)
}
