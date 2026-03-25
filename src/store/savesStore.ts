import { create } from 'zustand'
import type { Difficulty } from '../engine/types'
import type { GameSnapshot } from './gameStore'

const STORAGE_KEY = 'bizsim_saves'

export interface SavedGame {
  id: string
  playerName: string
  savedAt: string
  currentPeriod: number
  totalPeriods: number
  difficulty: Difficulty
  playerMPI: number
  snapshot: GameSnapshot
}

interface SavesState {
  saves: SavedGame[]
  loadSaves: () => void
  saveGame: (save: Omit<SavedGame, 'id' | 'savedAt'>) => void
  deleteSave: (id: string) => void
  getSave: (id: string) => SavedGame | undefined
}

function readFromStorage(): SavedGame[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedGame[]) : []
  } catch {
    return []
  }
}

function writeToStorage(saves: SavedGame[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
  } catch {
    // ignore storage errors
  }
}

export const useSavesStore = create<SavesState>((set, get) => ({
  saves: [],

  loadSaves: () => {
    set({ saves: readFromStorage() })
  },

  saveGame: (save) => {
    const newSave: SavedGame = {
      ...save,
      id: `save-${Date.now()}`,
      savedAt: new Date().toISOString(),
    }
    // Заменяем существующее сохранение той же игры или добавляем новое
    const existing = get().saves.filter((s) => s.snapshot.gameSeed !== save.snapshot.gameSeed)
    const updated = [newSave, ...existing].slice(0, 10)
    writeToStorage(updated)
    set({ saves: updated })
  },

  deleteSave: (id) => {
    const updated = get().saves.filter((s) => s.id !== id)
    writeToStorage(updated)
    set({ saves: updated })
  },

  getSave: (id) => get().saves.find((s) => s.id === id),
}))
