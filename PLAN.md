# PLAN.md — BizSim

---

## Этап 1: Инициализация проекта — ВЫПОЛНЕН

---

## Этап 2: Simulation Engine (Задача 1)

> Источник: docs/ENGINE.md (версия 2.0, март 2026)
> Методология: Plan → Tests (Red) → Code (Green) → Commit

### 2.1. Файлы в `src/engine/`

| Файл            | Этап | Описание                                                  |
| --------------- | ---- | --------------------------------------------------------- |
| `constants.ts`  | —    | 40 констант модели (раздел 16 ENGINE.md)                  |
| `types.ts`      | —    | Все TypeScript-интерфейсы                                 |
| `validation.ts` | 1    | Валидация и нормализация решений                          |
| `production.ts` | 2    | Оборудование, мощности, R&D, себестоимость                |
| `demand.ts`     | 3    | Макроэкономический спрос, сценарии                        |
| `cas.ts`        | 4    | Конкурентная привлекательность (CAS, 4 score)             |
| `market.ts`     | 5–6  | Распределение спроса, продажи, перераспределение          |
| `financial.ts`  | 7–8  | P&L, денежный поток, автокредит, кредитный рейтинг        |
| `brand.ts`      | 9    | Обновление репутации бренда                               |
| `mpi.ts`        | 10   | Расчёт MPI (6 компонент, шкала 0–1000)                    |
| `simulation.ts` | main | `simulatePeriod(companies, marketState) → PeriodResult[]` |

#### Существующие файлы (адаптировать):

- `events.ts` — система событий (уже реализована, интегрировать в конвейер)

#### Полная замена (несовместимы с новой моделью):

- `types.ts` — новые поля: brandReputation, loanBalance, creditRating, salesHistory
- `simulation.ts` — новый конвейер 10 этапов
- `market.ts` — переработка под новую модель
- `costs.ts` → заменяется на `production.ts`
- `mpi.ts` — новые веса, 6 компонент, шкала 0–1000

---

### 2.2. TypeScript-интерфейсы (`types.ts`)

#### Decisions

```typescript
interface Decisions {
  price: number // 10–100, шаг 1
  production: number // 0–capacity×1.5, шаг 10
  marketing: number // 0–30000, шаг 100
  capex: number // 0–40000, шаг 100
  rd: number // 0–30000, шаг 100
}
```

#### CompanyState

```typescript
interface CompanyState {
  id: string
  name: string
  isAI: boolean
  decisions: Decisions
  cash: number // Свободные деньги
  inventory: number // Готовая продукция (шт.)
  equipment: number // Балансовая стоимость оборудования
  capacity: number // Текущая мощность (шт./период)
  rdAccumulated: number // Накопленный R&D-капитал
  brandReputation: number // 0–100
  retainedEarnings: number // Нераспределённая прибыль (может быть < 0)
  loanBalance: number // Задолженность по кредиту
  creditRating: number // 1.0 = норма, 2.0 = максимально плохо
  salesHistory: number[] // Продажи по периодам
  isBankrupt: boolean // (зарезервировано, не используется в v2)
}
```

#### Начальное состояние (Period 0)

```
cash: 50000
inventory: 600
equipment: 100000
capacity: 1000
rdAccumulated: 1000
brandReputation: 50.0
retainedEarnings: 0
loanBalance: 0
creditRating: 1.0
salesHistory: [600]
```

#### MarketState

```typescript
interface MarketState {
  period: number
  totalPeriods: number
  scenario: 'stable' | 'growing' | 'crisis' | 'random'
  economicMultiplier: number
  numberOfCompanies: number
}
```

#### PeriodResult (для одной компании)

```typescript
interface PeriodResult {
  companyId: string
  // Продажи
  unitsSold: number
  endInventory: number
  spoilage: number
  marketShare: number // 0–1
  companyDemand: number
  unmetDemand: number
  // Себестоимость
  unitCost: number
  variableCostPerUnit: number
  fixedCostPerUnit: number
  // P&L
  revenue: number
  costOfGoodsSold: number
  grossProfit: number
  marketingExpense: number
  rdExpense: number
  depreciation: number
  holdingCost: number
  spoilageCost: number
  productionOverhead: number
  operatingProfit: number
  interestExpense: number
  profitBeforeTax: number
  tax: number
  netProfit: number
  // Баланс
  newCash: number
  newEquipment: number
  newCapacity: number
  newRdAccumulated: number
  newBrandReputation: number
  newRetainedEarnings: number
  newLoanBalance: number
  newCreditRating: number
  // Конкурентность
  cas: number
  priceScore: number
  marketingScore: number
  qualityScore: number
  brandScore: number
  // Итог
  mpi: number
}
```

---

### 2.3. Все 40 констант (`constants.ts`, раздел 16 ENGINE.md)

```
// Производство и оборудование
BASE_CAPACITY = 1000
INITIAL_EQUIPMENT = 100000
DEPRECIATION_RATE = 0.08
CAPACITY_SENSITIVITY = 0.35

// R&D
RD_DEPRECIATION = 0.05
MAX_RD_EFFICIENCY = 0.30
RD_EFFICIENCY_SCALE = 100000

// Себестоимость
BASE_FIXED_COSTS = 8000
MAINTENANCE_RATE = 0.02
BASE_VARIABLE_COST = 12.0
MAX_SCALE_DISCOUNT = 0.20
OVERTIME_COST_MULTIPLIER = 0.50
OVERTIME_FIXED_PENALTY = 3.0

// Спрос
BASE_DEMAND_PER_COMPANY = 1000

// CAS — веса
W_PRICE = 0.35
W_MKT = 0.25
W_QUALITY = 0.20
W_BRAND = 0.20

// CAS — priceScore
ELASTICITY_EXPONENT = 1.3

// CAS — marketingScore
MKTG_MAX = 100.0
MKTG_HALF = 6000.0
RELATIVE_MKT_WEIGHT = 10.0

// CAS — qualityScore
Q_MAX = 100.0
Q_HALF = 15000.0

// Бренд
BRAND_RETENTION = 0.90
BRAND_MKT_CAP = 3.0
BRAND_QUALITY_CAP = 2.0
DAMAGE_STOCKOUT = 15.0
DAMAGE_OVERPRICE = 5.0
DAMAGE_QUALITY_DROP = 3.0

// Продажи
REDISTRIBUTION_RATE = 0.60
SPOILAGE_RATE = 0.05
HOLDING_COST_PER_UNIT = 1.5

// Финансы
TAX_RATE = 0.25
INTEREST_RATE = 0.06
MAX_LOAN_RATIO = 0.80
LOAN_BUFFER = 5000
REPAYMENT_THRESHOLD = 20000

// MPI — веса (6 компонент)
W_RE = 0.30
W_DP = 0.15
W_SP = 0.15
W_PR = 0.10
W_MS = 0.15
W_GR = 0.15
```

**Итого: 40 констант.**

---

### 2.4. Порядок 10 этапов конвейера (раздел 1.1 ENGINE.md)

```
Вход: decisions[i], companyStates[], marketState

Этап 1 — validation.ts
  validateDecisions(raw, capacity, prevDecisions?) → Decisions

Этап 2 — production.ts
  calcEquipment(prevEquipment, capex) → number
  calcCapacity(equipment) → number
  calcRdAccumulated(prevRd, rdSpend) → number
  calcUnitCost(production, capacity, equipment, rdAccumulated) → UnitCostResult

Этап 3 — demand.ts
  calcEconomicMultiplier(scenario, period, totalPeriods, prevMultiplier?, noise?) → number
  calcTotalMarketDemand(numberOfCompanies, economicMultiplier, noise?) → number

Этап 4 — cas.ts
  calcPriceScore(price, allPrices[]) → number
  calcMarketingScore(marketing, allMarketings[]) → number
  calcQualityScore(rdAccumulated) → number
  calcBrandScore(brandReputation) → number
  calcCAS(priceScore, marketingScore, qualityScore, brandScore) → number

Этап 5 — market.ts
  distributeMarketDemand(cas[], totalMarketDemand) → companyDemand[]

Этап 6 — market.ts
  calcSalesAndInventory(demand, prevInventory, production) → SalesResult
  calcSpoilage(newInventory) → number
  redistributeUnmetDemand(unmetDemand[], cas[], inventories[]) → number[]

Этап 7 — financial.ts
  calcPnL(unitsSold, unitCost, price, marketing, rd, equipment, loanBalance, creditRating,
          newInventory, spoilage, production, capacity) → PnLResult

Этап 8 — financial.ts
  calcCashAndLoans(prevCash, prevLoan, prevCreditRating, outflows, inflows,
                   equipment) → CashResult

Этап 9 — brand.ts
  calcBrandReputation(prevBrand, marketingScore, qualityScore, prevQualityScore,
                      fulfillmentRate, price, avgPrice) → number

Этап 10 — mpi.ts
  calcMPI(company, allResults, period) → number

Выход: PeriodResult[], updatedCompanyStates[]
```

---

### 2.5. Краевые случаи для тестов (по разделам ENGINE.md)

#### validation.ts (этап 1)

- `price = 5` → `10` (clamp min)
- `price = 150` → `100` (clamp max)
- `production > capacity × 1.5` → обрезка до `floor(capacity × 1.5)`
- `marketing = 15432` → `15400` (round down to step 100)
- `production = 155` → `160` (round to step 10)
- `capex = -100` → `0`
- Пропуск хода (period > 1): возвращаются решения предыдущего периода
- Пропуск хода (period == 1): defaults: price=35, production=800, marketing=5000, capex=5000, rd=3000

#### production.ts (этап 2)

- `capex = 0` все периоды → equipment деградирует, capacity не падает ниже 200
- `capex = 40000` → capacity растёт логарифмически (убывающая отдача)
- `equipment → 0` → `capacity = 200` (clamp min)
- `production = 0` → `fixedCostPerUnit = totalFixedCosts / 1`, COGS = 0 (unitsSold = 0)
- `production = capacity` → `scaleDiscount = MAX_SCALE_DISCOUNT`, `overtimePenalty = 1.0`
- `production = capacity × 1.5` → `overtimePenalty = 1.25`
- `rd = 0` за 12 периодов → rdAccumulated ≈ 540, qualityScore ≈ 3.47
- `unitCost >= 1.0` всегда (clamp)

#### demand.ts (этап 3)

- Сценарий stable: multiplier = 1.0 каждый период
- Сценарий growing: правильный рост по формуле
- Сценарий crisis: дно = 0.60 в середине, восстановление 0.95 в конце
- Сценарий random: clamp [0.45, 1.60], mean reversion к 1.0
- noise `Uniform(-0.03, 0.03)` для stable/growing/crisis
- `numberOfCompanies = 2` → totalDemand = BASE_DEMAND × 2 × multiplier

#### cas.ts (этап 4)

- Все цены одинаковые → `priceScore = 50.0` для всех
- Один демпингёр (`price=10`, остальные `price=50`) → `priceScore[0] = 100`
- `ELASTICITY_EXPONENT = 1.3` применяется корректно
- `marketing = 0` для всех → `marketingScore = 0`, relativeBonus не считается
- Один `marketing=25000`, остальные `2000` → лидер capped в 100
- `rdAccumulated = 1000` → `qualityScore ≈ 6.25`
- `rdAccumulated = 15000` → `qualityScore = 50.0`
- `CAS >= 0.01` всегда

#### market.ts (этапы 5–6)

- Все CAS одинаковые → равное деление спроса
- Коррекция остатка: `sum(companyDemand) == totalMarketDemand`
- `production=0, inventory=0` → `unitsSold = 0`
- Перераспределение: 60% неудовлетворённого спроса → компании с запасами
- Дуополия: `CAS[0]=80, CAS[1]=40` → доли 66.7% / 33.3%
- `spoilage = floor(inventory × SPOILAGE_RATE)`
- `sum(marketShareFraction) ≈ 1.0` (погрешность < 0.001)

#### financial.ts (этапы 7–8)

- `unitsSold = 0` → revenue = 0, COGS = 0, но fixed costs остаются → убыток
- `profitBeforeTax < 0` → tax = 0
- `profitBeforeTax > 0` → tax = profitBeforeTax × 0.25
- Автокредит: `cash < 0` → выдача кредита до лимита `MAX_LOAN_RATIO × equipment`
- Автокредит невозможен: `equipment ≈ 0` → `cash = -1000` (овердрафт)
- Автопогашение: `cash > REPAYMENT_THRESHOLD, loanBalance > 0` → погашение
- Погашение → `creditRating` восстанавливается (-0.2, min 1.0)
- Получение кредита → `creditRating` ухудшается (+0.1, max 2.0)
- `productionOverhead` считается только при `production > capacity`
- `holdingCost = endInventory × HOLDING_COST_PER_UNIT`
- `spoilageCost = spoilage × unitCost × 0.5`

#### brand.ts (этап 9)

- Нет активности (`marketing=0, rd=0`) за 12 периодов → бренд ≈ 14.1
- Полный дефицит 2 периода → бренд: 50 → 30 → 12
- `fulfillmentRate >= 0.95` → `brandFromFulfillment = 1.0`
- `fulfillmentRate < 0.75` → brandDamage = `DAMAGE_STOCKOUT × (1 - fulfillmentRate)`
- `price > avgPrice × 1.4` → штраф до 5.0
- Падение qualityScore на > 30% → штраф 3.0
- `brandReputation` остаётся в [0, 100]

#### mpi.ts (этап 10)

- Все одинаковые → `MPI = 500` для всех
- Один доминирует → `MPI ≈ 1000`
- `retainedEarnings < 0` → `f_RE × 0.8` (штраф)
- `period == 1` → `f_GR = 0.5`
- `MPI >= 0` всегда (инвариант)
- Нет деления на 0 (все знаменатели защищены через max(..., 1) или max(..., 0.01))

#### simulation.ts (интеграция)

- Инвариант: `sum(marketShareFraction) ≈ 1.0` (< 0.001 погрешность)
- Инвариант: `inventory[t-1] + production - unitsSold - spoilage == inventory[t]`
- Инвариант: `MPI[i] >= 0` для всех компаний
- Инвариант: `capacity >= 200` для всех компаний
- Прогон 12 периодов: retainedEarnings корректно накапливается
- Сценарий «Все одинаковые»: MPI ≈ 500 ±5, marketShare ≈ 1/N ±0.005
- Сценарий «Полная остановка»: убытки, автокредит активируется, нет NaN/Infinity
- Нет NaN, Infinity при любых входных данных в допустимом диапазоне

---

### 2.6. Зависимости между модулями

```
constants.ts ← (все модули)
types.ts     ← (все модули)

validation.ts  (только constants)
production.ts  ← constants
demand.ts      ← constants
cas.ts         ← constants
market.ts      ← constants, cas.ts
financial.ts   ← constants, production.ts
brand.ts       ← constants, cas.ts
mpi.ts         ← constants
simulation.ts  ← все вышеперечисленные
```

---

### 2.7. Порядок написания тестов (Задача 1.2)

1. `tests/unit/engine/constants.test.ts`
2. `tests/unit/engine/validation.test.ts`
3. `tests/unit/engine/production.test.ts`
4. `tests/unit/engine/demand.test.ts`
5. `tests/unit/engine/cas.test.ts`
6. `tests/unit/engine/market.test.ts`
7. `tests/unit/engine/financial.test.ts`
8. `tests/unit/engine/brand.test.ts`
9. `tests/unit/engine/mpi.test.ts`
10. `tests/unit/engine/simulation.test.ts`

---

### 2.8. Порядок реализации (Задача 1.3)

1. `constants.ts`
2. `types.ts`
3. `validation.ts`
4. `production.ts`
5. `demand.ts`
6. `cas.ts`
7. `market.ts`
8. `financial.ts`
9. `brand.ts`
10. `mpi.ts`
11. `simulation.ts`

---

_Задача 1.1 выполнена. Следующий шаг: Задача 1.2 — написать тесты (все должны падать)._
