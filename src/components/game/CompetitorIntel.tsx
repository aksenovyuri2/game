import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import type { CompanyState, Difficulty } from '@/engine/types'
import { useState } from 'react'

interface CompetitorIntelProps {
  companies: CompanyState[]
  playerCompanyId: string | null
  difficulty: Difficulty
}

function ComparisonValue({
  value,
  playerValue,
  unit,
  inverse,
}: {
  value: number
  playerValue: number
  unit: string
  inverse?: boolean
}) {
  const diff = value - playerValue
  const isHigher = inverse ? diff < 0 : diff > 0
  const isLower = inverse ? diff > 0 : diff < 0
  const colorCls = isHigher ? 'text-emerald-600' : isLower ? 'text-red-500' : 'text-foreground'

  return (
    <span className={`font-mono text-sm ${colorCls}`}>
      {unit === 'шт.' ? `${value}` : formatMoney(value)} {unit}
    </span>
  )
}

export function CompetitorIntel({ companies, playerCompanyId, difficulty }: CompetitorIntelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const player = companies.find((c) => c.id === playerCompanyId)
  const competitors = companies.filter((c) => c.id !== playerCompanyId && !c.isBankrupt)

  if (!player || competitors.length === 0) return null

  const showFull = difficulty === 'expert' || difficulty === 'master'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-gradient-to-r from-chart-4 to-purple-400" />
          Разведка конкурентов
          {!showFull && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-normal">
              Полные данные на Expert+
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {competitors.map((comp) => {
          const isExpanded = expanded === comp.id
          const d = comp.decisions
          const pd = player.decisions
          const capex = d.capex ?? d.capitalInvestment ?? 0
          const playerCapex = pd.capex ?? pd.capitalInvestment ?? 0

          return (
            <button
              key={comp.id}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                isExpanded
                  ? 'border-primary/20 bg-primary/3'
                  : 'border-border/30 bg-muted/20 hover:bg-muted/40'
              }`}
              onClick={() => setExpanded(isExpanded ? null : comp.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{comp.name}</span>
                  {comp.aiCharacter && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {comp.aiCharacter === 'cautious'
                        ? 'Осторожный'
                        : comp.aiCharacter === 'aggressive'
                          ? 'Агрессивный'
                          : comp.aiCharacter === 'balanced'
                            ? 'Сбалансир.'
                            : 'Адаптивный'}
                    </span>
                  )}
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <path
                    d="M3 5L7 9L11 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Always show price */}
              <div className="flex gap-4 mt-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Цена: </span>
                  <ComparisonValue value={d.price} playerValue={pd.price} unit="УДЕ" inverse />
                </div>
                <div>
                  <span className="text-muted-foreground">Маркетинг: </span>
                  <ComparisonValue value={d.marketing} playerValue={pd.marketing} unit="УДЕ" />
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 gap-3 text-xs animate-fade-in">
                  <div>
                    <span className="text-muted-foreground">Производство: </span>
                    <ComparisonValue value={d.production} playerValue={pd.production} unit="шт." />
                  </div>
                  {showFull && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Инвестиции: </span>
                        <ComparisonValue value={capex} playerValue={playerCapex} unit="УДЕ" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">R&D: </span>
                        <ComparisonValue value={d.rd} playerValue={pd.rd} unit="УДЕ" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Оборудование: </span>
                        <span className="font-mono text-sm">{formatMoney(comp.equipment)} УДЕ</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
