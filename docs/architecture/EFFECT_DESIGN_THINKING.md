# Effect Design Thinking

## Purpose

The code should visibly match the program's call graph:

```text
X → Graph → Effect<A, E, R>
                    │  │  │
                    │  │  └─ capabilities required to run
                    │  └──── named ways the graph can fail
                    └─────── values produced by the success path
```

This project applies that model through DDD dependency boundaries: Elysia
delivery, domain entities and use cases, data adapters, and production layers.

## The application graph

Production:

```ts
HTTP request
  → Elysia model validation
    → permission/authentication boundary
      → domain use case
        → repository/capability tags
          → data repository adapter
            → case-specific data source
              → Drizzle / PostgreSQL
```

Tests:

```ts
trusted test param
  → domain use case
    → capability tags
      → deterministic in-memory implementations
```

The domain use case is identical in both graphs. This is the practical meaning
of swapping `R`.

## 1. Shapes: establish the language

Define nouns before functions:

- **Records:** persistent or flowing values such as `UserWithPermissions`.
- **IDs:** identities such as `UserId`; validate them at the boundary and avoid
  mixing unrelated IDs.
- **Variants:** finite states such as `"draft" | "published"`.
- **Errors:** tagged values carrying the failed operation and original cause.
- **Use-case params:** explicit params named for the behavior they initiate.

Put feature-owned trusted shapes in `src/<feature>/domain/entity/`. Domain
entities do not import Drizzle or Elysia types. Transport models live in
`delivery/dto/`; database rows and their mappings live in `data/model/`.

IDs use nominal Effect brands. A raw `string` becomes a branded ID only at a
trusted boundary:

```ts
export type UserId = string & Brand.Brand<"UserId">
export const UserId = Brand.nominal<UserId>()
```

Elysia uses a transformed schema that validates the ULID and returns the
appropriate brand in one boundary operation. Data mappers may construct brands
from trusted database rows. Domain use cases and repository contracts accept
only branded IDs.

## 2. A: write the successful graph

`Effect.gen` is a readable sequence of graph nodes:

```ts
export const readWidget = (id: WidgetId) =>
    Effect.gen(function* () {
        const repository = yield* WidgetRepository
        const widget = yield* repository.getById(id)
        const existingWidget = yield* requireWidget(widget)

        return toWidgetResponse(existingWidget)
    }).pipe(
        Effect.catchTag("WidgetRepositoryError", mapRepositoryError),
    )
```

Each `yield*` should name a meaningful edge. Avoid wrapping every edge in
`Effect.tryPromise`; repository and capability layers own promise conversion.

## 3. Cardinality

Use:

- `Effect<A, E, R>` for one request producing one result.
- `Stream<A, E, R>` for multiple values over time.
- caching or request deduplication for time-bounded values.

Paginated HTTP results are still one-shot Effects: one request returns one page.
A live subscription is a Stream.

## 4. E: scope errors at each layer

Infrastructure errors do not escape repositories:

```ts
export class WidgetRepositoryError extends Data.TaggedError(
    "WidgetRepositoryError",
)<{
        cause: unknown
        operation: "create" | "getById"
    }> {}
```

The domain use case maps that error into an application failure code:

```ts
Effect.catchTag("WidgetRepositoryError", (error) => {
    let code = ApplicationErrorCode.INTERNAL

    if (error.operation === "create") {
        code = ApplicationErrorCode.FAILED_TO_CREATE_WIDGET
    }

    return Effect.fail(applicationError(code))
})
```

The delivery boundary maps that code to the existing response message and HTTP
status. Domain code never imports response enums or stores transport status.

Classify failures deliberately:

- **Retry:** transient connection, timeout, or rate-limit failure.
- **Escape:** fallback, cache, default, or optional side effect.
- **Propagate:** expected domain failure owned by the current layer.
- **Die:** violated invariant or programmer defect only.

### Divergent error strategies

Inline error handling is allowed when two yielded nodes need intentionally
different mappings. User creation is an example: password hashing failure and
email-token hashing failure use the same hasher but produce different public
messages. Keep this exception local and obvious.

## 5. R: make requirements compile-time visible

A domain use case imports a contract symbol. Its tagged error stays beside the
contract in `domain/repository/`; the implementation belongs to
`data/repository/`:

```ts
export type WidgetRepositoryService = {
    getById: (
        id: string,
    ) => Effect.Effect<Widget | null, WidgetRepositoryError>
}

export const WidgetRepository =
    Context.GenericTag<WidgetRepositoryService>("WidgetRepository")

// data/repository/widget_repository_impl.ts
export const makeWidgetRepositoryLayer = (database: Database) =>
    Layer.succeed(WidgetRepository, {
        getById: (id) =>
            Effect.tryPromise({
                try: () => database.findWidget(id),
                catch: (cause) =>
                    new WidgetRepositoryError({
                        cause,
                        operation: "getById",
                    }),
            }),
    })
```

The constructor receives production values; it does not import or initialize
them. The feature's `layer.ts` composes capability constructors, and the
application runtime calls that feature constructor once with its scoped
resources. Elysia only submits the service graph:

```ts
return runService(
    WidgetUsecase.get(params.id),
    responseOptions,
)
```

Common capabilities such as ID generation and password hashing get focused
tags. Do not bundle unrelated dependencies into a generic dependency bag.

## 6. Boundary: unknown becomes trusted once

Elysia models validate path parameters, queries, and bodies before service code
runs. The service accepts the resulting trusted shape.

Boundary checklist:

- IDs have format constraints.
- numeric pagination is bounded.
- variants enumerate allowed values.
- optional values are distinguished from nullable values.
- no service reparses raw HTTP objects.
- external API responses and environment values are also validated boundaries.

The long-term target is one source of truth for runtime schema and static type.
Keep Elysia transport models in `delivery/dto/` and map them into domain
use-case params at the presenter boundary when their shapes differ.

## 7. Behavior wraps the graph

Retries, timeout, tracing, metrics, caching, and error mapping belong in
`.pipe()` or layers. They must not obscure the success graph.

```ts
const program = loadWidget(id).pipe(
    Effect.timeout("2 seconds"),
    Effect.retry(transientSchedule),
    Effect.withSpan("widgets.read"),
)
```

Only retry failures known to be transient. Never retry validation or
authorization failures.

## 8. Scope resources

Database clients, Redis clients, telemetry processors, file handles, and other
resources need acquire/release ownership. Their final target is
`Layer.scoped`/`Effect.acquireRelease`, provided once by the application
runtime.

Feature services never close shared resources and never create a new client per
request.

## 9. Prove the design by swapping R

Do not mock implementation modules. Provide the service tag:

```ts
readWidget(id).pipe(
    Effect.provideService(WidgetRepository, inMemoryRepository),
    Effect.runPromise,
)
```

If importing a service test requires production environment variables, its
repository/capability module imported a composition root or evaluated production
configuration. Move those values to the feature's `layer.ts` and pass them into
a `make...Layer` constructor.

## 10. Placement rules

| Concern | Location |
| --- | --- |
| Request parsing and response status | `delivery/presenter/http/` |
| Runtime request/response schema | `delivery/dto/` |
| Happy-path orchestration | `domain/usecase/` |
| Domain/feature shapes | `domain/entity/` |
| Persistence contract and tagged error | `domain/repository/` |
| Raw case-specific persistence | `data/source/<case>.ts` |
| Persistence mapping | `data/model/` |
| Source wiring and adapter constructor | `data/repository/` |
| Production values and layer composition | `layer.ts` |
| Shared capability contract, error, layer constructor | `src/general/service/<capability>.ts` |

Repositories are ports, not large logic containers. A domain contract names
only capabilities required by use cases. Its data adapter composes small,
case-specific sources. `layer.ts` imports `db`, configuration, locks, and
provider functions.

## Architectural fitness checks

A migrated service directory should produce no matches:

```sh
rg "@/db|@/app/config|@/utils/services/locks|sendEmail|Bun\\.password|ulid" \
  src/<feature>/domain
```

Review every match rather than adding it to an allowlist.
