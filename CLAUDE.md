# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cook Mode is a voice-powered cooking assistant with real-time recipe guidance. The system consists of a pnpm monorepo with shared packages and deployable services, plus a separate React PWA frontend.

## Repository Structure

**Monorepo** (`cook-mode-monorepo/`):
- `packages/` - 5 shared internal packages (config, shared, db, redis, vector)
- `apps/` - 5 deployable services (api, realtime, voice-bridge, worker, web)
- `services/mcp/` - External Python recipe extraction service

**Browser App** (`voice-agent-service/services/cook-mode-browser/`):
- Production React PWA with voice-driven cooking assistance
- Connects to the monorepo backend services

## Common Commands

### Monorepo (cook-mode-monorepo)

```bash
# Development
pnpm dev:apps              # Start all apps in parallel
pnpm dev:backend           # Start backend services only (no frontend)
pnpm build                 # Build packages first, then apps
pnpm build:packages        # Build only shared packages
pnpm clean                 # Remove node_modules and dist folders

# Single package/app
pnpm --filter @cook-mode/api dev       # Run specific app in watch mode
pnpm --filter @cook-mode/api build     # Build specific app

# Database (Supabase migrations)
pnpm db:link                           # Link to Supabase project (once)
pnpm db:new <name>                     # Create migration SQL in supabase/migrations/
pnpm db:migrate                        # Apply migrations (supabase db push)
```

### Browser App (cook-mode-browser)

```bash
npm run dev                # Start Vite dev server (port 3000)
npm run build              # Production build
npm run lint               # Run ESLint
npm run test               # Run Vitest
npm run test:ui            # Vitest with UI dashboard
npm run test:coverage      # Coverage report
npm run deploy             # Deploy to Vercel (production)
```

## Architecture

### Service Communication

```
Browser App (PWA)
    │
    ├── REST → API Server (:3000)
    │              │
    │              ├── Jobs → Worker (BullMQ)
    │              │              │
    │              │              └── Redis Pub/Sub
    │              │
    │              └── DB Queries → PostgreSQL
    │
    ├── WebSocket → Realtime Gateway (:3001)
    │                    │
    │                    └── Redis Pub/Sub (channel subscriptions)
    │
    └── Audio Stream → Voice Bridge (:3002)
                            │
                            └── OpenAI Realtime API
```

### Key Patterns

**Configuration**: All services use `@cook-mode/config` which loads from root `.env` and exports typed config objects via Zod schemas.

**Job Queue**: API enqueues to BullMQ, Worker processes. Job types: `recipe.extract`, `voice.track`.

**Real-time Updates**: WebSocket subscriptions via Redis pub/sub channels:
- `subscription:{userId}:events`
- `voice:{userId}:usage`
- `recipe:{jobId}:progress`

**Browser App State**: Context-based (AuthContext, SubscriptionContext, ToastContext) with React Query for server state.

**Voice Sessions**: WebRTC peer connections with OpenAI Realtime API integration. Token tracking for premium features.

### Package Dependencies

| Package | Purpose |
|---------|---------|
| `@cook-mode/config` | Environment loading with Zod validation |
| `@cook-mode/shared` | Types, schemas, Redis channel definitions |
| `@cook-mode/db` | Drizzle ORM, PostgreSQL schema (41 tables) |
| `@cook-mode/redis` | BullMQ queues, ioredis pub/sub |
| `@cook-mode/vector` | Qdrant client, OpenAI embeddings |

## Tech Stack

**Backend**: Node.js 20+, TypeScript 5.7, Fastify 5.2, BullMQ, Drizzle ORM, Redis, Qdrant

**Frontend (monorepo web)**: React 19, Vite 7, TanStack Query, Tailwind CSS, Supabase Auth

**Browser App**: React 19, Vite 7, React Router 7, TanStack Query, Tailwind CSS, WebRTC, OpenAI Agents, Vitest, MSW

## Database

Schema defined in `packages/db/src/schema.ts` using Drizzle ORM. **Migrations** are managed by Supabase: SQL files in `supabase/migrations/` are applied with `pnpm db:migrate` (supabase db push). Create new migrations with `pnpm db:new <name>`; keep the Drizzle schema in sync when changing tables.

- Recipe tables: recipes, recipeInstructions, recipeNutrients, recipeRelevance, plus junction tables
- User tables: users, userRecipeSaves, userTags, userRecipeTags, userSubscriptions, voiceSessions
- Job tables: jobs, jobEvents

All tables use UUID primary keys and timezone-aware timestamps.

## Testing (Browser App)

- **Unit tests**: `npm run test:unit` - Hooks and utilities
- **Integration tests**: `npm run test:integration` - Page components
- **MSW**: Mock Service Worker for API mocking
- **Coverage**: v8 provider with text/JSON/HTML reports

## Environment Variables

Monorepo services read from root `.env`. Key variable groups:
- `DATABASE_*` - PostgreSQL/Supabase connection
- `REDIS_*` - Redis connection
- `OPENAI_*` - API keys and models
- `QDRANT_*` - Vector database
- Service ports: API (3000), Realtime (3001), Voice Bridge (3002), Web (3003)

Browser app uses Vite env vars (prefixed `VITE_`):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_API_KEY`
- `VITE_API_URL`, `VITE_WEBSOCKET_URL`
- `VITE_OPENAI_API_KEY`

## Type Safety

- Canonical API types in `cook-mode-browser/src/types/api.ts`
- Shared types via `@cook-mode/shared` package
- Zod schemas for runtime validation throughout
