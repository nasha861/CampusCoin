# Campus Coin

**NextGen BudgetBee** — a responsive, student-first budgeting and
expense-tracking web application.

> This repository is currently scaffolded as a **frontend-only** React
> application. There is no backend/database in this repo yet; the API and
> service layers define the contract a future backend should implement.

## Stack

- React 18 + TypeScript + Vite
- React Router
- Tailwind CSS
- Recharts (charts)
- Lucide React (icons)
- Axios (HTTP client)

## Getting started

```bash
npm install
cp .env.example .env.local   # then set VITE_API_BASE_URL once a backend exists
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`, `npm run format`.

## Project structure

```
src/
├── assets/          static images/fonts
├── components/       reusable UI, grouped by feature
│   ├── common/        generic building blocks (Button, Input, Card, ...)
│   ├── layout/         navbar/sidebar/footer used by layouts
│   ├── dashboard/       dashboard widgets
│   ├── transactions/    transaction list/form components
│   ├── budgets/          budget list/progress components
│   ├── reports/           chart/report components
│   ├── insights/           insight + saving-tip cards
│   ├── categories/          category list/form components
│   └── admin/                 admin console components
├── pages/            route-level screens, mirrors the route table
│   ├── public/         marketing pages
│   ├── auth/             login/register/password recovery
│   ├── student/            protected student app
│   └── admin/                protected admin console
├── layouts/          PublicLayout, AuthLayout, StudentLayout, AdminLayout
├── routes/           AppRoutes, ProtectedRoute, RoleRoute
├── contexts/         AuthContext, ThemeContext, NotificationContext
├── hooks/            useAuth, useTheme, useNotifications, useAsync
├── services/         business logic; the only layer pages/components call
├── api/              typed Axios wrappers; the only layer that knows REST paths
├── types/            shared TypeScript types/interfaces
├── utils/            formatting, validation, class-name helpers
├── constants/        route paths, app config, feature flags
└── styles/           global Tailwind entrypoint
```

Data flow: `pages/components → services → api → httpClient → (future backend)`.
Components never talk to `src/api` directly, and never contain data-fetching
or database logic.

## Routes

See `src/constants/routes.ts` for the canonical path list and
`docs/architecture/overview.md` for the full architecture writeup, including
the AI abstraction layer (`src/api/ai.api.ts` / `src/services/ai.service.ts`)
which is intentionally provider-agnostic.

## Status

This is the **architecture/scaffolding phase**. Folders, types, the API and
service contracts, routing, layouts, and placeholder pages are in place so
each feature (auth forms, transaction CRUD, budgets, reports, insights, CSV
import, admin console, etc.) can be implemented independently on top of a
stable structure. Feature pages currently render a `PageStub` placeholder —
replace them one at a time as each feature is built.
