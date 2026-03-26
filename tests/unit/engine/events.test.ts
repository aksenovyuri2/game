import { describe, it, expect } from 'vitest'
import {
  EVENT_POOL,
  NEUTRAL_EFFECTS,
  combineEventEffects,
  tickEvents,
  generateNewEvents,
} from '../../../src/engine/events'
import { applyEventEffectsToConfig } from '../../../src/engine/simulation'
import { DEFAULT_CONFIG } from '../../../src/engine/types'
import type { ActiveEvent } from '../../../src/engine/types'

// ─── EVENT_POOL ──────────────────────────────────────────────────────────────

describe('EVENT_POOL', () => {
  it('contains at least 50 events', () => {
    expect(EVENT_POOL.length).toBeGreaterThanOrEqual(50)
  })

  it('all events have unique ids', () => {
    const ids = EVENT_POOL.map((e) => e.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all events have non-empty title and description', () => {
    for (const e of EVENT_POOL) {
      expect(e.title.length).toBeGreaterThan(0)
      expect(e.description.length).toBeGreaterThan(10)
    }
  })

  it('all events have valid duration (min ≤ max, both ≥ 1)', () => {
    for (const e of EVENT_POOL) {
      expect(e.minDuration).toBeGreaterThanOrEqual(1)
      expect(e.maxDuration).toBeGreaterThanOrEqual(e.minDuration)
    }
  })

  it('all events have at least one non-neutral effect', () => {
    for (const e of EVENT_POOL) {
      const keys = Object.keys(e.effects)
      expect(keys.length).toBeGreaterThan(0)
    }
  })

  it('covers all five categories', () => {
    const categories = new Set(EVENT_POOL.map((e) => e.category))
    expect(categories).toContain('economy')
    expect(categories).toContain('technology')
    expect(categories).toContain('social')
    expect(categories).toContain('regulation')
    expect(categories).toContain('industry')
  })
})

// ─── combineEventEffects ─────────────────────────────────────────────────────

describe('combineEventEffects', () => {
  it('returns neutral effects for empty array', () => {
    const result = combineEventEffects([])
    expect(result).toEqual(NEUTRAL_EFFECTS)
  })

  it('multiplies demand multipliers', () => {
    const events: ActiveEvent[] = [
      makeActive('a', { demandMultiplier: 0.8 }),
      makeActive('b', { demandMultiplier: 1.2 }),
    ]
    const result = combineEventEffects(events)
    expect(result.demandMultiplier).toBeCloseTo(0.96)
  })

  it('adds elasticity mods', () => {
    const events: ActiveEvent[] = [
      makeActive('a', { priceElasticityMod: 0.3 }),
      makeActive('b', { priceElasticityMod: -0.1 }),
    ]
    const result = combineEventEffects(events)
    expect(result.priceElasticityMod).toBeCloseTo(0.2)
  })

  it('multiplies cost multipliers', () => {
    const events: ActiveEvent[] = [
      makeActive('a', { variableCostMult: 1.2 }),
      makeActive('b', { variableCostMult: 1.1 }),
    ]
    const result = combineEventEffects(events)
    expect(result.variableCostMult).toBeCloseTo(1.32)
  })

  it('handles single event correctly', () => {
    const events: ActiveEvent[] = [makeActive('a', { demandMultiplier: 0.75, rdBetaMod: 0.15 })]
    const result = combineEventEffects(events)
    expect(result.demandMultiplier).toBeCloseTo(0.75)
    expect(result.rdBetaMod).toBeCloseTo(0.15)
    expect(result.marketingAlphaMod).toBe(0)
  })
})

// ─── tickEvents ──────────────────────────────────────────────────────────────

describe('tickEvents', () => {
  it('decrements remainingPeriods by 1', () => {
    const events: ActiveEvent[] = [makeActive('a', {}, 3)]
    const result = tickEvents(events)
    expect(result[0]?.remainingPeriods).toBe(2)
  })

  it('removes events with remainingPeriods reaching 0', () => {
    const events: ActiveEvent[] = [makeActive('a', {}, 1), makeActive('b', {}, 3)]
    const result = tickEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0]?.eventId).toBe('b')
  })

  it('returns empty array when all events expire', () => {
    const events: ActiveEvent[] = [makeActive('a', {}, 1), makeActive('b', {}, 1)]
    const result = tickEvents(events)
    expect(result).toHaveLength(0)
  })
})

// ─── generateNewEvents ───────────────────────────────────────────────────────

describe('generateNewEvents', () => {
  it('is deterministic for same seed and period', () => {
    const a = generateNewEvents([], 42, 1)
    const b = generateNewEvents([], 42, 1)
    expect(a.map((e) => e.eventId)).toEqual(b.map((e) => e.eventId))
  })

  it('returns 0-2 events', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const events = generateNewEvents([], seed, 1)
      expect(events.length).toBeGreaterThanOrEqual(0)
      expect(events.length).toBeLessThanOrEqual(2)
    }
  })

  it('does not return duplicate event ids within same generation', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const events = generateNewEvents([], seed, 1)
      const ids = events.map((e) => e.eventId)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('does not return events already active', () => {
    const active: ActiveEvent[] = [makeActive('econ-crisis', {}, 2)]
    for (let seed = 1; seed <= 50; seed++) {
      const events = generateNewEvents(active, seed, 1)
      const ids = events.map((e) => e.eventId)
      expect(ids).not.toContain('econ-crisis')
    }
  })

  it('generates events with valid duration within event minDuration-maxDuration', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const events = generateNewEvents([], seed, 1)
      for (const event of events) {
        const def = EVENT_POOL.find((e) => e.id === event.eventId)
        if (def) {
          expect(event.remainingPeriods).toBeGreaterThanOrEqual(def.minDuration)
          expect(event.remainingPeriods).toBeLessThanOrEqual(def.maxDuration)
        }
      }
    }
  })

  it('produces different events for different seeds', () => {
    const allIds = new Set<string>()
    for (let seed = 1; seed <= 20; seed++) {
      const events = generateNewEvents([], seed, 1)
      events.forEach((e) => allIds.add(e.eventId))
    }
    // With 20 different seeds, we should get variety
    expect(allIds.size).toBeGreaterThan(3)
  })
})

// ─── applyEventEffectsToConfig ───────────────────────────────────────────────

describe('applyEventEffectsToConfig', () => {
  it('neutral effects do not change config', () => {
    const result = applyEventEffectsToConfig(DEFAULT_CONFIG, NEUTRAL_EFFECTS)
    expect(result.fixedCosts).toBe(DEFAULT_CONFIG.fixedCosts)
    expect(result.baseVariableCost).toBe(DEFAULT_CONFIG.baseVariableCost)
    expect(result.priceElasticity).toBe(DEFAULT_CONFIG.priceElasticity)
  })

  it('applies cost multipliers', () => {
    const effects = { ...NEUTRAL_EFFECTS, variableCostMult: 1.2, fixedCostMult: 0.9 }
    const result = applyEventEffectsToConfig(DEFAULT_CONFIG, effects)
    expect(result.baseVariableCost).toBeCloseTo(DEFAULT_CONFIG.baseVariableCost * 1.2)
    expect(result.fixedCosts).toBeCloseTo(DEFAULT_CONFIG.fixedCosts * 0.9)
  })

  it('applies additive mods to elasticity', () => {
    const effects = { ...NEUTRAL_EFFECTS, priceElasticityMod: 0.5 }
    const result = applyEventEffectsToConfig(DEFAULT_CONFIG, effects)
    expect(result.priceElasticity).toBeCloseTo(DEFAULT_CONFIG.priceElasticity + 0.5)
  })

  it('clamps priceElasticity to minimum 0.1', () => {
    const effects = { ...NEUTRAL_EFFECTS, priceElasticityMod: -10 }
    const result = applyEventEffectsToConfig(DEFAULT_CONFIG, effects)
    expect(result.priceElasticity).toBe(0.1)
  })

  it('clamps marketingAlpha to minimum 0', () => {
    const effects = { ...NEUTRAL_EFFECTS, marketingAlphaMod: -10 }
    const result = applyEventEffectsToConfig(DEFAULT_CONFIG, effects)
    expect(result.marketingAlpha).toBe(0)
  })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeActive(
  eventId: string,
  effects: Partial<import('../../../src/engine/types').EventEffects>,
  remainingPeriods: number = 2
): ActiveEvent {
  return {
    eventId,
    title: `Test ${eventId}`,
    description: 'Test event',
    effects,
    remainingPeriods,
    startPeriod: 1,
  }
}
