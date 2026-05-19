# Formalio Technologies

Professional document and financial management platform for businesses in Cameroon and Central Africa.

## Structure

```text
formalio/
|-- apps/
|   |-- mobile/        React Native + Expo app
|   |-- web/           React web app
|   |-- admin/         Admin dashboard
|   |-- accountant/    Accountant portal
|   |-- landing/       Public landing page
|   `-- api/           Node.js Express API server
|-- packages/
|   |-- ui/            Shared React component library
|   |-- types/         Shared TypeScript types
|   |-- schemas/       Shared Zod validation schemas
|   |-- config/        Shared TypeScript/Tailwind config
|   `-- utils/         Shared utility functions
|-- supabase/
|   |-- migrations/    Database migration files
|   |-- seed/          Seed data
|   `-- functions/     Supabase Edge Functions
|-- .github/           GitHub Actions CI/CD
`-- docs/              Technical documentation
```

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Mobile**: Expo (React Native)
- **Backend**: Supabase, Node.js, Express 5
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **Validation**: Zod
- **Language**: TypeScript 5

## Backend

Formalio now includes a deployed Supabase production backend: Postgres schema, Row Level Security, Storage buckets, Edge Functions, Auth configuration, and Expo integration services. Deployment and operations are documented in [docs/backend-supabase.md](./docs/backend-supabase.md), with verification provider setup in [docs/auth-verification.md](./docs/auth-verification.md).

## Mobile

From the repo root:

```bash
npx expo start
```

Expo loads the mobile app from `apps/mobile`. Add production public environment variables to an ignored `.env` file locally or to EAS for cloud builds.

## About

Formalio Technologies is building the financial and document infrastructure for businesses across Cameroon and Central Africa, making professional-grade tools accessible, local, and built for the region.

## Contact

| | |
|---|---|
| **Founder** | Yong Justice Animbom Numfor |
| **Email** | yongjustice8@gmail.com |
| **Company** | Formalio Technologies |

## License

Copyright 2026 Formalio Technologies. All Rights Reserved.

Licensed under the [Apache License, Version 2.0](./LICENSE).
