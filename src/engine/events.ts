import type { MarketEventDef, ActiveEvent, CombinedEffects, EventEffects } from './types'
import { seededRandom } from '../ai/base'

// ─── Пул событий (50+ штук) ─────────────────────────────────────────────────

export const EVENT_POOL: MarketEventDef[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // ЭКОНОМИКА (15)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'econ-crisis',
    category: 'economy',
    title: 'Мировой экономический кризис',
    description:
      'В мире начался экономический кризис. Потребители экономят на всём — спрос значительно падает. Рекомендуется сократить производство и снизить расходы.',
    effects: { demandMultiplier: 0.75, priceElasticityMod: 0.3 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'econ-boom',
    category: 'economy',
    title: 'Экономический бум',
    description:
      'Мировая экономика на подъёме! Потребители активно тратят деньги — спрос растёт. Самое время увеличить производство и вложиться в маркетинг.',
    effects: { demandMultiplier: 1.25, priceElasticityMod: -0.2 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'econ-inflation',
    category: 'economy',
    title: 'Рост инфляции',
    description:
      'Инфляция ускоряется — себестоимость производства и хранения растёт. Закупочные цены на сырьё увеличились. Стоит задуматься о повышении цен.',
    effects: { variableCostMult: 1.15, fixedCostMult: 1.1, storageCostMult: 1.2 },
    minDuration: 2,
    maxDuration: 5,
  },
  {
    id: 'econ-deflation',
    category: 'economy',
    title: 'Дефляция',
    description:
      'Цены на сырьё и ресурсы снижаются. Производство и хранение становятся дешевле. Можно снизить цены для захвата рынка.',
    effects: { variableCostMult: 0.88, fixedCostMult: 0.92, storageCostMult: 0.85 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'econ-currency-crisis',
    category: 'economy',
    title: 'Девальвация валюты',
    description:
      'Национальная валюта обесценилась. Импортное сырьё подорожало, но экспортные возможности выросли. Переменные затраты растут, спрос слегка повышен.',
    effects: { variableCostMult: 1.2, demandMultiplier: 1.08 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'econ-stock-crash',
    category: 'economy',
    title: 'Обвал фондового рынка',
    description:
      'Биржевые индексы рухнули. Потребительская уверенность на минимуме — люди откладывают крупные покупки. Резкое падение спроса.',
    effects: { demandMultiplier: 0.7, priceElasticityMod: 0.5 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'econ-consumer-confidence',
    category: 'economy',
    title: 'Рост потребительской уверенности',
    description:
      'Опросы показывают высокий уровень потребительской уверенности. Люди готовы тратить больше и менее чувствительны к ценам.',
    effects: { demandMultiplier: 1.12, priceElasticityMod: -0.3 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'econ-credit-crunch',
    category: 'economy',
    title: 'Кредитный кризис',
    description:
      'Банки ужесточили условия кредитования. Потребители не могут брать кредиты — спрос на дорогие товары падает.',
    effects: { demandMultiplier: 0.85, priceElasticityMod: 0.4 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'econ-stimulus',
    category: 'economy',
    title: 'Государственные субсидии',
    description:
      'Правительство запустило программу стимулирования экономики. Субсидии снижают постоянные расходы и повышают покупательную способность.',
    effects: { fixedCostMult: 0.85, demandMultiplier: 1.1 },
    minDuration: 2,
    maxDuration: 3,
  },
  {
    id: 'econ-trade-war',
    category: 'economy',
    title: 'Торговая война',
    description:
      'Страны ввели взаимные пошлины. Стоимость сырья выросла, а часть рынков закрылась. Производство дорожает, спрос снижается.',
    effects: { variableCostMult: 1.18, demandMultiplier: 0.9 },
    minDuration: 2,
    maxDuration: 5,
  },
  {
    id: 'econ-interest-rise',
    category: 'economy',
    title: 'Повышение ключевой ставки',
    description:
      'Центробанк повысил ключевую ставку. Потребительские кредиты подорожали — расходы населения снижаются.',
    effects: { demandMultiplier: 0.92, priceElasticityMod: 0.15 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'econ-interest-fall',
    category: 'economy',
    title: 'Снижение ключевой ставки',
    description:
      'Центробанк снизил ключевую ставку. Кредиты подешевели — потребители готовы тратить больше.',
    effects: { demandMultiplier: 1.08, priceElasticityMod: -0.1 },
    minDuration: 2,
    maxDuration: 3,
  },
  {
    id: 'econ-energy-crisis',
    category: 'economy',
    title: 'Энергетический кризис',
    description:
      'Цены на энергоносители резко выросли. Производство и хранение товаров значительно подорожали.',
    effects: { variableCostMult: 1.25, fixedCostMult: 1.15, storageCostMult: 1.3 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'econ-cheap-energy',
    category: 'economy',
    title: 'Дешёвая энергия',
    description:
      'Цены на энергоносители упали до минимума. Себестоимость производства и хранения снижается.',
    effects: { variableCostMult: 0.85, fixedCostMult: 0.9, storageCostMult: 0.8 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'econ-recession-fears',
    category: 'economy',
    title: 'Страхи рецессии',
    description:
      'Аналитики предсказывают рецессию. Потребители начинают экономить впрок — спрос снижается умеренно.',
    effects: { demandMultiplier: 0.88 },
    minDuration: 1,
    maxDuration: 3,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ТЕХНОЛОГИИ (10)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'tech-breakthrough',
    category: 'technology',
    title: 'Технологический прорыв в отрасли',
    description:
      'Учёные совершили прорыв, открывающий новые возможности для R&D. Инвестиции в НИОКР приносят больше отдачи.',
    effects: { rdBetaMod: 0.15 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'tech-digital-transform',
    category: 'technology',
    title: 'Цифровая трансформация рынка',
    description:
      'Потребители массово переходят в онлайн. Цифровой маркетинг стал значительно эффективнее — каждый рубль в рекламу работает лучше.',
    effects: { marketingAlphaMod: 0.15 },
    minDuration: 2,
    maxDuration: 5,
  },
  {
    id: 'tech-automation',
    category: 'technology',
    title: 'Автоматизация производства',
    description:
      'Новые технологии автоматизации снижают постоянные расходы. Компании с современным оборудованием получают преимущество.',
    effects: { fixedCostMult: 0.85, rdBetaMod: 0.05 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'tech-supply-chain',
    category: 'technology',
    title: 'Инновации в логистике',
    description:
      'Логистические стартапы перевернули рынок доставки. Себестоимость производства и хранения снижается.',
    effects: { variableCostMult: 0.9, storageCostMult: 0.75 },
    minDuration: 2,
    maxDuration: 3,
  },
  {
    id: 'tech-cyber-threat',
    category: 'technology',
    title: 'Кибератака на отрасль',
    description:
      'Волна кибератак парализовала часть предприятий. Постоянные расходы на безопасность выросли.',
    effects: { fixedCostMult: 1.15 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'tech-ai-boom',
    category: 'technology',
    title: 'Бум искусственного интеллекта',
    description:
      'ИИ-технологии революционизируют бизнес. R&D становится ключевым фактором успеха — инвестиции в НИОКР дают больший эффект.',
    effects: { rdBetaMod: 0.2, marketingAlphaMod: 0.05 },
    minDuration: 2,
    maxDuration: 5,
  },
  {
    id: 'tech-new-manufacturing',
    category: 'technology',
    title: 'Новые методы производства',
    description:
      'Революция в производственных технологиях — переменные издержки значительно снижаются для всех производителей.',
    effects: { variableCostMult: 0.82 },
    minDuration: 2,
    maxDuration: 3,
  },
  {
    id: 'tech-patent-expiry',
    category: 'technology',
    title: 'Истечение ключевых патентов',
    description:
      'Патенты крупных игроков истекли — технологии стали доступны всем. R&D менее дифференцирует, но маркетинг важнее.',
    effects: { rdBetaMod: -0.08, marketingAlphaMod: 0.1 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'tech-obsolescence',
    category: 'technology',
    title: 'Технологическое устаревание',
    description:
      'Текущие технологии быстро устаревают. Компании, не инвестирующие в R&D, теряют конкурентоспособность.',
    effects: { rdBetaMod: 0.12, demandMultiplier: 0.95 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'tech-3d-printing',
    category: 'technology',
    title: '3D-печать входит в массовое производство',
    description:
      'Революция 3D-печати снижает стоимость производства. Компании, вкладывающие в оборудование, получают значительное преимущество.',
    effects: { variableCostMult: 0.88, fixedCostMult: 0.92 },
    minDuration: 2,
    maxDuration: 4,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // СОЦИАЛЬНЫЕ (12)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'social-quality',
    category: 'social',
    title: 'Потребители требуют качество',
    description:
      'Социальные сети взорвались обзорами качества. Покупатели выбирают товар по качеству, а не по цене — R&D важнее, чувствительность к цене падает.',
    effects: { rdBetaMod: 0.18, priceElasticityMod: -0.4 },
    minDuration: 2,
    maxDuration: 5,
  },
  {
    id: 'social-price-hunting',
    category: 'social',
    title: 'Охотники за скидками',
    description:
      'Тренд на экономию: блогеры продвигают «умные покупки». Потребители стали крайне чувствительны к цене — дешёвые товары раскупают первыми.',
    effects: { priceElasticityMod: 0.6 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'social-brand-loyalty',
    category: 'social',
    title: 'Эпоха брендов',
    description:
      'Потребители доверяют известным маркам. Маркетинг стал ключевым фактором — узнаваемость бренда определяет выбор покупателя.',
    effects: { marketingAlphaMod: 0.2 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'social-eco-awareness',
    category: 'social',
    title: 'Экологическое сознание',
    description:
      'Экодвижение набирает силу. Потребители готовы платить больше за «зелёные» товары — R&D в экологию окупается. Чувствительность к цене снижается.',
    effects: { rdBetaMod: 0.12, priceElasticityMod: -0.25 },
    minDuration: 2,
    maxDuration: 5,
  },
  {
    id: 'social-minimalism',
    category: 'social',
    title: 'Тренд на минимализм',
    description:
      'Движение «меньше вещей» набирает популярность. Люди покупают реже — общий спрос на рынке снижается.',
    effects: { demandMultiplier: 0.82 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'social-consumerism',
    category: 'social',
    title: 'Волна потребительства',
    description:
      'Массовая культура потребления: люди покупают больше, чаще, без оглядки на цену. Спрос значительно растёт!',
    effects: { demandMultiplier: 1.2, priceElasticityMod: -0.15 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'social-influencer-era',
    category: 'social',
    title: 'Эра инфлюенсеров',
    description:
      'Инфлюенсер-маркетинг на пике: один пост блогера продаёт тысячи единиц. Эффективность маркетинга резко выросла.',
    effects: { marketingAlphaMod: 0.25 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'social-health-trend',
    category: 'social',
    title: 'Мода на здоровый образ жизни',
    description:
      'ЗОЖ-тренд меняет спрос: потребители ценят качество и готовы платить премию. R&D в качество продукта окупается.',
    effects: { rdBetaMod: 0.1, priceElasticityMod: -0.2, demandMultiplier: 1.05 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'social-demographic-shift',
    category: 'social',
    title: 'Демографический сдвиг',
    description:
      'Новое поколение покупателей выходит на рынок. Маркетинг через новые каналы становится критически важен.',
    effects: { marketingAlphaMod: 0.12, demandMultiplier: 1.06 },
    minDuration: 3,
    maxDuration: 5,
  },
  {
    id: 'social-panic-buying',
    category: 'social',
    title: 'Панические покупки',
    description:
      'Слухи о дефиците вызвали волну панических покупок. Спрос временно взлетел — но не забудьте, что это ненадолго!',
    effects: { demandMultiplier: 1.35, priceElasticityMod: -0.3 },
    minDuration: 1,
    maxDuration: 2,
  },
  {
    id: 'social-trust-crisis',
    category: 'social',
    title: 'Кризис доверия к брендам',
    description:
      'Серия скандалов подорвала доверие к крупным брендам. Маркетинг работает хуже — потребители скептичны к рекламе.',
    effects: { marketingAlphaMod: -0.12 },
    minDuration: 2,
    maxDuration: 3,
  },
  {
    id: 'social-subscription-economy',
    category: 'social',
    title: 'Подписочная экономика',
    description:
      'Потребители переходят на подписочные модели. Стабильный спрос, но покупатели ищут лучшую цену за подписку.',
    effects: { demandMultiplier: 1.08, priceElasticityMod: 0.2 },
    minDuration: 2,
    maxDuration: 4,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // РЕГУЛИРОВАНИЕ (8)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'reg-environmental',
    category: 'regulation',
    title: 'Ужесточение экологических норм',
    description:
      'Новые экологические стандарты повышают стоимость производства. Постоянные и переменные издержки растут.',
    effects: { variableCostMult: 1.12, fixedCostMult: 1.1 },
    minDuration: 2,
    maxDuration: 5,
  },
  {
    id: 'reg-deregulation',
    category: 'regulation',
    title: 'Дерегулирование отрасли',
    description:
      'Правительство ослабило контроль — бюрократия уменьшилась. Постоянные расходы снижаются, рынок открывается.',
    effects: { fixedCostMult: 0.85, demandMultiplier: 1.05 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'reg-import-tariffs',
    category: 'regulation',
    title: 'Импортные пошлины',
    description:
      'Введены высокие пошлины на импорт конкурирующих товаров. Местный рынок защищён — спрос на отечественную продукцию растёт.',
    effects: { demandMultiplier: 1.15 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'reg-quality-standards',
    category: 'regulation',
    title: 'Новые стандарты качества',
    description:
      'Регулятор ввёл обязательную сертификацию. Компании с высоким уровнем R&D получают преимущество — остальные несут дополнительные затраты.',
    effects: { rdBetaMod: 0.15, fixedCostMult: 1.08 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'reg-tax-hike',
    category: 'regulation',
    title: 'Повышение налогов',
    description:
      'Правительство повысило налог на прибыль. Чистая прибыль компаний снижается — нужно оптимизировать расходы.',
    effects: { fixedCostMult: 1.12 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'reg-tax-cut',
    category: 'regulation',
    title: 'Снижение налогов',
    description:
      'Налоговые льготы для бизнеса! Постоянные расходы снижаются — больше средств для инвестиций.',
    effects: { fixedCostMult: 0.88 },
    minDuration: 2,
    maxDuration: 3,
  },
  {
    id: 'reg-labor-laws',
    category: 'regulation',
    title: 'Ужесточение трудового законодательства',
    description:
      'Новые требования к условиям труда повышают расходы на персонал. Постоянные и переменные издержки растут.',
    effects: { fixedCostMult: 1.12, variableCostMult: 1.08 },
    minDuration: 2,
    maxDuration: 5,
  },
  {
    id: 'reg-free-trade',
    category: 'regulation',
    title: 'Соглашение о свободной торговле',
    description:
      'Подписано международное торговое соглашение. Новые рынки открылись — спрос растёт, а сырьё дешевеет.',
    effects: { demandMultiplier: 1.12, variableCostMult: 0.92 },
    minDuration: 2,
    maxDuration: 4,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ОТРАСЛЬ (10)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 'ind-raw-shortage',
    category: 'industry',
    title: 'Дефицит сырья',
    description:
      'Ключевое сырьё в дефиците — мировые поставки нарушены. Переменные затраты на производство резко выросли.',
    effects: { variableCostMult: 1.3 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'ind-raw-surplus',
    category: 'industry',
    title: 'Избыток сырья на рынке',
    description:
      'Перепроизводство сырья обрушило цены на материалы. Производство стало значительно дешевле — можно нарастить объёмы.',
    effects: { variableCostMult: 0.78 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'ind-innovation-race',
    category: 'industry',
    title: 'Инновационная гонка в отрасли',
    description:
      'Отрасль переживает инновационный бум. Компании, не вкладывающие в R&D, рискуют безнадёжно отстать от конкурентов.',
    effects: { rdBetaMod: 0.2 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'ind-marketing-saturation',
    category: 'industry',
    title: 'Рекламная перегрузка',
    description:
      'Рынок завален рекламой — потребители устали. Эффективность маркетинга падает, каждый рубль приносит меньше отдачи.',
    effects: { marketingAlphaMod: -0.1 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'ind-logistics-disruption',
    category: 'industry',
    title: 'Логистический коллапс',
    description:
      'Перебои в логистике парализовали склады. Стоимость хранения и доставки товаров резко выросла.',
    effects: { storageCostMult: 2.0, variableCostMult: 1.1 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'ind-seasonal-demand',
    category: 'industry',
    title: 'Сезонный пик спроса',
    description:
      'Праздничный сезон и распродажи увеличивают спрос. Потребители готовы покупать больше — не упустите момент!',
    effects: { demandMultiplier: 1.3 },
    minDuration: 1,
    maxDuration: 2,
  },
  {
    id: 'ind-reputation-crisis',
    category: 'industry',
    title: 'Репутационный кризис отрасли',
    description:
      'Скандал в отрасли подорвал доверие покупателей. Спрос падает, но маркетинг может помочь выделиться среди конкурентов.',
    effects: { demandMultiplier: 0.85, marketingAlphaMod: 0.1 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'ind-new-market',
    category: 'industry',
    title: 'Открытие нового сегмента рынка',
    description:
      'Обнаружен новый потребительский сегмент! Общий спрос значительно вырос — время расширять производство и маркетинг.',
    effects: { demandMultiplier: 1.22, marketingAlphaMod: 0.08 },
    minDuration: 2,
    maxDuration: 4,
  },
  {
    id: 'ind-price-war',
    category: 'industry',
    title: 'Ценовая война в отрасли',
    description:
      'Конкуренты начали ценовую войну — покупатели ожидают низких цен. Ценовая чувствительность резко выросла.',
    effects: { priceElasticityMod: 0.5, demandMultiplier: 1.05 },
    minDuration: 1,
    maxDuration: 3,
  },
  {
    id: 'ind-consolidation',
    category: 'industry',
    title: 'Консолидация отрасли',
    description:
      'Крупные игроки поглощают мелких. Рынок стабилизируется, но конкуренция становится жёстче — нужны инвестиции в R&D и маркетинг.',
    effects: { rdBetaMod: 0.08, marketingAlphaMod: 0.08 },
    minDuration: 2,
    maxDuration: 4,
  },
]

// ─── Логика событий ──────────────────────────────────────────────────────────

/** Нейтральные эффекты (без влияния) */
export const NEUTRAL_EFFECTS: EventEffects = {
  demandMultiplier: 1.0,
  priceElasticityMod: 0.0,
  marketingAlphaMod: 0.0,
  rdBetaMod: 0.0,
  variableCostMult: 1.0,
  fixedCostMult: 1.0,
  storageCostMult: 1.0,
}

/**
 * Комбинирует эффекты нескольких активных событий.
 * Множители перемножаются, модификаторы складываются.
 */
export function combineEventEffects(events: ActiveEvent[]): CombinedEffects {
  const combined = { ...NEUTRAL_EFFECTS }

  for (const event of events) {
    const e = event.effects
    if (e.demandMultiplier !== undefined) combined.demandMultiplier *= e.demandMultiplier
    if (e.priceElasticityMod !== undefined) combined.priceElasticityMod += e.priceElasticityMod
    if (e.marketingAlphaMod !== undefined) combined.marketingAlphaMod += e.marketingAlphaMod
    if (e.rdBetaMod !== undefined) combined.rdBetaMod += e.rdBetaMod
    if (e.variableCostMult !== undefined) combined.variableCostMult *= e.variableCostMult
    if (e.fixedCostMult !== undefined) combined.fixedCostMult *= e.fixedCostMult
    if (e.storageCostMult !== undefined) combined.storageCostMult *= e.storageCostMult
  }

  return combined
}

/**
 * Тикает активные события: уменьшает оставшееся время, удаляет истёкшие.
 */
export function tickEvents(events: ActiveEvent[]): ActiveEvent[] {
  return events
    .map((e) => ({ ...e, remainingPeriods: e.remainingPeriods - 1 }))
    .filter((e) => e.remainingPeriods > 0)
}

/**
 * Генерирует новые события для текущего периода.
 * Детерминированная генерация на основе seed + period.
 *
 * @param currentEvents - текущие активные события (для проверки дубликатов)
 * @param seed - seed игры для воспроизводимости
 * @param period - текущий период
 * @returns массив новых событий (0-2 штуки)
 */
export function generateNewEvents(
  currentEvents: ActiveEvent[],
  seed: number,
  period: number
): ActiveEvent[] {
  const newEvents: ActiveEvent[] = []
  const activeIds = new Set(currentEvents.map((e) => e.eventId))

  // Определяем количество новых событий (0-2)
  const countRoll = seededRandom(`event-count-${seed}`, period)
  let count: number
  if (countRoll < 0.25) {
    count = 0 // 25% — ничего нового
  } else if (countRoll < 0.8) {
    count = 1 // 55% — одно событие
  } else {
    count = 2 // 20% — два события
  }

  for (let i = 0; i < count; i++) {
    // Выбираем случайное событие из пула
    const eventRoll = seededRandom(`event-pick-${seed}-${i}`, period)
    const availableEvents = EVENT_POOL.filter((e) => !activeIds.has(e.id))
    if (availableEvents.length === 0) break

    const idx = Math.floor(eventRoll * availableEvents.length)
    const eventDef = availableEvents[idx]
    if (!eventDef) break

    // Случайная длительность
    const durationRoll = seededRandom(`event-dur-${seed}-${i}`, period)
    const duration =
      eventDef.minDuration +
      Math.floor(durationRoll * (eventDef.maxDuration - eventDef.minDuration + 1))

    const active: ActiveEvent = {
      eventId: eventDef.id,
      title: eventDef.title,
      description: eventDef.description,
      effects: { ...eventDef.effects },
      remainingPeriods: duration,
      startPeriod: period,
    }

    newEvents.push(active)
    activeIds.add(eventDef.id)
  }

  return newEvents
}
