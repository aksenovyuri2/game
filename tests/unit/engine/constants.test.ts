import { describe, it, expect } from 'vitest'
import {
  BASE_CAPACITY,
  INITIAL_EQUIPMENT,
  DEPRECIATION_RATE,
  CAPACITY_SENSITIVITY,
  RD_DEPRECIATION,
  MAX_RD_EFFICIENCY,
  RD_EFFICIENCY_SCALE,
  BASE_FIXED_COSTS,
  MAINTENANCE_RATE,
  BASE_VARIABLE_COST,
  MAX_SCALE_DISCOUNT,
  OVERTIME_COST_MULTIPLIER,
  OVERTIME_FIXED_PENALTY,
  BASE_DEMAND_PER_COMPANY,
  W_PRICE,
  W_MKT,
  W_QUALITY,
  W_BRAND,
  ELASTICITY_EXPONENT,
  MKTG_MAX,
  MKTG_HALF,
  RELATIVE_MKT_WEIGHT,
  Q_MAX,
  Q_HALF,
  BRAND_RETENTION,
  BRAND_MKT_CAP,
  BRAND_QUALITY_CAP,
  DAMAGE_STOCKOUT,
  DAMAGE_OVERPRICE,
  DAMAGE_QUALITY_DROP,
  REDISTRIBUTION_RATE,
  SPOILAGE_RATE,
  HOLDING_COST_PER_UNIT,
  TAX_RATE,
  INTEREST_RATE,
  MAX_LOAN_RATIO,
  LOAN_BUFFER,
  REPAYMENT_THRESHOLD,
  W_RE,
  W_DP,
  W_SP,
  W_PR,
  W_MS,
  W_GR,
} from '@/engine/constants'

describe('constants', () => {
  describe('производство и оборудование', () => {
    it('BASE_CAPACITY = 1000', () => {
      expect(BASE_CAPACITY).toBe(1000)
    })
    it('INITIAL_EQUIPMENT = 100000', () => {
      expect(INITIAL_EQUIPMENT).toBe(100000)
    })
    it('DEPRECIATION_RATE = 0.08', () => {
      expect(DEPRECIATION_RATE).toBe(0.08)
    })
    it('CAPACITY_SENSITIVITY = 0.35', () => {
      expect(CAPACITY_SENSITIVITY).toBe(0.35)
    })
  })

  describe('R&D', () => {
    it('RD_DEPRECIATION = 0.05', () => {
      expect(RD_DEPRECIATION).toBe(0.05)
    })
    it('MAX_RD_EFFICIENCY = 0.30', () => {
      expect(MAX_RD_EFFICIENCY).toBe(0.3)
    })
    it('RD_EFFICIENCY_SCALE = 100000', () => {
      expect(RD_EFFICIENCY_SCALE).toBe(100000)
    })
  })

  describe('себестоимость', () => {
    it('BASE_FIXED_COSTS = 8000', () => {
      expect(BASE_FIXED_COSTS).toBe(8000)
    })
    it('MAINTENANCE_RATE = 0.02', () => {
      expect(MAINTENANCE_RATE).toBe(0.02)
    })
    it('BASE_VARIABLE_COST = 12.0', () => {
      expect(BASE_VARIABLE_COST).toBe(12.0)
    })
    it('MAX_SCALE_DISCOUNT = 0.20', () => {
      expect(MAX_SCALE_DISCOUNT).toBe(0.2)
    })
    it('OVERTIME_COST_MULTIPLIER = 0.50', () => {
      expect(OVERTIME_COST_MULTIPLIER).toBe(0.5)
    })
    it('OVERTIME_FIXED_PENALTY = 3.0', () => {
      expect(OVERTIME_FIXED_PENALTY).toBe(3.0)
    })
  })

  describe('спрос', () => {
    it('BASE_DEMAND_PER_COMPANY = 1000', () => {
      expect(BASE_DEMAND_PER_COMPANY).toBe(1000)
    })
  })

  describe('CAS веса — сумма = 1.0', () => {
    it('W_PRICE = 0.35', () => {
      expect(W_PRICE).toBe(0.35)
    })
    it('W_MKT = 0.25', () => {
      expect(W_MKT).toBe(0.25)
    })
    it('W_QUALITY = 0.20', () => {
      expect(W_QUALITY).toBe(0.2)
    })
    it('W_BRAND = 0.20', () => {
      expect(W_BRAND).toBe(0.2)
    })
    it('CAS weights sum to 1.0', () => {
      expect(W_PRICE + W_MKT + W_QUALITY + W_BRAND).toBeCloseTo(1.0, 10)
    })
  })

  describe('CAS параметры', () => {
    it('ELASTICITY_EXPONENT = 1.3', () => {
      expect(ELASTICITY_EXPONENT).toBe(1.3)
    })
    it('MKTG_MAX = 100.0', () => {
      expect(MKTG_MAX).toBe(100.0)
    })
    it('MKTG_HALF = 6000.0', () => {
      expect(MKTG_HALF).toBe(6000.0)
    })
    it('RELATIVE_MKT_WEIGHT = 10.0', () => {
      expect(RELATIVE_MKT_WEIGHT).toBe(10.0)
    })
    it('Q_MAX = 100.0', () => {
      expect(Q_MAX).toBe(100.0)
    })
    it('Q_HALF = 15000.0', () => {
      expect(Q_HALF).toBe(15000.0)
    })
  })

  describe('бренд', () => {
    it('BRAND_RETENTION = 0.90', () => {
      expect(BRAND_RETENTION).toBe(0.9)
    })
    it('BRAND_MKT_CAP = 3.0', () => {
      expect(BRAND_MKT_CAP).toBe(3.0)
    })
    it('BRAND_QUALITY_CAP = 2.0', () => {
      expect(BRAND_QUALITY_CAP).toBe(2.0)
    })
    it('DAMAGE_STOCKOUT = 15.0', () => {
      expect(DAMAGE_STOCKOUT).toBe(15.0)
    })
    it('DAMAGE_OVERPRICE = 5.0', () => {
      expect(DAMAGE_OVERPRICE).toBe(5.0)
    })
    it('DAMAGE_QUALITY_DROP = 3.0', () => {
      expect(DAMAGE_QUALITY_DROP).toBe(3.0)
    })
  })

  describe('продажи', () => {
    it('REDISTRIBUTION_RATE = 0.60', () => {
      expect(REDISTRIBUTION_RATE).toBe(0.6)
    })
    it('SPOILAGE_RATE = 0.05', () => {
      expect(SPOILAGE_RATE).toBe(0.05)
    })
    it('HOLDING_COST_PER_UNIT = 1.5', () => {
      expect(HOLDING_COST_PER_UNIT).toBe(1.5)
    })
  })

  describe('финансы', () => {
    it('TAX_RATE = 0.25', () => {
      expect(TAX_RATE).toBe(0.25)
    })
    it('INTEREST_RATE = 0.06', () => {
      expect(INTEREST_RATE).toBe(0.06)
    })
    it('MAX_LOAN_RATIO = 0.80', () => {
      expect(MAX_LOAN_RATIO).toBe(0.8)
    })
    it('LOAN_BUFFER = 5000', () => {
      expect(LOAN_BUFFER).toBe(5000)
    })
    it('REPAYMENT_THRESHOLD = 20000', () => {
      expect(REPAYMENT_THRESHOLD).toBe(20000)
    })
  })

  describe('MPI веса — сумма = 1.0', () => {
    it('W_RE = 0.30', () => {
      expect(W_RE).toBe(0.3)
    })
    it('W_DP = 0.15', () => {
      expect(W_DP).toBe(0.15)
    })
    it('W_SP = 0.15', () => {
      expect(W_SP).toBe(0.15)
    })
    it('W_PR = 0.10', () => {
      expect(W_PR).toBe(0.1)
    })
    it('W_MS = 0.15', () => {
      expect(W_MS).toBe(0.15)
    })
    it('W_GR = 0.15', () => {
      expect(W_GR).toBe(0.15)
    })
    it('MPI weights sum to 1.0', () => {
      expect(W_RE + W_DP + W_SP + W_PR + W_MS + W_GR).toBeCloseTo(1.0, 10)
    })
  })

  describe('типы', () => {
    it('все константы являются числами', () => {
      const constants = [
        BASE_CAPACITY,
        INITIAL_EQUIPMENT,
        DEPRECIATION_RATE,
        CAPACITY_SENSITIVITY,
        RD_DEPRECIATION,
        MAX_RD_EFFICIENCY,
        RD_EFFICIENCY_SCALE,
        BASE_FIXED_COSTS,
        MAINTENANCE_RATE,
        BASE_VARIABLE_COST,
        MAX_SCALE_DISCOUNT,
        OVERTIME_COST_MULTIPLIER,
        OVERTIME_FIXED_PENALTY,
        BASE_DEMAND_PER_COMPANY,
        W_PRICE,
        W_MKT,
        W_QUALITY,
        W_BRAND,
        ELASTICITY_EXPONENT,
        MKTG_MAX,
        MKTG_HALF,
        RELATIVE_MKT_WEIGHT,
        Q_MAX,
        Q_HALF,
        BRAND_RETENTION,
        BRAND_MKT_CAP,
        BRAND_QUALITY_CAP,
        DAMAGE_STOCKOUT,
        DAMAGE_OVERPRICE,
        DAMAGE_QUALITY_DROP,
        REDISTRIBUTION_RATE,
        SPOILAGE_RATE,
        HOLDING_COST_PER_UNIT,
        TAX_RATE,
        INTEREST_RATE,
        MAX_LOAN_RATIO,
        LOAN_BUFFER,
        REPAYMENT_THRESHOLD,
        W_RE,
        W_DP,
        W_SP,
        W_PR,
        W_MS,
        W_GR,
      ]
      for (const c of constants) {
        expect(typeof c).toBe('number')
        expect(isFinite(c)).toBe(true)
      }
    })
  })
})
