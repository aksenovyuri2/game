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
    <div
      className={`flex justify-between py-2.5 border-b border-dashed border-border/50 last:border-0 last:pb-0 ${bold ? 'bg-muted/20 -mx-1 px-1 rounded-md' : ''}`}
    >
      <span className={`text-sm ${bold ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <span className={`text-sm font-mono ${colorCls} ${fontCls}`}>{value}</span>
    </div>
  )
}

function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-1 mt-1">
      <span className="text-xs">{icon}</span>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{label}</p>
    </div>
  )
}

export function PeriodReport({ result, companyName }: PeriodReportProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-gradient-to-r from-primary to-primary/70" />
          Отчёт: {companyName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <SectionHeader label="Продажи" icon="📦" />
          <Row label="Продано единиц" value={`${formatUnits(result.unitsSold)} шт.`} />
          <Row label="Остаток на складе" value={`${formatUnits(result.endInventory)} шт.`} />
          <Row label="Доля рынка" value={formatPercent(result.marketShare)} bold />
        </div>

        <div>
          <SectionHeader label="Финансовый результат (УДЕ)" icon="💹" />
          <Row label="Выручка" value={formatMoney(result.revenue)} />
          <Row
            label="Себестоимость"
            value={`-${formatMoney(result.costOfGoodsSold ?? result.cogs ?? 0)}`}
          />
          <Row label="Валовая прибыль" value={formatMoney(result.grossProfit)} bold />
          <Row label="Маркетинг" value={`-${formatMoney(result.marketingExpense ?? 0)}`} />
          <Row label="НИОКР" value={`-${formatMoney(result.rdExpense ?? 0)}`} />
          <Row label="Амортизация" value={`-${formatMoney(result.depreciation ?? 0)}`} />
          <Row
            label="Складские расходы"
            value={`-${formatMoney(result.holdingCost ?? result.storageCost ?? 0)}`}
          />
          <Row
            label="Операционная прибыль"
            value={formatMoney(result.operatingProfit ?? result.ebit ?? 0)}
            highlight={(result.operatingProfit ?? result.ebit ?? 0) >= 0 ? 'positive' : 'negative'}
            bold
          />
          <Row label="Налог (20%)" value={`-${formatMoney(result.tax)}`} />
          <Row
            label="Чистая прибыль"
            value={`${result.netProfit >= 0 ? '+' : ''}${formatMoney(result.netProfit)}`}
            highlight={result.netProfit >= 0 ? 'positive' : 'negative'}
            bold
          />
        </div>

        <div>
          <SectionHeader label="Баланс (конец периода)" icon="🏦" />
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
