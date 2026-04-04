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

const COLORS = ['#7c3aed', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

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
          <div className="size-2.5 rounded-full bg-gradient-to-r from-chart-1 to-chart-4" />
          {METRIC_LABELS[metric]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 20% 90%)" opacity={0.5} />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="hsl(225 10% 65%)" />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => formatValue(metric, v)}
              width={60}
              stroke="hsl(225 10% 65%)"
            />
            <Tooltip
              formatter={(value) => formatValue(metric, value as number)}
              labelStyle={{ fontWeight: 600, color: 'hsl(225 50% 10%)' }}
              contentStyle={{
                borderRadius: '1rem',
                border: '1px solid hsl(225 20% 90%)',
                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(12px)',
                background: 'rgba(255,255,255,0.9)',
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
                dot={c.id === playerCompanyId ? { r: 4, strokeWidth: 2 } : false}
                strokeDasharray={c.id === playerCompanyId ? undefined : '6 3'}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
