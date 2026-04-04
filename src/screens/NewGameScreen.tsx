import { useState } from 'react'
import { useNavigation } from '@/app/router'
import { useGameStore, type NewGameParams } from '@/store/gameStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Difficulty, MarketScenario, StartingCashPreset } from '@/engine/types'

const DIFFICULTIES: { value: Difficulty; label: string; desc: string; icon: string }[] = [
  {
    value: 'novice',
    label: 'Новичок',
    desc: 'ИИ делает случайные ошибки. Идеально для знакомства.',
    icon: '🌱',
  },
  {
    value: 'medium',
    label: 'Средний',
    desc: 'ИИ использует базовые стратегии.',
    icon: '⚡',
  },
  {
    value: 'expert',
    label: 'Эксперт',
    desc: 'ИИ анализирует рынок и адаптируется.',
    icon: '🎯',
  },
  {
    value: 'master',
    label: 'Мастер',
    desc: 'ИИ играет оптимально. Вызов для профи.',
    icon: '👑',
  },
]

const STARTING_CASH: {
  value: StartingCashPreset
  label: string
  amount: string
  desc: string
  icon: string
}[] = [
  {
    value: 'low',
    label: 'Низкий',
    amount: '30 000',
    desc: 'Минимум ресурсов. Нужна точная стратегия.',
    icon: '🪙',
  },
  {
    value: 'medium',
    label: 'Средний',
    amount: '50 000',
    desc: 'Стандартный старт. Есть запас для манёвров.',
    icon: '💰',
  },
  {
    value: 'high',
    label: 'Высокий',
    amount: '80 000',
    desc: 'Комфортный старт. Можно экспериментировать.',
    icon: '🏦',
  },
]

const SCENARIOS: { value: MarketScenario; label: string; desc: string; icon: string }[] = [
  { value: 'stable', label: 'Стабильный', desc: 'Ровный спрос.', icon: '📊' },
  { value: 'growing', label: 'Растущий', desc: 'Рынок +3%/период.', icon: '📈' },
  { value: 'crisis', label: 'Кризисный', desc: 'Спрос -5%/период.', icon: '📉' },
  { value: 'random', label: 'Случайный', desc: 'Колебания +-15%.', icon: '🎲' },
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
    startingCash: 'medium',
  })

  const handleStart = () => {
    initGame(params)
    navigate('game')
  }

  return (
    <PageLayout title="Новая игра" showBack>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Настройка игры</h1>
          <p className="text-muted-foreground text-sm mt-1">Выберите параметры новой игры</p>
        </div>

        {/* Company name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-xs">
                🏢
              </span>
              Название вашей компании
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Например: МегаПром"
              value={params.playerName}
              onChange={(e) => setParams((p) => ({ ...p, playerName: e.target.value }))}
              maxLength={30}
              className="h-12 text-base rounded-xl"
            />
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-xs">
                🎮
              </span>
              Уровень сложности ИИ
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setParams((p) => ({ ...p, difficulty: d.value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  params.difficulty === d.value
                    ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
                    : 'border-transparent bg-secondary/40 hover:bg-secondary/70 hover:border-border/50'
                }`}
              >
                <span className="text-2xl">{d.icon}</span>
                <p className="font-semibold text-sm mt-2">{d.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{d.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Scenario */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-xs">
                📊
              </span>
              Рыночный сценарий
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {SCENARIOS.map((s) => (
              <button
                key={s.value}
                onClick={() => setParams((p) => ({ ...p, scenario: s.value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  params.scenario === s.value
                    ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
                    : 'border-transparent bg-secondary/40 hover:bg-secondary/70 hover:border-border/50'
                }`}
              >
                <span className="text-2xl">{s.icon}</span>
                <p className="font-semibold text-sm mt-2">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Starting cash */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-xs">
                💵
              </span>
              Стартовый капитал
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            {STARTING_CASH.map((s) => (
              <button
                key={s.value}
                onClick={() => setParams((p) => ({ ...p, startingCash: s.value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  params.startingCash === s.value
                    ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
                    : 'border-transparent bg-secondary/40 hover:bg-secondary/70 hover:border-border/50'
                }`}
              >
                <span className="text-2xl">{s.icon}</span>
                <p className="font-semibold text-sm mt-2">{s.label}</p>
                <p className="text-xs font-bold text-gradient mt-0.5">{s.amount} УДЕ</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-xs">
                ⚙️
              </span>
              Параметры игры
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-sm font-medium">Количество периодов</label>
                <span className="text-sm font-bold text-primary bg-primary/8 px-3 py-1 rounded-lg">
                  {params.totalPeriods}
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={24}
                value={params.totalPeriods}
                onChange={(e) => setParams((p) => ({ ...p, totalPeriods: +e.target.value }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>8 (короткая)</span>
                <span>24 (длинная)</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-sm font-medium">ИИ-конкурентов</label>
                <span className="text-sm font-bold text-primary bg-primary/8 px-3 py-1 rounded-lg">
                  {params.aiCount}
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={7}
                value={params.aiCount}
                onChange={(e) => setParams((p) => ({ ...p, aiCount: +e.target.value }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>2</span>
                <span>7</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full h-14 text-base rounded-2xl shadow-lg shadow-primary/20"
          onClick={handleStart}
        >
          Начать игру
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="ml-1">
            <path
              d="M4 10H16M16 10L11 5M16 10L11 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </PageLayout>
  )
}
