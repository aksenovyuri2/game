import { describe, it, expect } from 'vitest'
import {
  updateStats,
  checkAchievements,
  createEmptyStats,
  ACHIEVEMENTS,
  type GameEndData,
} from '@/engine/achievements'

function makeGameEnd(overrides: Partial<GameEndData> = {}): GameEndData {
  return {
    won: false,
    rank: 3,
    finalMPI: 400,
    totalPeriods: 12,
    difficulty: 'medium',
    scenario: 'stable',
    isBankruptcy: false,
    maxMarketShareInGame: 0.25,
    maxCashInGame: 50000,
    totalProfitInGame: 20000,
    wasLastAtAnyPoint: false,
    startingCash: 50000,
    ...overrides,
  }
}

describe('updateStats', () => {
  it('increments gamesPlayed', () => {
    const stats = createEmptyStats()
    const updated = updateStats(stats, makeGameEnd())
    expect(updated.gamesPlayed).toBe(1)
  })

  it('increments gamesWon on win', () => {
    const stats = createEmptyStats()
    const updated = updateStats(stats, makeGameEnd({ won: true }))
    expect(updated.gamesWon).toBe(1)
  })

  it('does not increment gamesWon on loss', () => {
    const stats = createEmptyStats()
    const updated = updateStats(stats, makeGameEnd({ won: false }))
    expect(updated.gamesWon).toBe(0)
  })

  it('tracks win streak', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ won: true }))
    stats = updateStats(stats, makeGameEnd({ won: true }))
    stats = updateStats(stats, makeGameEnd({ won: true }))
    expect(stats.currentWinStreak).toBe(3)
    expect(stats.longestWinStreak).toBe(3)
  })

  it('resets current win streak on loss', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ won: true }))
    stats = updateStats(stats, makeGameEnd({ won: true }))
    stats = updateStats(stats, makeGameEnd({ won: false }))
    expect(stats.currentWinStreak).toBe(0)
    expect(stats.longestWinStreak).toBe(2)
  })

  it('tracks highest MPI', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ finalMPI: 500 }))
    stats = updateStats(stats, makeGameEnd({ finalMPI: 800 }))
    stats = updateStats(stats, makeGameEnd({ finalMPI: 600 }))
    expect(stats.highestMPI).toBe(800)
  })

  it('tracks best rank', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ rank: 3 }))
    stats = updateStats(stats, makeGameEnd({ rank: 1 }))
    stats = updateStats(stats, makeGameEnd({ rank: 2 }))
    expect(stats.bestRank).toBe(1)
  })

  it('increments bankruptcies', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ isBankruptcy: true }))
    expect(stats.bankruptcies).toBe(1)
  })

  it('tracks total periods played', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ totalPeriods: 12 }))
    stats = updateStats(stats, makeGameEnd({ totalPeriods: 8 }))
    expect(stats.totalPeriodsPlayed).toBe(20)
  })

  it('tracks difficulties beaten', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ won: true, difficulty: 'expert' }))
    expect(stats.difficultiesBeaten).toContain('expert')
  })

  it('tracks scenarios played', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ scenario: 'crisis' }))
    expect(stats.scenariosPlayed).toContain('crisis')
  })

  it('does not duplicate scenarios', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ scenario: 'crisis' }))
    stats = updateStats(stats, makeGameEnd({ scenario: 'crisis' }))
    expect(stats.scenariosPlayed.filter((s) => s === 'crisis')).toHaveLength(1)
  })

  it('tracks comeback wins', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ won: true, wasLastAtAnyPoint: true }))
    expect(stats.comebackWins).toBe(1)
  })

  it('tracks max market share', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ maxMarketShareInGame: 0.45 }))
    expect(stats.maxMarketShare).toBe(0.45)
  })

  it('accumulates total profit (only positive)', () => {
    let stats = createEmptyStats()
    stats = updateStats(stats, makeGameEnd({ totalProfitInGame: 30000 }))
    stats = updateStats(stats, makeGameEnd({ totalProfitInGame: -5000 }))
    expect(stats.totalProfit).toBe(30000)
  })
})

describe('checkAchievements', () => {
  it('returns empty for empty stats', () => {
    const stats = createEmptyStats()
    const result = checkAchievements(stats, undefined, [])
    expect(result).toEqual([])
  })

  it('unlocks first-game after one game', () => {
    let stats = createEmptyStats()
    const game = makeGameEnd()
    stats = updateStats(stats, game)
    const result = checkAchievements(stats, game, [])
    expect(result.some((a) => a.id === 'first-game')).toBe(true)
  })

  it('unlocks first-win after winning', () => {
    let stats = createEmptyStats()
    const game = makeGameEnd({ won: true, rank: 1 })
    stats = updateStats(stats, game)
    const result = checkAchievements(stats, game, [])
    expect(result.some((a) => a.id === 'first-win')).toBe(true)
  })

  it('does not re-unlock already unlocked achievements', () => {
    let stats = createEmptyStats()
    const game = makeGameEnd()
    stats = updateStats(stats, game)
    const result = checkAchievements(stats, game, ['first-game'])
    expect(result.some((a) => a.id === 'first-game')).toBe(false)
  })

  it('unlocks mpi-800 for high MPI', () => {
    let stats = createEmptyStats()
    const game = makeGameEnd({ finalMPI: 850 })
    stats = updateStats(stats, game)
    const result = checkAchievements(stats, game, [])
    expect(result.some((a) => a.id === 'mpi-800')).toBe(true)
  })

  it('unlocks survive-crisis for crisis scenario without bankruptcy', () => {
    let stats = createEmptyStats()
    const game = makeGameEnd({ scenario: 'crisis', isBankruptcy: false })
    stats = updateStats(stats, game)
    const result = checkAchievements(stats, game, [])
    expect(result.some((a) => a.id === 'survive-crisis')).toBe(true)
  })

  it('unlocks market-leader for >40% market share', () => {
    let stats = createEmptyStats()
    const game = makeGameEnd({ maxMarketShareInGame: 0.45 })
    stats = updateStats(stats, game)
    const result = checkAchievements(stats, game, [])
    expect(result.some((a) => a.id === 'market-leader')).toBe(true)
  })

  it('unlocks survived-bankruptcy after going bankrupt', () => {
    let stats = createEmptyStats()
    const game = makeGameEnd({ isBankruptcy: true })
    stats = updateStats(stats, game)
    const result = checkAchievements(stats, game, [])
    expect(result.some((a) => a.id === 'survived-bankruptcy')).toBe(true)
  })

  it('all achievements have required fields', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy()
      expect(a.title).toBeTruthy()
      expect(a.description).toBeTruthy()
      expect(a.icon).toBeTruthy()
      expect(['gameplay', 'mastery', 'challenge', 'exploration']).toContain(a.category)
    }
  })
})
