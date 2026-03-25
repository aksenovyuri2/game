import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

export default function HelpScreen() {
  return (
    <PageLayout title="Справка" showBack>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Как играть</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Всё, что нужно знать для успешного управления компанией
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">О игре</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              BizSim — это экономическая симуляция. Вы управляете компанией, производящей{' '}
              <strong className="text-foreground">Эко-Ручку</strong>, и конкурируете с
              ИИ-оппонентами на едином рынке. В каждом периоде (квартале) все компании одновременно
              принимают 5 решений, после чего система рассчитывает результаты. Побеждает тот, кто
              наберёт наивысший <strong className="text-foreground">MPI</strong> по итогам всех
              периодов.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">5 решений игрока</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PARAMS.map((p) => (
              <div key={p.name} className="flex gap-3 items-start p-3 rounded-xl bg-secondary/50">
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
            <CardTitle className="text-base">Индекс эффективности (MPI)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              MPI рассчитывается по 6 факторам и отражает общую эффективность управления:
            </p>
            <div className="space-y-3">
              {MPI_FACTORS.map((f) => (
                <div key={f.name} className="flex gap-3 items-start">
                  <span className="text-xs font-bold font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-lg shrink-0 w-14 text-center">
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
            <CardTitle className="text-base">Советы</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                Следите за долей рынка — резкое снижение сигнализирует о проблемах с ценой или
                маркетингом.
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                Инвестируйте в оборудование для снижения себестоимости.
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                Не забывайте о складских расходах — перепроизводство стоит денег.
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                На уровне «Мастер» у ИИ нет случайности — он использует оптимальные стратегии.
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">→</span>
                Нераспределённая прибыль — главный показатель MPI, держите компанию прибыльной.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
