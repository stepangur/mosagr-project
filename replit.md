# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── ag-booklet/         # React+Vite frontend — Буклет АГ сайт
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Artifacts

### `artifacts/ag-booklet` — Буклет АГ сайт

Frontend website for ordering АГ (Архитектурно-градостроительный облик) booklet development services according to Москомархитектура requirements.

Pages:
- **Главная (Home)** — hero section, overview, process steps, FAQ
- **Требования** — full requirements for AG booklet per Moskомархитектура rules
- **Услуги** — three service tiers (consultation, booklet AG, full package)
- **Заказать** — order form (POST /api/orders)
- **Контакты** — contact form (POST /api/contacts)

Tech: React + Vite, Tailwind CSS, shadcn/ui, react-hook-form, framer-motion

### `artifacts/api-server` — Express API Server

Backend API server with routes for orders and contacts.

Routes:
- `GET /api/healthz` — health check
- `GET /api/orders` — list all orders
- `POST /api/orders` — create order
- `POST /api/contacts` — submit contact

## Notification System

### Telegram (`artifacts/api-server/src/lib/telegram.ts`)
Settings stored in `site_settings`: `notify.telegram.enabled`, `notify.telegram.bot_token`, `notify.telegram.chat_id`
- `sendOrderNotification(order)` — non-blocking; reads settings from DB
- Test endpoint: `POST /api/admin/notify/test` — accepts `{botToken, chatId}` body, makes real Telegram API call

### Email (`artifacts/api-server/src/lib/email.ts`)
Dependency: `nodemailer`. Settings stored in `site_settings`:
- `notify.email.enabled`, `notify.email.smtp_host`, `notify.email.smtp_port`, `notify.email.smtp_user`
- `notify.email.smtp_pass`, `notify.email.from`, `notify.email.recipients` (comma-separated), `notify.email.smtp_secure`
- `sendEmailNotification(order)` — non-blocking; reads settings from DB; sends HTML email to all recipients
- Test endpoint: `POST /api/admin/notify/email/test` — accepts full SMTP config in body, no DB save required

Both notifications are triggered non-blocking on every `POST /api/orders`.

## Database Schema

- `orders` table — stores order requests (name, email, phone, address, serviceType, status, notes)
- `contacts` table — stores contact form submissions (name, email, phone, message)
- `site_settings` table — key/value store for all site settings including notification configs

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
