import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import type { ActiveEvent, MarketScenario, SimulationPeriodResult } from '@/engine/types'
import { combineEventEffects } from '@/engine/events'

interface MarketResearchProps {
  activeEvents: ActiveEvent[]
  scenario: MarketScenario
  lastPeriodResult: SimulationPeriodResult | null
  currentPeriod: number
  totalPeriods: number
}

const SCENARIO_LABELS: Record<MarketScenario, { label: string; trend: string; icon: string }> = {
  stable: { label: 'Стабильный', trend: 'Спрос стабилен', icon: '📊' },
  growing: { label: 'Растущий', trend: 'Спрос растёт +3%/период', icon: '📈' },
  crisis: { label: 'Кризисный', trend: 'Спрос снижается -5%/период', icon: '📉' },
  random: { label: 'Случайный', trend: 'Спрос колеблется +-15%', icon: '🎲' },
}

function EffectIndicator({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      <span>{positive ? '↑' : '↓'}</span>
      <span>
        {label}: {value}
      </span>
    </div>
  )
}

export function MarketResearch({
  activeEvents,
  scenario,
  lastPeriodResult,
  currentPeriod,
  totalPeriods,
}: MarketResearchProps) {
  const scenarioInfo = SCENARIO_LABELS[scenario]
  const combined = combineEventEffects(activeEvents)

  // Calculate average price from last period
  let avgPrice = 0
  let avgMarketing = 0
  if (lastPeriodResult) {
    const results = lastPeriodResult.results
    avgPrice =
      results.reduce(
        (s, r) =>
          s +
          (lastPeriodResult.updatedCompanyStates.find((c) => c.id === r.companyId)?.decisions
            .price ?? 0),
        0
      ) / results.length
    avgMarketing =
      results.reduce(
        (s, r) =>
          s +
          (lastPeriodResult.updatedCompanyStates.find((c) => c.id === r.companyId)?.decisions
            .marketing ?? 0),
        0
      ) / results.length
  }

  const gamePhase =
    currentPeriod <= totalPeriods * 0.3
      ? 'early'
      : currentPeriod <= totalPeriods * 0.7
        ? 'mid'
        : 'late'
  const phaseLabel =
    gamePhase === 'early' ? 'Начало игры' : gamePhase === 'mid' ? 'Середина игры' : 'Финал'

  const effects: { label: string; value: string; positive: boolean }[] = []
  if (combined.demandMultiplier !== 1) {
    const pct = Math.round((combined.demandMultiplier - 1) * 100)
    effects.push({
      label: 'Спрос',
      value: `${pct > 0 ? '+' : ''}${pct}%`,
      positive: pct > 0,
    })
  }
  if (combined.variableCostMult !== 1) {
    const pct = Math.round((combined.variableCostMult - 1) * 100)
    effects.push({
      label: 'Себестоимость',
      value: `${pct > 0 ? '+' : ''}${pct}%`,
      positive: pct < 0,
    })
  }
  if (combined.marketingAlphaMod !== 0) {
    effects.push({
      label: 'Маркетинг',
      value: combined.marketingAlphaMod > 0 ? 'эффективнее' : 'слабее',
      positive: combined.marketingAlphaMod > 0,
    })
  }
  if (combined.rdBetaMod !== 0) {
    effects.push({
      label: 'R&D',
      value: combined.rdBetaMod > 0 ? 'эффективнее' : 'слабее',
      positive: combined.rdBetaMod > 0,
    })
  }

  return (
    <Card className="mb-5 border-blue-200/30 bg-gradient-to-r from-blue-50/30 to-indigo-50/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <span className="text-xs text-white">🔍</span>
          </div>
          Обзор рынка
          <span className="text-[10px] text-muted-foreground bg-white/50 px-2 py-0.5 rounded-full font-normal">
            {phaseLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Scenario & trend */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-blue-100/40">
          <span className="text-xl">{scenarioInfo.icon}</span>
          <div>
            <p className="text-sm font-semibold">Сценарий: {scenarioInfo.label}</p>
            <p className="text-xs text-muted-foreground">{scenarioInfo.trend}</p>
          </div>
        </div>

        {/* Market averages from last period */}
        {lastPeriodResult && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-white/40 border border-blue-100/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Средняя цена рынка
              </p>
              <p className="text-sm font-bold font-mono mt-0.5">{formatMoney(avgPrice)} УДЕ</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white/40 border border-blue-100/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Ср. маркетинг
              </p>
              <p className="text-sm font-bold font-mono mt-0.5">{formatMoney(avgMarketing)} УДЕ</p>
            </div>
          </div>
        )}

        {/* Active effects */}
        {effects.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Активные эффекты
            </p>
            <div className="flex flex-wrap gap-1.5">
              {effects.map((e, i) => (
                <EffectIndicator key={i} label={e.label} value={e.value} positive={e.positive} />
              ))}
            </div>
          </div>
        )}

        {/* Game phase tips */}
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          {gamePhase === 'early' &&
            'Рекомендуется инвестировать в оборудование и R&D для создания конкурентных преимуществ.'}
          {gamePhase === 'mid' &&
            'Середина игры — время использовать накопленные преимущества. Следите за долей рынка.'}
          {gamePhase === 'late' &&
            'Финальные периоды — сфокусируйтесь на максимизации прибыли и MPI.'}
        </p>
      </CardContent>
    </Card>
  )
}
