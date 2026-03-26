import { describe, it, expect } from 'vitest'
import { validateDecisions, DEFAULT_DECISIONS } from '@/engine/validation'
import type { Decisions } from '@/engine/types'

const BASE_CAPACITY = 1000

describe('validateDecisions', () => {
  describe('значения по умолчанию', () => {
    it('возвращает DEFAULT_DECISIONS при пустом вводе на период 1', () => {
      const result = validateDecisions({}, BASE_CAPACITY, undefined, 1)
      expect(result.price).toBe(35)
      expect(result.production).toBe(800)
      expect(result.marketing).toBe(5000)
      expect(result.capex).toBe(5000)
      expect(result.rd).toBe(3000)
    })

    it('возвращает решения предыдущего периода при пустом вводе на период > 1', () => {
      const prev: Decisions = { price: 40, production: 900, marketing: 6000, capex: 4000, rd: 2000 }
      const result = validateDecisions({}, BASE_CAPACITY, prev, 2)
      expect(result.price).toBe(40) // prev price
      expect(result.production).toBe(900)
      expect(result.marketing).toBe(6000)
      expect(result.capex).toBe(4000)
      expect(result.rd).toBe(2000)
    })
  })

  describe('clamp price [10, 100]', () => {
    it('price < 10 → 10', () => {
      const result = validateDecisions({ price: 5 }, BASE_CAPACITY, undefined, 1)
      expect(result.price).toBe(10)
    })

    it('price > 100 → 100', () => {
      const result = validateDecisions({ price: 150 }, BASE_CAPACITY, undefined, 1)
      expect(result.price).toBe(100)
    })

    it('price = 50 → 50 (без изменений)', () => {
      const result = validateDecisions({ price: 50 }, BASE_CAPACITY, undefined, 1)
      expect(result.price).toBe(50)
    })

    it('price отрицательный → 10', () => {
      const result = validateDecisions({ price: -5 }, BASE_CAPACITY, undefined, 1)
      expect(result.price).toBe(10)
    })
  })

  describe('production clamp и округление', () => {
    it('production > capacity × 1.5 → floor(capacity × 1.5)', () => {
      const result = validateDecisions({ production: 2000 }, BASE_CAPACITY, undefined, 1)
      expect(result.production).toBe(1500) // floor(1000 × 1.5) = 1500
    })

    it('production обрезается по capacity 800: max = floor(800 × 1.5) = 1200', () => {
      const result = validateDecisions({ production: 1400 }, 800, undefined, 1)
      expect(result.production).toBe(1200)
    })

    it('production < 0 → 0', () => {
      const result = validateDecisions({ production: -100 }, BASE_CAPACITY, undefined, 1)
      expect(result.production).toBe(0)
    })

    it('production округляется до шага 10: 155 → 160', () => {
      const result = validateDecisions({ production: 155 }, BASE_CAPACITY, undefined, 1)
      expect(result.production).toBe(160)
    })

    it('production округляется до шага 10: 153 → 150', () => {
      const result = validateDecisions({ production: 153 }, BASE_CAPACITY, undefined, 1)
      expect(result.production).toBe(150)
    })
  })

  describe('marketing clamp и округление', () => {
    it('marketing < 0 → 0', () => {
      const result = validateDecisions({ marketing: -100 }, BASE_CAPACITY, undefined, 1)
      expect(result.marketing).toBe(0)
    })

    it('marketing > 30000 → 30000', () => {
      const result = validateDecisions({ marketing: 50000 }, BASE_CAPACITY, undefined, 1)
      expect(result.marketing).toBe(30000)
    })

    it('marketing округляется до шага 100: 15432 → 15400', () => {
      const result = validateDecisions({ marketing: 15432 }, BASE_CAPACITY, undefined, 1)
      expect(result.marketing).toBe(15400)
    })

    it('marketing округляется до шага 100: 15450 → 15500', () => {
      const result = validateDecisions({ marketing: 15450 }, BASE_CAPACITY, undefined, 1)
      expect(result.marketing).toBe(15500)
    })
  })

  describe('capex clamp и округление', () => {
    it('capex < 0 → 0', () => {
      const result = validateDecisions({ capex: -100 }, BASE_CAPACITY, undefined, 1)
      expect(result.capex).toBe(0)
    })

    it('capex > 40000 → 40000', () => {
      const result = validateDecisions({ capex: 60000 }, BASE_CAPACITY, undefined, 1)
      expect(result.capex).toBe(40000)
    })

    it('capex округляется до шага 100: 5050 → 5100', () => {
      const result = validateDecisions({ capex: 5050 }, BASE_CAPACITY, undefined, 1)
      expect(result.capex).toBe(5100)
    })
  })

  describe('rd clamp и округление', () => {
    it('rd < 0 → 0', () => {
      const result = validateDecisions({ rd: -500 }, BASE_CAPACITY, undefined, 1)
      expect(result.rd).toBe(0)
    })

    it('rd > 30000 → 30000', () => {
      const result = validateDecisions({ rd: 40000 }, BASE_CAPACITY, undefined, 1)
      expect(result.rd).toBe(30000)
    })

    it('rd округляется до шага 100: 3333 → 3300', () => {
      const result = validateDecisions({ rd: 3333 }, BASE_CAPACITY, undefined, 1)
      expect(result.rd).toBe(3300)
    })
  })

  describe('инварианты результата', () => {
    it('результат всегда содержит все 5 полей', () => {
      const result = validateDecisions({}, BASE_CAPACITY, undefined, 1)
      expect(result).toHaveProperty('price')
      expect(result).toHaveProperty('production')
      expect(result).toHaveProperty('marketing')
      expect(result).toHaveProperty('capex')
      expect(result).toHaveProperty('rd')
    })

    it('производство кратно 10', () => {
      const result = validateDecisions({ production: 777 }, BASE_CAPACITY, undefined, 1)
      expect(result.production % 10).toBe(0)
    })

    it('маркетинг кратен 100', () => {
      const result = validateDecisions({ marketing: 7777 }, BASE_CAPACITY, undefined, 1)
      expect(result.marketing % 100).toBe(0)
    })
  })

  describe('DEFAULT_DECISIONS', () => {
    it('содержит корректные значения по умолчанию', () => {
      expect(DEFAULT_DECISIONS.price).toBe(35)
      expect(DEFAULT_DECISIONS.production).toBe(800)
      expect(DEFAULT_DECISIONS.marketing).toBe(5000)
      expect(DEFAULT_DECISIONS.capex).toBe(5000)
      expect(DEFAULT_DECISIONS.rd).toBe(3000)
    })
  })
})
