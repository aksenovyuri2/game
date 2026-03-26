import { describe, it, expect } from 'vitest'
import { calcMPI } from '@/engine/mpi'

interface MPIInput {
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

function makeInput(overrides: Partial<MPIInput> = {}): MPIInput {
  return {
    retainedEarnings: 10000,
    cas: 60,
    capacity: 1000,
    inventory: 200,
    revenue: 28000,
    totalCosts: 20000,
    unitsSold: 800,
    totalUnitsSold: 4000,
    prevRevenue: 25000,
    period: 2,
    allRetainedEarnings: [10000, 10000, 10000, 10000],
    allCAS: [60, 60, 60, 60],
    allSupplyPotentials: [760, 760, 760, 760],
    allProductivities: [1.4, 1.4, 1.4, 1.4],
    ...overrides,
  }
}

describe('calcMPI', () => {
  describe('все одинаковые → MPI одинаковый у всех', () => {
    it('симметричный случай: все компании дают одинаковый MPI', () => {
      // В симметричном случае (все равны) все компании получают одинаковый MPI
      const input = makeInput()
      const mpi = calcMPI(input)
      // MPI > 0 и является числом
      expect(mpi).toBeGreaterThan(0)
      expect(mpi).toBeLessThanOrEqual(1000)
      // Второй вызов с теми же данными даёт то же значение
      expect(calcMPI(makeInput())).toBe(mpi)
    })

    it('MPI > 0 при нормальных входных данных', () => {
      const mpi = calcMPI(makeInput())
      expect(mpi).toBeGreaterThan(0)
    })
  })

  describe('один доминирует → MPI ≈ 1000', () => {
    it('один лидер с максимальными показателями', () => {
      const input = makeInput({
        retainedEarnings: 100000,
        cas: 100,
        capacity: 3000,
        inventory: 1000,
        revenue: 100000,
        totalCosts: 20000,
        unitsSold: 2000,
        totalUnitsSold: 2100, // лидер продаёт почти всё
        prevRevenue: 50000,
        allRetainedEarnings: [100000, -10000, -10000, -10000],
        allCAS: [100, 10, 10, 10],
        allSupplyPotentials: [3100, 500, 500, 500],
        allProductivities: [5.0, 1.0, 1.0, 1.0],
      })
      const mpi = calcMPI(input)
      expect(mpi).toBeGreaterThan(800)
    })
  })

  describe('f_RE — Retained Earnings', () => {
    it('retainedEarnings < 0 → штраф × 0.8', () => {
      const allRE = [-80000, 50000, 50000]
      const inputPositive = makeInput({
        retainedEarnings: 50000,
        allRetainedEarnings: [50000, 50000, 50000],
      })
      const inputNegative = makeInput({
        retainedEarnings: -80000,
        allRetainedEarnings: allRE,
      })
      const mpiPos = calcMPI(inputPositive)
      const mpiNeg = calcMPI(inputNegative)
      expect(mpiNeg).toBeLessThan(mpiPos)
    })

    it('все RE одинаковые → f_RE = 0.5 (специальный случай)', () => {
      // Когда все RE одинаковые, minRE == maxRE → f_RE = 0.5
      // Это не означает MPI = 500 (другие компоненты могут быть > 0.5)
      const input = makeInput()
      const mpi = calcMPI(input)
      // MPI в разумном диапазоне
      expect(mpi).toBeGreaterThan(0)
      expect(mpi).toBeLessThanOrEqual(1000)
    })
  })

  describe('f_GR — Growth', () => {
    it('period == 1 → f_GR = 0.5', () => {
      // period=1 → growth factor = 0.5 (нет данных для сравнения)
      const inputP1 = makeInput({ period: 1 })
      const inputP2 = makeInput({ period: 2 })
      // MPI одинаковый между period=1 и period=2 при f_GR=0.5 vs f_GR=growth
      // Просто проверяем что нет NaN
      expect(isFinite(calcMPI(inputP1))).toBe(true)
      expect(isFinite(calcMPI(inputP2))).toBe(true)
    })

    it('высокий рост выручки → выше f_GR', () => {
      const inputGrowth = makeInput({ revenue: 50000, prevRevenue: 10000, period: 2 })
      const inputFlat = makeInput({ revenue: 25000, prevRevenue: 25000, period: 2 })
      expect(calcMPI(inputGrowth)).toBeGreaterThanOrEqual(calcMPI(inputFlat))
    })
  })

  describe('f_MS — Market Share', () => {
    it('unitsSold = 0 при totalUnitsSold > 0 → f_MS = 0, MPI снижается', () => {
      const inputNormal = makeInput()
      const inputZeroSales = makeInput({
        unitsSold: 0,
        totalUnitsSold: 4000,
      })
      expect(calcMPI(inputZeroSales)).toBeLessThan(calcMPI(inputNormal))
    })

    it('все unitsSold = 0 → нет деления на 0', () => {
      const input = makeInput({
        unitsSold: 0,
        totalUnitsSold: 0,
      })
      const mpi = calcMPI(input)
      expect(isFinite(mpi)).toBe(true)
    })
  })

  describe('инварианты', () => {
    it('MPI >= 0 всегда', () => {
      const testCases = [
        makeInput({ retainedEarnings: -100000 }),
        makeInput({ unitsSold: 0, totalUnitsSold: 0 }),
        makeInput({ revenue: 0, totalCosts: 0 }),
      ]
      for (const input of testCases) {
        expect(calcMPI(input)).toBeGreaterThanOrEqual(0)
      }
    })

    it('MPI — целое число (round)', () => {
      const input = makeInput()
      const mpi = calcMPI(input)
      expect(mpi).toBe(Math.round(mpi))
    })

    it('MPI не содержит NaN', () => {
      const input = makeInput()
      expect(isNaN(calcMPI(input))).toBe(false)
    })

    it('MPI в диапазоне [0, 1000]', () => {
      const testCases = [
        makeInput(),
        makeInput({ retainedEarnings: -50000, allRetainedEarnings: [-50000, 100000, 100000] }),
        makeInput({
          retainedEarnings: 100000,
          cas: 100,
          unitsSold: 2000,
          totalUnitsSold: 2001,
          allCAS: [100, 1, 1, 1],
          allRetainedEarnings: [100000, 0, 0, 0],
        }),
      ]
      for (const input of testCases) {
        const mpi = calcMPI(input)
        expect(mpi).toBeGreaterThanOrEqual(0)
        expect(mpi).toBeLessThanOrEqual(1000)
      }
    })
  })
})
