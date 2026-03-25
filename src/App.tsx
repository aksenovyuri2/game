import { NavigationProvider, useNavigation } from '@/app/router'
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

export default function App() {
  return (
    <NavigationProvider>
      <AppScreens />
    </NavigationProvider>
  )
}
