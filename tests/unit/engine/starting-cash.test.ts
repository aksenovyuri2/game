import { describe, it, expect } from 'vitest'
import { getStartingCash } from '../../../src/engine/types'
import { createInitialCompanyState } from '../../../src/engine/simulation'

describe('getStartingCash — пресеты стартового капитала', () => {
  it('low = 30000', () => {
    expect(getStartingCash('low')).toBe(30000)
  })

  it('medium = 50000', () => {
    expect(getStartingCash('medium')).toBe(50000)
  })

  it('high = 80000', () => {
    expect(getStartingCash('high')).toBe(80000)
  })
})

describe('createInitialCompanyState — startingCash parameter', () => {
  it('default (no startingCash) → 50000', () => {
    const state = createInitialCompanyState({ id: '1', name: 'Test' })
    expect(state.cash).toBe(50000)
  })

  it('startingCash=high → 80000', () => {
    const state = createInitialCompanyState({ id: '1', name: 'Test', startingCash: 'high' })
    expect(state.cash).toBe(80000)
  })

  it('startingCash=low → 30000', () => {
    const state = createInitialCompanyState({ id: '1', name: 'Test', startingCash: 'low' })
    expect(state.cash).toBe(30000)
  })
})
