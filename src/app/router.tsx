import { createContext, useContext, useState, type ReactNode } from 'react'

export type Screen = 'home' | 'new-game' | 'game' | 'results' | 'help' | 'stats'

interface NavigationContextValue {
  screen: Screen
  navigate: (to: Screen) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('home')
  return (
    <NavigationContext.Provider value={{ screen, navigate: setScreen }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
