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
  bold,
}: {
  label: string
  value: string
  highlight?: 'positive' | 'negative' | 'neutral'
  bold?: boolean
}) {
  const colorCls =
    highlight === 'positive' ? 'text-emerald-600' : highlight === 'negative' ? 'text-red-500' : ''
  const fontCls = bold || highlight ? 'font-semibold' : ''
  return (
    <div className="flex justify-between py-2 border-b border-dashed last:border-0 last:pb-0">
      <span className={`text-sm ${bold ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <span className={`text-sm font-mono ${colorCls} ${fontCls}`}>{value}</span>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-1 mt-1">
      {label}
    </p>
  )
}

export function PeriodReport({ result, companyName }: PeriodReportProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          Отчёт: {companyName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Продажи */}
        <div>
          <SectionHeader label="Продажи" />
          <Row label="Продано единиц" value={`${formatUnits(result.unitsSold)} шт.`} />
          <Row label="Остаток на складе" value={`${formatUnits(result.endInventory)} шт.`} />
          <Row label="Доля рынка" value={formatPercent(result.marketShare)} bold />
        </div>

        {/* Финансы */}
        <div>
          <SectionHeader label="Финансовый результат (УДЕ)" />
          <Row label="Выручка" value={formatMoney(result.revenue)} />
          <Row label="Себестоимость" value={`−${formatMoney(result.cogs)}`} />
          <Row label="Валовая прибыль" value={formatMoney(result.grossProfit)} bold />
          <Row label="Постоянные затраты" value={`−${formatMoney(result.fixedCosts)}`} />
          <Row label="Маркетинг" value={`−${formatMoney(result.marketingExpense)}`} />
          <Row label="НИОКР" value={`−${formatMoney(result.rdExpense)}`} />
          <Row label="Амортизация" value={`−${formatMoney(result.depreciation)}`} />
          <Row label="Складские расходы" value={`−${formatMoney(result.storageCost)}`} />
          <Row
            label="EBIT"
            value={formatMoney(result.ebit)}
            highlight={result.ebit >= 0 ? 'positive' : 'negative'}
            bold
          />
          <Row label="Налог (20%)" value={`−${formatMoney(result.tax)}`} />
          <Row
            label="Чистая прибыль"
            value={`${result.netProfit >= 0 ? '+' : ''}${formatMoney(result.netProfit)}`}
            highlight={result.netProfit >= 0 ? 'positive' : 'negative'}
            bold
          />
        </div>

        {/* Баланс */}
        <div>
          <SectionHeader label="Баланс (конец периода)" />
          <Row label="Касса" value={`${formatMoney(result.newCash)} УДЕ`} bold />
          <Row label="Оборудование" value={`${formatMoney(result.newEquipment)} УДЕ`} />
          <Row
            label="Нераспределённая прибыль"
            value={`${formatMoney(result.newRetainedEarnings)} УДЕ`}
            highlight={result.newRetainedEarnings >= 0 ? 'positive' : 'negative'}
            bold
          />
        </div>
      </CardContent>
    </Card>
  )
}
