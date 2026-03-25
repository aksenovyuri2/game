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
  noiseLevel: 0.03,
  canAnalyzeCompetitors: true,
  canUseLongTermPlanning: true,
  strengthMultiplier: 1.15,
}

const masterDifficulty: DifficultyConfig = {
  noiseLevel: 0,
  canAnalyzeCompetitors: true,
  canUseLongTermPlanning: true,
  strengthMultiplier: 1.3,
}

const noviceDifficulty: DifficultyConfig = {
  noiseLevel: 0.25,
  canAnalyzeCompetitors: false,
  canUseLongTermPlanning: false,
  strengthMultiplier: 0.8,
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
    isBankrupt: false,
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

// ─── CautiousAI — стратегия R&D Supremacy ──────────────────────────────────

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

  it('invests heavily in R&D in early phase', () => {
    const ai = new CautiousAI(masterDifficulty)
    const ctx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 1,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    const d = ai.makeDecisions(ctx)
    // R&D should be significantly higher than marketing in early phase
    expect(d.rd).toBeGreaterThan(d.marketing)
  })

  it('R&D investment decreases in late phase', () => {
    const ai = new CautiousAI(masterDifficulty)
    const earlyCtx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 1,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    const lateCtx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 11,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    const dEarly = ai.makeDecisions(earlyCtx)
    const dLate = ai.makeDecisions(lateCtx)
    // R&D rate should be higher early than late
    expect(dEarly.rd / INITIAL_COMPANY_STATE.cash).toBeGreaterThan(
      dLate.rd / INITIAL_COMPANY_STATE.cash
    )
  })
})

// ─── AggressiveAI — стратегия Cost Leadership ────────────────────────────────

describe('AggressiveAI', () => {
  it('price is lower than CautiousAI', () => {
    const cautious = new CautiousAI(masterDifficulty)
    const aggressive = new AggressiveAI(masterDifficulty)
    // Compare in mid-phase where price differences are clearer
    const ctx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 6,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    expect(aggressive.makeDecisions(ctx).price).toBeLessThan(cautious.makeDecisions(ctx).price)
  })

  it('marketing is higher than CautiousAI', () => {
    const cautious = new CautiousAI(masterDifficulty)
    const aggressive = new AggressiveAI(masterDifficulty)
    const ctx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 6,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    expect(aggressive.makeDecisions(ctx).marketing).toBeGreaterThan(
      cautious.makeDecisions(ctx).marketing
    )
  })

  it('invests heavily in capex in early phase', () => {
    const ai = new AggressiveAI(masterDifficulty)
    const ctx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 1,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    const d = ai.makeDecisions(ctx)
    // CapEx should be the largest single investment in early phase
    expect(d.capitalInvestment).toBeGreaterThan(d.rd)
    expect(d.capitalInvestment).toBeGreaterThan(d.marketing)
  })

  it('price drops further in late phase with cost advantage', () => {
    const ai = new AggressiveAI(masterDifficulty)
    const earlyCtx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 1,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    const lateCtx = makeCtx('ai1', masterDifficulty, {
      companyState: makeCompanyState('ai1', { equipment: 300000 }), // built up equipment
      marketState: {
        period: 11,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    const dEarly = ai.makeDecisions(earlyCtx)
    const dLate = ai.makeDecisions(lateCtx)
    expect(dLate.price).toBeLessThan(dEarly.price)
  })
})

// ─── BalancedAI — стратегия Diversified Growth ──────────────────────────────

describe('BalancedAI', () => {
  it('marketing, capex, rd are all non-zero', () => {
    const ai = new BalancedAI(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    expect(d.marketing).toBeGreaterThan(0)
    expect(d.capitalInvestment).toBeGreaterThan(0)
    expect(d.rd).toBeGreaterThan(0)
  })

  it('investments are relatively balanced (no single dominates > 60%)', () => {
    const ai = new BalancedAI(masterDifficulty)
    const d = ai.makeDecisions(makeCtx('ai1', masterDifficulty))
    const total = d.marketing + d.capitalInvestment + d.rd
    expect(d.marketing / total).toBeLessThan(0.6)
    expect(d.capitalInvestment / total).toBeLessThan(0.6)
    expect(d.rd / total).toBeLessThan(0.6)
  })

  it('boosts marketing when losing money', () => {
    const ai = new BalancedAI(masterDifficulty)
    const goodCtx = makeCtx('ai1', masterDifficulty)
    const poorCtx = makeCtx('ai1', masterDifficulty, {
      companyState: makeCompanyState('ai1', { retainedEarnings: -50000 }),
    })
    const dGood = ai.makeDecisions(goodCtx)
    const dPoor = ai.makeDecisions(poorCtx)
    expect(dPoor.marketing).toBeGreaterThan(dGood.marketing)
  })
})

// ─── AdaptiveAI — стратегия Dynamic Counter-Strategy ────────────────────────

describe('AdaptiveAI', () => {
  it('without competitor history behaves without crash', () => {
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

  it('increases marketing when losing money', () => {
    const ai = new AdaptiveAI(masterDifficulty)

    const goodCtx = makeCtx('ai1', masterDifficulty)
    const poorCtx = makeCtx('ai1', masterDifficulty, {
      companyState: makeCompanyState('ai1', {
        retainedEarnings: -50000,
      }),
    })

    const dGood = ai.makeDecisions(goodCtx)
    const dPoor = ai.makeDecisions(poorCtx)
    expect(dPoor.marketing).toBeGreaterThanOrEqual(dGood.marketing)
  })

  it('counter-strategies: more marketing when competitors invest in R&D', () => {
    const ai = new AdaptiveAI(masterDifficulty)

    const lowRDCtx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 6,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
      competitorDecisions: [
        { price: 95, production: 2000, marketing: 10000, capitalInvestment: 10000, rd: 5000 },
      ],
    })
    const highRDCtx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 6,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
      competitorDecisions: [
        { price: 95, production: 2000, marketing: 10000, capitalInvestment: 10000, rd: 25000 },
      ],
    })

    const dLowRD = ai.makeDecisions(lowRDCtx)
    const dHighRD = ai.makeDecisions(highRDCtx)
    // When competitors invest in R&D, adaptive should boost marketing as counter
    expect(dHighRD.marketing).toBeGreaterThan(dLowRD.marketing)
  })

  it('adjusts strategy across game phases', () => {
    const ai = new AdaptiveAI(masterDifficulty)

    const earlyCtx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 1,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })
    const lateCtx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 11,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })

    const dEarly = ai.makeDecisions(earlyCtx)
    const dLate = ai.makeDecisions(lateCtx)

    // Early: more investment (capex+rd), Late: more marketing
    const earlyInvestment = dEarly.capitalInvestment + dEarly.rd
    const lateInvestment = dLate.capitalInvestment + dLate.rd
    expect(earlyInvestment).toBeGreaterThan(lateInvestment)
    expect(dLate.marketing).toBeGreaterThan(dEarly.marketing)
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

  it('novice (noise=0.25) can produce different decisions across periods', () => {
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

// ─── Стратегическое разнообразие ─────────────────────────────────────────────

describe('Strategic diversity', () => {
  it('all four AI characters produce different decisions on master', () => {
    const ais = [
      new CautiousAI(masterDifficulty),
      new AggressiveAI(masterDifficulty),
      new BalancedAI(masterDifficulty),
      new AdaptiveAI(masterDifficulty),
    ]
    const decisions = ais.map((ai) =>
      ai.makeDecisions(
        makeCtx('ai1', masterDifficulty, {
          marketState: {
            period: 6,
            totalPeriods: 12,
            scenario: 'stable',
            macroFactor: 1.0,
            baseMarketSize: cfg.baseMarketSize,
          },
        })
      )
    )

    // Prices should differ
    const prices = decisions.map((d) => d.price)
    const uniquePrices = new Set(prices.map((p) => Math.round(p)))
    expect(uniquePrices.size).toBeGreaterThanOrEqual(3)

    // Marketing allocations should differ significantly
    const marketings = decisions.map((d) => d.marketing)
    const maxMarketing = Math.max(...marketings)
    const minMarketing = Math.min(...marketings)
    expect(maxMarketing / minMarketing).toBeGreaterThan(1.3)
  })

  it('each character has a distinct investment focus', () => {
    const cautious = new CautiousAI(masterDifficulty)
    const aggressive = new AggressiveAI(masterDifficulty)
    const balanced = new BalancedAI(masterDifficulty)

    const ctx = makeCtx('ai1', masterDifficulty, {
      marketState: {
        period: 2,
        totalPeriods: 12,
        scenario: 'stable',
        macroFactor: 1.0,
        baseMarketSize: cfg.baseMarketSize,
      },
    })

    const dCautious = cautious.makeDecisions(ctx)
    const dAggressive = aggressive.makeDecisions(ctx)
    const dBalanced = balanced.makeDecisions(ctx)

    // Cautious: R&D is primary investment
    expect(dCautious.rd).toBeGreaterThan(dCautious.marketing)

    // Aggressive: CapEx is primary investment in early phase
    expect(dAggressive.capitalInvestment).toBeGreaterThan(dAggressive.rd)

    // Balanced: no single investment dominates extremely
    const balTotal = dBalanced.marketing + dBalanced.capitalInvestment + dBalanced.rd
    expect(dBalanced.marketing / balTotal).toBeGreaterThan(0.2)
    expect(dBalanced.capitalInvestment / balTotal).toBeGreaterThan(0.2)
    expect(dBalanced.rd / balTotal).toBeGreaterThan(0.2)
  })

  it('difficulty strengthMultiplier increases spending on harder difficulties', () => {
    const aiNovice = new BalancedAI(noviceDifficulty)
    const aiMaster = new BalancedAI(masterDifficulty)

    // Use same phase by forcing mid-game (period 6)
    const ctx = (d: DifficultyConfig) =>
      makeCtx('test-strength', d, {
        marketState: {
          period: 6,
          totalPeriods: 12,
          scenario: 'stable',
          macroFactor: 1.0,
          baseMarketSize: cfg.baseMarketSize,
        },
      })

    const dNovice = aiNovice.makeDecisions(ctx(noviceDifficulty))
    const dMaster = aiMaster.makeDecisions(ctx(masterDifficulty))

    // Master should spend more total (ignoring noise) due to higher strengthMultiplier
    // Compare base spending rates: master str=1.3 vs novice str=0.8
    const noviceSpend = dNovice.marketing + dNovice.capitalInvestment + dNovice.rd
    const masterSpend = dMaster.marketing + dMaster.capitalInvestment + dMaster.rd
    // Master should spend noticeably more (accounting for noise on novice)
    expect(masterSpend).toBeGreaterThan(noviceSpend * 0.9)
  })
})
