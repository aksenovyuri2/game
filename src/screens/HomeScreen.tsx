import { useEffect, useState } from 'react'
import { useNavigation } from '@/app/router'
import { useGameStore } from '@/store/gameStore'
import { useSavesStore } from '@/store/savesStore'
import { useAchievementsStore } from '@/store/achievementsStore'
import { ACHIEVEMENTS } from '@/engine/achievements'
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
  const unlockedCount = useAchievementsStore((s) => s.unlockedIds.length)
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
      <div className="flex flex-col items-center gap-12 py-16 animate-fade-in">
        {/* Hero */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-purple-500 flex items-center justify-center shadow-xl shadow-primary/30 animate-float">
              <span className="text-primary-foreground font-bold text-3xl">B</span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            <span className="text-gradient">BizSim</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Бизнес-Симулятор: Управление и Экономика
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Управляй компанией, конкурируй с ИИ-оппонентами и стань лидером рынка
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {hasActiveGame && (
            <Button
              size="lg"
              className="w-full text-base h-14 rounded-2xl shadow-lg shadow-primary/20"
              onClick={handleContinue}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-1">
                <path d="M6 4L16 10L6 16V4Z" fill="currentColor" />
              </svg>
              Продолжить игру
            </Button>
          )}

          {confirmNewGame ? (
            <div className="flex flex-col gap-2 p-5 rounded-2xl border border-destructive/20 bg-destructive/5 backdrop-blur-sm animate-slide-up">
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
              className={`w-full text-base h-14 rounded-2xl ${!hasActiveGame ? 'shadow-lg shadow-primary/20' : ''}`}
              onClick={handleNewGame}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-1">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M10 7V13M7 10H13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Новая игра
            </Button>
          )}

          <Button
            size="lg"
            variant="ghost"
            className="w-full text-base h-12 text-muted-foreground"
            onClick={() => navigate('help')}
          >
            Как играть
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full text-base h-12 text-muted-foreground"
            onClick={() => navigate('stats')}
          >
            📊 Статистика
            {unlockedCount > 0 && (
              <span className="ml-2 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {unlockedCount}/{ACHIEVEMENTS.length}
              </span>
            )}
          </Button>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {['ИИ-конкуренты', 'Экономическая модель', 'Без регистрации', 'Оффлайн'].map((f) => (
            <span
              key={f}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-primary/5 text-primary/80 border border-primary/10"
            >
              {f}
            </span>
          ))}
        </div>

        {/* Saves */}
        {saves.length > 0 && (
          <div className="w-full max-w-xl animate-slide-up">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 3H12L15 6V15H3V3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 3V7H11V3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 15V10H12V15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              Сохранённые игры
            </h2>
            <div className="space-y-2.5">
              {saves.slice(0, 5).map((save) => (
                <Card
                  key={save.id}
                  className="group cursor-pointer hover:border-primary/20 active:scale-[0.99] transition-all duration-200"
                  onClick={() => handleLoadSave(save.id)}
                >
                  <CardContent className="py-4 px-5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{save.playerName}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-primary/8 text-primary px-2 py-0.5 rounded-md font-medium">
                          {save.currentPeriod}/{save.totalPeriods}
                        </span>
                        <span>{DIFFICULTY_LABELS[save.difficulty] ?? save.difficulty}</span>
                        <span className="font-mono">MPI {formatMPI(save.playerMPI)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-1">
                        {formatDate(save.savedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Загрузить
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSave(save.id)
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M3 3L11 11M11 3L3 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
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
