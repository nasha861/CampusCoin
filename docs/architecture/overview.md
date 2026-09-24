# Architecture Overview

Campus Coin (NextGen BudgetBee) is currently scaffolded as a **frontend-only**
React application. There is no backend in this repository yet — the
architecture below is written so a REST API can be dropped in later without
touching UI code.

## Layers

1. **Presentation** — `src/pages`, `src/components`, `src/layouts`. Pages
   compose feature components; components never call `fetch`/`axios`
   directly.
2. **Application/state** — `src/contexts`, `src/hooks`. React Context holds
   cross-cutting state (auth session, theme, notifications); hooks expose it
   ergonomically.
3. **Service layer** — `src/services`. Business logic and derived
   computations (budget status, chart-data shaping, AI feature flags) live
   here. Pages/components call services, never `src/api` directly.
4. **API layer** — `src/api`. One module per resource, each a thin,
   fully-typed wrapper around a shared Axios instance (`httpClient.ts`).
   This is the *only* place that knows REST paths and HTTP verbs.

```
pages/components → services → api → httpClient → (future backend)
```

## Routing

`src/routes/AppRoutes.tsx` is the single source of truth for the route
table, composed from three layouts:

- `PublicLayout` — marketing pages, always accessible.
- `AuthLayout` — login/register/password-recovery flows.
- `StudentLayout` — wrapped in `ProtectedRoute` (requires a session).
- `AdminLayout` — wrapped in `ProtectedRoute` + `RoleRoute(['admin'])`.

Route path constants live in `src/constants/routes.ts` so a path never has
to be duplicated or hand-typed across the codebase.

## AI abstraction

`src/api/ai.api.ts` and `src/services/ai.service.ts` define a
provider-agnostic contract (`/ai/categorize`, `/ai/insights/generate`).
The frontend never encodes which LLM provider serves these routes — that
decision belongs entirely to the backend. Both AI features are gated by
`VITE_FEATURE_AI_CATEGORIZATION` / `VITE_FEATURE_AI_INSIGHTS` so the UI
degrades gracefully while no AI backend is configured.

## Current status

This is the **architecture phase**: folders, types, the API/service
contracts, routing, layouts, and page stubs are in place. Feature UIs
(forms, tables, charts, real data fetching) are intentionally left as
placeholders (`PageStub`) — see `README.md` at the repo root for the
suggested build order.
