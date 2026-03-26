# Задание для Claude Code — Реализация BizSim

> Скопируй этот текст целиком и вставь в Claude Code как первую команду.  
> Перед запуском убедись, что репозиторий склонирован и ты находишься в корне проекта.

---

## Контекст

Ты работаешь над проектом BizSim — однопользовательская экономическая симуляция (аналог MESE) на React + TypeScript. 

Прочитай следующие файлы перед началом работы:
- `CLAUDE.md` — правила проекта, стек, структура, конвенции
- `docs/SPEC.md` — полное ТЗ
- `docs/ENGINE.md` — экономическая модель с формулами, все константы, стратегии ИИ
- `docs/SEO.md` — SEO-оптимизация

Методология: **Plan → Tests → Code**. Сначала план, потом тесты (которые падают), потом реализация (пока тесты не станут зелёными), потом коммит.

---

## Задача 1: Simulation Engine (ядро экономики)

### 1.1. План

Создай файл `PLAN.md` с планом реализации Simulation Engine по `docs/ENGINE.md`. В плане опиши:

- Список файлов, которые будут созданы в `src/engine/`
- Интерфейсы TypeScript (из раздела 12 ENGINE.md + типы из CLAUDE.md)
- Файл `src/engine/constants.ts` — все 40 констант из раздела 16 ENGINE.md
- Порядок реализации 10 этапов конвейера (раздел 1.1 ENGINE.md)
- Краевые случаи, которые нужно покрыть тестами (из каждого раздела ENGINE.md)

**Не пиши код. Только план.**

### 1.2. Тесты

После утверждения плана напиши тесты в `tests/unit/engine/`. Покрытие: не менее 90%.

Обязательные тест-файлы:
- `constants.test.ts` — все константы имеют правильные значения и типы
- `validation.test.ts` — валидация решений (этап 1): границы, округление, значения по умолчанию, пропуск хода
- `production.test.ts` — мощности, себестоимость, амортизация, эффект масштаба, сверхурочные (этап 2)
- `demand.test.ts` — макроспрос, 4 сценария, краевые случаи мультипликатора (этап 3)
- `cas.test.ts` — CAS: priceScore, marketingScore, qualityScore, brandScore (этап 4). Все краевые: одинаковые цены, демпинг, нулевой маркетинг, R&D-деградация
- `market.test.ts` — распределение спроса, перераспределение неудовлетворённого (этапы 5–6). Краевые: дуополия, CAS=0, дефицит
- `financial.test.ts` — P&L, автокредит, автопогашение, creditRating, retainedEarnings (этапы 7–8). Краевые: unitsSold=0, все расходы=0, глубокий убыток, овердрафт
- `brand.test.ts` — обновление бренда (этап 9). Краевые: без маркетинга 12 периодов, двойной дефицит, стабильный бренд
- `mpi.test.ts` — расчёт MPI (этап 10). Краевые: все одинаковые, один доминирует, отрицательный RE
- `simulation.test.ts` — интеграционный: полный расчёт 1 периода от входа до выхода, прогон 12 периодов с проверкой инвариантов

Каждый тест-файл должен содержать:
- Тесты на нормальные значения
- Тесты на краевые случаи из ENGINE.md
- Тесты на инварианты (раздел 15.1 ENGINE.md)

**Все тесты должны падать (red). Не пиши реализацию.**

### 1.3. Реализация

Реализуй все модули `src/engine/` чтобы все тесты стали зелёными:
- `types.ts` — все интерфейсы
- `constants.ts` — все 40 констант
- `validation.ts` — этап 1
- `production.ts` — этап 2 (equipment, capacity, unitCost)
- `demand.ts` — этап 3 (макроспрос, сценарии)
- `cas.ts` — этап 4 (CAS и все 4 score)
- `market.ts` — этапы 5–6 (распределение, продажи, перераспределение)
- `financial.ts` — этапы 7–8 (P&L, баланс, кредит)
- `brand.ts` — этап 9
- `mpi.ts` — этап 10
- `simulation.ts` — главная функция `simulatePeriod(companies, marketState) → PeriodResult[]`

Запусти `npm run test` и убедись что все тесты зелёные. Сделай коммит:
```
feat: implement simulation engine with full economic model
```

---

## Задача 2: ИИ-оппоненты

### 2.1. План

Обнови `PLAN.md` с планом реализации ИИ по разделам 12–14 ENGINE.md:
- Файлы в `src/ai/`
- Интерфейсы AIConfig, AIMemory, AIDecision
- Логика каждого характера (CautiousAI, AggressiveAI, BalancedAI, AdaptiveAI)
- Логика уровней сложности (noise, ошибки, планирование)
- Специальные тактики Мастера (блиц-демпинг, R&D-марафон, волны, ансамбль)

**Не пиши код. Только план.**

### 2.2. Тесты

Напиши тесты в `tests/unit/ai/`:

- `base.test.ts` — базовый класс: applyNoise (проверка диапазона шума по сложности), generateErrors (частота ошибок)
- `cautious.test.ts` — CautiousAI: цена ≥ unitCost × 1.15, production ≤ capacity, маркетинг 3000–10000, кризисная реакция (mkt × 0.70), бюджетное ограничение
- `aggressive.test.ts` — AggressiveAI: цена < avgPrice, production > capacity (сверхурочные), маркетинг ≥ 6000, реакция на конкурентов-демпингёров, вынужденное повышение при низком cash
- `balanced.test.ts` — BalancedAI: цена ≈ avgPrice (±5%), production ≈ demand, самокоррекция MPI (слабый компонент → усиление)
- `adaptive.test.ts` — AdaptiveAI: фаза сбора (периоды 1–3 = Balanced), классификация (5 типов с числовыми порогами), контрстратегии (множители)
- `difficulty.test.ts` — уровни сложности: шум ±20% для Новичка / ±2% для Мастера, ошибки 20% / 0%, стартовый штраф / бонус
- `master-tactics.test.ts` — тактики Мастера: блиц-демпинг (price ≈ unitCost × 1.03 в периоды 1–3), R&D-марафон (rd = 80% бюджета), ансамбль (роли)
- `balance.test.ts` — интеграционный: прогон 100 игр на каждом уровне сложности, проверка winRate (Новичок 80–90%, Средний 50–65%, Эксперт 30–45%, Мастер 10–25%)

**Все тесты должны падать. Не пиши реализацию.**

### 2.3. Реализация

Реализуй все модули `src/ai/`:
- `types.ts` — AIConfig, AIMemory, AIDecision, PlayerStrategyType
- `base.ts` — абстрактный AIPlayer (applyNoise, generateErrors, estimateDemand)
- `cautious.ts` — CautiousAI.plan() по разделу 13.1 ENGINE.md
- `aggressive.ts` — AggressiveAI.plan() по разделу 13.2
- `balanced.ts` — BalancedAI.plan() по разделу 13.3
- `adaptive.ts` — AdaptiveAI (classifyPlayerStrategy, selectCounterStrategy) по разделу 13.4
- `difficulty.ts` — DifficultyController: конфиг по уровню, распределение характеров, master-тактики (раздел 14)
- `factory.ts` — createAIPlayers(difficulty, count): создание набора ИИ с разными характерами

Запусти тесты, убедись что зелёные. Коммит:
```
feat: implement AI opponents with 4 characters and 4 difficulty levels
```

---

## Задача 3: SEO-оптимизация

### 3.1. План

Обнови `PLAN.md` с планом SEO по `docs/SEO.md`:
- Какие пакеты установить (react-helmet-async, vite-plugin-sitemap, vite-plugin-pwa)
- Какие файлы создать в `src/seo/` и `public/`
- Пререндеринг: какие маршруты, какой инструмент
- JSON-LD разметка: WebApplication, FAQPage, BreadcrumbList
- manifest.json и набор иконок

**Не пиши код. Только план.**

### 3.2. Реализация

Реализуй SEO пошагово:

**Шаг 1: Мета-теги**
- Создай `src/seo/constants.ts` с текстами title, description, OG для каждой страницы (раздел 3 SEO.md)
- Создай `src/seo/SEOHead.tsx` — компонент на react-helmet-async, принимает page: 'home' | 'help' | 'about' | 'game' | 'results'
- Добавь `<SEOHead page="..." />` в каждый экран

**Шаг 2: Open Graph**
- Добавь OG-теги в SEOHead (og:title, og:description, og:image, og:url) по разделу 4 SEO.md
- Добавь Twitter Card теги
- Создай placeholder `public/og-image.png` (1200×630, можно заглушку)

**Шаг 3: JSON-LD**
- Создай `src/seo/JsonLd.tsx` — компонент для вставки `<script type="application/ld+json">`
- WebApplication на главной (раздел 5.1 SEO.md)
- FAQPage на странице справки (раздел 5.2)
- BreadcrumbList на внутренних страницах (раздел 5.3)

**Шаг 4: Технический SEO**
- Создай `public/robots.txt` (раздел 6.1 SEO.md): Allow /, Disallow /game, /results
- Установи и настрой vite-plugin-sitemap для автогенерации sitemap.xml (раздел 6.2)
- Добавь `<link rel="canonical">` в SEOHead
- Убедись что `<html lang="ru">` в index.html

**Шаг 5: PWA**
- Создай `public/manifest.json` (раздел 11.1 SEO.md)
- Установи и настрой vite-plugin-pwa (раздел 11.2)
- Создай placeholder-иконки: favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png

**Шаг 6: Производительность**
- Настрой React.lazy для игровых экранов (GameScreen, ResultsScreen) — раздел 7.2
- Проверь что бандл < 500KB gzip
- Добавь `loading="lazy"` на некритичные изображения

**Шаг 7: Семантика**
- Проверь что каждая страница имеет один `<h1>`, корректную иерархию h2→h3
- Используй семантические теги: `<header>`, `<main>`, `<nav>`, `<footer>`, `<article>`, `<section>`
- `alt` на всех изображениях, `aria-label` на иконочных кнопках

Коммит:
```
feat: add SEO optimization (meta tags, OG, JSON-LD, PWA, sitemap)
```

---

## Задача 4: Проверка чек-листа SEO

Пройди чек-лист из раздела 12 SEO.md. Для каждого пункта:
- Проверь что выполнен
- Если нет — исправь

```
[ ] Уникальные title и description на каждой странице
[ ] OG-теги на всех страницах
[ ] Twitter Card теги
[ ] OG-изображение в /public/
[ ] JSON-LD WebApplication на главной
[ ] JSON-LD FAQPage на справке
[ ] robots.txt
[ ] sitemap.xml генерируется
[ ] canonical на каждой странице
[ ] <html lang="ru">
[ ] Семантические теги
[ ] Один h1 на страницу
[ ] alt на изображениях
[ ] manifest.json
[ ] Favicon набор
[ ] Code splitting для игровых экранов
[ ] Core Web Vitals в норме
```

Коммит:
```
fix: complete SEO checklist items
```

---

## Задача 5: Интеграция и финальная проверка

### 5.1. Связка Engine + AI + UI

Проверь что:
- `GameScreen` использует `simulatePeriod()` из `src/engine/simulation.ts`
- ИИ-решения генерируются через `createAIPlayers()` → `.plan()` перед каждым `simulatePeriod()`
- Сохранение в localStorage работает (gameStore.ts → savesStore.ts)
- Настройки новой игры (сложность, кол-во ИИ, сценарий) корректно передаются

### 5.2. Запуск всех тестов

```bash
npm run test          # Все юнит-тесты зелёные
npm run build         # Сборка без ошибок
npm run lint          # Без ошибок линтинга
```

### 5.3. Финальный коммит и деплой

```bash
git add .
git commit -m "feat: integrate engine, AI, and SEO into game flow"
git push origin main
```

Vercel автоматически задеплоит.

---

## Важные правила (напоминание)

1. **Не пиши код без плана.** Сначала PLAN.md.
2. **Не пиши реализацию без тестов.** Сначала тесты (red).
3. **Не коммить с красными тестами.**
4. **Формулы и константы — строго по `docs/ENGINE.md`.** Не выдумывай свои.
5. **Краевые случаи — из ENGINE.md.** Каждый `CASE:` блок = минимум 1 тест.
6. **Коммиты — Conventional Commits:** `feat:`, `fix:`, `test:`, `refactor:`.
7. **Запрещено:** `any`, `@ts-ignore`, `console.log` в продакшен-коде, CSS-файлы.

Начни с Задачи 1.1 — составь план Simulation Engine и запиши в `PLAN.md`.
