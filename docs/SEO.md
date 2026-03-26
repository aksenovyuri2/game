# Техническое задание — SEO-оптимизация BizSim

> Поисковая оптимизация веб-приложения «Бизнес-Симулятор: Управление и Экономика»  
> Дополнение к основному ТЗ (docs/SPEC.md)  
> Версия 1.0 | Март 2026

---

## 1. Цели SEO-оптимизации

### 1.1. Зачем

BizSim — клиентское SPA-приложение (React). По умолчанию поисковые роботы плохо индексируют SPA: они видят пустой `<div id="root">` без контента. Без SEO-оптимизации сайт не будет появляться в поиске по запросам вроде «бизнес симулятор онлайн», «экономическая игра бесплатно», «аналог MESE на русском».

### 1.2. Целевые результаты

- Сайт индексируется Яндексом и Google по целевым запросам
- Корректное отображение превью при шаринге ссылки в Telegram, VK, WhatsApp, Twitter/X
- Core Web Vitals в зелёной зоне (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Время до первого контентного отображения (FCP) < 1.5 секунд

### 1.3. Целевые поисковые запросы (семантическое ядро)

**Высокочастотные:**
- бизнес симулятор онлайн
- экономическая игра онлайн бесплатно
- симулятор управления компанией
- бизнес игра в браузере

**Среднечастотные:**
- симуляция экономики онлайн
- управление виртуальной компанией игра
- стратегия управления бизнесом
- аналог MESE на русском
- экономическая стратегия бесплатно

**Низкочастотные (длинный хвост):**
- игра для студентов экономистов
- симулятор предпринимательства для обучения
- бизнес симулятор без регистрации
- экономическая симуляция с ИИ противниками
- игра про управление производством онлайн

---

## 2. Техническая SEO-оптимизация

### 2.1. Рендеринг: SSG через Vite

Поскольку BizSim — это SPA без серверного бэкенда, используем **Static Site Generation (SSG)** для ключевых страниц. Это позволяет отдавать поисковикам готовый HTML без необходимости запуска JavaScript.

**Реализация:**

Использовать плагин `vite-ssg` для пререндеринга статических страниц при сборке:

```
Страницы для пререндеринга:
├── / (главная)
├── /game (игровой экран — пререндер заглушки с описанием)
├── /how-to-play (как играть)
├── /about (о проекте)
└── /sitemap.xml
```

Игровой экран (`/game`) при пререндере отдаёт SEO-заглушку с описанием и CTA, а после гидрации подключается React-приложение.

### 2.2. Маршрутизация

Использовать `react-router-dom` с history mode (не hash-маршрутизацию):

- ✅ `bizsim.vercel.app/how-to-play`
- ❌ `bizsim.vercel.app/#/how-to-play`

**Vercel-конфиг** (`vercel.json`) для корректной работы SPA-роутинга:

```json
{
  "rewrites": [
    { "source": "/((?!api|_next|static|favicon|sitemap|robots).*)", "destination": "/index.html" }
  ]
}
```

### 2.3. Структура URL

| URL | Назначение | Индексация |
|---|---|---|
| `/` | Главная — описание, CTA «Играть» | ✅ Да |
| `/game` | Игровой экран | ⚠️ Заглушка с описанием |
| `/how-to-play` | Правила и обучение | ✅ Да (основной контент) |
| `/about` | О проекте, контакты | ✅ Да |
| `/results` | Экран итогов (динамический) | ❌ Нет (noindex) |

---

## 3. Мета-теги и заголовки

### 3.1. Базовые мета-теги (для каждой страницы)

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="index, follow">
<meta name="language" content="ru">
<meta name="author" content="BizSim">
```

### 3.2. Мета-теги по страницам

**Главная (`/`):**

| Тег | Значение |
|---|---|
| `<title>` | BizSim — Бизнес-Симулятор онлайн · Экономическая игра бесплатно |
| `<meta name="description">` | Бесплатный онлайн бизнес-симулятор на русском. Управляй компанией, конкурируй с ИИ, учись экономике. Без регистрации, прямо в браузере. |
| `<meta name="keywords">` | бизнес симулятор, экономическая игра, симуляция управления, онлайн стратегия, MESE, бесплатно |

**Как играть (`/how-to-play`):**

| Тег | Значение |
|---|---|
| `<title>` | Как играть в BizSim · Правила бизнес-симулятора |
| `<meta name="description">` | Правила игры BizSim: 5 решений, которые определяют судьбу вашей компании. Узнайте как управлять ценой, производством, маркетингом и инвестициями. |

**О проекте (`/about`):**

| Тег | Значение |
|---|---|
| `<title>` | О проекте BizSim · Экономическая симуляция для обучения |
| `<meta name="description">` | BizSim — бесплатная экономическая симуляция, аналог MESE. Для студентов, школьников и всех, кто хочет научиться управлять бизнесом. |

### 3.3. Каноничные URL

Каждая страница должна содержать canonical-тег:

```html
<link rel="canonical" href="https://bizsim.vercel.app/how-to-play">
```

### 3.4. Hreflang (подготовка к i18n)

На начальном этапе только русский, но заложить структуру:

```html
<link rel="alternate" hreflang="ru" href="https://bizsim.vercel.app/">
<link rel="alternate" hreflang="x-default" href="https://bizsim.vercel.app/">
```

---

## 4. Open Graph и социальные сети

### 4.1. Open Graph (Facebook, VK, Telegram, WhatsApp)

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="BizSim">
<meta property="og:locale" content="ru_RU">
<meta property="og:title" content="BizSim — Бизнес-Симулятор онлайн">
<meta property="og:description" content="Бесплатный онлайн бизнес-симулятор. Управляй компанией, конкурируй с ИИ, учись экономике.">
<meta property="og:image" content="https://bizsim.vercel.app/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://bizsim.vercel.app/">
```

### 4.2. Twitter/X Card

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BizSim — Бизнес-Симулятор онлайн">
<meta name="twitter:description" content="Бесплатный онлайн бизнес-симулятор. Управляй компанией, конкурируй с ИИ.">
<meta name="twitter:image" content="https://bizsim.vercel.app/og-image.png">
```

### 4.3. OG-изображение

Создать статическое изображение `og-image.png` (1200×630 px):
- Название «BizSim» крупно
- Подзаголовок «Бизнес-Симулятор: Управление и Экономика»
- Графический элемент (график роста / иконка компании)
- Фоновый градиент в стилистике приложения
- Формат: PNG, вес не более 300 KB

---

## 5. Структурированные данные (Schema.org)

### 5.1. WebApplication (главная страница)

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BizSim — Бизнес-Симулятор",
  "description": "Бесплатный онлайн бизнес-симулятор на русском языке. Управляй виртуальной компанией и конкурируй с ИИ.",
  "url": "https://bizsim.vercel.app",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "RUB"
  },
  "inLanguage": "ru",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "softwareVersion": "1.0",
  "author": {
    "@type": "Organization",
    "name": "BizSim"
  }
}
```

### 5.2. FAQPage (страница «Как играть»)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Что такое BizSim?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "BizSim — бесплатный онлайн бизнес-симулятор, в котором вы управляете виртуальной компанией и конкурируете с ИИ-оппонентами."
      }
    },
    {
      "@type": "Question",
      "name": "Нужна ли регистрация?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Нет. BizSim работает прямо в браузере без регистрации и установки."
      }
    },
    {
      "@type": "Question",
      "name": "Это бесплатно?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Да, BizSim полностью бесплатен."
      }
    }
  ]
}
```

### 5.3. BreadcrumbList

На всех внутренних страницах:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://bizsim.vercel.app/" },
    { "@type": "ListItem", "position": 2, "name": "Как играть", "item": "https://bizsim.vercel.app/how-to-play" }
  ]
}
```

---

## 6. Контентные страницы для SEO

### 6.1. Страница «Как играть» (`/how-to-play`)

Это основная контентная страница для привлечения органического трафика. Должна содержать:

- **H1:** Как играть в BizSim — правила бизнес-симулятора
- **Разделы (H2):**
  - Цель игры
  - 5 решений, которые вы принимаете каждый период
  - Что такое MPI и как победить
  - Уровни сложности ИИ
  - Советы для начинающих
  - Стратегии для опытных игроков
- **Объём:** 2000–3000 слов (длинный контент лучше ранжируется)
- **Внутренние ссылки:** на главную (`/`), на игру (`/game`)
- **Иллюстрации:** скриншоты интерфейса с alt-текстами

### 6.2. Страница «О проекте» (`/about`)

- Что такое BizSim, история создания
- Для кого (целевая аудитория)
- Чем отличается от MESE
- Технологии (краткое описание стека)
- Ссылка на GitHub-репозиторий

### 6.3. Главная страница (`/`)

Помимо интерфейса игры (кнопки «Играть», «Продолжить»), должна содержать видимый текстовый блок:

- Краткое описание (2–3 абзаца): что это, для кого, почему бесплатно
- Ключевые преимущества (список): без регистрации, ИИ-оппоненты, 4 уровня сложности
- CTA: кнопка «Начать игру»
- Ссылки на «Как играть» и «О проекте»

---

## 7. Технические файлы

### 7.1. robots.txt

```
User-agent: *
Allow: /
Disallow: /results
Disallow: /api/

Sitemap: https://bizsim.vercel.app/sitemap.xml
```

Разместить в `public/robots.txt`.

### 7.2. sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bizsim.vercel.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bizsim.vercel.app/how-to-play</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bizsim.vercel.app/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://bizsim.vercel.app/game</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

Разместить в `public/sitemap.xml`.

### 7.3. Favicon и иконки

```
public/
├── favicon.ico          (32×32)
├── favicon-16x16.png    (16×16)
├── favicon-32x32.png    (32×32)
├── apple-touch-icon.png (180×180)
├── android-chrome-192x192.png
├── android-chrome-512x512.png
├── og-image.png         (1200×630)
└── site.webmanifest
```

В `<head>`:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#1F4E79">
```

---

## 8. Производительность (Core Web Vitals)

### 8.1. Целевые метрики

| Метрика | Целевое значение | Как достичь |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5 сек | Пререндеринг главной, оптимизация шрифтов, lazy-load графиков |
| **FID** (First Input Delay) | < 100 мс | Code splitting, вынести Simulation Engine в Web Worker при необходимости |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Фиксированные размеры для графиков и таблиц, font-display: swap |
| **FCP** (First Contentful Paint) | < 1.5 сек | Минимальный initial bundle, критический CSS inline |
| **TTFB** (Time to First Byte) | < 200 мс | Vercel Edge Network, статическая раздача |

### 8.2. Оптимизации

- **Code splitting** по маршрутам: `React.lazy()` + `Suspense` для `/game`, `/how-to-play`, `/results`
- **Шрифты:** системные шрифты или подключать через `font-display: swap`, preload для основного шрифта
- **Изображения:** WebP/AVIF формат, `loading="lazy"`, фиксированные `width`/`height`
- **CSS:** Tailwind purge неиспользуемых классов (по умолчанию в production)
- **JS Bundle:** целевой размер < 500 KB gzip. Контролировать через `rollup-plugin-visualizer`
- **Preload критических ресурсов:**

```html
<link rel="preload" href="/assets/main.js" as="script">
<link rel="preload" href="/assets/main.css" as="style">
```

---

## 9. Аналитика и вебмастер

### 9.1. Яндекс.Вебмастер

- Подтвердить сайт в Яндекс.Вебмастер (мета-тег или DNS)
- Добавить sitemap.xml
- Настроить регион: Россия
- Мониторить индексацию и ошибки

### 9.2. Google Search Console

- Подтвердить сайт в Google Search Console
- Добавить sitemap.xml
- Мониторить Core Web Vitals и покрытие индексом

### 9.3. Аналитика (опционально)

- Яндекс.Метрика — основная аналитика (популярна в рунете, бесплатна)
- Альтернатива: Plausible / Umami (privacy-friendly, self-hosted)
- Трекать: визиты, начало игры, завершение игры, выбор сложности

**Важно:** код аналитики загружать асинхронно, не блокировать рендеринг:

```html
<script defer src="https://mc.yandex.ru/metrika/tag.js"></script>
```

---

## 10. Дополнительные SEO-техники

### 10.1. Внутренняя перелинковка

- Главная ↔ Как играть (в обе стороны)
- Главная ↔ О проекте
- Как играть → Играть (CTA)
- Footer на всех страницах: ссылки на все разделы

### 10.2. Внешние ссылки (линкбилдинг)

Рекомендуемые площадки для размещения ссылок на BizSim:

- GitHub (репозиторий с description и URL)
- Product Hunt (запуск)
- Habr / VC.ru (статья о разработке)
- Тематические Telegram-каналы (образование, экономика, геймдев)
- Каталоги бесплатных онлайн-игр
- Образовательные порталы и форумы

### 10.3. PWA (Progressive Web App)

Файл `site.webmanifest`:

```json
{
  "name": "BizSim — Бизнес-Симулятор",
  "short_name": "BizSim",
  "description": "Экономическая симуляция с ИИ-оппонентами",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1F4E79",
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 10.4. Микроразметка хлебных крошек в UI

Отображать хлебные крошки на страницах:

```
Главная > Как играть
Главная > О проекте
```

С соответствующей Schema.org разметкой (см. раздел 5.3).

---

## 11. Чек-лист SEO перед релизом

| # | Проверка | Статус |
|---|---|---|
| 1 | `<title>` уникален на каждой странице, содержит ключевые слова, до 60 символов | ☐ |
| 2 | `<meta description>` уникален, до 160 символов, содержит CTA | ☐ |
| 3 | Один `<h1>` на страницу, содержит ключевой запрос | ☐ |
| 4 | Open Graph теги на всех страницах, og-image загружается | ☐ |
| 5 | Twitter Card теги на всех страницах | ☐ |
| 6 | Schema.org разметка (WebApplication, FAQPage, BreadcrumbList) | ☐ |
| 7 | Canonical URL на всех страницах | ☐ |
| 8 | robots.txt в корне сайта, Disallow для /results | ☐ |
| 9 | sitemap.xml в корне, зарегистрирован в Search Console и Вебмастере | ☐ |
| 10 | Favicon и apple-touch-icon на месте | ☐ |
| 11 | site.webmanifest (PWA) корректен | ☐ |
| 12 | Все изображения имеют alt-тексты на русском | ☐ |
| 13 | URL читаемые, без хэшей, латиница | ☐ |
| 14 | Страница /how-to-play содержит 2000+ слов контента | ☐ |
| 15 | Core Web Vitals в зелёной зоне (PageSpeed Insights) | ☐ |
| 16 | Мобильная версия проходит Mobile-Friendly Test | ☐ |
| 17 | HTTPS активен (Vercel по умолчанию) | ☐ |
| 18 | Нет битых ссылок (проверить Screaming Frog или аналогом) | ☐ |
| 19 | Яндекс.Вебмастер подтверждён, sitemap добавлен | ☐ |
| 20 | Google Search Console подтверждён, sitemap добавлен | ☐ |
| 21 | Аналитика подключена (Яндекс.Метрика) | ☐ |
| 22 | Скорость загрузки < 3 сек на 3G | ☐ |
| 23 | Bundle size < 500 KB gzip | ☐ |

---

## 12. Реализация в Claude Code

### Порядок работы

Это ТЗ реализуется на **этапе 4–5** основной разработки (после UI) по стандартной методологии:

```
1. Plan → записать план SEO-реализации в PLAN.md
2. Создать контентные страницы (/how-to-play, /about)
3. Добавить мета-теги (компонент SEOHead)
4. Добавить Schema.org разметку
5. Создать robots.txt, sitemap.xml, favicon-набор, og-image
6. Настроить SSG/пререндеринг для статических страниц
7. Проверить Core Web Vitals через Lighthouse
8. Зарегистрировать в Яндекс.Вебмастере и Google Search Console
```

### Рекомендуемый компонент

Создать переиспользуемый компонент `SEOHead`:

```
src/components/seo/
├── SEOHead.tsx       # Управляет <title>, meta, OG, Schema.org
├── SchemaOrg.tsx     # JSON-LD разметка
└── Breadcrumbs.tsx   # Хлебные крошки с микроразметкой
```

### Команда для Claude Code

```
Прочитай docs/SEO.md. Составь план реализации SEO-оптимизации 
в PLAN.md. Начни с создания компонента SEOHead, robots.txt, 
sitemap.xml. Затем контентные страницы /how-to-play и /about.
Сначала план, потом тесты, потом код.
```

---

*— Конец документа —*
