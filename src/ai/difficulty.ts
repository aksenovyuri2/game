import type { AICharacter, Difficulty } from '../engine/types'
import type { DifficultyConfig } from './types'
import { BaseAI } from './base'
import { CautiousAI } from './cautious'
import { AggressiveAI } from './aggressive'
import { BalancedAI } from './balanced'
import { AdaptiveAI } from './adaptive'
import { seededRandom } from './base'

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  novice: {
    noiseLevel: 0.3,
    canAnalyzeCompetitors: false,
    canUseLongTermPlanning: false,
  },
  medium: {
    noiseLevel: 0.15,
    canAnalyzeCompetitors: false,
    canUseLongTermPlanning: false,
  },
  expert: {
    noiseLevel: 0.05,
    canAnalyzeCompetitors: true,
    canUseLongTermPlanning: true,
  },
  master: {
    noiseLevel: 0,
    canAnalyzeCompetitors: true,
    canUseLongTermPlanning: true,
  },
}

/** Возвращает конфигурацию уровня сложности */
export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty]
}

/** Набор характеров, доступных на каждом уровне сложности */
const AVAILABLE_CHARACTERS: Record<Difficulty, AICharacter[]> = {
  novice: ['cautious', 'balanced'],
  medium: ['cautious', 'aggressive', 'balanced'],
  expert: ['cautious', 'aggressive', 'balanced', 'adaptive'],
  master: ['cautious', 'aggressive', 'balanced', 'adaptive'],
}

/**
 * Создаёт экземпляр ИИ-игрока по характеру и уровню сложности.
 * Если AdaptiveAI недоступен на уровне — используется BalancedAI.
 */
export function createAIPlayer(character: AICharacter, difficulty: Difficulty): BaseAI {
  const config = getDifficultyConfig(difficulty)
  const available = AVAILABLE_CHARACTERS[difficulty]

  // Если характер недоступен на уровне — fallback к balanced
  const effectiveCharacter: AICharacter = available.includes(character) ? character : 'balanced'

  switch (effectiveCharacter) {
    case 'cautious':
      return new CautiousAI(config)
    case 'aggressive':
      return new AggressiveAI(config)
    case 'balanced':
      return new BalancedAI(config)
    case 'adaptive':
      return new AdaptiveAI(config)
  }
}

/**
 * Назначает характеры ИИ-компаниям детерминированно по сиду.
 * Гарантирует разнообразие — использует модульное распределение по пулу.
 */
export function assignAICharacters(
  count: number,
  difficulty: Difficulty,
  seed: number
): AICharacter[] {
  const available = AVAILABLE_CHARACTERS[difficulty]
  return Array.from({ length: count }, (_, i) => {
    const r = seededRandom(`assign-${seed}`, i + 1)
    const idx = Math.floor(r * available.length)
    return available[idx] ?? available[0]!
  })
}
