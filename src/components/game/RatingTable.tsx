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
        <CardTitle className="text-base">Рейтинг компаний</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Компания</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">MPI</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Доля</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Прибыль</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, idx) => {
                const company = companies.find((c) => c.id === r.companyId)
                const isPlayer = r.companyId === playerCompanyId
                return (
                  <tr
                    key={r.companyId}
                    className={`border-b last:border-0 transition-colors ${
                      isPlayer ? 'bg-primary/5 font-semibold' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="px-4 py-2.5">
                      {company?.name ?? r.companyId}
                      {isPlayer && <span className="ml-1.5 text-xs text-primary">(вы)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatMPI(r.mpi)}</td>
                    <td className="px-4 py-2.5 text-right">{formatPercent(r.marketShare)}</td>
                    <td
                      className={`px-4 py-2.5 text-right ${
                        r.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
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
