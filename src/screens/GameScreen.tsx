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

  // --- Шапка с текущим состоянием ---
  const statusBar = (
    <Card className="mb-4">
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Компания</p>
              <p className="font-semibold">{player.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Период</p>
              <p className="font-semibold">
                {currentPeriod} / {config.totalPeriods}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Касса</p>
              <p className="font-semibold">{formatMoney(player.cash)} УДЕ</p>
            </div>
            {playerLastResult && (
              <div>
                <p className="text-xs text-muted-foreground">MPI</p>
                <p className="font-semibold">{formatMPI(playerLastResult.mpi)}</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('home')}>
            ← Меню
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // --- Фаза принятия решений ---
  if (phase === 'deciding') {
    return (
      <PageLayout title={`Период ${currentPeriod}`}>
        {statusBar}
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <DecisionsForm onSubmit={handleSubmit} />
          </div>
          <div className="space-y-4">
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
          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-4 text-center">
              <p className="text-xl font-bold text-red-600">Ваша компания обанкротилась</p>
              <p className="text-sm text-red-500 mt-1">
                Денежные средства исчерпаны. Компания не может продолжать деятельность.
              </p>
            </CardContent>
          </Card>
        )}
        {lastPeriodResult && (
          <div className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {playerLastResult && (
                <PeriodReport result={playerLastResult} companyName={player.name} />
              )}
              <div className="space-y-4">
                <RatingTable
                  results={lastPeriodResult.results}
                  companies={companies}
                  playerCompanyId={playerCompanyId}
                />
                <Button size="lg" className="w-full" onClick={handleContinue}>
                  {isOver
                    ? '📊 Итоги игры →'
                    : `Следующий период (${currentPeriod + 1}/${config.totalPeriods}) →`}
                </Button>
              </div>
            </div>

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
