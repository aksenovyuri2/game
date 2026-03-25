import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney, formatUnits, formatPercent } from '@/lib/format'
import type { PeriodResult } from '@/engine/types'

interface PeriodReportProps {
  result: PeriodResult
  companyName: string
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'positive' | 'negative' | 'neutral'
}) {
  const cls =
    highlight === 'positive'
      ? 'text-green-600 font-semibold'
      : highlight === 'negative'
        ? 'text-red-600 font-semibold'
        : ''
  return (
    <div className="flex justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono ${cls}`}>{value}</span>
    </div>
  )
}

export function PeriodReport({ result, companyName }: PeriodReportProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Отчёт: {companyName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Продажи */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Продажи
          </p>
          <Row label="Продано единиц" value={`${formatUnits(result.unitsSold)} шт.`} />
          <Row label="Остаток на складе" value={`${formatUnits(result.endInventory)} шт.`} />
          <Row label="Доля рынка" value={formatPercent(result.marketShare)} />
        </div>

        {/* Финансы */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Финансовый результат (УДЕ)
          </p>
          <Row label="Выручка" value={formatMoney(result.revenue)} />
          <Row label="Себестоимость реализованного" value={`−${formatMoney(result.cogs)}`} />
          <Row label="Валовая прибыль" value={formatMoney(result.grossProfit)} />
          <Row label="Постоянные затраты" value={`−${formatMoney(result.fixedCosts)}`} />
          <Row label="Маркетинг" value={`−${formatMoney(result.marketingExpense)}`} />
          <Row label="НИОКР" value={`−${formatMoney(result.rdExpense)}`} />
          <Row label="Амортизация" value={`−${formatMoney(result.depreciation)}`} />
          <Row label="Складские расходы" value={`−${formatMoney(result.storageCost)}`} />
          <Row
            label="EBIT"
            value={formatMoney(result.ebit)}
            highlight={result.ebit >= 0 ? 'positive' : 'negative'}
          />
          <Row label="Налог (20%)" value={`−${formatMoney(result.tax)}`} />
          <Row
            label="Чистая прибыль"
            value={`${result.netProfit >= 0 ? '+' : ''}${formatMoney(result.netProfit)}`}
            highlight={result.netProfit >= 0 ? 'positive' : 'negative'}
          />
        </div>

        {/* Баланс */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Баланс (конец периода)
          </p>
          <Row label="Касса" value={`${formatMoney(result.newCash)} УДЕ`} />
          <Row label="Оборудование" value={`${formatMoney(result.newEquipment)} УДЕ`} />
          <Row
            label="Нераспределённая прибыль"
            value={`${formatMoney(result.newRetainedEarnings)} УДЕ`}
            highlight={result.newRetainedEarnings >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </CardContent>
    </Card>
  )
}
