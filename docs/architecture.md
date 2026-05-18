# Formalio Architecture

## Overview

Formalio is a multi-tenant document and financial management platform built as a pnpm + Turborepo monorepo.

## Apps

| App | Domain | Description |
|-----|--------|-------------|
| `web` | app.formalio.cm | Main client-facing web app (Next.js) |
| `admin` | admin.formalio.cm | Internal admin dashboard (Next.js) |
| `accountant` | pro.formalio.cm | Accountant portal (Next.js) |
| `landing` | formalio.cm | Public marketing site (Next.js) |
| `mobile` | — | React Native + Expo mobile app |
| `api` | api.formalio.cm | Node.js Express API server |

## Shared Packages

| Package | Description |
|---------|-------------|
| `@formalio/ui` | Shared React component library |
| `@formalio/types` | Shared TypeScript type definitions |
| `@formalio/schemas` | Shared Zod validation schemas |
| `@formalio/config` | Shared ESLint, TypeScript, and Tailwind configs |
| `@formalio/utils` | Shared utility functions |

## Data Layer

- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage (document files)
- **Realtime**: Supabase Realtime (notifications)

## Key Flows

### Document Upload
1. Client uploads file → Supabase Storage
2. API creates document record in DB
3. Background job extracts metadata
4. Accountant is notified via realtime

### Invoice Creation
1. Staff creates invoice with line items
2. Tax calculated automatically (OHADA/Cameroon rules)
3. PDF generated server-side
4. Sent to client via email
