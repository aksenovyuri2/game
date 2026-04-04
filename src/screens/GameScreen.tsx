import { useState, useCallback, useEffect } from 'react'
import { useNavigation } from '@/app/router'
import { useGameStore } from '@/store/gameStore'
import { useSavesStore } from '@/store/savesStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { DecisionsForm } from '@/components/game/DecisionsForm'
import { PeriodReport } from '@/components/game/PeriodReport'
import { RatingTable } from '@/components/game/RatingTable'
import { HistoryChart } from '@/components/charts/HistoryChart'
import { NewsPanel } from '@/components/game/NewsPanel'
import { BubbleTip } from '@/components/ui/bubble-tip'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatMoney, formatMPI } from '@/lib/format'
import type { Decisions } from '@/engine/types'

type ChartMetric = 'mpi' | 'netProfit' | 'marketShare' | 'revenue'

const METRIC_OPTIONS: { value: ChartMetric; label: string }[] = [
  { value: 'mpi', label: 'MPI' },
  { value: 'netProfit', label: 'Прибыль' },
  { value: 'marketShare', label: 'Доля рынка' },
  { value: 'revenue', label: 'Выручка' },
]

const TOTAL_ONBOARDING_STEPS = 5

function saveCurrentGame(): void {
  const state = useGameStore.getState()
  const snapshot = state.getSnapshot()
  if (!snapshot) return

  const player = state.companies.find((c) => c.id === state.playerCompanyId)
  const lastResult = state.lastPeriodResult?.results.find(
    (r) => r.companyId === state.playerCompanyId
  )

  useSavesStore.getState().saveGame({
    playerName: player?.name ?? 'Моя компания',
    currentPeriod: state.currentPeriod,
    totalPeriods: snapshot.config.totalPeriods,
    difficulty: snapshot.config.difficulty,
    playerMPI: lastResult?.mpi ?? 0,
    snapshot,
  })
}

export default function GameScreen() {
  const { navigate } = useNavigation()
  const {
    config,
    companies,
    playerCompanyId,
    currentPeriod,
    phase,
    gameOverReason,
    periodHistory,
    lastPeriodResult,
    activeEvents,
    newEventsThisPeriod,
    submitDecisions,
    continueToNextPeriod,
  } = useGameStore()

  const showTip = useOnboardingStore((s) => s.show)
  const isDismissed = useOnboardingStore((s) => s.isDismissed)

  const [chartMetric, setChartMetric] = useState<ChartMetric>('mpi')
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const player = companies.find((c) => c.id === playerCompanyId)
  const playerLastResult = lastPeriodResult?.results.find((r) => r.companyId === playerCompanyId)

  useEffect(() => {
    if (phase === 'deciding' && currentPeriod === 1 && !isDismissed('welcome')) {
      const timer = setTimeout(() => showTip('welcome'), 500)
      return () => clearTimeout(timer)
    }
    if (phase === 'period-result' && currentPeriod === 1 && !isDismissed('period-result')) {
      const timer = setTimeout(() => showTip('period-result'), 400)
      return () => clearTimeout(timer)
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentPeriod])

  const handleSubmit = useCallback(
    (decisions: Decisions) => {
      submitDecisions(decisions)
      setTimeout(saveCurrentGame, 0)
    },
    [submitDecisions]
  )

  const handleContinue = useCallback(() => {
    if (phase === 'game-over') {
      navigate('results')
    } else {
      continueToNextPeriod()
    }
  }, [phase, navigate, continueToNextPeriod])

  const handleEndGame = useCallback(() => {
    useGameStore.setState({ phase: 'game-over', gameOverReason: 'completed' })
    saveCurrentGame()
    navigate('results')
  }, [navigate])

  if (!config || !player) {
    return (
      <PageLayout>
        <div className="text-center py-20 animate-fade-in">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎮</span>
          </div>
          <p className="text-muted-foreground text-lg">Игра не запущена.</p>
          <Button className="mt-6" onClick={() => navigate('home')}>
            На главную
          </Button>
        </div>
      </PageLayout>
    )
  }

  const progressPercent = ((currentPeriod - 1) / config.totalPeriods) * 100

  const statusBar = (
    <BubbleTip
      id="status-bar"
      arrow="bottom"
      content="Здесь ваши ключевые показатели: касса, текущий период и MPI — индекс эффективности управления."
      step={2}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      onNext={() => showTip('decisions-form')}
    >
      <Card className="mb-5">
        <CardContent className="py-4 px-5">
          <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Компания
                </p>
                <p className="font-bold truncate">{player.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Период
                </p>
                <p className="font-bold">
                  <span className="text-gradient">{currentPeriod}</span>{' '}
                  <span className="text-muted-foreground font-normal">/ {config.totalPeriods}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Касса
                </p>
                <p className={`font-bold font-mono ${player.cash <= 0 ? 'text-destructive' : ''}`}>
                  {formatMoney(player.cash)} УДЕ
                </p>
              </div>
              {playerLastResult && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    MPI
                  </p>
                  <p className="font-bold text-gradient font-mono">
                    {formatMPI(playerLastResult.mpi)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {phase === 'deciding' && !showEndConfirm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setShowEndConfirm(true)}
                >
                  Закончить игру
                </Button>
              )}
              {showEndConfirm && (
                <div className="flex items-center gap-2 animate-slide-up">
                  <span className="text-xs text-muted-foreground">Завершить?</span>
                  <Button variant="destructive" size="sm" onClick={handleEndGame}>
                    Да
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowEndConfirm(false)}>
                    Нет
                  </Button>
                </div>
              )}
              {!showEndConfirm && (
                <Button variant="ghost" size="sm" onClick={() => navigate('home')}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1">
                    <path
                      d="M10 12L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Меню
                </Button>
              )}
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-secondary/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </BubbleTip>
  )

  const metricSelector = (
    <div className="flex gap-2 flex-wrap">
      {METRIC_OPTIONS.map((m) => (
        <Button
          key={m.value}
          size="sm"
          variant={chartMetric === m.value ? 'default' : 'outline'}
          onClick={() => setChartMetric(m.value)}
          className={chartMetric === m.value ? '' : 'bg-white/50'}
        >
          {m.label}
        </Button>
      ))}
    </div>
  )

  // --- Deciding phase ---
  if (phase === 'deciding') {
    return (
      <PageLayout title={`Период ${currentPeriod}`}>
        <BubbleTip
          id="welcome"
          arrow="bottom"
          content="Добро пожаловать! Каждый период вы принимаете 5 решений: цена, производство, маркетинг, инвестиции и R&D. Побеждает тот, у кого выше MPI."
          step={1}
          totalSteps={TOTAL_ONBOARDING_STEPS}
          onNext={() => showTip('status-bar')}
        >
          <div />
        </BubbleTip>

        <div className="animate-fade-in">
          {statusBar}
          <NewsPanel
            activeEvents={activeEvents}
            newEvents={newEventsThisPeriod}
            currentPeriod={currentPeriod}
          />
          <div className="grid lg:grid-cols-2 gap-5">
            <BubbleTip
              id="decisions-form"
              arrow="right"
              content="Настройте 5 параметров с помощью ползунков. Следите за бюджетом вверху — не тратьте больше, чем есть в кассе!"
              step={3}
              totalSteps={TOTAL_ONBOARDING_STEPS}
              onNext={() => showTip('budget-bar')}
            >
              <div>
                <DecisionsForm key={currentPeriod} onSubmit={handleSubmit} />
              </div>
            </BubbleTip>
            <div className="space-y-5">
              {lastPeriodResult && playerLastResult && (
                <PeriodReport result={playerLastResult} companyName={player.name} />
              )}
              {lastPeriodResult && (
                <RatingTable
                  results={lastPeriodResult.results}
                  companies={companies}
                  playerCompanyId={playerCompanyId}
                />
              )}
            </div>
          </div>
          {periodHistory.length > 0 && (
            <div className="mt-6 space-y-4">
              {metricSelector}
              <HistoryChart
                history={periodHistory}
                companies={companies}
                playerCompanyId={playerCompanyId}
                metric={chartMetric}
              />
            </div>
          )}
        </div>
      </PageLayout>
    )
  }

  // --- Period-result / Game-over ---
  if (phase === 'period-result' || phase === 'game-over') {
    const isOver = phase === 'game-over'
    const isBankruptcy = gameOverReason === 'bankruptcy'
    const pageTitle = isBankruptcy
      ? 'Банкротство!'
      : isOver
        ? 'Игра завершена!'
        : `Результаты периода ${currentPeriod}`
    return (
      <PageLayout title={pageTitle}>
        <div className="animate-fade-in">
          {statusBar}
          <NewsPanel
            activeEvents={activeEvents}
            newEvents={newEventsThisPeriod}
            currentPeriod={currentPeriod}
          />
          {isBankruptcy && (
            <Card className="border-destructive/30 bg-gradient-to-r from-destructive/5 to-destructive/10 mb-5">
              <CardContent className="py-6 text-center">
                <p className="text-3xl mb-2">💀</p>
                <p className="text-xl font-bold text-destructive">Ваша компания обанкротилась</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Денежные средства исчерпаны. Компания не может продолжать деятельность.
                </p>
              </CardContent>
            </Card>
          )}
          {lastPeriodResult && (
            <div className="space-y-5">
              <div className="grid lg:grid-cols-2 gap-5">
                {playerLastResult && (
                  <BubbleTip
                    id="period-result"
                    arrow="right"
                    content="Это ваш финансовый отчёт за период. Следите за чистой прибылью и кассой — если деньги кончатся, компания обанкротится!"
                    step={4}
                    totalSteps={TOTAL_ONBOARDING_STEPS}
                    onNext={() => showTip('rating-table')}
                  >
                    <PeriodReport result={playerLastResult} companyName={player.name} />
                  </BubbleTip>
                )}
                <div className="space-y-5">
                  <BubbleTip
                    id="rating-table"
                    arrow="left"
                    content="Рейтинг компаний по MPI. Ваша цель — быть на первом месте к концу игры. Изучайте конкурентов!"
                    step={5}
                    totalSteps={TOTAL_ONBOARDING_STEPS}
                  >
                    <RatingTable
                      results={lastPeriodResult.results}
                      companies={companies}
                      playerCompanyId={playerCompanyId}
                    />
                  </BubbleTip>
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-xl shadow-md shadow-primary/15"
                    onClick={handleContinue}
                  >
                    {isOver
                      ? '📊 Итоги игры'
                      : `Следующий период (${currentPeriod + 1}/${config.totalPeriods})`}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1">
                      <path
                        d="M3 8H13M13 8L9 4M13 8L9 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div>
              </div>

              {periodHistory.length > 1 && (
                <>
                  {metricSelector}
                  <BubbleTip
                    id="chart-metrics"
                    arrow="top"
                    content="Переключайте метрики, чтобы сравнить динамику компаний по прибыли, доле рынка и другим показателям."
                  >
                    <HistoryChart
                      history={periodHistory}
                      companies={companies}
                      playerCompanyId={playerCompanyId}
                      metric={chartMetric}
                    />
                  </BubbleTip>
                </>
              )}
              {periodHistory.length <= 1 && (
                <>
                  {metricSelector}
                  <HistoryChart
                    history={periodHistory}
                    companies={companies}
                    playerCompanyId={playerCompanyId}
                    metric={chartMetric}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </PageLayout>
    )
  }

  return null
}
