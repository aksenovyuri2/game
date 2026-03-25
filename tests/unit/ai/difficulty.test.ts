import { describe, it, expect } from 'vitest'
import { getDifficultyConfig, createAIPlayer, assignAICharacters } from '../../../src/ai/difficulty'
import type { Difficulty, AICharacter } from '../../../src/engine/types'

// ─── getDifficultyConfig ─────────────────────────────────────────────────────

describe('getDifficultyConfig', () => {
  it('novice has highest noise level', () => {
    const novice = getDifficultyConfig('novice')
    const master = getDifficultyConfig('master')
    expect(novice.noiseLevel).toBeGreaterThan(master.noiseLevel)
  })

  it('master has zero noise', () => {
    expect(getDifficultyConfig('master').noiseLevel).toBe(0)
  })

  it('expert and master can analyze competitors', () => {
    expect(getDifficultyConfig('expert').canAnalyzeCompetitors).toBe(true)
    expect(getDifficultyConfig('master').canAnalyzeCompetitors).toBe(true)
  })

  it('novice and medium cannot analyze competitors', () => {
    expect(getDifficultyConfig('novice').canAnalyzeCompetitors).toBe(false)
    expect(getDifficultyConfig('medium').canAnalyzeCompetitors).toBe(false)
  })

  it('noise levels are in descending order: novice > medium > expert > master', () => {
    const levels: Difficulty[] = ['novice', 'medium', 'expert', 'master']
    const noises = levels.map((d) => getDifficultyConfig(d).noiseLevel)
    for (let i = 0; i < noises.length - 1; i++) {
      expect(noises[i]).toBeGreaterThanOrEqual(noises[i + 1]!)
    }
  })

  it('strengthMultiplier increases with difficulty', () => {
    const levels: Difficulty[] = ['novice', 'medium', 'expert', 'master']
    const strengths = levels.map((d) => getDifficultyConfig(d).strengthMultiplier)
    for (let i = 0; i < strengths.length - 1; i++) {
      expect(strengths[i]).toBeLessThanOrEqual(strengths[i + 1]!)
    }
  })

  it('medium has canUseLongTermPlanning enabled', () => {
    expect(getDifficultyConfig('medium').canUseLongTermPlanning).toBe(true)
  })

  it('novice has canUseLongTermPlanning disabled', () => {
    expect(getDifficultyConfig('novice').canUseLongTermPlanning).toBe(false)
  })
})

// ─── createAIPlayer ──────────────────────────────────────────────────────────

describe('createAIPlayer', () => {
  const characters: AICharacter[] = ['cautious', 'aggressive', 'balanced']

  it.each(characters)('creates %s AI without error', (character) => {
    expect(() => createAIPlayer(character, 'medium')).not.toThrow()
  })

  it('creates AdaptiveAI for expert difficulty', () => {
    expect(() => createAIPlayer('adaptive', 'expert')).not.toThrow()
  })

  it('creates AdaptiveAI for master difficulty', () => {
    expect(() => createAIPlayer('adaptive', 'master')).not.toThrow()
  })

  it('adaptive on novice falls back to BalancedAI behavior (no crash)', () => {
    expect(() => createAIPlayer('adaptive', 'novice')).not.toThrow()
  })
})

// ─── assignAICharacters ──────────────────────────────────────────────────────

describe('assignAICharacters', () => {
  it('returns correct number of characters', () => {
    const chars = assignAICharacters(4, 'medium', 42)
    expect(chars).toHaveLength(4)
  })

  it('only returns characters available for difficulty', () => {
    const noviceChars = assignAICharacters(4, 'novice', 1)
    const validNovice: AICharacter[] = ['cautious', 'balanced']
    noviceChars.forEach((c) => {
      expect(validNovice).toContain(c)
    })
  })

  it('expert includes all four character types with enough AIs', () => {
    const chars = assignAICharacters(4, 'expert', 42)
    const unique = new Set(chars)
    // With guaranteed diversity, 4 AIs on expert should have all 4 types
    expect(unique.size).toBe(4)
  })

  it('expert can include adaptive character', () => {
    // With guaranteed diversity for count >= available.length
    const chars = assignAICharacters(4, 'expert', 42)
    expect(chars).toContain('adaptive')
  })

  it('is deterministic for same seed', () => {
    const a = assignAICharacters(4, 'medium', 99)
    const b = assignAICharacters(4, 'medium', 99)
    expect(a).toEqual(b)
  })

  it('count=0 returns empty array', () => {
    expect(assignAICharacters(0, 'master', 1)).toHaveLength(0)
  })
})
