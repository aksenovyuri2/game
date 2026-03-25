# 🎮 BizSim — Бизнес-Симулятор: Управление и Экономика

Однопользовательская экономическая симуляция (аналог MESE).  
Управляй компанией, конкурируй с ИИ-оппонентами, побеждай.

## Быстрый старт

```bash
npm install
npm run dev
```

## Стек

React + TypeScript + Vite + shadcn/ui + Tailwind CSS + Recharts + Zustand

## Документация

- [Полное ТЗ](docs/SPEC.md)
- [Инструкции для Claude Code](CLAUDE.md)

## Разработка

Проект разрабатывается через Claude Code по методологии **Plan → Tests → Code** (TDD).

```bash
npm run test         # Юнит-тесты
npm run test:e2e     # E2E-тесты
npm run lint         # Линтинг
npm run build        # Сборка
```

## Деплой

Автоматический деплой на Vercel при push в `main`.
