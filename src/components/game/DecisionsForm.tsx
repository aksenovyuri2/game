import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import type { Decisions } from '@/engine/types'

interface FieldConfig {
  key: keyof Decisions
  label: string
  hint: string
  min: number
  max: number
  step: number
  unit: string
}

const FIELDS: FieldConfig[] = [
  {
    key: 'price',
    label: 'Цена продукции',
    hint: 'Влияет на спрос (ниже цена — выше спрос)',
    min: 30,
    max: 300,
    step: 1,
    unit: 'УДЕ',
  },
  {
    key: 'production',
    label: 'Объём производства',
    hint: 'Непроданные единицы хранятся на складе',
    min: 0,
    max: 4000,
    step: 50,
    unit: 'шт.',
  },
  {
    key: 'marketing',
    label: 'Маркетинг',
    hint: 'Увеличивает спрос с убывающей отдачей',
    min: 0,
    max: 100000,
    step: 1000,
    unit: 'УДЕ',
  },
  {
    key: 'capitalInvestment',
    label: 'Капитальные инвестиции',
    hint: 'Снижают себестоимость, амортизируются 15%/период',
    min: 0,
    max: 100000,
    step: 1000,
    unit: 'УДЕ',
  },
  {
    key: 'rd',
    label: 'НИОКР (R&D)',
    hint: 'Накапливаются, повышают качество и спрос',
    min: 0,
    max: 50000,
    step: 500,
    unit: 'УДЕ',
  },
]

interface DecisionsFormProps {
  onSubmit: (d: Decisions) => void
}

export function DecisionsForm({ onSubmit }: DecisionsFormProps) {
  const companies = useGameStore((s) => s.companies)
  const playerCompanyId = useGameStore((s) => s.playerCompanyId)
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

  if (!player) return null

  const totalSpend = decisions.marketing + decisions.capitalInvestment + decisions.rd
  const cashAfter = player.cash - totalSpend
  const isOverBudget = cashAfter < 0

  const set = (key: keyof Decisions, value: number) =>
    setDecisions((prev) => ({ ...prev, [key]: value }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Решения на период</CardTitle>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Касса: {formatMoney(player.cash)} УДЕ</span>
          <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
            После расходов: {formatMoney(cashAfter)} УДЕ
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {FIELDS.map((f) => {
          const val = decisions[f.key]
          return (
            <div key={f.key} className="space-y-1">
              <div className="flex justify-between items-baseline">
                <label className="text-sm font-medium">{f.label}</label>
                <span className="text-sm font-mono text-primary">
                  {f.key === 'production' ? `${val} ${f.unit}` : `${formatMoney(val)} ${f.unit}`}
                </span>
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={val}
                onChange={(e) => set(f.key, +e.target.value)}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{f.min}</span>
                <span className="italic">{f.hint}</span>
                <span>{f.key === 'production' ? f.max : formatMoney(f.max)}</span>
              </div>
            </div>
          )
        })}

        <Button
          className="w-full mt-2"
          size="lg"
          onClick={() => onSubmit(decisions)}
          disabled={isOverBudget}
        >
          {isOverBudget ? 'Недостаточно средств' : 'Завершить период →'}
        </Button>
      </CardContent>
    </Card>
  )
}
