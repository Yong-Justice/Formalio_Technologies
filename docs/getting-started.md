# Getting Started

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- A Supabase project

## Setup

1. **Clone the repository**

```bash
git clone https://github.com/Formalio/Formalio_Technologies.git
cd Formalio_Technologies
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
# Fill in your Supabase URL, keys, and other values
```

4. **Run database migrations**

```bash
# Using Supabase CLI
supabase db push
```

5. **Seed the database**

```bash
supabase db seed
```

6. **Start development servers**

```bash
# All apps
pnpm dev

# Single app
pnpm --filter @formalio/web dev
pnpm --filter @formalio/api dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all tests |

## Apps & Ports (development)

| App | Port |
|-----|------|
| `web` | 3000 |
| `admin` | 3001 |
| `accountant` | 3002 |
| `landing` | 3003 |
| `api` | 4000 |
