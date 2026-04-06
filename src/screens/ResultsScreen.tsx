import { useNavigation } from '@/app/router'
import { useGameStore } from '@/store/gameStore'
import { useAchievementsStore } from '@/store/achievementsStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { HistoryChart } from '@/components/charts/HistoryChart'
import { StrategyComparison } from '@/components/game/StrategyComparison'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, formatMPI, formatPercent } from '@/lib/format'
import { analyzeGame } from '@/engine/analytics'
import { useState, useEffect, useRef, useMemo } from 'react'
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
  const recordGameEnd = useAchievementsStore((s) => s.recordGameEnd)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('mpi')
  const achievementRecorded = useRef(false)

  const last = periodHistory[periodHistory.length - 1]

  // Analyze game
  const analysis = useMemo(() => {
    if (!last || !playerCompanyId) return null
    return analyzeGame(periodHistory, playerCompanyId)
  }, [periodHistory, playerCompanyId, last])

  // Record achievement data once when results screen mounts
  useEffect(() => {
    if (achievementRecorded.current || !last || !config || !playerCompanyId) return
    achievementRecorded.current = true

    const sortedRes = [...last.results].sort((a, b) => b.mpi - a.mpi)
    const pResult = last.results.find((r) => r.companyId === playerCompanyId)
    const pRank = sortedRes.findIndex((r) => r.companyId === playerCompanyId) + 1
    const pWon = sortedRes[0]?.companyId === playerCompanyId

    let maxMS = 0
    let maxCash = 0
    let totalProfitInGame = 0
    let wasLast = false
    for (const period of periodHistory) {
      const pr = period.results.find((r) => r.companyId === playerCompanyId)
      if (pr) {
        maxMS = Math.max(maxMS, pr.marketShare)
        maxCash = Math.max(maxCash, pr.newCash)
        totalProfitInGame += pr.netProfit
      }
      const sorted = [...period.results].sort((a, b) => b.mpi - a.mpi)
      if (sorted[sorted.length - 1]?.companyId === playerCompanyId) {
        wasLast = true
      }
    }

    const playerCompany = companies.find((c) => c.id === playerCompanyId)

    recordGameEnd({
      won: pWon,
      rank: pRank,
      finalMPI: pResult?.mpi ?? 0,
      totalPeriods: periodHistory.length,
      difficulty: config.difficulty,
      scenario: config.scenario,
      isBankruptcy: gameOverReason === 'bankruptcy',
      maxMarketShareInGame: maxMS,
      maxCashInGame: maxCash,
      totalProfitInGame,
      wasLastAtAnyPoint: wasLast,
      startingCash: playerCompany?.cash ?? 50000,
    })
  }, [last, config, playerCompanyId, periodHistory, companies, gameOverReason, recordGameEnd])

  if (!last || !config) {
    return (
      <PageLayout>
        <div className="text-center py-20 animate-fade-in">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
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
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Hero result card */}
        <Card
          className={
            isBankruptcy
              ? 'border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10'
              : playerWon
                ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5 glow-primary'
                : ''
          }
        >
          <CardContent className="py-10 text-center">
            <div className="text-6xl mb-4 animate-float">
              {isBankruptcy ? '💀' : playerWon ? '🏆' : playerRank <= 3 ? '🥈' : '📊'}
            </div>
            <h1 className="text-3xl font-bold">
              {isBankruptcy ? (
                'Банкротство'
              ) : playerWon ? (
                <span className="text-gradient">Победа!</span>
              ) : (
                `Место ${playerRank} из ${sortedResults.length}`
              )}
            </h1>
            {player && playerResult && (
              <p className="text-muted-foreground mt-3 text-lg">
                {player.name} · MPI{' '}
                <span className="font-bold font-mono text-gradient">
                  {formatMPI(playerResult.mpi)}
                </span>
              </p>
            )}
            {!playerWon && winner && (
              <p className="text-sm text-muted-foreground mt-4 bg-muted/30 inline-block px-4 py-2 rounded-full">
                Победитель:{' '}
                <strong className="text-foreground">
                  {companies.find((c) => c.id === winner.companyId)?.name ?? winner.companyId}
                </strong>{' '}
                с MPI {formatMPI(winner.mpi)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Final rating */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-gradient-to-r from-chart-3 to-amber-400" />
              Финальный рейтинг
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
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
                      className={`border-b border-border/30 last:border-0 transition-colors ${
                        companyBankrupt
                          ? 'opacity-40'
                          : isPlayer
                            ? 'bg-primary/5'
                            : 'hover:bg-muted/20'
                      }`}
                    >
                      <td className="px-4 py-3">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={isPlayer ? 'font-semibold' : ''}>
                            {c?.name ?? r.companyId}
                          </span>
                          {isPlayer && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                              ВЫ
                            </span>
                          )}
                          {companyBankrupt && (
                            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-md">
                              БАНКРОТ
                            </span>
                          )}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono ${isPlayer ? 'font-semibold' : ''}`}
                      >
                        {formatMPI(r.mpi)}
                      </td>
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

        {/* Charts */}
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
        <HistoryChart
          history={periodHistory}
          companies={companies}
          playerCompanyId={playerCompanyId}
          metric={chartMetric}
        />

        {/* Game Insights */}
        {analysis && analysis.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-gradient-to-r from-chart-1 to-chart-2" />
                Ключевые моменты
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.insights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border/20 bg-muted/10"
                >
                  <span className="text-xl shrink-0">{insight.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Strategy Comparison */}
        {analysis && analysis.profiles.length > 0 && playerCompanyId && (
          <StrategyComparison profiles={analysis.profiles} playerCompanyId={playerCompanyId} />
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 h-12 rounded-xl shadow-md shadow-primary/15"
            onClick={handleNewGame}
          >
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
