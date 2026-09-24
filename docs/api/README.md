# API Contracts

This project currently has no backend, so there is no live API. The frontend
already defines the REST contract it expects, in `src/api/*.api.ts` — treat
those files as the source of truth when a backend is built:

| Domain | Module | Base path |
| --- | --- | --- |
| Auth | `src/api/auth.api.ts` | `/auth` |
| Transactions | `src/api/transactions.api.ts` | `/transactions` |
| Categories | `src/api/categories.api.ts` | `/categories` |
| Budgets | `src/api/budgets.api.ts` | `/budgets` |
| Reports | `src/api/reports.api.ts` | `/reports` |
| Insights / Saving Tips / Bookmarks | `src/api/insights.api.ts` | `/insights`, `/saving-tips`, `/bookmarks` |
| Notifications | `src/api/notifications.api.ts` | `/notifications` |
| Profile / Settings | `src/api/profile.api.ts` | `/profile` |
| AI (provider-agnostic) | `src/api/ai.api.ts` | `/ai` |
| Admin: Users | `src/api/admin/users.api.ts` | `/admin/users` |
| Admin: Categories | `src/api/admin/categories.api.ts` | `/admin/categories` |
| Admin: Announcements | `src/api/admin/announcements.api.ts` | `/admin/announcements` |
| Admin: Statistics | `src/api/admin/statistics.api.ts` | `/admin/statistics` |

All responses are expected in the `ApiSuccess<T>` / `PaginatedResult<T>`
envelope shapes defined in `src/types/api.ts`.
