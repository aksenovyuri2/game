# PLAN.md — BizSim

---

## Этап 1: Инициализация проекта — ВЫПОЛНЕН

Vite + React + TS, Tailwind v4, shadcn/ui, ESLint, Vitest, Playwright, Husky.

---

## Этап 2: Simulation Engine — В РАБОТЕ

### Цель

Реализовать экономическое ядро симуляции: расчёт спроса, рыночной доли,
себестоимости, финансовых результатов и MPI. Покрытие тестами ≥ 90%.

### Файлы

| Файл                                   | Содержание                         |
| -------------------------------------- | ---------------------------------- |
| `src/engine/types.ts`                  | Все интерфейсы модели              |
| `src/engine/market.ts`                 | Расчёт спроса и доли рынка         |
| `src/engine/costs.ts`                  | Себестоимость, амортизация, запасы |
| `src/engine/mpi.ts`                    | Расчёт MPI по 6 факторам           |
| `src/engine/simulation.ts`             | Оркестрация одного периода         |
| `tests/unit/engine/market.test.ts`     | Тесты рынка                        |
| `tests/unit/engine/costs.test.ts`      | Тесты затрат                       |
| `tests/unit/engine/mpi.test.ts`        | Тесты MPI                          |
| `tests/unit/engine/simulation.test.ts` | Интеграционные тесты периода       |

### Модель: параметры и формулы

#### Константы (GameConfig)

```
BASE_MARKET_SIZE      = 10 000 единиц/период (на всех игроков)
BASE_PRICE            = 100 УДЕ
BASE_VARIABLE_COST    = 60 УДЕ/ед
FIXED_COSTS           = 50 000 УДЕ/период
DEPRECIATION_RATE     = 0.15 (15%/период)
STORAGE_COST_PER_UNIT = 2 УДЕ/ед/период
TAX_RATE              = 0.20 (20%)
PRICE_ELASTICITY      = 1.5
MARKETING_ALPHA       = 0.3
RD_BETA               = 0.2
```

#### Начальное состояние компании

```
cash               = 200 000
inventory          = 0
equipment          = 100 000
rdAccumulated      = 0
retainedEarnings   = 0
```

#### Расчёт спроса (market.ts)

1. **Базовый спрос компании i:**

   ```
   priceScore[i]     = (BASE_PRICE / price[i]) ^ PRICE_ELASTICITY
   marketingScore[i] = 1 + MARKETING_ALPHA * sqrt(marketing[i] / 10_000)
   rdScore[i]        = 1 + RD_BETA * sqrt(rdAccumulated[i] / 50_000)
   competScore[i]    = priceScore[i] * marketingScore[i] * rdScore[i]
   ```

2. **Рыночная доля:**

   ```
   share[i] = competScore[i] / sum(competScore)
   ```

3. **Макроэкономический коэффициент** (по сценарию):

   ```
   stable:  macro = 1.0
   growing: macro = 1.0 + 0.03 * period  (рост 3%/период)
   crisis:  macro = 1.0 - 0.05 * period  (спад 5%/период, min 0.4)
   random:  macro = случайное ±15%
   ```

4. **Продажи и запасы:**
   ```
   demandForCompany[i] = BASE_MARKET_SIZE * macro * share[i]
   unitsSold[i]        = min(demandForCompany[i], inventory[i] + produced[i])
   endInventory[i]     = inventory[i] + produced[i] - unitsSold[i]
   ```

#### Расчёт затрат (costs.ts)

```
variableCostPerUnit[i] = BASE_VARIABLE_COST / (1 + equipment[i] / 500_000)
newEquipment[i]        = equipment[i] * (1 - DEPRECIATION_RATE) + capitalInvestment[i]
depreciation[i]        = equipment[i] * DEPRECIATION_RATE
storageCost[i]         = endInventory[i] * STORAGE_COST_PER_UNIT
productionCost[i]      = variableCostPerUnit[i] * produced[i] + FIXED_COSTS
```

#### Финансы (simulation.ts)

```
revenue[i]       = price[i] * unitsSold[i]
cogs[i]          = variableCostPerUnit * unitsSold[i]  (только реализованная часть)
grossProfit[i]   = revenue[i] - cogs[i]
ebit[i]          = grossProfit[i] - FIXED_COSTS - marketing[i] - rd[i] - depreciation[i] - storageCost[i]
tax[i]           = max(0, ebit[i] * TAX_RATE)
netProfit[i]     = ebit[i] - tax[i]
newCash[i]       = cash[i] + netProfit[i] - capitalInvestment[i]
newRetained[i]   = retainedEarnings[i] + netProfit[i]
```

R&D накопление: `newRdAccumulated[i] = rdAccumulated[i] * 0.9 + rd[i]` (10% устаревание)

#### MPI (mpi.ts)

6 факторов, каждый нормализован в [0, 100], веса в сумме = 1:

| Фактор           | Вес  | Формула                                                 |
| ---------------- | ---- | ------------------------------------------------------- |
| retainedEarnings | 0.35 | `clamp(retainedEarnings / 500_000 * 100, 0, 100)`       |
| demandPotential  | 0.15 | `clamp(marketingScore * rdScore * 50, 0, 100)`          |
| supplyPotential  | 0.15 | `clamp(equipment / 200_000 * 100, 0, 100)`              |
| productivity     | 0.15 | `clamp(revenue / (revenue + totalCosts) * 200, 0, 100)` |
| marketShare      | 0.10 | `marketShare * 100` (уже в долях → %)                   |
| growth           | 0.10 | `clamp(50 + (netProfit / 50_000) * 50, 0, 100)`         |

```
MPI = sum(factor[i] * weight[i])
```

### Краевые случаи

- `price = 0` → запрещено (минимум 1)
- `produced < 0` → запрещено
- `cash < 0` → компания технически банкрот, но игра продолжается
- `endInventory < 0` → невозможно (clamp к 0)
- `macro * demand < 0` → clamp к 0
- Деление на 0 при `sum(competScore) = 0` → равные доли

---

---

## Этап 3: ИИ-оппоненты — В РАБОТЕ

### Цель

Реализовать 4 характера ИИ × 4 уровня сложности. Каждый ИИ принимает
решения на период исходя из состояния рынка и своей компании.

### Файлы

| Файл                      | Содержание                                     |
| ------------------------- | ---------------------------------------------- |
| `src/ai/types.ts`         | Типы AI: контекст, конфиг сложности            |
| `src/ai/base.ts`          | Абстрактный `BaseAI`, утилита шума             |
| `src/ai/cautious.ts`      | `CautiousAI` — осторожная стратегия            |
| `src/ai/aggressive.ts`    | `AggressiveAI` — агрессивная стратегия         |
| `src/ai/balanced.ts`      | `BalancedAI` — сбалансированная стратегия      |
| `src/ai/adaptive.ts`      | `AdaptiveAI` — адаптируется к конкурентам      |
| `src/ai/difficulty.ts`    | Конфигурация 4 уровней сложности               |
| `src/ai/factory.ts`       | Фабрика: создаёт нужный ИИ по типу и сложности |
| `tests/unit/ai/*.test.ts` | Тесты для каждого модуля                       |

### Архитектура

```typescript
interface AIDecisionContext {
  companyState: CompanyState
  marketState: MarketState
  cfg: GameConfig
  competitorDecisions?: Decisions[] // предыдущий период
  history?: CompanyState[] // история своей компании
}

abstract class BaseAI {
  abstract makeDecisions(ctx: AIDecisionContext): Decisions
  protected applyNoise(d: Decisions, level: number, seed: number): Decisions
  protected clampDecisions(d: Decisions, state: CompanyState): Decisions
}
```

### Поведение характеров

#### CautiousAI

- Цена: рядом с `basePrice` ±5%, не демпингует
- Производство: `demand_estimate * 0.85` (с запасом под склад)
- Маркетинг: 8–12% от выручки
- CapEx: поддерживает оборудование (= амортизации)
- R&D: минимальный (2–3% от выручки)

#### AggressiveAI

- Цена: на 10–15% ниже средней по рынку (или `basePrice`)
- Производство: завышенное, `demand_estimate * 1.2`
- Маркетинг: 20–25% от выручки (максимальный)
- CapEx: агрессивный (10–15% от выручки)
- R&D: минимальный

#### BalancedAI

- Цена: `basePrice * 0.95` (чуть ниже базы)
- Производство: `demand_estimate * 1.0`
- Маркетинг, CapEx, R&D: равномерно по 10% от выручки каждый

#### AdaptiveAI _(только Expert/Master)_

- Анализирует решения конкурентов за прошлый период
- Если конкурент снизил цену → тоже снижает на 5%
- Если теряет долю рынка → увеличивает маркетинг на 20%
- Если растёт → сохраняет стратегию

### Уровни сложности (noiseLevel)

| Уровень | Шум  | Доступные характеры            | Анализ конкурентов |
| ------- | ---- | ------------------------------ | ------------------ |
| novice  | ±30% | cautious, balanced             | нет                |
| medium  | ±15% | cautious, aggressive, balanced | нет                |
| expert  | ±5%  | все 4                          | да                 |
| master  | 0%   | все 4                          | да (глубокий)      |

### Шум — детерминированный PRNG

```
seed = hash(companyId + period)
noise = sin(seed) * noiseLevel  →  решение ± noise * решение
```

Решения после шума клэмпятся к допустимым диапазонам.

### Краевые случаи

- Цена всегда ≥ 1 УДЕ
- Производство ≥ 0
- Все расходы (marketing, capex, rd) ≥ 0
- Расходы не превышают `cash * 0.8` (не разорять компанию за 1 период)
- AdaptiveAI без истории ведёт себя как BalancedAI

---

## Следующие этапы

- **Этап 4:** UI экраны (v0.dev → интеграция)
- **Этап 5:** Сохранение, онбординг, справка
- **Этап 6:** E2E-тесты, балансировка ИИ
- **Этап 7:** Полировка, релиз

---

## Этап 4: UI — экраны и компоненты — В РАБОТЕ

Навигация: простой контекст (home | new-game | game | results | help).
Gameloop в Zustand: initGame → deciding → submitDecisions → period-result → continueToNextPeriod → deciding/game-over.
Стек: shadcn/ui + Tailwind + Recharts.
