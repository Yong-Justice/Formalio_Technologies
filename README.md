# Formalio Technologies

  > Professional document and financial management platform for businesses in Cameroon and Central Africa.

  ## Structure

  ```
  formalio/
  ├── apps/
  │   ├── mobile/        ← React Native + Expo app
  │   ├── web/           ← React web app (app.formalio.cm)
  │   ├── admin/         ← Admin dashboard (admin.formalio.cm)
  │   ├── accountant/    ← Accountant portal (pro.formalio.cm)
  │   ├── landing/       ← Public landing page (formalio.cm)
  │   └── api/           ← Node.js Express API server
  ├── packages/
  │   ├── ui/            ← Shared React component library (@formalio/ui)
  │   ├── types/         ← Shared TypeScript types (@formalio/types)
  │   ├── schemas/       ← Shared Zod validation schemas (@formalio/schemas)
  │   ├── config/        ← Shared configs: TypeScript, Tailwind
  │   └── utils/         ← Shared utility functions (@formalio/utils)
  ├── supabase/
  │   ├── migrations/    ← Database migration files
  │   ├── seed/          ← Seed data (categories, tax rules)
  │   └── functions/     ← Supabase Edge Functions
  ├── .github/
  │   └── workflows/     ← GitHub Actions CI/CD pipelines
  └── docs/              ← Technical documentation
  ```

  ## Stack

  - **Monorepo**: pnpm workspaces + Turborepo
  - **Frontend**: Next.js 14, React 18, Tailwind CSS
  - **Mobile**: Expo (React Native)
  - **Backend**: Node.js, Express 5
  - **Database**: PostgreSQL via Supabase
  - **Auth**: Supabase Auth
  - **Validation**: Zod
  - **Language**: TypeScript 5
  