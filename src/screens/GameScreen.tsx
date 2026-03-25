import { useState } from 'react'
import { useNavigation } from '@/app/router'
import { useGameStore } from '@/store/gameStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { DecisionsForm } from '@/components/game/DecisionsForm'
import { PeriodReport } from '@/components/game/PeriodReport'
import { RatingTable } from '@/components/game/RatingTable'
import { HistoryChart } from '@/components/charts/HistoryChart'
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
    submitDecisions,
    continueToNextPeriod,
  } = useGameStore()

  const [chartMetric, setChartMetric] = useState<ChartMetric>('mpi')
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const player = companies.find((c) => c.id === playerCompanyId)
  const playerLastResult = lastPeriodResult?.results.find((r) => r.companyId === playerCompanyId)

  if (!config || !player) {
    return (
      <PageLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Игра не запущена.</p>
          <Button className="mt-4" onClick={() => navigate('home')}>
            На главную
          </Button>
        </div>
      </PageLayout>
    )
  }

  const handleSubmit = (decisions: Decisions) => {
    submitDecisions(decisions)
  }

  const handleContinue = () => {
    if (phase === 'game-over') {
      navigate('results')
    } else {
      continueToNextPeriod()
    }
  }

  const handleEndGame = () => {
    useGameStore.setState({ phase: 'game-over', gameOverReason: 'completed' })
    navigate('results')
  }

  // --- Progress bar ---
  const progressPercent = ((currentPeriod - 1) / config.totalPeriods) * 100

  // --- Status bar ---
  const statusBar = (
    <Card className="mb-5">
      <CardContent className="py-4 px-5">
        <div className="flex flex-wrap gap-5 items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Компания
              </p>
              <p className="font-bold">{player.name}</p>
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
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-xs text-muted-foreground">Завершить?</span>
                <Button variant="destructive" size="sm" onClick={handleEndGame}>
                  Да, завершить
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowEndConfirm(false)}>
                  Отмена
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
        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )

  // --- Metric selector ---
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
        {statusBar}
        <div className="grid lg:grid-cols-2 gap-5">
          <div>
            <DecisionsForm onSubmit={handleSubmit} />
          </div>
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
        {isBankruptcy && (
          <Card className="border-destructive/50 bg-destructive/5 mb-5">
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
                <PeriodReport result={playerLastResult} companyName={player.name} />
              )}
              <div className="space-y-5">
                <RatingTable
                  results={lastPeriodResult.results}
                  companies={companies}
                  playerCompanyId={playerCompanyId}
                />
                <Button size="lg" className="w-full h-12 rounded-xl" onClick={handleContinue}>
                  {isOver
                    ? '📊 Итоги игры →'
                    : `Следующий период (${currentPeriod + 1}/${config.totalPeriods}) →`}
                </Button>
              </div>
            </div>

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

  return null
}
