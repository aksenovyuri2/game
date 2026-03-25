import { create } from 'zustand'

const STORAGE_KEY = 'bizsim_onboarding'

export type TipId =
  | 'welcome'
  | 'status-bar'
  | 'decisions-form'
  | 'price-slider'
  | 'production-slider'
  | 'budget-bar'
  | 'submit-period'
  | 'period-result'
  | 'rating-table'
  | 'chart-metrics'
  | 'results-screen'

interface OnboardingState {
  /** ID подсказок, которые уже были показаны и закрыты */
  dismissed: Set<TipId>
  /** Текущая активная подсказка (одна за раз) */
  activeTip: TipId | null

  init: () => void
  show: (id: TipId) => void
  dismiss: (id: TipId) => void
  dismissAll: () => void
  isDismissed: (id: TipId) => boolean
  resetOnboarding: () => void
}

function readDismissed(): Set<TipId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as TipId[]) : new Set()
  } catch {
    return new Set()
  }
}

function writeDismissed(dismissed: Set<TipId>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]))
  } catch {
    // ignore
  }
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  dismissed: new Set(),
  activeTip: null,

  init: () => {
    set({ dismissed: readDismissed() })
  },

  show: (id) => {
    if (get().dismissed.has(id)) return
    set({ activeTip: id })
  },

  dismiss: (id) => {
    const dismissed = new Set(get().dismissed)
    dismissed.add(id)
    writeDismissed(dismissed)
    set({ dismissed, activeTip: get().activeTip === id ? null : get().activeTip })
  },

  dismissAll: () => {
    const dismissed = new Set(get().dismissed)
    if (get().activeTip) dismissed.add(get().activeTip!)
    writeDismissed(dismissed)
    set({ dismissed, activeTip: null })
  },

  isDismissed: (id) => get().dismissed.has(id),

  resetOnboarding: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ dismissed: new Set(), activeTip: null })
  },
}))
