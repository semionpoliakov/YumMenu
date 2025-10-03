# YumMenu

YumMenu — планировщик меню: собирает блюда на неделю, учитывает содержимое холодильника и формирует списки покупок.

## Стек

- Next.js (App Router, TypeScript strict)
- Tailwind CSS + shadcn/ui + Radix UI
- TanStack Query
- ts-rest + Zod
- Drizzle ORM + Turso (LibSQL)
- TypeScript, pnpm

## ENV

Основной `.env` находится в корне проекта (см. `.env.example`).
Важно заполнить: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.

## Запуск

1. Установите зависимости: `pnpm install`
2. Скопируйте `.env.example` в `.env` и задайте значения переменных
3. Сгенерируйте миграции (при необходимости): `pnpm db:generate`
4. Примените миграции: `pnpm db:migrate`
5. Запустите приложение: `pnpm dev` (http://localhost:3000)
6. Продажная сборка: `pnpm build` и `pnpm start`
