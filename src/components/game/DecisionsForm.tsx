import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { Button } from '@/components/ui/button'
import { BubbleTip } from '@/components/ui/bubble-tip'
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
  color: string
}

const FIELDS: FieldConfig[] = [
  {
    key: 'price',
    label: 'Цена продукции',
    hint: 'Ниже цена — выше спрос',
    min: 10,
    max: 100,
    step: 1,
    unit: 'УДЕ',
    icon: '💰',
    color: 'from-amber-500 to-orange-500',
  },
  {
    key: 'production',
    label: 'Объём производства',
    hint: 'Непроданное хранится на складе',
    min: 0,
    max: 1500,
    step: 10,
    unit: 'шт.',
    icon: '🏭',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'marketing',
    label: 'Маркетинг',
    hint: 'Убывающая отдача',
    min: 0,
    max: 30000,
    step: 100,
    unit: 'УДЕ',
    icon: '📢',
    color: 'from-green-500 to-emerald-500',
  },
  {
    key: 'capex',
    label: 'Капитальные инвестиции',
    hint: 'Снижают себестоимость',
    min: 0,
    max: 40000,
    step: 100,
    unit: 'УДЕ',
    icon: '🔧',
    color: 'from-purple-500 to-violet-500',
  },
  {
    key: 'rd',
    label: 'НИОКР (R&D)',
    hint: 'Накапливаются, повышают качество',
    min: 0,
    max: 30000,
    step: 100,
    unit: 'УДЕ',
    icon: '🔬',
    color: 'from-pink-500 to-rose-500',
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
      price: 35,
      production: 800,
      marketing: 5000,
      capex: 5000,
      rd: 3000,
    }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showTip = useOnboardingStore((s) => s.show)

  if (!player || !config) return null

  const variableCost = calcVariableCostPerUnit(player.equipment, config)
  const productionCost = decisions.production * variableCost
  const capexAmount = decisions.capex ?? decisions.capitalInvestment ?? 0
  const directSpend = decisions.marketing + capexAmount + decisions.rd
  const totalEstimatedCost = directSpend + productionCost
  const cashAfter = player.cash - directSpend
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
        <CardTitle className="text-base flex items-center gap-2">
          <div className="size-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7.5L5.5 10L11 4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          Решения на период
        </CardTitle>
        <div className="space-y-2.5 mt-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Касса:{' '}
              <span className="font-mono font-medium text-foreground">
                {formatMoney(player.cash)}
              </span>{' '}
              УДЕ
            </span>
            <span
              className={`font-mono font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}
            >
              Остаток: {formatMoney(cashAfter)} УДЕ
            </span>
          </div>
          <BubbleTip
            id="budget-bar"
            arrow="top"
            content="Эта шкала показывает, сколько кассы вы тратите. Маркетинг, инвестиции и R&D — прямые расходы. Не забудьте про затраты на производство ниже!"
            step={4}
            totalSteps={5}
            onNext={() => showTip('submit-period')}
          >
            <div className="h-2.5 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isOverBudget
                    ? 'bg-gradient-to-r from-destructive to-destructive/80'
                    : budgetUsedPercent > 70
                      ? 'bg-gradient-to-r from-warning to-orange-400'
                      : 'bg-gradient-to-r from-primary to-primary/70'
                }`}
                style={{ width: `${Math.min(100, budgetUsedPercent)}%` }}
              />
            </div>
          </BubbleTip>
          <p className="text-xs text-muted-foreground">
            Оценка затрат на производство: ~{formatMoney(productionCost)} УДЕ (
            {formatMoney(variableCost)}/шт. x {decisions.production})
          </p>
          {totalEstimatedCost > player.cash * 0.9 && (
            <p className="text-xs text-warning font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1L11 10H1L6 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M6 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
              </svg>
              Высокие расходы — следите за кассой!
            </p>
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
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <span className="text-base">{f.icon}</span>
                  {f.label}
                </label>
                <span className="text-sm font-bold font-mono bg-gradient-to-r from-primary/10 to-primary/5 text-primary px-2.5 py-1 rounded-lg">
                  {f.key === 'production'
                    ? `${val} ${f.unit}`
                    : `${formatMoney(val ?? 0)} ${f.unit}`}
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
                <span className="text-muted-foreground/60">{f.hint}</span>
                <span>{f.key === 'production' ? f.max : formatMoney(f.max)}</span>
              </div>
            </div>
          )
        })}

        <BubbleTip
          id="submit-period"
          arrow="top"
          content="Когда будете готовы — нажмите, чтобы завершить период. Все компании (включая ИИ) ходят одновременно."
          step={5}
          totalSteps={5}
        >
          <Button
            className="w-full mt-2 h-12 text-base rounded-xl shadow-md shadow-primary/15"
            size="lg"
            onClick={handleSubmit}
            disabled={isOverBudget || isSubmitting}
          >
            {isSubmitting
              ? 'Расчёт...'
              : isOverBudget
                ? 'Недостаточно средств'
                : 'Завершить период'}
            {!isSubmitting && !isOverBudget && (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="ml-1">
                <path
                  d="M3 9H15M15 9L10 4M15 9L10 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Button>
        </BubbleTip>
      </CardContent>
    </Card>
  )
}
