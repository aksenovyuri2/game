import { useEffect } from 'react'
import { NavigationProvider, useNavigation } from '@/app/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useOnboardingStore } from '@/store/onboardingStore'
import HomeScreen from '@/screens/HomeScreen'
import NewGameScreen from '@/screens/NewGameScreen'
import GameScreen from '@/screens/GameScreen'
import ResultsScreen from '@/screens/ResultsScreen'
import HelpScreen from '@/screens/HelpScreen'

function AppScreens() {
  const { screen } = useNavigation()

  switch (screen) {
    case 'home':
      return <HomeScreen />
    case 'new-game':
      return <NewGameScreen />
    case 'game':
      return <GameScreen />
    case 'results':
      return <ResultsScreen />
    case 'help':
      return <HelpScreen />
    default:
      return <HomeScreen />
  }
}

function AppInit() {
  const init = useOnboardingStore((s) => s.init)
  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationProvider>
        <AppInit />
        <AppScreens />
      </NavigationProvider>
    </ErrorBoundary>
  )
}
