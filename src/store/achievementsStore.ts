import { create } from 'zustand'
import {
  type CareerStats,
  type Achievement,
  type GameEndData,
  createEmptyStats,
  updateStats,
  checkAchievements,
  ACHIEVEMENTS,
} from '../engine/achievements'

const STORAGE_KEY = 'bizsim_achievements'

interface AchievementsState {
  stats: CareerStats
  unlockedIds: string[]
  newlyUnlocked: Achievement[]

  init: () => void
  recordGameEnd: (game: GameEndData) => void
  clearNewlyUnlocked: () => void
  resetAll: () => void
  getAchievement: (id: string) => Achievement | undefined
  isUnlocked: (id: string) => boolean
}

function loadFromStorage(): { stats: CareerStats; unlockedIds: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as { stats: CareerStats; unlockedIds: string[] }
      return { stats: data.stats, unlockedIds: data.unlockedIds }
    }
  } catch {
    // ignore parse errors
  }
  return { stats: createEmptyStats(), unlockedIds: [] }
}

function saveToStorage(stats: CareerStats, unlockedIds: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats, unlockedIds }))
  } catch {
    // ignore storage errors
  }
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  stats: createEmptyStats(),
  unlockedIds: [],
  newlyUnlocked: [],

  init: () => {
    const { stats, unlockedIds } = loadFromStorage()
    set({ stats, unlockedIds })
  },

  recordGameEnd: (game) => {
    const { stats: prevStats, unlockedIds: prevUnlocked } = get()
    const newStats = updateStats(prevStats, game)
    const newAchievements = checkAchievements(newStats, game, prevUnlocked)
    const newUnlockedIds = [...prevUnlocked, ...newAchievements.map((a) => a.id)]

    saveToStorage(newStats, newUnlockedIds)

    set({
      stats: newStats,
      unlockedIds: newUnlockedIds,
      newlyUnlocked: newAchievements,
    })
  },

  clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),

  resetAll: () => {
    const empty = createEmptyStats()
    saveToStorage(empty, [])
    set({ stats: empty, unlockedIds: [], newlyUnlocked: [] })
  },

  getAchievement: (id) => ACHIEVEMENTS.find((a) => a.id === id),

  isUnlocked: (id) => get().unlockedIds.includes(id),
}))
