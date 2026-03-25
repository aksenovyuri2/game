import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, formatMPI, formatPercent } from '@/lib/format'
import type { PeriodResult } from '@/engine/types'
import type { CompanyState } from '@/engine/types'

interface RatingTableProps {
  results: PeriodResult[]
  companies: CompanyState[]
  playerCompanyId: string | null
}

export function RatingTable({ results, companies, playerCompanyId }: RatingTableProps) {
  const sorted = [...results].sort((a, b) => b.mpi - a.mpi)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="size-2 rounded-full bg-chart-3" />
          Рейтинг компаний
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
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
                    className={`border-b last:border-0 transition-colors ${
                      isBankrupt
                        ? 'opacity-50'
                        : isPlayer
                          ? 'bg-primary/5 font-semibold'
                          : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {company?.name ?? r.companyId}
                        {isPlayer && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            ВЫ
                          </span>
                        )}
                        {isBankrupt && (
                          <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            БАНКРОТ
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatMPI(r.mpi)}</td>
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
