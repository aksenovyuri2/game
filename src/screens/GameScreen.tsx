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

  // Онбординг: запуск подсказок на первом периоде
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
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">Игра не запущена.</p>
          <Button className="mt-4" onClick={() => navigate('home')}>
            На главную
          </Button>
        </div>
      </PageLayout>
    )
  }

  const progressPercent = ((currentPeriod - 1) / config.totalPeriods) * 100

  // --- Status bar with onboarding tip ---
  const statusBar = (
    <BubbleTip
      id="status-bar"
      arrow="bottom"
      content="Здесь ваши ключевые показатели: касса, текущий период и MPI — индекс эффективности управления."
      step={2}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      onNext={() => showTip('decisions-form')}
    >
      <Card className="mb-5 hover:shadow-sm">
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
                  {currentPeriod}{' '}
                  <span className="text-muted-foreground font-normal">/ {config.totalPeriods}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Касса
                </p>
                <p className={`font-bold ${player.cash <= 0 ? 'text-destructive' : ''}`}>
                  {formatMoney(player.cash)} УДЕ
                </p>
              </div>
              {playerLastResult && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    MPI
                  </p>
                  <p className="font-bold text-primary">{formatMPI(playerLastResult.mpi)}</p>
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
                <div className="flex items-center gap-2">
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
                  ← Меню
                </Button>
              )}
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
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
        >
          {m.label}
        </Button>
      ))}
    </div>
  )

  // --- Фаза принятия решений ---
  if (phase === 'deciding') {
    return (
      <PageLayout title={`Период ${currentPeriod}`}>
        {/* Welcome tip — на всю страницу */}
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
      </PageLayout>
    )
  }

  // --- Фаза просмотра результатов ---
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
        {statusBar}
        <NewsPanel
          activeEvents={activeEvents}
          newEvents={newEventsThisPeriod}
          currentPeriod={currentPeriod}
        />
        {isBankruptcy && (
          <Card className="border-destructive/50 bg-destructive/5 mb-5 hover:shadow-sm">
            <CardContent className="py-5 text-center">
              <p className="text-2xl mb-1">💀</p>
              <p className="text-xl font-bold text-destructive">Ваша компания обанкротилась</p>
              <p className="text-sm text-muted-foreground mt-1">
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
                <Button size="lg" className="w-full h-12 rounded-xl" onClick={handleContinue}>
                  {isOver
                    ? '📊 Итоги игры →'
                    : `Следующий период (${currentPeriod + 1}/${config.totalPeriods}) →`}
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
      </PageLayout>
    )
  }

  return null
}
