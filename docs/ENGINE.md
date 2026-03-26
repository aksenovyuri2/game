# Экономическая модель и стратегии ИИ — BizSim

> Детальное описание Simulation Engine и алгоритмов ИИ-оппонентов  
> Версия 2.0 | Март 2026

---

# ЧАСТЬ I. ЭКОНОМИЧЕСКАЯ МОДЕЛЬ

---

## 1. Обзор модели

### 1.1. Конвейер расчёта периода

Каждый период обрабатывается строго последовательно. Порядок **критически важен** — изменение последовательности даёт другие результаты.

```
Вход: decisions[i] для каждой компании i = 0..N-1
       marketState из предыдущего периода

  ┌─[Этап 1] Валидация и нормализация решений
  │    Ограничение значений, обработка невалидного ввода
  │
  ├─[Этап 2] Обновление активов (до расчёта продаж)
  │    equipment, rdAccumulated, capacity, unitCost
  │
  ├─[Этап 3] Расчёт макроспроса
  │    totalMarketDemand = f(scenario, period, economicMultiplier)
  │
  ├─[Этап 4] Расчёт привлекательности каждой компании (CAS)
  │    priceScore, marketingScore, qualityScore, brandScore
  │
  ├─[Этап 5] Распределение спроса по компаниям
  │    companyDemand[i] = totalMarketDemand × CAS[i] / sum(CAS)
  │
  ├─[Этап 6] Расчёт продаж и перераспределение неудовл. спроса
  │    unitsSold = min(demand, available), inventory update
  │
  ├─[Этап 7] Финансовый расчёт (P&L)
  │    revenue, COGS, expenses, tax, netProfit
  │
  ├─[Этап 8] Обновление баланса и автокредит
  │    cash, loans, retainedEarnings, creditRating
  │
  ├─[Этап 9] Обновление бренда
  │    brandReputation = f(marketing, quality, stockouts, price)
  │
  └─[Этап 10] Расчёт MPI
       6 компонент → итоговый балл 0–1000

Выход: periodReport[i] для каждой компании
        обновлённый marketState
```

### 1.2. Начальные условия (Period 0)

Все компании стартуют с идентичными показателями:

| Параметр          | Переменная         | Значение         | Описание                   |
| ----------------- | ------------------ | ---------------- | -------------------------- |
| Денежные средства | `cash`             | 50 000 УДЕ       | Свободные деньги           |
| Запасы на складе  | `inventory`        | 600 шт.          | Готовая продукция          |
| Оборудование      | `equipment`        | 100 000 УДЕ      | Балансовая стоимость       |
| R&D-капитал       | `rdAccumulated`    | 1 000 УДЕ        | Накопленные разработки     |
| Репутация бренда  | `brandReputation`  | 50.0             | Шкала 0–100                |
| Нераспр. прибыль  | `retainedEarnings` | 0 УДЕ            | Совокупная прибыль         |
| Мощность          | `capacity`         | 1 000 шт./период | Макс. нормальный выпуск    |
| Кредит            | `loanBalance`      | 0 УДЕ            | Задолженность              |
| Кредитный рейтинг | `creditRating`     | 1.0              | Множитель к ставке         |
| История продаж    | `salesHistory`     | [600]            | Продажи за прошлые периоды |

---

## 2. Этап 1: Валидация решений

### 2.1. Границы решений

| Решение      | Мин | Макс             | По умолч. | Шаг |
| ------------ | --- | ---------------- | --------- | --- |
| `price`      | 10  | 100              | 35        | 1   |
| `production` | 0   | `capacity × 1.5` | 800       | 10  |
| `marketing`  | 0   | 30 000           | 5 000     | 100 |
| `capex`      | 0   | 40 000           | 5 000     | 100 |
| `rd`         | 0   | 30 000           | 3 000     | 100 |

### 2.2. Правила валидации

```
price = clamp(price, 10, 100)
production = clamp(production, 0, floor(capacity × 1.5))
marketing = clamp(marketing, 0, 30000)
capex = clamp(capex, 0, 40000)
rd = clamp(rd, 0, 30000)

production = round(production / 10) × 10
marketing = round(marketing / 100) × 100
capex = round(capex / 100) × 100
rd = round(rd / 100) × 100
```

### 2.3. Краевые случаи валидации

```
CASE: Игрок не отправил решения (таймаут / пропуск)
    → Используются решения предыдущего периода
    → Если period == 1: используются значения по умолчанию

CASE: production > capacity × 1.5
    → Обрезается до capacity × 1.5

CASE: Суммарные расходы превышают cash + maxLoan
    → Решения принимаются как есть, дефицит покрывается автокредитом
    → НЕ блокируем решения: игрок имеет право рисковать
```

---

## 3. Этап 2: Обновление активов

### 3.1. Оборудование и мощности

```
equipment[t] = equipment[t-1] × (1 - DEPRECIATION_RATE) + capex[t]
DEPRECIATION_RATE = 0.08

equipment[t] = max(equipment[t], 0)

capitalRatio = equipment[t] / INITIAL_EQUIPMENT
capacityMultiplier = 1 + CAPACITY_SENSITIVITY × ln(max(capitalRatio, 0.1))
CAPACITY_SENSITIVITY = 0.35
INITIAL_EQUIPMENT = 100000

capacity[t] = BASE_CAPACITY × capacityMultiplier
BASE_CAPACITY = 1000

capacity[t] = clamp(capacity[t], 200, 3000)
```

Краевые случаи:

```
CASE: capex = 0 каждый период
    equipment: 100000 → 92000 → 84640 → 77869 → ...
    capacity:  1000   → 970   → 942   → 916   → ...
    После 10 периодов: capacity ≈ 687
    → Деградация, но не смерть

CASE: capex = 40000 каждый период
    equipment: 100000 → 132000 → 161440 → ...
    capacity:  1000   → 1098   → 1167   → ...
    → Рост замедляется из-за ln() — убывающая отдача

CASE: equipment → 0
    capitalRatio → 0, ln(0.1) = -2.3
    capacityMultiplier = 1 - 0.81 = 0.19
    capacity = max(1000 × 0.19, 200) = 200
    → Минимум 200 — компания не умирает полностью
```

### 3.2. R&D-капитал

```
rdAccumulated[t] = rdAccumulated[t-1] × (1 - RD_DEPRECIATION) + rd[t]
RD_DEPRECIATION = 0.05

rdAccumulated[t] = max(rdAccumulated[t], 0)
```

Краевые случаи:

```
CASE: rd = 0 вся игра (12 периодов)
    rdAccumulated: 1000 → 950 → 902 → ... → 540
    qualityScore: 6.25 → 5.96 → ... → 3.47
    → Медленная деградация качества (−47% за 12 периодов)

CASE: rd = 30000 (максимум) каждый период
    Стабилизация: rdAccumulated → 30000 / 0.05 = 600000
    qualityScore → 97.6
    → Потолок качества. Стоимость: 30000 × 12 = 360000 УДЕ за игру

CASE: Резкое R&D после долгого нуля (rd=0 × 5, затем rd=15000)
    rdAccumulated после 5 нулевых: 774
    Новый: 774 × 0.95 + 15000 = 15735
    qualityScore: с 4.9 до 51.2 за ОДИН период
    → Мгновенный компонент есть, но устойчивость требует продолжения
```

### 3.3. Себестоимость единицы продукции

```
// Постоянные затраты
totalFixedCosts = BASE_FIXED_COSTS + maintenanceCost
BASE_FIXED_COSTS = 8000
maintenanceCost = equipment[t] × MAINTENANCE_RATE
MAINTENANCE_RATE = 0.02

fixedCostPerUnit = totalFixedCosts / max(production, 1)

// Переменные затраты
rawVariableCost = BASE_VARIABLE_COST × (1 - rdEfficiency)
BASE_VARIABLE_COST = 12.0

rdEfficiency = min(MAX_RD_EFFICIENCY, rdAccumulated / RD_EFFICIENCY_SCALE)
MAX_RD_EFFICIENCY = 0.30
RD_EFFICIENCY_SCALE = 100000

// Эффект масштаба
utilizationRate = production / max(capacity, 1)
scaleDiscount = min(MAX_SCALE_DISCOUNT, MAX_SCALE_DISCOUNT × utilizationRate)
MAX_SCALE_DISCOUNT = 0.20

// Штраф за сверхурочные
if production <= capacity:
    overtimePenalty = 1.0
else:
    overtimeRatio = (production - capacity) / capacity
    overtimePenalty = 1.0 + OVERTIME_COST_MULTIPLIER × overtimeRatio
    OVERTIME_COST_MULTIPLIER = 0.50

// Итог
variableCostPerUnit = rawVariableCost × (1 - scaleDiscount) × overtimePenalty
unitCost = fixedCostPerUnit + variableCostPerUnit
unitCost = max(unitCost, 1.0)
```

Краевые случаи:

```
CASE: production = 0
    fixedCostPerUnit = totalFixedCosts / 1 = ~10000
    НО: unitsSold = 0, COGS = 0. Фиксированные затраты несём через operatingExpenses.
    → Остановка производства не спасает от постоянных расходов

CASE: production = 1
    fixedCostPerUnit ≈ 10000. unitCost ≈ 10012.
    → Штучное производство крайне нерентабельно

CASE: production = capacity (полная загрузка)
    fixedCostPerUnit = 10000/1000 = 10
    scaleDiscount = 20%
    variableCost = 12 × (1 - rdEff) × 0.80 × 1.0
    При rdEff=0.2: unitCost ≈ 10 + 7.68 = 17.68
    → Оптимальная зона

CASE: production = capacity × 1.5 (макс. сверхурочные)
    overtimeRatio = 0.5, overtimePenalty = 1.25
    fixedCostPerUnit = 10000/1500 = 6.67
    variableCost = 12 × 0.80 × 0.80 × 1.25 = 9.60
    unitCost ≈ 16.27
    → Может быть выгодно при высоком спросе
```

---

## 4. Этап 3: Макроэкономический спрос

### 4.1. Базовый спрос

```
totalMarketDemand = BASE_DEMAND_PER_COMPANY × numberOfCompanies
                    × economicMultiplier[t]
                    × (1 + noise[t])

BASE_DEMAND_PER_COMPANY = 1000
noise[t] ~ Uniform(-0.03, 0.03)
```

### 4.2. Экономические сценарии

**Стабильный:**

```
economicMultiplier[t] = 1.0
```

**Растущий:**

```
economicMultiplier[t] = 1.0 + 0.03 × t
trendMultiplier:
    t ≤ T/3:     1.0
    t ≤ 2T/3:    1.0 + 0.02 × (t - T/3)
    t > 2T/3:    plateau × 0.99
```

**Кризисный:**

```
crisisStart  = floor(T × 0.2)
crisisBottom = floor(T × 0.5)
recoveryEnd  = floor(T × 0.85)

economicMultiplier[t]:
    t < crisisStart:      1.0
    t < crisisBottom:     1.0 - 0.40 × progress    // Падение до 0.60
    t < recoveryEnd:      0.60 + 0.35 × progress²  // Квадратичное восстановление
    t ≥ recoveryEnd:      0.95                      // «Новая нормальность»
```

**Случайный:**

```
economicMultiplier[0] = 1.0
shock[t] ~ Normal(0, 0.07)
shock[t] += 0.10 × (1.0 - economicMultiplier[t-1])   // Mean reversion
economicMultiplier[t] = clamp(economicMultiplier[t-1] + shock[t], 0.45, 1.60)
```

Краевые случаи:

```
CASE: economicMultiplier → 0.45 (минимум)
    Спрос = 1000 × 5 × 0.45 = 2250 (450/компанию)
    → Жёсткая борьба за ограниченный спрос

CASE: economicMultiplier → 1.60 (максимум)
    Спрос = 1000 × 5 × 1.60 = 8000 (1600/компанию)
    → Дефицит товара если capacity = 1000

CASE: numberOfCompanies = 2 (дуополия)
    Каждое решение СИЛЬНО влияет на конкурента

CASE: numberOfCompanies = 8
    Влияние одной компании рассеивается
```

---

## 5. Этап 4: Конкурентная привлекательность (CAS)

### 5.1. Формула

```
CAS[i] = W_PRICE × priceScore[i]
       + W_MKT × marketingScore[i]
       + W_QUALITY × qualityScore[i]
       + W_BRAND × brandScore[i]

W_PRICE = 0.35,  W_MKT = 0.25,  W_QUALITY = 0.20,  W_BRAND = 0.20

CAS[i] = max(CAS[i], 0.01)
```

### 5.2. Price Score

```
if maxPrice == minPrice:
    priceScore[i] = 50.0     // Все равны
else:
    priceScore[i] = 100 × (maxPrice - price[i]) / (maxPrice - minPrice)

priceScore[i] = priceScore[i] ^ ELASTICITY_EXPONENT
ELASTICITY_EXPONENT = 1.3
```

Краевые случаи:

```
CASE: Все price = 35
    priceScore = 50 для всех → цена не влияет на распределение

CASE: price[0]=10, остальные=50
    priceScore[0] = 100^1.3 = 100, остальные = 0
    → Демпингёр забирает ВЕСЬ ценовой балл
    → Но маржа может быть отрицательной

CASE: price < unitCost
    → Допускается (демпинг как стратегия)
    → cash → минус → автокредит → процентные расходы

CASE: price = 100, остальные 20–30
    priceScore ≈ 0, но CAS может быть >0 за счёт quality/brand
    → «Премиум-ниша»: мало продаж, большая маржа
```

### 5.3. Marketing Score

```
marketingScore[i] = MKTG_MAX × (1 - e^(-marketing[i] / MKTG_HALF))
MKTG_MAX = 100.0
MKTG_HALF = 6000.0

// Бонус за превышение среднего
avgMarketing = mean(marketing[all])
if avgMarketing > 0:
    relativeBonus = RELATIVE_MKT_WEIGHT × (marketing[i] / avgMarketing - 1)
    RELATIVE_MKT_WEIGHT = 10.0
    marketingScore[i] += clamp(relativeBonus, -15, 15)

marketingScore[i] = clamp(marketingScore[i], 0, 100)
```

Таблица эффективности:

| Бюджет | Базовый балл | При avg=8000 | ROI          |
| ------ | ------------ | ------------ | ------------ |
| 0      | 0            | 0            | —            |
| 3 000  | 39           | 33           | Высокий      |
| 6 000  | 63           | 61           | Хороший      |
| 12 000 | 86           | 92           | Средний      |
| 18 000 | 95           | 100          | Низкий       |
| 25 000 | 98           | 100          | Очень низкий |

Краевые случаи:

```
CASE: Все marketing = 0
    marketingScore = 0 для всех, relativeBonus не считается
    → CAS определяется только ценой, качеством, брендом

CASE: Один 25000, остальные 2000
    Лидер: 98.5 + 15 (cap) = 100
    Остальные: 28.3 - 15 = 13.3
    → Преимущество, но 25000 — перерасход (ROI < 12000 за полцены)
```

### 5.4. Quality Score

```
qualityScore[i] = Q_MAX × rdAccumulated[i] / (rdAccumulated[i] + Q_HALF)
Q_MAX = 100.0
Q_HALF = 15000.0
```

| rdAccumulated | qualityScore |
| ------------- | ------------ |
| 1 000 (старт) | 6.25         |
| 5 000         | 25.0         |
| 15 000        | 50.0         |
| 30 000        | 66.7         |
| 60 000        | 80.0         |
| 100 000       | 87.0         |
| 200 000       | 93.0         |

### 5.5. Brand Score

```
brandScore[i] = brandReputation[i]   // 0–100
```

Обновление бренда — см. раздел 9.

---

## 6. Этап 5: Распределение спроса

```
totalCAS = sum(CAS[0..N-1])
marketShareFraction[i] = CAS[i] / totalCAS
companyDemand[i] = floor(totalMarketDemand × marketShareFraction[i])

// Коррекция остатка
remainder = totalMarketDemand - sum(companyDemand)
→ Распределяем по 1 шт. компаниям с наибольшим CAS
```

Краевые случаи:

```
CASE: Все CAS одинаковые
    marketShareFraction = 1/N для всех → равное деление

CASE: Одна CAS = 0.01, остальные ~60
    Доля ≈ 0.004% → companyDemand ≈ 0–2 шт.
    → Почти вытеснена, но не полностью (CAS ≥ 0.01)

CASE: N=2, CAS[0]=80, CAS[1]=40
    Доли: 66.7% и 33.3%
    → В дуополии преимущества сильнее проявляются
```

---

## 7. Этап 6: Продажи и перераспределение

### 7.1. Базовые продажи

```
available[i] = inventory[i] + production[i]
unitsSold[i] = min(companyDemand[i], available[i])
unmetDemand[i] = max(0, companyDemand[i] - available[i])
newInventory[i] = available[i] - unitsSold[i]

// Списание (порча/устаревание)
spoilage = floor(newInventory[i] × SPOILAGE_RATE)
SPOILAGE_RATE = 0.05
newInventory[i] -= spoilage
```

### 7.2. Перераспределение неудовлетворённого спроса

```
totalUnmetDemand = sum(unmetDemand)
redistributedDemand = totalUnmetDemand × REDISTRIBUTION_RATE
REDISTRIBUTION_RATE = 0.60   // 60% идёт к конкурентам, 40% — потеряно

for each company i where newInventory[i] > 0:
    share = CAS[i] / sum(CAS[companies with surplus])
    extraDemand = floor(redistributedDemand × share)
    extraSold = min(extraDemand, newInventory[i])
    unitsSold[i] += extraSold
    newInventory[i] -= extraSold
```

Краевые случаи:

```
CASE: production=0, inventory=0
    unitsSold = 0, brandDamage из-за дефицита
    → Компания невидима на рынке

CASE: demand=2000, available=500
    unitsSold = 500, unmetDemand = 1500
    → 75% спроса не удовлетворено + серьёзный brandDamage
    → 900 шт. (60% от 1500) идёт к конкурентам с запасом

CASE: demand=200, available=1500
    unitsSold = 200, newInventory = 1300
    holdingCost = 1300 × 1.5 = 1950
    → Перепроизводство «съедает» прибыль
```

---

## 8. Этап 7: Финансовый расчёт (P&L)

```
revenue = unitsSold × price
costOfGoodsSold = unitsSold × unitCost
grossProfit = revenue - costOfGoodsSold

// Операционные расходы
marketingExpense = marketing
rdExpense = rd
depreciation = equipment[t-1] × DEPRECIATION_RATE
holdingCost = newInventory × HOLDING_COST_PER_UNIT       // 1.5 УДЕ/шт.
spoilageCost = spoilage × unitCost × 0.5                 // 50% себестоимости
productionOverhead:
    if production > capacity:
        = (production - capacity) × OVERTIME_FIXED_PENALTY  // 3.0 УДЕ/шт.
    else: 0

totalOperatingExpenses = sum(all above)
operatingProfit = grossProfit - totalOperatingExpenses

// Проценты
if loanBalance > 0:
    effectiveRate = INTEREST_RATE × creditRating   // 6% × рейтинг
    interestExpense = loanBalance × effectiveRate
else: interestExpense = 0

profitBeforeTax = operatingProfit - interestExpense

// Налоги
if profitBeforeTax > 0:
    tax = profitBeforeTax × TAX_RATE   // 25%
else:
    tax = 0                             // Нет налога на убытки

netProfit = profitBeforeTax - tax
```

Краевые случаи:

```
CASE: unitsSold=0, production=500, marketing=5000, rd=3000
    revenue = 0, COGS = 0, но operatingExpenses ≈ 20000+
    netProfit ≈ -20000
    → Убытки покрываются из cash / автокредита

CASE: Все расходы = 0 (price=50, production=0, mkt=0, capex=0, rd=0)
    revenue = 0 (нечего продавать если inventory=0)
    totalFixedCosts = 8000 + maintenance → убыток
    → «Ничего не делая» компания теряет деньги

CASE: profitBeforeTax = -50000
    tax = 0, netProfit = -50000
    retainedEarnings -= 50000
    → Отрицательный retainedEarnings допускается
```

---

## 9. Этап 8–9: Баланс и бренд

### 9.1. Денежный поток и автокредит

```
totalOutflow = production × unitCost + marketing + rd + capex
             + tax + interestExpense + holdingCost + spoilageCost
             + productionOverhead

totalInflow = revenue
cash[t] = cash[t-1] + totalInflow - totalOutflow

// Автокредит
if cash[t] < 0:
    loanNeeded = abs(cash[t]) + LOAN_BUFFER            // LOAN_BUFFER = 5000
    maxLoan = MAX_LOAN_RATIO × equipment[t]             // 80% от оборудования
    actualLoan = min(loanNeeded, maxLoan - loanBalance)
    actualLoan = max(actualLoan, 0)

    if actualLoan < loanNeeded:
        cash[t] = -1000  // Овердрафт (нет залога)
    else:
        loanBalance += actualLoan
        cash[t] += actualLoan

    creditRating = min(creditRating + 0.1, 2.0)        // Ухудшение рейтинга

// Автопогашение
if cash[t] > REPAYMENT_THRESHOLD AND loanBalance > 0:  // THRESHOLD = 20000
    repayment = min(loanBalance, cash[t] - 15000)
    repayment = max(repayment, 0)
    loanBalance -= repayment
    cash[t] -= repayment
    if loanBalance == 0:
        creditRating = max(creditRating - 0.2, 1.0)    // Восстановление

retainedEarnings[t] = retainedEarnings[t-1] + netProfit
salesHistory.push(unitsSold)
```

Краевые случаи:

```
CASE: cash < 0, equipment ≈ 0, loanBalance уже большой
    maxLoan = 0, actualLoan = 0, cash = -1000
    → Овердрафт. Компания продолжает, но с огромным штрафом

CASE: retainedEarnings = -100000
    → MPI retainedEarningsScore будет 0 (или минимальный)
    → Компания может «вернуться» если начнёт генерировать прибыль

CASE: loanBalance > 0, creditRating = 2.0
    effectiveRate = 12%. Кредитная спираль.
    → Нужно срочно генерировать прибыль
```

### 9.2. Обновление бренда

```
brandBase = brandReputation[t-1] × BRAND_RETENTION        // 0.90

// Прирост
brandFromMarketing = (marketingScore / MKTG_MAX) × BRAND_MKT_CAP    // до 3.0
brandFromQuality = (qualityScore / Q_MAX) × BRAND_QUALITY_CAP       // до 2.0
fulfillmentRate = unitsSold / max(companyDemand, 1)
brandFromFulfillment = 1.0 if fulfillmentRate >= 0.95 else 0.0

// Штрафы
brandDamage = 0

if fulfillmentRate < 0.75:
    brandDamage += DAMAGE_STOCKOUT × (1 - fulfillmentRate)           // до 15.0

if price > avgPrice × 1.4:
    priceExcess = min((price / avgPrice - 1.4) / 0.6, 1.0)
    brandDamage += DAMAGE_OVERPRICE × priceExcess                    // до 5.0

if qualityScore < prevQualityScore × 0.7:
    brandDamage += DAMAGE_QUALITY_DROP                                // 3.0

// Итог
brandReputation[t] = brandBase + brandFromMarketing + brandFromQuality
                   + brandFromFulfillment - brandDamage
brandReputation[t] = clamp(brandReputation[t], 0, 100)
```

Краевые случаи:

```
CASE: marketing=0, rd=0, 12 периодов
    brand: 50 → 45 → 40.5 → ... → 14.1
    → Экспоненциальное затухание без поддержки

CASE: Полный дефицит 2 периода подряд (fulfillmentRate=0)
    Период 1: brand = 50 × 0.9 - 15 = 30
    Период 2: brand = 30 × 0.9 - 15 = 12
    → Два дефицита «убивают» бренд

CASE: Стабильный mkt=10000, rd=8000
    Прирост ≈ 2.43 + 1.20 + 1.0 = 4.63
    Затухание: 50 × 0.1 = 5.0
    → brand ≈ стабильный (49.6)
    → Для РОСТА бренда нужно mkt > 12000 или rd > 10000
```

---

## 10. Этап 10: MPI

### 10.1. Формула

```
rawMPI = W_RE × f_RE + W_DP × f_DP + W_SP × f_SP
       + W_PR × f_PR + W_MS × f_MS + W_GR × f_GR

W_RE=0.30  W_DP=0.15  W_SP=0.15  W_PR=0.10  W_MS=0.15  W_GR=0.15

MPI = max(round(rawMPI × 1000), 0)
```

### 10.2. Компоненты

```
// Retained Earnings (нормализованный среди всех)
if maxRE == minRE: f_RE = 0.5
else: f_RE = (retainedEarnings - minRE) / (maxRE - minRE)
if retainedEarnings < 0: f_RE *= 0.8   // Штраф за убыточность

// Demand Potential
f_DP = CAS / max(CAS[all])

// Supply Potential
supplyPotential = capacity × 0.7 + inventory × 0.3
f_SP = supplyPotential / max(supplyPotential[all])

// Productivity
productivity = revenue / max(totalCosts, 1)
f_PR = productivity / max(productivity[all], 0.01)

// Market Share
f_MS = unitsSold / max(sum(unitsSold), 1)

// Growth
if period == 1: f_GR = 0.5
else:
    growthRatio = revenue / max(prevRevenue, 1)
    f_GR = clamp((growthRatio - 0.5) / 1.5, 0, 1)
```

Краевые случаи:

```
CASE: Все одинаковые → MPI = 500 для всех
CASE: Один доминирует → MPI ≈ 1000
CASE: retainedEarnings = -80000 при остальных +50000 → f_RE = 0 × 0.8 = 0
```

---

## 11. Информация, видимая игроку

```
О СВОЕЙ компании: полная информация (P&L, баланс, все внутренние метрики)
О КОНКУРЕНТАХ: price, unitsSold, marketShare, MPI (публичные)
НЕ ВИДНО: marketing, capex, rd, cash, loanBalance, inventory (закрытые)
РЫНОК: avgPrice, totalMarketDemand, economicMultiplier, avgUnitsSold
```

---

# ЧАСТЬ II. СТРАТЕГИИ ИИ

---

## 12. Архитектура ИИ

### 12.1. Параметры по уровням

| Параметр            | Новичок              | Средний         | Эксперт    | Мастер             |
| ------------------- | -------------------- | --------------- | ---------- | ------------------ |
| `noiseAmplitude`    | 0.20                 | 0.12            | 0.05       | 0.02               |
| `planningHorizon`   | 0                    | 1               | 3          | 5                  |
| `adaptiveness`      | 0.0                  | 0.3             | 0.7        | 1.0                |
| Доступные характеры | Cautious, Balanced   | + Aggressive    | + Adaptive | Все усиленные      |
| Ошибки              | 20% периодов         | 10%             | 3%         | 0%                 |
| Стартовый штраф     | price×1.10, mkt×0.80 | Нет             | Нет        | price×0.95 (бонус) |
| Реакция на кризис   | Задержка 2 пер.      | Задержка 1 пер. | Мгновенная | Предвидение        |

### 12.2. Применение шума

```
applyNoise(value, noiseAmplitude):
    noise = Uniform(-1, 1) × noiseAmplitude
    return value × (1 + noise)
```

### 12.3. Намеренные ошибки

```
if random() < errorRate:
    errorType = randomChoice(['bad_price', 'bad_production', 'bad_marketing'])
    bad_price:      price *= choice([0.75, 1.30])
    bad_production: production *= choice([0.50, 1.80])
    bad_marketing:  marketing *= choice([0.30, 2.50])
```

---

## 13. Стратегии характеров

### 13.1. CautiousAI

```
ЦЕНА: unitCost × 1.40 (маржа 40%). Не ниже unitCost × 1.15.
      Медленно следует за avgPrice (±5%/период).

ПРОИЗВОДСТВО: expectedDemand × 1.05 + safetyStock(10% capacity).
              НИКОГДА > capacity (без сверхурочных).

МАРКЕТИНГ: 10% от выручки. Диапазон [3000, 10000].
           При падении доли: × 1.15.

CAPEX: equipment × depRate × 1.1 (покрытие амортизации + 10%).
       При capacity < demand × 0.9: × 1.5.
       Диапазон [2000, 15000].

R&D: rdAccumulated × rdDepreciation × 1.3 (поддержание уровня).
     Минимум: 7% от выручки. Диапазон [2000, 10000].

КРИЗИС (multiplier < 0.75):
    marketing × 0.70, production × 0.80, rd × 0.80. Цену НЕ меняет.

БЮДЖЕТ: Если totalSpend > cash × 0.85 → пропорциональное урезание.
```

### 13.2. AggressiveAI

```
ЦЕНА: avgPrice × 0.85. Минимум: unitCost × 1.03.
      На Мастере, периоды 1–3: avgPrice × 0.70 (блиц-демпинг).
      При cash < 5000 + кредит: вынужденный unitCost × 1.20.

ПРОИЗВОДСТВО: capacity × 1.15. При растущем рынке: × 1.30.
              Макс: capacity × 1.5.

МАРКЕТИНГ: 20% от выручки. Диапазон [6000, 25000].
           На Мастере каждый 3-й период: × 1.5.

CAPEX: equipment × depRate × 2.0. При capacity < demand × 1.1: min 15000.
       Диапазон [3000, 30000].

R&D: 6% от выручки. Диапазон [1500, 8000].
     Если qualityScore < avg × 0.6: × 2.0.

КОНКУРЕНТЫ: Если кто-то дешевле → перебить на 3% (price × 0.97).
            Минимум: unitCost × 1.01.

КРИЗИС: ПРОДОЛЖАЕТ давить (price × 0.95, mkt × 0.90, prod × 0.85).
```

### 13.3. BalancedAI

```
ЦЕНА: avgPrice × [0.97, 1.03]. Целевая маржа 25–35%.

ПРОИЗВОДСТВО: expectedDemand - inventory + 15% запас.
              Диапазон [capacity × 0.4, capacity × 1.1].

МАРКЕТИНГ: 12% от max(выручка, 20000). Диапазон [4000, 12000].
R&D: 9% от базы. Диапазон [2500, 10000].
CAPEX: equipment × depRate × 1.3. При нехватке мощностей: + 5000.

САМОКОРРЕКЦИЯ MPI (с периода 3):
    Слабый demandPotential → mkt × 1.25, rd × 1.15
    Слабый supplyPotential → capex × 1.40, prod × 1.15
    Слабый productivity    → mkt × 0.85, rd × 0.85
    Слабый marketShare     → price × 0.95, mkt × 1.20
    Слабый growth          → prod × 1.10, mkt × 1.10

КРИЗИС: Все расходы × (multiplier / 1.0). R&D ≥ 80% от обычного.
```

### 13.4. AdaptiveAI

```
ФАЗЫ:
    Периоды 1–3 (2 на Мастере): сбор данных, играет как Balanced.
    Период 3+: классификация → контрстратегия.
    Реанализ: каждые 2 периода (Эксперт), каждый период (Мастер).

КЛАССИФИКАЦИЯ ИГРОКА:
    avgPlayerPriceRatio = mean(playerPriceHistory) / avgPrice

    price_leader:    priceRatio < 0.85
    quality_leader:  priceRatio > 1.15 AND salesGrowth > 1.1
    passive:         priceRatio > 1.15 AND salesGrowth ≤ 1.1
    marketing_heavy: marketShareTrend > 0.03 AND priceRatio ≈ 1.0
    balanced:        всё ≈ среднее
    unknown:         не классифицировано → ответ как balanced

КОНТРСТРАТЕГИИ (множители к базовым решениям BalancedAI):

    vs price_leader:
        price × 1.05, mkt × 1.40, rd × 1.50, capex × 1.10, prod × 0.95
        Логика: НЕ конкурировать по цене → дифференциация

    vs quality_leader:
        price × 0.88, mkt × 1.30, rd × 0.70, capex × 1.20, prod × 1.15
        Логика: давить ценой и маркетингом

    vs marketing_heavy:
        price × 0.92, mkt × 0.80, rd × 1.50, capex × 1.10, prod × 1.05
        Логика: R&D + цена (маркетинговую войну не выиграть)

    vs balanced:
        Найти слабое место игрока (brand/quality/capacity) → давить туда.
        По умолчанию: price × 0.93, mkt × 1.15

    vs passive:
        price × 0.82, mkt × 1.50, prod × 1.30
        Логика: забрать весь рынок у пассивного игрока
```

---

## 14. Специальные тактики «Мастер»

### 14.1. Блиц-демпинг (Aggressive)

```
Период 1–3: price = unitCost × 1.03, marketing = 15000
Период 4–6: price += 5% за период
Период 7+:  price = avgPrice × 0.92
Отмена: если retainedEarnings < -30000 к периоду 3 → переход на Balanced
```

### 14.2. R&D-марафон (Cautious)

```
Период 1–4: rd = 80% бюджета (15000–20000), price = avgPrice × 1.05
Период 5:   rdAccumulated ≈ 60000+, qualityScore ≈ 80
Период 5+:  price = avgPrice × 1.15 (премиум), rd → поддерживающий
```

### 14.3. Маркетинговые волны (Balanced)

```
Нечётные периоды: marketing = 18000
Чётные периоды:   marketing = 4000
Выгода: экономия cash в «низкие» периоды → capex/R&D
```

### 14.4. Ансамблевая координация (4+ ИИ на Мастере)

```
ИИ-1 (Aggressive): давит ценой
ИИ-2 (Cautious):   давит качеством (R&D-марафон)
ИИ-3 (Balanced):   давит маркетингом
ИИ-4 (Adaptive):   контратакует слабое место игрока

→ Игрок не может победить по ВСЕМ фронтам одновременно
→ Единственный способ: найти баланс с суммарным MPI выше любого ИИ
```

---

## 15. Тестирование

### 15.1. Инварианты (должны выполняться ВСЕГДА)

```
sum(cashFlow) == cash[t] - cash[t-1] + loanChange
inventory[t-1] + production - unitsSold - spoilage == inventory[t]
for all i: MPI[i] >= 0
abs(sum(marketShareFraction) - 1.0) < 0.001
for all i: unitsSold >= 0, inventory >= 0, equipment >= 0, capacity >= 200
```

### 15.2. Сценарии валидации

```
«Все одинаковые»:      MPI ±1%, marketShare ±0.5%
«Демпингёр»:            макс marketShare, НЕ макс MPI к периоду 8+
«Нулевой R&D»:          qualityScore падает, marketShare < 15% к периоду 10
«Полная остановка»:     убытки, автокредит, нет NaN/Infinity
«Кризис»:               все в убытке на дне, никто не «умирает»
«Экстремальные входы»:  нет NaN, Infinity, деления на ноль
```

### 15.3. Целевой winRate ИИ

```
500 автоигр на каждый уровень, бот-игрок = BalancedAI(noise=0):
    Новичок:  80–90% winRate
    Средний:  50–65%
    Эксперт:  30–45%
    Мастер:   10–25%
```

---

## 16. Все константы модели

| Константа                  | Значение | Описание                         |
| -------------------------- | -------- | -------------------------------- |
| `BASE_CAPACITY`            | 1000     | Начальная мощность               |
| `INITIAL_EQUIPMENT`        | 100000   | Начальная стоимость оборудования |
| `DEPRECIATION_RATE`        | 0.08     | Амортизация за период            |
| `CAPACITY_SENSITIVITY`     | 0.35     | Чувствительность мощности        |
| `RD_DEPRECIATION`          | 0.05     | Устаревание R&D                  |
| `BASE_FIXED_COSTS`         | 8000     | Постоянные расходы               |
| `MAINTENANCE_RATE`         | 0.02     | Обслуживание оборудования        |
| `BASE_VARIABLE_COST`       | 12.0     | Переменная себестоимость         |
| `MAX_RD_EFFICIENCY`        | 0.30     | Макс. снижение затрат от R&D     |
| `RD_EFFICIENCY_SCALE`      | 100000   | R&D для макс. эффекта            |
| `MAX_SCALE_DISCOUNT`       | 0.20     | Макс. эффект масштаба            |
| `OVERTIME_COST_MULTIPLIER` | 0.50     | Штраф за сверхурочные            |
| `OVERTIME_FIXED_PENALTY`   | 3.0      | Фикс. штраф за единицу           |
| `BASE_DEMAND_PER_COMPANY`  | 1000     | Базовый спрос на компанию        |
| `ELASTICITY_EXPONENT`      | 1.3      | Ценовая эластичность             |
| `MKTG_MAX`                 | 100.0    | Макс. маркетингового балла       |
| `MKTG_HALF`                | 6000.0   | Маркетинг для 63% max            |
| `RELATIVE_MKT_WEIGHT`      | 10.0     | Вес относительного маркетинга    |
| `Q_MAX`                    | 100.0    | Макс. балла качества             |
| `Q_HALF`                   | 15000.0  | R&D для 50% качества             |
| `W_PRICE`                  | 0.35     | Вес цены в CAS                   |
| `W_MKT`                    | 0.25     | Вес маркетинга в CAS             |
| `W_QUALITY`                | 0.20     | Вес качества в CAS               |
| `W_BRAND`                  | 0.20     | Вес бренда в CAS                 |
| `BRAND_RETENTION`          | 0.90     | Сохранение бренда                |
| `BRAND_MKT_CAP`            | 3.0      | Макс. прирост от маркетинга      |
| `BRAND_QUALITY_CAP`        | 2.0      | Макс. прирост от качества        |
| `DAMAGE_STOCKOUT`          | 15.0     | Штраф за дефицит                 |
| `DAMAGE_OVERPRICE`         | 5.0      | Штраф за завышение цены          |
| `DAMAGE_QUALITY_DROP`      | 3.0      | Штраф за падение качества        |
| `REDISTRIBUTION_RATE`      | 0.60     | Перераспределение спроса         |
| `SPOILAGE_RATE`            | 0.05     | Порча запасов                    |
| `HOLDING_COST_PER_UNIT`    | 1.5      | Стоимость хранения               |
| `TAX_RATE`                 | 0.25     | Налог на прибыль                 |
| `INTEREST_RATE`            | 0.06     | Ставка кредита                   |
| `MAX_LOAN_RATIO`           | 0.80     | Макс. кредит (% от equipment)    |
| `LOAN_BUFFER`              | 5000     | Буфер автокредита                |
| `REPAYMENT_THRESHOLD`      | 20000    | Порог автопогашения              |
| `W_RE`                     | 0.30     | Вес прибыли в MPI                |
| `W_DP`                     | 0.15     | Вес спроса в MPI                 |
| `W_SP`                     | 0.15     | Вес предложения в MPI            |
| `W_PR`                     | 0.10     | Вес продуктивности в MPI         |
| `W_MS`                     | 0.15     | Вес доли рынка в MPI             |
| `W_GR`                     | 0.15     | Вес роста в MPI                  |

---

_— Конец документа —_
