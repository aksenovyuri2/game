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
  return [...last.results].sort((a, b) => b.mpi - a.mpi)[0]
}

export default function ResultsScreen() {
  const { navigate } = useNavigation()
  const { companies, playerCompanyId, periodHistory, config, resetGame } = useGameStore()
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

  const handleNewGame = () => {
    resetGame()
    navigate('new-game')
  }

  return (
    <PageLayout title="Итоги игры">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Победитель */}
        <Card className={playerWon ? 'border-primary bg-primary/5' : ''}>
          <CardContent className="py-6 text-center">
            <div className="text-4xl mb-2">{playerWon ? '🏆' : playerRank <= 3 ? '🥈' : '📊'}</div>
            <h1 className="text-2xl font-bold">
              {playerWon ? 'Победа!' : `Место ${playerRank} из ${sortedResults.length}`}
            </h1>
            {player && playerResult && (
              <p className="text-muted-foreground mt-1">
                {player.name} · MPI {formatMPI(playerResult.mpi)}
              </p>
            )}
            {!playerWon && winner && (
              <p className="text-sm text-muted-foreground mt-2">
                Победитель:{' '}
                <strong>
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
            <CardTitle className="text-base">Финальный рейтинг</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left text-muted-foreground font-medium">#</th>
                  <th className="px-4 py-2 text-left text-muted-foreground font-medium">
                    Компания
                  </th>
                  <th className="px-4 py-2 text-right text-muted-foreground font-medium">MPI</th>
                  <th className="px-4 py-2 text-right text-muted-foreground font-medium">Доля</th>
                  <th className="px-4 py-2 text-right text-muted-foreground font-medium">
                    Нар. прибыль
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r, idx) => {
                  const c = companies.find((co) => co.id === r.companyId)
                  const isPlayer = r.companyId === playerCompanyId
                  return (
                    <tr
                      key={r.companyId}
                      className={`border-b last:border-0 ${isPlayer ? 'bg-primary/5 font-semibold' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        {c?.name ?? r.companyId}
                        {isPlayer && <span className="ml-1.5 text-xs text-primary">(вы)</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatMPI(r.mpi)}</td>
                      <td className="px-4 py-2.5 text-right">{formatPercent(r.marketShare)}</td>
                      <td
                        className={`px-4 py-2.5 text-right ${r.newRetainedEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}
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
          <Button size="lg" className="flex-1" onClick={handleNewGame}>
            Новая игра
          </Button>
          <Button size="lg" variant="outline" className="flex-1" onClick={() => navigate('home')}>
            На главную
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
