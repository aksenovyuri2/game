import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import type { Decisions } from '@/engine/types'
import { calcVariableCostPerUnit } from '@/engine/costs'

interface FieldConfig {
  key: keyof Decisions
  label: string
  hint: string
  min: number
  max: number
  step: number
  unit: string
  icon: string
}

const FIELDS: FieldConfig[] = [
  {
    key: 'price',
    label: 'Цена продукции',
    hint: 'Ниже цена — выше спрос',
    min: 30,
    max: 300,
    step: 1,
    unit: 'УДЕ',
    icon: '💰',
  },
  {
    key: 'production',
    label: 'Объём производства',
    hint: 'Непроданное хранится на складе',
    min: 0,
    max: 4000,
    step: 50,
    unit: 'шт.',
    icon: '🏭',
  },
  {
    key: 'marketing',
    label: 'Маркетинг',
    hint: 'Убывающая отдача',
    min: 0,
    max: 100000,
    step: 1000,
    unit: 'УДЕ',
    icon: '📢',
  },
  {
    key: 'capitalInvestment',
    label: 'Капитальные инвестиции',
    hint: 'Снижают себестоимость',
    min: 0,
    max: 100000,
    step: 1000,
    unit: 'УДЕ',
    icon: '🔧',
  },
  {
    key: 'rd',
    label: 'НИОКР (R&D)',
    hint: 'Накапливаются, повышают качество',
    min: 0,
    max: 50000,
    step: 500,
    unit: 'УДЕ',
    icon: '🔬',
  },
]

interface DecisionsFormProps {
  onSubmit: (d: Decisions) => void
}

export function DecisionsForm({ onSubmit }: DecisionsFormProps) {
  const companies = useGameStore((s) => s.companies)
  const playerCompanyId = useGameStore((s) => s.playerCompanyId)
  const config = useGameStore((s) => s.config)
  const player = companies.find((c) => c.id === playerCompanyId)

  const [decisions, setDecisions] = useState<Decisions>(
    player?.decisions ?? {
      price: 100,
      production: 1000,
      marketing: 10000,
      capitalInvestment: 10000,
      rd: 5000,
    }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!player || !config) return null

  // Расчёт полных расходов включая производство
  const variableCost = calcVariableCostPerUnit(player.equipment, config)
  const productionCost = decisions.production * variableCost
  const directSpend = decisions.marketing + decisions.capitalInvestment + decisions.rd
  const totalEstimatedCost = directSpend + productionCost
  const cashAfter = player.cash - directSpend - decisions.capitalInvestment
  const isOverBudget = cashAfter < 0
  const budgetUsedPercent = player.cash > 0 ? Math.min(100, (directSpend / player.cash) * 100) : 100

  const set = (key: keyof Decisions, value: number) =>
    setDecisions((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = () => {
    if (isSubmitting || isOverBudget) return
    setIsSubmitting(true)
    onSubmit(decisions)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Решения на период</CardTitle>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Касса: {formatMoney(player.cash)} УДЕ</span>
            <span
              className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}
            >
              Остаток: {formatMoney(cashAfter)} УДЕ
            </span>
          </div>
          {/* Budget progress bar */}
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget
                  ? 'bg-destructive'
                  : budgetUsedPercent > 70
                    ? 'bg-warning'
                    : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, budgetUsedPercent)}%` }}
            />
          </div>
          {/* Оценка затрат на производство */}
          <p className="text-xs text-muted-foreground">
            Оценка затрат на производство: ~{formatMoney(productionCost)} УДЕ (
            {formatMoney(variableCost)}/шт. × {decisions.production})
          </p>
          {totalEstimatedCost > player.cash * 0.9 && (
            <p className="text-xs text-warning font-medium">Высокие расходы — следите за кассой!</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {FIELDS.map((f) => {
          const val = decisions[f.key]
          return (
            <div key={f.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor={`field-${f.key}`}
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <span>{f.icon}</span>
                  {f.label}
                </label>
                <span className="text-sm font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {f.key === 'production' ? `${val} ${f.unit}` : `${formatMoney(val)} ${f.unit}`}
                </span>
              </div>
              <input
                id={`field-${f.key}`}
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={val}
                onChange={(e) => set(f.key, +e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{f.min}</span>
                <span>{f.hint}</span>
                <span>{f.key === 'production' ? f.max : formatMoney(f.max)}</span>
              </div>
            </div>
          )
        })}

        <Button
          className="w-full mt-2 h-12 text-base rounded-xl"
          size="lg"
          onClick={handleSubmit}
          disabled={isOverBudget || isSubmitting}
        >
          {isSubmitting
            ? 'Расчёт...'
            : isOverBudget
              ? 'Недостаточно средств'
              : 'Завершить период →'}
        </Button>
      </CardContent>
    </Card>
  )
}
