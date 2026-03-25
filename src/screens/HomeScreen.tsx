import { useEffect, useState } from 'react'
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
  const [confirmNewGame, setConfirmNewGame] = useState(false)

  useEffect(() => {
    loadSaves()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasActiveGame = phase === 'deciding' || phase === 'period-result'

  const handleNewGame = () => {
    if (hasActiveGame && !confirmNewGame) {
      setConfirmNewGame(true)
      return
    }
    setConfirmNewGame(false)
    resetGame()
    navigate('new-game')
  }

  const handleContinue = () => {
    navigate('game')
  }

  const handleLoadSave = (saveId: string) => {
    const save = useSavesStore.getState().getSave(saveId)
    if (!save) return
    useGameStore.getState().restoreSnapshot(save.snapshot)
    navigate('game')
  }

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-10 py-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="size-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-primary-foreground font-bold text-2xl">B</span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">BizSim</h1>
          <p className="text-xl text-muted-foreground font-medium">
            Бизнес-Симулятор: Управление и Экономика
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Управляй компанией, конкурируй с ИИ-оппонентами и стань лидером рынка
          </p>
        </div>

        {/* Основные кнопки */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {hasActiveGame && (
            <Button size="lg" className="w-full text-base h-14 rounded-xl" onClick={handleContinue}>
              Продолжить игру
            </Button>
          )}

          {confirmNewGame ? (
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
              <p className="text-sm text-center text-muted-foreground">
                Текущая игра будет потеряна. Продолжить?
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={handleNewGame}>
                  Да, новая игра
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmNewGame(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              variant={hasActiveGame ? 'outline' : 'default'}
              className="w-full text-base h-14 rounded-xl"
              onClick={handleNewGame}
            >
              Новая игра
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
                <Card
                  key={save.id}
                  className="group cursor-pointer hover:border-primary/30"
                  onClick={() => handleLoadSave(save.id)}
                >
                  <CardContent className="py-3.5 px-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{save.playerName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Период {save.currentPeriod}/{save.totalPeriods} ·{' '}
                        {DIFFICULTY_LABELS[save.difficulty] ?? save.difficulty} · MPI{' '}
                        {formatMPI(save.playerMPI)}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {formatDate(save.savedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Загрузить →
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSave(save.id)
                        }}
                      >
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
