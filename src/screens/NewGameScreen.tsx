import { useState } from 'react'
import { useNavigation } from '@/app/router'
import { useGameStore, type NewGameParams } from '@/store/gameStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Difficulty, MarketScenario } from '@/engine/types'

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  {
    value: 'novice',
    label: 'Новичок',
    desc: 'ИИ делает случайные ошибки. Идеально для знакомства с механикой.',
  },
  {
    value: 'medium',
    label: 'Средний',
    desc: 'ИИ использует базовые стратегии. Требует осознанных решений.',
  },
  {
    value: 'expert',
    label: 'Эксперт',
    desc: 'ИИ анализирует рынок и адаптируется. Победить непросто.',
  },
  {
    value: 'master',
    label: 'Мастер',
    desc: 'ИИ играет оптимально. Вызов даже для опытных игроков.',
  },
]

const SCENARIOS: { value: MarketScenario; label: string; desc: string }[] = [
  { value: 'stable', label: 'Стабильный', desc: 'Ровный спрос, предсказуемая экономика.' },
  { value: 'growing', label: 'Растущий', desc: 'Рынок расширяется +3%/период.' },
  { value: 'crisis', label: 'Кризисный', desc: 'Спрос падает −5%/период.' },
  { value: 'random', label: 'Случайный', desc: 'Непредсказуемые колебания спроса ±15%.' },
]

export default function NewGameScreen() {
  const { navigate } = useNavigation()
  const { initGame } = useGameStore()

  const [params, setParams] = useState<NewGameParams>({
    playerName: '',
    difficulty: 'medium',
    scenario: 'stable',
    totalPeriods: 12,
    aiCount: 4,
  })

  const handleStart = () => {
    initGame(params)
    navigate('game')
  }

  return (
    <PageLayout title="Новая игра" showBack>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Настройка игры</h1>

        {/* Название компании */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Название вашей компании</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Например: МегаПром"
              value={params.playerName}
              onChange={(e) => setParams((p) => ({ ...p, playerName: e.target.value }))}
              maxLength={30}
            />
          </CardContent>
        </Card>

        {/* Сложность */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Уровень сложности ИИ</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setParams((p) => ({ ...p, difficulty: d.value }))}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  params.difficulty === d.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <p className="font-medium text-sm">{d.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Сценарий */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Рыночный сценарий</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.value}
                onClick={() => setParams((p) => ({ ...p, scenario: s.value }))}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  params.scenario === s.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <p className="font-medium text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Параметры */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Параметры игры</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Количество периодов: <span className="text-primary">{params.totalPeriods}</span>
              </label>
              <input
                type="range"
                min={8}
                max={24}
                value={params.totalPeriods}
                onChange={(e) => setParams((p) => ({ ...p, totalPeriods: +e.target.value }))}
                className="w-full mt-1 accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>8 (короткая)</span>
                <span>24 (длинная)</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                ИИ-конкурентов: <span className="text-primary">{params.aiCount}</span>
              </label>
              <input
                type="range"
                min={2}
                max={7}
                value={params.aiCount}
                onChange={(e) => setParams((p) => ({ ...p, aiCount: +e.target.value }))}
                className="w-full mt-1 accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2</span>
                <span>7</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full h-12 text-base" onClick={handleStart}>
          Начать игру →
        </Button>
      </div>
    </PageLayout>
  )
}
