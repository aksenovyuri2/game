# PLAN.md — Этап 1: Инициализация проекта

## Статус: ВЫПОЛНЕН

## Что сделано

### 1. Vite + React + TypeScript

- Проект создан на Vite с шаблоном `react-ts`
- TypeScript в strict mode, алиас `@/` → `src/`
- `tsconfig.json` + `tsconfig.node.json`

### 2. UI-фреймворк

- **Tailwind CSS v4** через `@tailwindcss/vite` плагин
- **shadcn/ui** — компоненты Button, Card, Input созданы вручную
- CSS-переменные для тем (light/dark ready)
- Утилита `cn()` из `clsx` + `tailwind-merge`
- **Lucide React** — библиотека иконок

### 3. Состояние и данные

- **Zustand** — менеджер состояния
- **Recharts** — графики и диаграммы
- **Dexie.js** — обёртка для IndexedDB (сохранения)

### 4. Структура папок

```
src/
├── app/               # Точка входа, роутинг
├── components/
│   ├── ui/            # shadcn/ui (Button, Card, Input)
│   ├── game/          # Игровые компоненты
│   ├── charts/        # Графики
│   └── layout/        # Шапка, навигация
├── engine/            # Simulation Engine
├── ai/                # ИИ-оппоненты
├── store/             # Zustand-сторы
├── screens/           # Экраны (страницы)
├── lib/               # Утилиты (cn, helpers)
└── types/             # Глобальные типы
tests/
├── unit/engine/
├── unit/ai/
└── e2e/
```

### 5. Инструменты разработки

- **ESLint** + `@typescript-eslint` — запрет `any`
- **Prettier** — единый стиль кода
- **Vitest** — юнит-тесты (jsdom)
- **Playwright** — E2E-тесты
- **Husky + lint-staged** — pre-commit хуки

### 6. Скрипты

| Команда              | Описание                |
| -------------------- | ----------------------- |
| `npm run dev`        | Dev-сервер (Vite)       |
| `npm run build`      | Продакшен-сборка        |
| `npm run test`       | Юнит-тесты (Vitest)     |
| `npm run test:watch` | Тесты в watch-режиме    |
| `npm run test:e2e`   | E2E-тесты (Playwright)  |
| `npm run lint`       | Линтинг ESLint          |
| `npm run format`     | Форматирование Prettier |

## Следующий этап

**Этап 2 — Simulation Engine (ядро экономики)**

- Определить интерфейсы в `src/engine/types.ts`
- Написать тесты для расчёта спроса, себестоимости, MPI
- Реализовать ядро симуляции: `simulation.ts`, `market.ts`, `costs.ts`, `mpi.ts`
