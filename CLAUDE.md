# BizSim — Бизнес-Симулятор: Управление и Экономика

## Спецификация

Полное ТЗ проекта: `docs/SPEC.md`

## Описание

Однопользовательская экономическая симуляция (аналог MESE). Игрок управляет компанией, конкурирует с ИИ-оппонентами на едином рынке. Полностью клиентское SPA — без серверного бэкенда, без регистрации.

## Стек

- **Фреймворк:** React 18+ с TypeScript (strict mode)
- **Сборка:** Vite
- **UI:** shadcn/ui + Tailwind CSS + Lucide Icons
- **Графики:** Recharts
- **Состояние:** Zustand
- **Сохранение:** localStorage / IndexedDB (Dexie.js)
- **Тесты:** Vitest (юнит) + Playwright (E2E)
- **Линтинг:** ESLint + Prettier
- **Коммиты:** Husky + lint-staged
- **Репозиторий:** GitHub
- **Деплой:** Vercel (автодеплой при push в main)

## Структура проекта

```
bizsim/
├── CLAUDE.md              # Этот файл
├── PLAN.md                # Текущий план разработки
├── docs/
│   └── SPEC.md            # Полное ТЗ проекта
├── src/
│   ├── app/               # Точка входа, роутинг, провайдеры
│   ├── components/        # UI-компоненты (shadcn/ui обёртки)
│   │   ├── ui/            # shadcn/ui базовые компоненты
│   │   ├── game/          # Игровые компоненты (решения, отчёты)
│   │   ├── charts/        # Графики и диаграммы
│   │   └── layout/        # Шапка, навигация, лейаут
│   ├── engine/            # Simulation Engine (экономическая модель)
│   │   ├── simulation.ts  # Ядро расчётов периода
│   │   ├── market.ts      # Расчёт спроса и доли рынка
│   │   ├── costs.ts       # Себестоимость, амортизация
│   │   ├── mpi.ts         # Расчёт Management Performance Index
│   │   └── types.ts       # Типы и интерфейсы модели
│   ├── ai/                # ИИ-оппоненты
│   │   ├── base.ts        # Базовый класс AIPlayer
│   │   ├── cautious.ts    # Осторожный ИИ
│   │   ├── aggressive.ts  # Агрессивный ИИ
│   │   ├── balanced.ts    # Сбалансированный ИИ
│   │   ├── adaptive.ts    # Адаптивный ИИ
│   │   └── difficulty.ts  # Конфигурация уровней сложности
│   ├── store/             # Zustand-сторы
│   │   ├── gameStore.ts   # Состояние текущей игры
│   │   └── savesStore.ts  # Управление сохранениями
│   ├── screens/           # Экраны (страницы)
│   │   ├── HomeScreen.tsx
│   │   ├── NewGameScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── ResultsScreen.tsx
│   │   └── HelpScreen.tsx
│   ├── lib/               # Утилиты, хелперы, i18n
│   └── types/             # Глобальные типы
├── tests/
│   ├── unit/              # Юнит-тесты (Vitest)
│   │   ├── engine/
│   │   └── ai/
│   └── e2e/               # E2E-тесты (Playwright)
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── .github/               # GitHub-конфигурация (опционально)
```

## Методология разработки: Plan → Tests → Code

### Порядок работы над каждой фичей:

**Этап 1 — Plan:**

- Составить подробный план реализации в `PLAN.md`
- Описать: файлы, интерфейсы, зависимости, краевые случаи
- Дождаться утверждения перед написанием кода

**Этап 2 — Tests (Red):**

- Написать юнит-тесты (Vitest) ДО реализации
- Тесты описывают ожидаемое поведение: вход/выход, граничные значения
- Все тесты должны ПАДАТЬ на этом этапе

**Этап 3 — Code (Green):**

- Написать минимальную реализацию, чтобы все тесты стали зелёными
- Не добавлять функциональность сверх того, что покрыто тестами

**Этап 4 — Refactor:**

- Рефакторинг без поломки тестов
- Коммит в GitHub → автодеплой Vercel

### Команды для запуска

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Продакшен-сборка
npm run test         # Юнит-тесты (Vitest)
npm run test:watch   # Тесты в watch-режиме
npm run test:e2e     # E2E-тесты (Playwright)
npm run lint         # Линтинг
npm run format       # Форматирование
```

## Конвенции кода

### Именование

- Файлы компонентов: `PascalCase.tsx` (например `GameScreen.tsx`)
- Файлы логики: `camelCase.ts` (например `simulation.ts`)
- Тесты: `*.test.ts` / `*.test.tsx` рядом с файлом или в `tests/`
- Типы/интерфейсы: `PascalCase`, префикс `I` не используется

### TypeScript

- Strict mode обязателен
- Запрещено: `any`, `@ts-ignore`, `as unknown as`
- Все функции должны иметь явные типы параметров и возвращаемого значения
- Интерфейсы модели определены в `src/engine/types.ts`

### Коммиты (Conventional Commits)

```
feat: добавить расчёт MPI
fix: исправить формулу себестоимости при нулевом производстве
test: добавить тесты для AggressiveAI
refactor: вынести расчёт спроса в отдельный модуль
docs: обновить PLAN.md
```

### Компоненты React

- Только функциональные компоненты с хуками
- Экспорт: `export default` для экранов, именованный для компонентов
- Стилизация: только Tailwind-классы, никаких CSS-файлов
- Состояние: Zustand (глобальное), useState (локальное)

## Запрещено

- `any` в TypeScript
- Коммит с красными тестами
- Пропуск тестов для бизнес-логики (engine/, ai/)
- CSS-файлы (только Tailwind)
- Прямое обращение к localStorage (только через savesStore)
- Серверные вызовы (всё работает на клиенте)
- `console.log` в продакшен-коде

## Ключевые интерфейсы (engine/types.ts)

```typescript
interface Decisions {
  price: number // Цена за единицу (УДЕ)
  production: number // Объём производства (шт.)
  marketing: number // Бюджет на маркетинг (УДЕ)
  capitalInvestment: number // Капитальные инвестиции (УДЕ)
  rd: number // НИОКР (УДЕ)
}

interface CompanyState {
  name: string
  decisions: Decisions
  cash: number
  inventory: number
  equipment: number
  rdAccumulated: number
  retainedEarnings: number
  // ... финансовые показатели
}

interface PeriodResult {
  revenue: number
  costOfGoods: number
  grossProfit: number
  netProfit: number
  marketShare: number
  unitsSold: number
  mpi: number
  // ... отчёт о прибылях и убытках
}

type Difficulty = 'novice' | 'medium' | 'expert' | 'master'
type AICharacter = 'cautious' | 'aggressive' | 'balanced' | 'adaptive'
type MarketScenario = 'stable' | 'growing' | 'crisis' | 'random'
```

## Порядок реализации фич

1. Инициализация проекта (Vite + React + TS + shadcn/ui + GitHub + Vercel)
2. Simulation Engine (ядро экономики) — Plan → Tests → Code
3. ИИ-оппоненты (4 характера, 4 уровня) — Plan → Tests → Code
4. UI: экраны и компоненты — v0.dev → интеграция
5. Сохранение, онбординг, справка — Plan → Tests → Code
6. E2E-тесты и балансировка ИИ — Tests → Fix
7. Полировка и релиз — Refactor → Production Vercel
