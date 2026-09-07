# Effect Design Thinking

This project follows the graph-first method described in the
[design-thinking reference](https://gist.github.com/r17x/90eb2f7be93932b5693753aedb09c01a).
Refactors must preserve the HTTP contract while moving hidden dependencies into
the Effect `R` channel.

For the complete project guide, examples, testing strategy, and migration
workflow, use the [architecture documentation index](README.md) and
[Effect Design Thinking guide](architecture/EFFECT_DESIGN_THINKING.md).

## Module rule

Each feature is split into four graph layers:

1. `data/` names trusted domain shapes.
2. `repository/` declares persistence requirements and infrastructure errors.
3. `service/` contains the happy-path call graph and scopes repository errors.
4. `usecase/` is the HTTP boundary and provides production layers.

Production:

```ts
HTTP usecase
  → feature service
    → FeatureRepository
      → FeatureRepositoryLayer
        → Drizzle / PostgreSQL
```

Tests:

```ts
feature service
  → FeatureRepository
    → in-memory implementation
```

The service graph is identical in both cases. Only `R` changes.

## A, E, and R rules

- **A:** Keep `Effect.gen` readable as the successful call graph. Extract
  validation nodes instead of embedding infrastructure catches around every
  yield.
- **E:** Repositories expose tagged, operation-aware errors. A service
  handles those errors in its outer `.pipe()` and exposes only errors belonging
  to its own layer.
- **R:** Services request dependencies through `Context.Tag`. They must not
  import databases, mail clients, token signers, caches, or locks.
- **Boundary:** Elysia models validate request data before a service receives it.
  New domain IDs and variants should be named rather than passed as arbitrary
  strings.
- **Scope:** Resource ownership belongs in a production layer. Services do not open or
  close database, Redis, or telemetry clients.

## Migration order

Migrate one complete feature graph at a time so every intermediate revision is
deployable:

1. Users — migrated
2. Permissions — migrated
3. Posts
4. User permissions
5. Authentication
6. Shared infrastructure and application startup lifecycle

Do not create a second abstraction for an already migrated concern. Extend the
feature repository contract or introduce a focused shared service tag when two
features genuinely share the same capability.
