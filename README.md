# QR Pohon

End-to-end React + Vite application for managing and exploring tree data through QR codes. The project now follows a feature-first architecture with a clear separation between the app shell, shared primitives, and domain-specific modules.

## Getting started

```bash
npm install
npm run dev
```

- `npm run build` – type check and create a production bundle.
- `npm run lint` – run ESLint on the entire project.

## Key directories

| Path                | Purpose                                                           |
|---------------------|-------------------------------------------------------------------|
| `src/app`          | Application shell (router + providers).                           |
| `src/features`     | Feature modules (`admin`, `auth`, `trees`, `user`).               |
| `src/shared`       | Cross-cutting UI components, helpers, and external services.      |
| `src/assets`       | Static images & SVGs used across the app.                         |

See `docs/architecture.md` for a deeper explanation of the structure, route composition, and module aliases.
