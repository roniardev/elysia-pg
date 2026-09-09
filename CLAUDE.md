# Project Instructions

Architecture contract: [`AGENTS.md`](AGENTS.md). Read it before changing
application behavior. Design thinking, feature playbook, tests, and migration
live under `docs/architecture/`.

## Tech Stack

Bun 1.3.x, TypeScript 5.8, Elysia 1.4, Effect 3.22, Drizzle + PostgreSQL 18,
ioredis, Verrou locks. Path alias `@/*` → repo root.

## Code Style

- Four spaces, double quotes, no semicolons
- No ternary, no `else` / `else if` — guards and named transforms
- Feature files: snake_case + operation (`create_post_usecase.ts`)
- `get` for reads; `create` / `update` / `delete` for mutations
- Functions, not application classes (Effect tagged errors are the exception)
- Domain must not import `data/`, `delivery/`, `db`, Redis, config, email,
  tokens, `Bun.password`, or `ulid`

ESLint 9 (`eslint.config.mjs`) plus Prettier (`.prettierrc`) enforce this.

## Testing

- Unit: `bun run test:unit` → `test/unit/<feature>/*.test.ts` (`bun:test`)
- Same use-case graph as production; swap Effect services, do not mock modules
- Gate: `bun run check` (typecheck + lint + unit). Does **not** run
  `test/routes/`
- Full suite: `bun test` / `make test`

## Build & Run

- Dev: `make up-dev` then `make dev` (`bun --watch app/index.ts`, port 3000)
- Full local setup: `make full-setup`
- DB: `make db-generate` / `db-migrate` / `db-seed` / `db-reset`
- Prod image: `make build` (`oven/bun:1.3.14`, entry `bun start`)
- Config: `app/config.ts` via `env-var`. Copy `.env.example`; it lists every
  `required()` key plus Redis/lock/encryption defaults.

## Project Structure

```
app/                 entry, config, ManagedRuntime
src/<feature>/       domain / data / delivery / layer.ts / index.ts
db/                  Drizzle schema, migrations, seeds
common/              HTTP enums, shared models
utils/               logger, locks, redis, crypto, email
test/unit|routes/    graph tests vs HTTP characterization
docs/architecture/   source of truth for graphs
```

## Conventions

- Commits: Conventional Commits (`feat(posts): …`). Branch from `main`.
- No GitHub Actions in this repo; `bun run check` is the local gate.
- Elysia validates and maps HTTP. Use cases return `Effect<A, E, R>`.
- `ApplicationErrorCode` stays HTTP-free; delivery maps it.
- Production values enter only through `src/<feature>/layer.ts` composed in
  `app/runtime.ts`.
- Mount new HTTP plugins in `app/server.ts`.
- Feature files are snake_case. Do not add kebab re-exports or `service/`
  database leftovers.
