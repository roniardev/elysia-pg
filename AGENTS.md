# Agent Guide

This repository uses Elysia, Effect, Drizzle, PostgreSQL, Redis, and Bun.
Humans and coding agents follow the same graph-first architecture.

## Read first

Before changing application behavior, read:

1. [`docs/architecture/EFFECT_DESIGN_THINKING.md`](docs/architecture/EFFECT_DESIGN_THINKING.md)
2. [`docs/architecture/FEATURE_IMPLEMENTATION_GUIDE.md`](docs/architecture/FEATURE_IMPLEMENTATION_GUIDE.md)
3. [`docs/architecture/TESTING_EFFECT_GRAPHS.md`](docs/architecture/TESTING_EFFECT_GRAPHS.md)
4. [`docs/architecture/MIGRATION_GUIDE.md`](docs/architecture/MIGRATION_GUIDE.md) for legacy modules

Project skills under `.agents/skills/` provide procedural workflows:

- `design-effect-graph`
- `implement-effect-feature`
- `review-effect-architecture`

Code organization and naming rules are documented in
[`docs/architecture/CODE_STYLE.md`](docs/architecture/CODE_STYLE.md).

## Non-negotiable architecture rules

- Draw the call graph before editing code.
- Name domain records, IDs, variants, and errors.
- Elysia is the untrusted HTTP boundary.
- A domain use case requests capabilities with Effect `Context` tags.
- A domain use case must not import `db`, Redis, locks, environment configuration,
  email clients, token libraries, `Bun.password`, or `ulid`.
- Domain code must not import from `data/` or `delivery/`.
- Domain errors describe application meaning and must not contain HTTP statuses
  or response messages. Reuse the `ApplicationErrorCode` enum; delivery maps
  those codes to HTTP.
- Keep a capability contract and its tagged error together in `domain/repository/`.
- Put raw persistence in one case-specific file under `data/source/`; do not
  create generic `queries.ts` or `commands.ts` buckets.
- A `data/repository/` adapter wires sources, maps models, and constructs the
  repository layer. It does not own application orchestration.
- Production values such as `db`, configuration, and locks enter only through
  the feature's `layer.ts` composition root.
- Repository errors are tagged and operation-aware.
- `Effect.gen` describes the success graph. Error scoping belongs in the outer
  `.pipe()` unless two nodes intentionally need different strategies.
- Production and tests run the same service graph. Only provided layers differ.
- Preserve public HTTP behavior during architecture-only migrations.
- Use function-oriented feature code. Do not add application or infrastructure
  implementation classes; Effect tagged errors are the exception because they
  are structured error values.
- Name feature files with snake case and explicit operations, such as
  `get_list_post_usecase.ts`, `post_repository_impl.ts`, and
  `get_post_by_id_persistent.ts`.
- Use `get` for retrieval and meaningful verbs such as `create`, `update`, and
  `delete` for mutations. Avoid generic `get_data` and `set_data` names.

## Feature layout

```text
src/<feature>/
  domain/
    entity/                     framework-independent domain shapes
    repository/                 capability contracts + tagged errors
    usecase/                    application call graphs
  data/
    model/                      persistence-to-domain mapping
    source/                     one raw persistence operation per case
    repository/                 source wiring + repository layer constructor
  delivery/
    dto/                        Elysia request/response schemas
    presenter/http/             HTTP boundary + production layer provision
  layer.ts                      inject production values and compose layers
  index.ts                      route registration
```

Do not add a repository when the feature does not persist data. Add the smallest
capability tag that accurately describes the need.

## Required verification

Run:

```sh
bun run check
```

For a focused change, run the affected test path first, then run the complete
check. Do not report success when typecheck, lint, or relevant tests fail.

## Code style

- Four spaces
- Double quotes
- No semicolons
- No ternary expressions
- No `else`
- Prefer guard clauses and named transformations
- Do not use `any`

These rules are enforced by ESLint; do not work around them with disables.
