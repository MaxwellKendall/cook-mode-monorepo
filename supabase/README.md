# Supabase migrations

Schema changes are managed with **Supabase migrations** (SQL in `supabase/migrations/`). The Drizzle schema in `packages/db/src/schema.ts` remains the source of truth for types and queries; keep it in sync when you add or change tables.

## Workflow

1. **First-time setup** (link to your Supabase project):
   ```bash
   pnpm db:link
   ```

2. **Create a new migration** (adds a timestamped `.sql` under `supabase/migrations/`):
   ```bash
   pnpm db:new add_meal_plans
   ```

3. **Edit the generated SQL** to match `packages/db/src/schema.ts` (or your intended change).

4. **Apply migrations** to the linked remote project:
   ```bash
   pnpm db:migrate
   ```

## Commands (from repo root)

| Command        | Effect                                              |
|----------------|-----------------------------------------------------|
| `pnpm db:link` | Link this repo to a Supabase project (once)         |
| `pnpm db:new <name>` | Create `supabase/migrations/<timestamp>_<name>.sql` |
| `pnpm db:migrate`    | Run `supabase db push` to apply migrations          |

These scripts use `npx supabase@2`; the first run may download the CLI. For a global install instead: `brew install supabase/tap/supabase` (macOS) or `npm i -g supabase`.

## Local Supabase (optional)

- `supabase start` – start local Supabase (Postgres, Studio, etc.)
- `supabase db reset` – reset local DB and re-run all migrations
- `supabase stop` – stop local Supabase

Use the Supabase Dashboard (Table Editor / SQL) for browsing and ad‑hoc queries.
