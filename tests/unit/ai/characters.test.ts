import { describe, it, expect } from 'vitest'
import { CautiousAI } from '../../../src/ai/cautious'
import { AggressiveAI } from '../../../src/ai/aggressive'
import { BalancedAI } from '../../../src/ai/balanced'
import { AdaptiveAI } from '../../../src/ai/adaptive'
import { DEFAULT_CONFIG, INITIAL_COMPANY_STATE } from '../../../src/engine/types'
import type { AIDecisionContext, DifficultyConfig } from '../../../src/ai/types'
import type { CompanyState } from '../../../src/engine/types'

const cfg = DEFAULT_CONFIG

const expertDifficulty: DifficultyConfig = {
  noiseLevel: 0.05,
  canAnalyzeCompetitors: true,
  canUseLongTermPlanning: true,
}

const masterDifficulty: DifficultyConfig = {
  noiseLevel: 0,
  canAnalyzeCompetitors: true,
  canUseLongTermPlanning: true,
}

const noviceDifficulty: DifficultyConfig = {
  noiseLevel: 0.3,
  canAnalyzeCompetitors: false,
  canUseLongTermPlanning: false,
}

function makeCompanyState(id: string, overrides: Partial<CompanyState> = {}): CompanyState {
  return {
    id,
    name: `AI ${id}`,
    isHuman: false,
    aiCharacter: 'balanced',
    cash: INITIAL_COMPANY_STATE.cash,
    retainedEarnings: INITIAL_COMPANY_STATE.retainedEarnings,
    inventory: INITIAL_COMPANY_STATE.inventory,
    equipment: INITIAL_COMPANY_STATE.equipment,
    rdAccumulated: INITIAL_COMPANY_STATE.rdAccumulated,
    decisions: { ...INITIAL_COMPANY_STATE.decisions },
    ...overrides,
  }
}

function makeCtx(
  id: string,
  difficulty: DifficultyConfig,
  overrides: Partial<AIDecisionContext> = {}
): AIDecisionContext {
  return {
    companyState: makeCompanyState(id),
    marketState: {
      period: 1,
      totalPeriods: 12,
      scenario: 'stable',
      macroFactor: 1.0,
      baseMarketSize: cfg.baseMarketSize,
    },
    cfg,
    ...overrides,
  }
}

// ─── Общие требования для всех ИИ ────────────────────────────────────────────

const characters = [
  { name: 'CautiousAI', create: (d: DifficultyConfig) => new CautiousAI(d) },
  { name: 'AggressiveAI', create: (d: DifficultyConfig) => new AggressiveAI(d) },
  { name: 'BalancedAI', create: (d: DifficultyConfig) => new BalancedAI(d) },
  { name: 'AdaptiveAI', create: (d: DifficultyConfig) => new AdaptiveAI(d) },
]

describe.each(characters)('$name — базовые требования', ({ create }) => {
  it('price ≥ 1', () => {
    const ai = create(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    expect(d.price).toBeGreaterThanOrEqual(1)
  })

  it('production ≥ 0', () => {
    const ai = create(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    expect(d.production).toBeGreaterThanOrEqual(0)
  })

  it('marketing ≥ 0', () => {
    const ai = create(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    expect(d.marketing).toBeGreaterThanOrEqual(0)
  })

  it('capitalInvestment ≥ 0', () => {
    const ai = create(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    expect(d.capitalInvestment).toBeGreaterThanOrEqual(0)
  })

  it('rd ≥ 0', () => {
    const ai = create(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    expect(d.rd).toBeGreaterThanOrEqual(0)
  })

  it('total cash spend ≤ 80% of cash', () => {
    const cash = INITIAL_COMPANY_STATE.cash
    const ai = create(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    const spend = d.marketing + d.capitalInvestment + d.rd
    expect(spend).toBeLessThanOrEqual(cash * 0.8 + 1)
  })

  it('returns decisions for all 12 periods without error', () => {
    const ai = create(noviceDifficulty)
    for (let period = 1; period <= 12; period++) {
      const ctx = makeCtx('ai1', noviceDifficulty, {
        marketState: {
          period,
          totalPeriods: 12,
          scenario: 'stable',
          macroFactor: 1.0,
          baseMarketSize: cfg.baseMarketSize,
        },
      })
      expect(() => ai.makeDecisions(ctx)).not.toThrow()
    }
  })
})

// ─── CautiousAI — специфичное поведение ──────────────────────────────────────

describe('CautiousAI', () => {
  it('price stays near basePrice (within ±20%)', () => {
    const ai = new CautiousAI(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    expect(d.price).toBeGreaterThanOrEqual(cfg.basePrice * 0.8)
    expect(d.price).toBeLessThanOrEqual(cfg.basePrice * 1.2)
  })

  it('production is conservative (< aggressive estimate)', () => {
    const cautious = new CautiousAI(masterDifficulty)
    const aggressive = new AggressiveAI(masterDifficulty)
    const ctx = makeCtx('ai1', masterDifficulty)
    expect(cautious.makeDecisions(ctx).production).toBeLessThan(
      aggressive.makeDecisions(ctx).production
    )
  })
})

// ─── AggressiveAI — специфичное поведение ────────────────────────────────────

describe('AggressiveAI', () => {
  it('price is lower than CautiousAI', () => {
    const cautious = new CautiousAI(masterDifficulty)
    const aggressive = new AggressiveAI(masterDifficulty)
    const ctx = makeCtx('ai1', masterDifficulty)
    expect(aggressive.makeDecisions(ctx).price).toBeLessThan(cautious.makeDecisions(ctx).price)
  })

  it('marketing is higher than CautiousAI', () => {
    const cautious = new CautiousAI(masterDifficulty)
    const aggressive = new AggressiveAI(masterDifficulty)
    const ctx = makeCtx('ai1', masterDifficulty)
    expect(aggressive.makeDecisions(ctx).marketing).toBeGreaterThan(
      cautious.makeDecisions(ctx).marketing
    )
  })
})

// ─── BalancedAI — специфичное поведение ──────────────────────────────────────

describe('BalancedAI', () => {
  it('marketing, capex, rd are all non-zero', () => {
    const ai = new BalancedAI(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    expect(d.marketing).toBeGreaterThan(0)
    expect(d.capitalInvestment).toBeGreaterThan(0)
    expect(d.rd).toBeGreaterThan(0)
  })
})

// ─── AdaptiveAI — специфичное поведение ──────────────────────────────────────

describe('AdaptiveAI', () => {
  it('without competitor history behaves like BalancedAI (no crash)', () => {
    const ai = new AdaptiveAI(expertDifficulty)
    expect(() => ai.makeDecisions(makeCtx('ai1', expertDifficulty))).not.toThrow()
  })

  it('responds to low competitor price by lowering own price', () => {
    const ai = new AdaptiveAI(masterDifficulty)

    const highCompetitorCtx = makeCtx('ai1', masterDifficulty, {
      competitorDecisions: [
        { price: 120, production: 1000, marketing: 10000, capitalInvestment: 0, rd: 0 },
      ],
    })
    const lowCompetitorCtx = makeCtx('ai1', masterDifficulty, {
      competitorDecisions: [
        { price: 70, production: 1000, marketing: 10000, capitalInvestment: 0, rd: 0 },
      ],
    })

    const dHigh = ai.makeDecisions(highCompetitorCtx)
    const dLow = ai.makeDecisions(lowCompetitorCtx)
    expect(dLow.price).toBeLessThan(dHigh.price)
  })

  it('increases marketing when losing market share', () => {
    const ai = new AdaptiveAI(masterDifficulty)

    const goodShareCtx = makeCtx('ai1', masterDifficulty, {
      history: [makeCompanyState('ai1', { decisions: { ...INITIAL_COMPANY_STATE.decisions } })],
    })
    // Simulate losing market share by injecting low-share history
    const poorCtx = makeCtx('ai1', masterDifficulty, {
      companyState: makeCompanyState('ai1', {
        retainedEarnings: -50000, // losing money
      }),
      history: [makeCompanyState('ai1', { retainedEarnings: -50000 })],
    })

    const dGood = ai.makeDecisions(goodShareCtx)
    const dPoor = ai.makeDecisions(poorCtx)
    expect(dPoor.marketing).toBeGreaterThanOrEqual(dGood.marketing)
  })
})

// ─── Difficulty — влияние уровня сложности ───────────────────────────────────

describe('Difficulty noise', () => {
  it('master (noise=0) always returns same decisions', () => {
    const ai = new BalancedAI(masterDifficulty)
    const ctx = makeCtx('ai1', masterDifficulty)
    const d1 = ai.makeDecisions(ctx)
    const d2 = ai.makeDecisions(ctx)
    expect(d1.price).toBe(d2.price)
    expect(d1.production).toBe(d2.production)
  })

  it('novice (noise=0.3) can produce different decisions across periods', () => {
    const ai = new BalancedAI(noviceDifficulty)
    const decisions = Array.from({ length: 12 }, (_, i) =>
      ai.makeDecisions(
        makeCtx('ai1', noviceDifficulty, {
          marketState: {
            period: i + 1,
            totalPeriods: 12,
            scenario: 'stable',
            macroFactor: 1.0,
            baseMarketSize: cfg.baseMarketSize,
          },
        })
      )
    )
    const prices = decisions.map((d) => d.price)
    const allSame = prices.every((p) => p === prices[0])
    expect(allSame).toBe(false)
  })
})
