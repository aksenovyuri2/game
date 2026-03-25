import { PageLayout } from '@/components/layout/PageLayout'

const PARAMS = [
  {
    name: 'Цена продукции',
    desc: 'Розничная цена за единицу Эко-Ручки (УДЕ). Снижение цены увеличивает спрос, но уменьшает выручку на единицу.',
  },
  {
    name: 'Объём производства',
    desc: 'Количество единиц товара на следующий период. Непроданное уходит на склад (с расходами на хранение).',
  },
  {
    name: 'Маркетинг',
    desc: 'Бюджет на рекламу. Увеличивает известность бренда и спрос с убывающей отдачей.',
  },
  {
    name: 'Капитальные инвестиции',
    desc: 'Вложения в оборудование. Снижают переменную себестоимость и повышают производительность. Амортизируются 15%/период.',
  },
  {
    name: 'НИОКР (R&D)',
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
        <h1 className="text-2xl font-bold">Как играть</h1>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">О игре</h2>
          <p className="text-muted-foreground leading-relaxed">
            BizSim — это экономическая симуляция. Вы управляете компанией, производящей{' '}
            <strong>Эко-Ручку</strong>, и конкурируете с ИИ-оппонентами на едином рынке. В каждом
            периоде (квартале) все компании одновременно принимают 5 решений, после чего система
            рассчитывает результаты. Побеждает тот, кто наберёт наивысший <strong>MPI</strong> по
            итогам всех периодов.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5 решений игрока</h2>
          <div className="space-y-3">
            {PARAMS.map((p) => (
              <div key={p.name} className="border rounded-lg p-3">
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Индекс эффективности (MPI)</h2>
          <p className="text-sm text-muted-foreground">
            MPI рассчитывается по 6 факторам и отражает общую эффективность управления:
          </p>
          <div className="space-y-2">
            {MPI_FACTORS.map((f) => (
              <div key={f.name} className="flex gap-3 items-start">
                <span className="text-xs font-mono bg-secondary px-2 py-1 rounded shrink-0 w-12 text-center">
                  {f.weight}
                </span>
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Советы</h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>
              Следите за долей рынка — резкое снижение сигнализирует о проблемах с ценой или
              маркетингом.
            </li>
            <li>Инвестируйте в оборудование для снижения себестоимости.</li>
            <li>Не забывайте о складских расходах — перепроизводство стоит денег.</li>
            <li>На уровне «Мастер» у ИИ нет случайности — он использует оптимальные стратегии.</li>
            <li>Нераспределённая прибыль — главный показатель MPI, держите компанию прибыльной.</li>
          </ul>
        </section>
      </div>
    </PageLayout>
  )
}
