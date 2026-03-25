import { create } from 'zustand'
import type { Difficulty } from '../engine/types'

const STORAGE_KEY = 'bizsim_saves'

export interface SavedGame {
  id: string
  playerName: string
  savedAt: string
  currentPeriod: number
  totalPeriods: number
  difficulty: Difficulty
  playerMPI: number
  // Полный снапшот состояния игры (сериализуется в JSON)
  snapshot: unknown
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
    const updated = [newSave, ...get().saves].slice(0, 10) // максимум 10 сохранений
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
