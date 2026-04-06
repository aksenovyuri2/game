import { describe, it, expect } from 'vitest'
import { checkBreakthroughs, BREAKTHROUGHS } from '@/engine/breakthroughs'

describe('checkBreakthroughs', () => {
  it('returns empty array when no thresholds crossed', () => {
    const result = checkBreakthroughs(10000, 20000, [])
    expect(result).toEqual([])
  })

  it('detects first breakthrough at 25K', () => {
    const result = checkBreakthroughs(20000, 30000, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('rd-1')
    expect(result[0]!.threshold).toBe(25000)
  })

  it('detects second breakthrough at 50K', () => {
    const result = checkBreakthroughs(45000, 55000, ['rd-1'])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('rd-2')
  })

  it('detects multiple breakthroughs at once', () => {
    const result = checkBreakthroughs(20000, 55000, [])
    expect(result).toHaveLength(2)
    expect(result.map((b) => b.id)).toContain('rd-1')
    expect(result.map((b) => b.id)).toContain('rd-2')
  })

  it('does not return already achieved breakthroughs', () => {
    const result = checkBreakthroughs(20000, 30000, ['rd-1'])
    expect(result).toHaveLength(0)
  })

  it('detects all 4 breakthroughs at once from 0 to 100K+', () => {
    const result = checkBreakthroughs(0, 110000, [])
    expect(result).toHaveLength(4)
  })

  it('does not trigger if threshold is exactly equal to prevRd', () => {
    const result = checkBreakthroughs(25000, 30000, [])
    expect(result).toHaveLength(0)
  })

  it('triggers if newRd exactly equals threshold', () => {
    const result = checkBreakthroughs(20000, 25000, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('rd-1')
  })

  it('has 4 defined breakthroughs', () => {
    expect(BREAKTHROUGHS).toHaveLength(4)
  })

  it('breakthroughs are sorted by threshold ascending', () => {
    for (let i = 1; i < BREAKTHROUGHS.length; i++) {
      expect(BREAKTHROUGHS[i]!.threshold).toBeGreaterThan(BREAKTHROUGHS[i - 1]!.threshold)
    }
  })
})
