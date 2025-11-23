# Project Architecture

This refactor reorganizes the app around **feature-first modules** with a thin app shell and shared primitives. The goal is to keep domain logic, UI, and services co-located so that each area can evolve independently.

## Directory layout

```
src/
├── app/                 # Application shell (RouterProvider, route registry, global providers)
├── features/            # Feature-specific modules
│   ├── admin/           # Admin layout, navigation, admin-only pages and routing
│   ├── auth/            # Login/auth callback flows and related routes
│   ├── trees/           # Tree domain types, components (forms/table/card/QR), utilities
│   └── user/            # User-facing pages plus bottom navigation component
├── shared/
│   ├── components/      # Reusable UI primitives (Button, Input, Card, Badge, etc.)
│   ├── lib/             # Cross-cutting helpers (class name merger)
│   └── services/        # External clients (Supabase) and other singleton services
├── assets/              # Static images and icons
└── index.css            # Global styles & tokens
```

Each feature exports its own `routes.tsx` so the app router can stitch them together without importing implementation details.

## Module aliases

`tsconfig` and Vite are configured with the following aliases:

| Alias       | Points to      | Usage                                  |
|-------------|----------------|----------------------------------------|
| `@app/*`    | `src/app/*`    | App shell utilities (router, providers)|
| `@features/*` | `src/features/*` | Feature modules (admin, auth, trees, user) |
| `@shared/*` | `src/shared/*` | Shared UI, libs, and services          |
| `@assets/*` | `src/assets/*` | Static asset imports (images, svg)     |

Use these aliases instead of long relative paths to keep imports clear and consistent.

## Feature guidance

- **Admin**: Owns admin layout, navigation, and pages. Consumes tree components from `features/trees`.
- **Trees**: Holds reusable tree UI, domain types, and helpers for form defaults/normalization. Admin (and future features) pull from here instead of duplicating logic.
- **User**: All end-user pages plus the mobile bottom navigation live here.
- **Auth**: Handles login/callback flows in isolation.

## Shared layer

Shared components are headless and theme-aware so they can be composed across features. Services like the Supabase client live under `shared/services` to keep side effects centralized.

This structure keeps domain code together, reduces deep relative imports, and makes it easy to locate the owner of any screen or component. Use this document as the source of truth when adding new features or moving code.
