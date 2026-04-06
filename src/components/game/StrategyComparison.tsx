import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import type { StrategyProfile } from '@/engine/analytics'

interface StrategyComparisonProps {
  profiles: StrategyProfile[]
  playerCompanyId: string
}

function Bar({
  value,
  max,
  label,
  color,
}: {
  value: number
  max: number
  label: string
  color: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-20 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-14">{formatMoney(value)}</span>
    </div>
  )
}

export function StrategyComparison({ profiles, playerCompanyId }: StrategyComparisonProps) {
  if (profiles.length === 0) return null

  const maxMktg = Math.max(...profiles.map((p) => p.avgMarketing))
  const maxCapex = Math.max(...profiles.map((p) => p.avgCapex))
  const maxRd = Math.max(...profiles.map((p) => p.avgRd))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-gradient-to-r from-chart-1 to-chart-4" />
          Сравнение стратегий
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {profiles.map((p) => {
          const isPlayer = p.companyId === playerCompanyId
          return (
            <div
              key={p.companyId}
              className={`p-3 rounded-xl border ${
                isPlayer ? 'border-primary/20 bg-primary/3' : 'border-border/20 bg-muted/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-semibold ${isPlayer ? 'text-gradient' : ''}`}>
                  {p.companyName}
                </span>
                {isPlayer && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                    ВЫ
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  Ср. цена: {Math.round(p.avgPrice)} УДЕ
                </span>
              </div>
              <div className="space-y-1.5">
                <Bar
                  value={p.avgMarketing}
                  max={maxMktg}
                  label="Маркетинг"
                  color="bg-gradient-to-r from-green-400 to-emerald-500"
                />
                <Bar
                  value={p.avgCapex}
                  max={maxCapex}
                  label="Инвестиции"
                  color="bg-gradient-to-r from-purple-400 to-violet-500"
                />
                <Bar
                  value={p.avgRd}
                  max={maxRd}
                  label="R&D"
                  color="bg-gradient-to-r from-pink-400 to-rose-500"
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
