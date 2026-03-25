import { useNavigation } from '@/app/router'
import { useGameStore } from '@/store/gameStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { HistoryChart } from '@/components/charts/HistoryChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, formatMPI, formatPercent } from '@/lib/format'
import { useState } from 'react'
import type { SimulationPeriodResult } from '@/engine/types'

type ChartMetric = 'mpi' | 'netProfit' | 'marketShare' | 'revenue'

const METRIC_OPTIONS: { value: ChartMetric; label: string }[] = [
  { value: 'mpi', label: 'MPI' },
  { value: 'netProfit', label: 'Прибыль' },
  { value: 'marketShare', label: 'Доля рынка' },
  { value: 'revenue', label: 'Выручка' },
]

function getWinner(last: SimulationPeriodResult) {
  if (last.results.length === 0) return undefined
  return [...last.results].sort((a, b) => b.mpi - a.mpi)[0]
}

export default function ResultsScreen() {
  const { navigate } = useNavigation()
  const { companies, playerCompanyId, periodHistory, config, gameOverReason, resetGame } =
    useGameStore()
  const [chartMetric, setChartMetric] = useState<ChartMetric>('mpi')

  const last = periodHistory[periodHistory.length - 1]

  if (!last || !config) {
    return (
      <PageLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Нет данных об игре.</p>
          <Button className="mt-4" onClick={() => navigate('home')}>
            На главную
          </Button>
        </div>
      </PageLayout>
    )
  }

  const sortedResults = [...last.results].sort((a, b) => b.mpi - a.mpi)
  const player = companies.find((c) => c.id === playerCompanyId)
  const playerResult = last.results.find((r) => r.companyId === playerCompanyId)
  const playerRank = sortedResults.findIndex((r) => r.companyId === playerCompanyId) + 1
  const winner = getWinner(last)
  const playerWon = winner?.companyId === playerCompanyId
  const isBankruptcy = gameOverReason === 'bankruptcy'

  const handleNewGame = () => {
    resetGame()
    navigate('new-game')
  }

  return (
    <PageLayout title="Итоги игры">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Hero result card */}
        <Card
          className={
            isBankruptcy
              ? 'border-destructive/50 bg-destructive/5'
              : playerWon
                ? 'border-primary/50 bg-primary/5'
                : ''
          }
        >
          <CardContent className="py-8 text-center">
            <div className="text-5xl mb-3">
              {isBankruptcy ? '💀' : playerWon ? '🏆' : playerRank <= 3 ? '🥈' : '📊'}
            </div>
            <h1 className="text-3xl font-bold">
              {isBankruptcy
                ? 'Банкротство'
                : playerWon
                  ? 'Победа!'
                  : `Место ${playerRank} из ${sortedResults.length}`}
            </h1>
            {player && playerResult && (
              <p className="text-muted-foreground mt-2 text-lg">
                {player.name} · MPI{' '}
                <span className="font-bold text-foreground">{formatMPI(playerResult.mpi)}</span>
              </p>
            )}
            {!playerWon && winner && (
              <p className="text-sm text-muted-foreground mt-3">
                Победитель:{' '}
                <strong className="text-foreground">
                  {companies.find((c) => c.id === winner.companyId)?.name ?? winner.companyId}
                </strong>{' '}
                с MPI {formatMPI(winner.mpi)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Финальный рейтинг */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-2 rounded-full bg-chart-3" />
              Финальный рейтинг
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    #
                  </th>
                  <th className="px-4 py-2.5 text-left text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    Компания
                  </th>
                  <th className="px-4 py-2.5 text-right text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    MPI
                  </th>
                  <th className="px-4 py-2.5 text-right text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    Доля
                  </th>
                  <th className="px-4 py-2.5 text-right text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    Нар. прибыль
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r, idx) => {
                  const c = companies.find((co) => co.id === r.companyId)
                  const isPlayer = r.companyId === playerCompanyId
                  const companyBankrupt = c?.isBankrupt === true
                  return (
                    <tr
                      key={r.companyId}
                      className={`border-b last:border-0 transition-colors ${
                        companyBankrupt
                          ? 'opacity-50'
                          : isPlayer
                            ? 'bg-primary/5 font-semibold'
                            : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="px-4 py-3">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {c?.name ?? r.companyId}
                          {isPlayer && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              ВЫ
                            </span>
                          )}
                          {companyBankrupt && (
                            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                              БАНКРОТ
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatMPI(r.mpi)}</td>
                      <td className="px-4 py-3 text-right">{formatPercent(r.marketShare)}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono ${r.newRetainedEarnings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                      >
                        {formatMoney(r.newRetainedEarnings)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Графики */}
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

        {/* Действия */}
        <div className="flex gap-3">
          <Button size="lg" className="flex-1 h-12 rounded-xl" onClick={handleNewGame}>
            Новая игра
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            onClick={() => navigate('home')}
          >
            На главную
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
