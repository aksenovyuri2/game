import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SimulationPeriodResult, CompanyState } from '@/engine/types'

interface HistoryChartProps {
  history: SimulationPeriodResult[]
  companies: CompanyState[]
  playerCompanyId: string | null
  metric: 'mpi' | 'netProfit' | 'marketShare' | 'revenue'
}

const METRIC_LABELS: Record<string, string> = {
  mpi: 'MPI',
  netProfit: 'Чистая прибыль (УДЕ)',
  marketShare: 'Доля рынка (%)',
  revenue: 'Выручка (УДЕ)',
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

function formatValue(metric: string, value: number): string {
  if (metric === 'marketShare') return `${(value * 100).toFixed(1)}%`
  if (metric === 'mpi') return value.toFixed(1)
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)
}

export function HistoryChart({ history, companies, playerCompanyId, metric }: HistoryChartProps) {
  if (history.length === 0) return null

  const data = history.map((periodResult) => {
    const row: Record<string, number | string> = { period: `П${periodResult.period}` }
    periodResult.results.forEach((r) => {
      const company = companies.find((c) => c.id === r.companyId)
      const key = company?.name ?? r.companyId
      row[key] = metric === 'marketShare' ? r[metric] : (r[metric as keyof typeof r] as number)
    })
    return row
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="size-2 rounded-full bg-chart-1" />
          {METRIC_LABELS[metric]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => formatValue(metric, v)}
              width={60}
            />
            <Tooltip
              formatter={(value) => formatValue(metric, value as number)}
              labelStyle={{ fontWeight: 600 }}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid hsl(220 13% 91%)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            {companies.map((c, i) => (
              <Line
                key={c.id}
                type="monotone"
                dataKey={c.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={c.id === playerCompanyId ? 3 : 1.5}
                dot={c.id === playerCompanyId ? { r: 4 } : false}
                strokeDasharray={c.id === playerCompanyId ? undefined : '6 3'}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
