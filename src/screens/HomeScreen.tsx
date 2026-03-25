import { useEffect } from 'react'
import { useNavigation } from '@/app/router'
import { useGameStore } from '@/store/gameStore'
import { useSavesStore } from '@/store/savesStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatMPI } from '@/lib/format'

const DIFFICULTY_LABELS: Record<string, string> = {
  novice: 'Новичок',
  medium: 'Средний',
  expert: 'Эксперт',
  master: 'Мастер',
}

export default function HomeScreen() {
  const { navigate } = useNavigation()
  const { phase, resetGame } = useGameStore()
  const { saves, loadSaves, deleteSave } = useSavesStore()

  useEffect(() => {
    loadSaves()
  }, [loadSaves])

  const handleNewGame = () => {
    resetGame()
    navigate('new-game')
  }

  const handleContinue = () => {
    if (phase === 'deciding' || phase === 'period-result') {
      navigate('game')
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-8 py-12">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">BizSim</h1>
          <p className="text-xl text-muted-foreground">Бизнес-Симулятор: Управление и Экономика</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Управляй компанией, конкурируй с ИИ-оппонентами и стань лидером рынка
          </p>
        </div>

        {/* Основные кнопки */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button size="lg" className="w-full text-base h-12" onClick={handleNewGame}>
            Новая игра
          </Button>
          {(phase === 'deciding' || phase === 'period-result') && (
            <Button
              size="lg"
              variant="outline"
              className="w-full text-base h-12"
              onClick={handleContinue}
            >
              Продолжить текущую игру
            </Button>
          )}
          <Button
            size="lg"
            variant="ghost"
            className="w-full text-base h-12"
            onClick={() => navigate('help')}
          >
            Как играть
          </Button>
        </div>

        {/* Сохранения */}
        {saves.length > 0 && (
          <div className="w-full max-w-xl">
            <h2 className="text-lg font-semibold mb-3">Сохранённые игры</h2>
            <div className="space-y-2">
              {saves.slice(0, 5).map((save) => (
                <Card key={save.id} className="hover:bg-accent/30 transition-colors">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{save.playerName}</p>
                      <p className="text-xs text-muted-foreground">
                        Период {save.currentPeriod}/{save.totalPeriods} ·{' '}
                        {DIFFICULTY_LABELS[save.difficulty] ?? save.difficulty} · MPI{' '}
                        {formatMPI(save.playerMPI)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => deleteSave(save.id)}>
                        ✕
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
