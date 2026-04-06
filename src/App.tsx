import { useEffect } from 'react'
import { NavigationProvider, useNavigation } from '@/app/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useAchievementsStore } from '@/store/achievementsStore'
import { AchievementToast } from '@/components/game/AchievementToast'
import HomeScreen from '@/screens/HomeScreen'
import NewGameScreen from '@/screens/NewGameScreen'
import GameScreen from '@/screens/GameScreen'
import ResultsScreen from '@/screens/ResultsScreen'
import HelpScreen from '@/screens/HelpScreen'
import StatsScreen from '@/screens/StatsScreen'

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
    case 'stats':
      return <StatsScreen />
    default:
      return <HomeScreen />
  }
}

function AppInit() {
  const initOnboarding = useOnboardingStore((s) => s.init)
  const initAchievements = useAchievementsStore((s) => s.init)
  useEffect(() => {
    initOnboarding()
    initAchievements()
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
        <AchievementToast />
      </NavigationProvider>
    </ErrorBoundary>
  )
}
