import type { Difficulty, MarketScenario } from './types'

export interface CareerStats {
  gamesPlayed: number
  gamesWon: number
  totalPeriodsPlayed: number
  highestMPI: number
  totalProfit: number
  bankruptcies: number
  difficultiesBeaten: Difficulty[]
  scenariosPlayed: MarketScenario[]
  longestWinStreak: number
  currentWinStreak: number
  bestRank: number
  maxMarketShare: number
  maxCash: number
  comebackWins: number
}

export function createEmptyStats(): CareerStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    totalPeriodsPlayed: 0,
    highestMPI: 0,
    totalProfit: 0,
    bankruptcies: 0,
    difficultiesBeaten: [],
    scenariosPlayed: [],
    longestWinStreak: 0,
    currentWinStreak: 0,
    bestRank: 99,
    maxMarketShare: 0,
    maxCash: 0,
    comebackWins: 0,
  }
}

export interface GameEndData {
  won: boolean
  rank: number
  finalMPI: number
  totalPeriods: number
  difficulty: Difficulty
  scenario: MarketScenario
  isBankruptcy: boolean
  maxMarketShareInGame: number
  maxCashInGame: number
  totalProfitInGame: number
  wasLastAtAnyPoint: boolean
  startingCash: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'gameplay' | 'mastery' | 'challenge' | 'exploration'
}

interface AchievementDef extends Achievement {
  check: (stats: CareerStats, game?: GameEndData) => boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Gameplay
  {
    id: 'first-game',
    title: 'Первый шаг',
    description: 'Завершить первую игру',
    icon: '🎮',
    category: 'gameplay',
    check: (s) => s.gamesPlayed >= 1,
  },
  {
    id: 'first-win',
    title: 'Победитель',
    description: 'Выиграть игру (1 место по MPI)',
    icon: '🏆',
    category: 'gameplay',
    check: (s) => s.gamesWon >= 1,
  },
  {
    id: 'three-wins',
    title: 'Серийный чемпион',
    description: 'Выиграть 3 игры',
    icon: '🥇',
    category: 'gameplay',
    check: (s) => s.gamesWon >= 3,
  },
  {
    id: 'ten-games',
    title: 'Ветеран',
    description: 'Сыграть 10 игр',
    icon: '🎖️',
    category: 'gameplay',
    check: (s) => s.gamesPlayed >= 10,
  },
  {
    id: 'win-streak-3',
    title: 'Непобедимый',
    description: 'Выиграть 3 игры подряд',
    icon: '🔥',
    category: 'gameplay',
    check: (s) => s.longestWinStreak >= 3,
  },

  // Mastery
  {
    id: 'mpi-600',
    title: 'Эффективный управленец',
    description: 'Достичь MPI 600+',
    icon: '📈',
    category: 'mastery',
    check: (s) => s.highestMPI >= 600,
  },
  {
    id: 'mpi-800',
    title: 'Магнат',
    description: 'Достичь MPI 800+',
    icon: '💎',
    category: 'mastery',
    check: (s) => s.highestMPI >= 800,
  },
  {
    id: 'market-leader',
    title: 'Ценовой лидер',
    description: 'Захватить более 40% рынка в одном периоде',
    icon: '👑',
    category: 'mastery',
    check: (s) => s.maxMarketShare > 0.4,
  },
  {
    id: 'rich',
    title: 'Миллионер',
    description: 'Накопить более 200 000 УДЕ кассы',
    icon: '💰',
    category: 'mastery',
    check: (s) => s.maxCash > 200000,
  },
  {
    id: 'comeback',
    title: 'Камбэк',
    description: 'Победить после последнего места',
    icon: '🔄',
    category: 'mastery',
    check: (s) => s.comebackWins >= 1,
  },

  // Challenge
  {
    id: 'beat-expert',
    title: 'Покоритель экспертов',
    description: 'Победить на сложности Эксперт',
    icon: '🎯',
    category: 'challenge',
    check: (s) => s.difficultiesBeaten.includes('expert'),
  },
  {
    id: 'beat-master',
    title: 'Мастер рынка',
    description: 'Победить на сложности Мастер',
    icon: '🏅',
    category: 'challenge',
    check: (s) => s.difficultiesBeaten.includes('master'),
  },
  {
    id: 'survive-crisis',
    title: 'Непотопляемый',
    description: 'Завершить кризисный сценарий без банкротства',
    icon: '🛡️',
    category: 'challenge',
    check: (_s, g) => g !== undefined && g.scenario === 'crisis' && !g.isBankruptcy,
  },
  {
    id: 'minimalist',
    title: 'Минималист',
    description: 'Победить с начальным капиталом Low (30 000)',
    icon: '🪙',
    category: 'challenge',
    check: (_s, g) => g !== undefined && g.won && g.startingCash <= 30000,
  },
  {
    id: 'marathon',
    title: 'Марафонец',
    description: 'Пройти 24-периодную игру',
    icon: '🏃',
    category: 'challenge',
    check: (_s, g) => g !== undefined && g.totalPeriods >= 24 && !g.isBankruptcy,
  },

  // Exploration
  {
    id: 'all-scenarios',
    title: 'Исследователь',
    description: 'Сыграть во все 4 рыночных сценария',
    icon: '🗺️',
    category: 'exploration',
    check: (s) => {
      const set = new Set(s.scenariosPlayed)
      return set.has('stable') && set.has('growing') && set.has('crisis') && set.has('random')
    },
  },
  {
    id: 'all-difficulties',
    title: 'Все уровни',
    description: 'Сыграть на всех уровнях сложности',
    icon: '🎚️',
    category: 'exploration',
    check: (s) => {
      const played = new Set(s.difficultiesBeaten)
      const scenarios = new Set(s.scenariosPlayed)
      // Just need to have played on all difficulties (not necessarily won)
      return scenarios.size >= 1 && played.size >= 1 && s.gamesPlayed >= 4
    },
  },
  {
    id: 'survived-bankruptcy',
    title: 'Школа жизни',
    description: 'Обанкротиться хотя бы раз (и научиться на ошибках)',
    icon: '💀',
    category: 'exploration',
    check: (s) => s.bankruptcies >= 1,
  },
  {
    id: 'profit-100k',
    title: 'Капиталист',
    description: 'Заработать суммарно 100 000+ прибыли за карьеру',
    icon: '🏦',
    category: 'exploration',
    check: (s) => s.totalProfit >= 100000,
  },
]

/**
 * Updates career stats with results from a completed game.
 */
export function updateStats(prev: CareerStats, game: GameEndData): CareerStats {
  const stats = { ...prev }

  stats.gamesPlayed++
  stats.totalPeriodsPlayed += game.totalPeriods
  stats.highestMPI = Math.max(stats.highestMPI, game.finalMPI)
  stats.totalProfit += Math.max(0, game.totalProfitInGame)
  stats.maxMarketShare = Math.max(stats.maxMarketShare, game.maxMarketShareInGame)
  stats.maxCash = Math.max(stats.maxCash, game.maxCashInGame)
  stats.bestRank = Math.min(stats.bestRank, game.rank)

  if (game.isBankruptcy) {
    stats.bankruptcies++
  }

  if (game.won) {
    stats.gamesWon++
    stats.currentWinStreak++
    stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentWinStreak)

    if (!stats.difficultiesBeaten.includes(game.difficulty)) {
      stats.difficultiesBeaten = [...stats.difficultiesBeaten, game.difficulty]
    }

    if (game.wasLastAtAnyPoint) {
      stats.comebackWins++
    }
  } else {
    stats.currentWinStreak = 0
  }

  if (!stats.scenariosPlayed.includes(game.scenario)) {
    stats.scenariosPlayed = [...stats.scenariosPlayed, game.scenario]
  }

  return stats
}

/**
 * Check which achievements are newly unlocked.
 */
export function checkAchievements(
  stats: CareerStats,
  game: GameEndData | undefined,
  alreadyUnlockedIds: string[]
): Achievement[] {
  const unlockedSet = new Set(alreadyUnlockedIds)
  return ACHIEVEMENTS.filter((a) => !unlockedSet.has(a.id) && a.check(stats, game)).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    category: a.category,
  }))
}
