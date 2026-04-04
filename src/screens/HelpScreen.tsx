import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/store/onboardingStore'

const PARAMS = [
  {
    name: 'Цена продукции',
    icon: '💰',
    desc: 'Розничная цена за единицу Эко-Ручки (УДЕ). Снижение цены увеличивает спрос, но уменьшает выручку на единицу.',
  },
  {
    name: 'Объём производства',
    icon: '🏭',
    desc: 'Количество единиц товара на следующий период. Непроданное уходит на склад (с расходами на хранение).',
  },
  {
    name: 'Маркетинг',
    icon: '📢',
    desc: 'Бюджет на рекламу. Увеличивает известность бренда и спрос с убывающей отдачей.',
  },
  {
    name: 'Капитальные инвестиции',
    icon: '🔧',
    desc: 'Вложения в оборудование. Снижают переменную себестоимость и повышают производительность. Амортизируются 15%/период.',
  },
  {
    name: 'НИОКР (R&D)',
    icon: '🔬',
    desc: 'Инвестиции в разработки. Накапливаются и повышают качество продукции, увеличивая спрос.',
  },
]

const MPI_FACTORS = [
  {
    name: 'Нераспределённая прибыль',
    weight: '35%',
    desc: 'Главный показатель — накопленная прибыль за все периоды.',
  },
  {
    name: 'Потенциал спроса',
    weight: '15%',
    desc: 'Маркетинг + R&D: насколько компания привлекательна для рынка.',
  },
  {
    name: 'Потенциал предложения',
    weight: '15%',
    desc: 'Стоимость оборудования относительно эталона.',
  },
  { name: 'Производительность', weight: '15%', desc: 'Отношение выручки к суммарным затратам.' },
  { name: 'Доля рынка', weight: '10%', desc: 'Доля продаж компании в общем объёме рынка.' },
  { name: 'Рост', weight: '10%', desc: 'Прибыльность текущего периода.' },
]

const TIPS = [
  'Следите за долей рынка — резкое снижение сигнализирует о проблемах с ценой или маркетингом.',
  'Инвестируйте в оборудование для снижения себестоимости.',
  'Не забывайте о складских расходах — перепроизводство стоит денег.',
  'На уровне «Мастер» у ИИ нет случайности — он использует оптимальные стратегии.',
  'Нераспределённая прибыль — главный показатель MPI, держите компанию прибыльной.',
]

export default function HelpScreen() {
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding)
  const [resetDone, setResetDone] = useState(false)

  const handleReset = () => {
    resetOnboarding()
    setResetDone(true)
    setTimeout(() => setResetDone(false), 2000)
  }

  return (
    <PageLayout title="Справка" showBack>
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Как играть</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Всё, что нужно знать для успешного управления компанией
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                🎮
              </span>
              Об игре
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              BizSim — это экономическая симуляция. Вы управляете компанией, производящей{' '}
              <strong className="text-foreground">Эко-Ручку</strong>, и конкурируете с
              ИИ-оппонентами на едином рынке. В каждом периоде (квартале) все компании одновременно
              принимают 5 решений, после чего система рассчитывает результаты. Побеждает тот, кто
              наберёт наивысший <strong className="text-gradient">MPI</strong> по итогам всех
              периодов.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                📋
              </span>
              5 решений игрока
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PARAMS.map((p) => (
              <div
                key={p.name}
                className="flex gap-3 items-start p-3.5 rounded-xl bg-muted/30 border border-border/30"
              >
                <span className="text-xl shrink-0">{p.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                📊
              </span>
              Индекс эффективности (MPI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              MPI рассчитывается по 6 факторам и отражает общую эффективность управления:
            </p>
            <div className="space-y-3">
              {MPI_FACTORS.map((f) => (
                <div key={f.name} className="flex gap-3 items-start">
                  <span className="text-xs font-bold font-mono bg-gradient-to-r from-primary/15 to-primary/5 text-primary px-2.5 py-1 rounded-lg shrink-0 w-14 text-center">
                    {f.weight}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                💡
              </span>
              Советы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="size-5 rounded-md bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5H8M8 5L5.5 2.5M8 5L5.5 7.5"
                        stroke="hsl(250 85% 60%)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Подсказки</p>
              <p className="text-xs text-muted-foreground">Показать обучающие подсказки заново</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={resetDone}>
              {resetDone ? 'Готово!' : 'Сбросить подсказки'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
