# YumMenu — Tech Stack

## Frontend

- **Next.js** (App Router, TypeScript strict)
- **TanStack Query** (запросы/кэш)
- **react-hook-form** + **@hookform/resolvers/zod**
- **Zod** (валидация)
- **ts-rest** (типобезопасные API-контракты)
- **UI:** shadcn/ui + Radix UI
- **Иконки:** lucide-react
- **Стили:** Tailwind CSS

## Backend (Next API Routes)

- **Next.js Route Handlers** (`app/api/**/route.ts`)
- **Runtime:** Node.js
- **Валидация:** Zod
- **Контракты:** ts-rest
- **Бизнес-логика:** чистые TS-функции (domain/)

## Data Layer

- **База:** Supabase (Postgres)
- **ORM:** Drizzle ORM
- **Миграции:** drizzle-kit
- **Клиент:** postgres (для drizzle-postgres)
- **ID:** ulid или nanoid

## Contracts & Types

- **Zod-first:** схемы DTO
- **ts-rest:** серверные хендлеры + клиент
- **Общее хранилище:** `/contracts`

## Инфраструктура

- **Deploy:** Vercel (один проект)
- **ENV:**
  - `DATABASE_URL`
  - `DIRECT_DATABASE_URL`
- **Миграции:** запускаются отдельным шагом (npm-скрипт или CI)

## Структура(пример)

```json
{
  "apps": {
    "web": {
      "app": {
        "api": {
          "ingredients": "route.ts",
          "dishes": "route.ts",
          "fridge": "route.ts",
          "menus": {
            "generate": "route.ts",
            "[id]": {
              "regenerate": "route.ts",
              "lock": "route.ts"
            }
          },
          "shopping-lists": {
            "[id]": "route.ts"
          }
        },
        "pages_and_components": "UI страницы и компоненты"
      },
      "domain": "чистая бизнес-логика генерации",
      "lib": {
        "apiClient.ts": "ts-rest клиент",
        "queryClient.ts": "TanStack Query клиент",
        "env.ts": "валидация ENV через zod"
      }
    }
  },
  "contracts": "Zod-схемы и ts-rest контракты (общие для фронта и API)",
  "db": "Drizzle ORM схема + миграции",
  "shared": "Утилиты (id, ошибки, helpers)"
}
```

## Основные зависимости

- `next`, `react`, `typescript`
- `zod`
- `@tanstack/react-query`
- `react-hook-form`, `@hookform/resolvers`
- `tailwindcss`, `shadcn/ui`, `lucide-react`
- `drizzle-orm`, `drizzle-kit`, `postgres`
- `@ts-rest/core`, `@ts-rest/next`, `@ts-rest/react-query`
- `nanoid`

## Скрипты

- `dev`
- `build` / `start`
- `db:generate`
- `db:migrate`
- `db:seed`
- `typecheck`, `lint`, `format`
