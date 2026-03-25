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

## Следующие этапы

- **Этап 3:** ИИ-оппоненты (4 характера, 4 уровня) — Plan → Tests → Code
- **Этап 4:** UI экраны (v0.dev → интеграция)
- **Этап 5:** Сохранение, онбординг, справка
- **Этап 6:** E2E-тесты, балансировка ИИ
- **Этап 7:** Полировка, релиз
