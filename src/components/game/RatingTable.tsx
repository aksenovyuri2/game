import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, formatMPI, formatPercent } from '@/lib/format'
import type { PeriodResult } from '@/engine/types'
import type { CompanyState } from '@/engine/types'

interface RatingTableProps {
  results: PeriodResult[]
  companies: CompanyState[]
  playerCompanyId: string | null
}

const RANK_BADGES = ['🥇', '🥈', '🥉']

export function RatingTable({ results, companies, playerCompanyId }: RatingTableProps) {
  const sorted = [...results].sort((a, b) => b.mpi - a.mpi)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-gradient-to-r from-chart-3 to-amber-400" />
          Рейтинг компаний
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  #
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Компания
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  MPI
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Доля
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Прибыль
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, idx) => {
                const company = companies.find((c) => c.id === r.companyId)
                const isPlayer = r.companyId === playerCompanyId
                const isBankrupt = company?.isBankrupt === true
                return (
                  <tr
                    key={r.companyId}
                    className={`border-b border-border/30 last:border-0 transition-colors duration-200 ${
                      isBankrupt ? 'opacity-40' : isPlayer ? 'bg-primary/5' : 'hover:bg-muted/20'
                    }`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {idx < 3 ? RANK_BADGES[idx] : idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={isPlayer ? 'font-semibold' : ''}>
                          {company?.name ?? r.companyId}
                        </span>
                        {isPlayer && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                            ВЫ
                          </span>
                        )}
                        {isBankrupt && (
                          <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-md">
                            БАНКРОТ
                          </span>
                        )}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${isPlayer ? 'font-semibold text-gradient' : ''}`}
                    >
                      {formatMPI(r.mpi)}
                    </td>
                    <td className="px-4 py-3 text-right">{formatPercent(r.marketShare)}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${
                        r.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {r.netProfit >= 0 ? '+' : ''}
                      {formatMoney(r.netProfit)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
