# Legacy Feature Migration Guide

## Goal

Move a feature from hidden imports and per-yield `tryPromise` blocks to explicit
Effect requirements without changing its HTTP contract.

## Migration status

| Feature | Status | Next concern |
| --- | --- | --- |
| Users | DDD/Effect migrated | Add repository integration coverage |
| Permissions | DDD/Effect migrated | Add repository integration coverage |
| Posts | DDD/Effect migrated | Add repository integration coverage |
| User permissions | DDD/Effect migrated | Add repository integration coverage |
| Authentication | DDD/Effect migrated | Add repository and session integration coverage |
| Authorization boundary | DDD/Effect migrated | Add Redis/PostgreSQL integration coverage |
| Application startup | Effect scoped runtime | Add integration coverage for graceful shutdown |

Update this table in the same change that completes a feature migration.

## Safe migration sequence

### 1. Capture current behavior

Record:

- routes and methods;
- request schemas;
- statuses and response envelopes;
- domain errors;
- filtering, soft-delete, and scope semantics;
- transaction and lock boundaries;
- ordering of external side effects.

Add characterization tests when behavior is unclear.

### 2. Search for hidden R

```sh
rg "@/db|@/app/config|@/utils/services|sendEmail|Bun\\.password|ulid" \
  src/<feature>
```

Classify each match as repository, shared capability, boundary configuration, or
resource lifecycle.

### 3. Name E before moving code

List every `tryPromise` and thrown provider error. Group failures by the layer
that should own them. Add one tagged repository error with an operation union;
add focused capability errors for non-database providers.

### 4. Extract domain contracts without changing orchestration

Introduce tags and tagged errors in `domain/repository/`. Extract each raw
persistence case into its own specifically named `data/source/` file, then wire
those sources in `data/repository/`. Pass production values into its layer
constructor from `layer.ts`. Keep query behavior identical, including scope and
soft-delete rules.

### 5. Rewrite the domain use case as A

Replace direct calls with yielded requirements. Move infrastructure catches to
the outer pipe. Extract domain guard nodes such as `requireUser`.

### 6. Move transport code to delivery

Put schemas in `delivery/dto/` and handlers in `delivery/presenter/http/`. The
domain use case retains a non-empty `R` type until this Elysia boundary provides
the feature's production layer.

### 7. Swap R in tests

If the service test still loads environment config, follow its import chain.
A repository/capability module is importing production values instead of
receiving them from `layer.ts`.

### 8. Remove dead paths

After all consumers use the new contract:

- remove obsolete utility wrappers;
- remove duplicated query code;
- remove unused imports;
- retain shared helpers still used by legacy modules.

### 9. Verify

```sh
bun run check
git diff --check
rg "@/db|@/app/config|@/utils/services/locks" src/<feature>/domain
```

Run route/integration tests when database behavior moved.

## Compatibility review

Before merging, compare old and new behavior:

- active versus deleted records;
- `undefined` versus `null`;
- pagination page `-1`, page `0`, and out-of-range pages;
- lock failure behavior;
- response arrays versus objects;
- timestamps serialized versus raw;
- email sent before or after transaction commit;
- provider errors exposed versus scoped.

Architecture improvement is not permission for an undocumented API change.

## Target sequence

Production:

```ts
HTTP presenter
  → Auth/permission boundary
    → DomainUsecase.operation
      → FeatureRepository.operation
        → DataRepository adapter
          → case-specific data source
            → scoped database and lock services
```

Tests:

```ts
DomainUsecase.operation
  → in-memory FeatureRepository
  → deterministic capability services
```
