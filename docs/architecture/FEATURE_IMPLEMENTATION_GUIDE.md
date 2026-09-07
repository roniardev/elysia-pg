# Feature Implementation Guide

Use this guide for a new feature or a complete vertical migration. The project
combines Effect design thinking with DDD dependency direction:

```text
delivery → domain ← data
                  ↑
                layer.ts
```

`domain/` owns language and behavior. `delivery/` translates untrusted
transport parameters. `data/` implements domain capability contracts. `layer.ts`
injects production resources. See the
[user-creation walkthrough](WALKTHROUGH_USER_CREATION.md) for a real example.

## 1. State the problem and invariant

Record the actor, successful value, invariants, and existing HTTP behavior.

```text
Problem: read one active widget by ID.
Invariant: deleted widgets are never returned.
Compatibility: preserve route, status, errors, and response envelope.
```

## 2. Draw the graphs before editing

```text
A: request ID → find active widget → require widget → return widget
E: invalid ID → boundary error
   missing widget → domain not-found error
   persistence failure → scoped application error
R: WidgetRepository
```

Also draw the boundary, production, and test graphs. Use `Effect<A, E, R>` for
one result and `Stream<A, E, R>` for values over time. Pagination is one Effect.

## 3. Create the feature skeleton

```text
src/widgets/
  domain/
    entity/widget.ts
    repository/widget-repository.ts
    usecase/read-widget.ts
  data/
    model/widget-model.ts
    source/find-active-widget-by-id.ts
    repository/widget-repository.ts
  delivery/
    dto/widget-request.ts
    presenter/http/read-widget.ts
  layer.ts
  index.ts
```

Create only directories the feature needs.

## 4. Name domain entities

`domain/entity/widget.ts` contains framework-independent trusted values:

```ts
import { Brand } from "effect"

export type WidgetId = string & Brand.Brand<"WidgetId">
export const WidgetId = Brand.nominal<WidgetId>()

export type Widget = {
    id: WidgetId
    name: string
    deletedAt: Date | null
}
```

Domain files do not import Elysia, Drizzle, HTTP context, or production config.
Do not use bare strings for entity identities. Delivery defines a schema that
both validates the transport value and transforms it into its domain brand:

```ts
export const widgetIdSchema = t
    .Transform(t.String({ pattern: ULID_PATTERN }))
    .Decode(WidgetId)
    .Encode((value) => value)

// params.id is already WidgetId
readWidget(params.id)
```

## 5. Define domain capability contracts

Keep the contract and operation-aware tagged error together:

```ts
import { Context, Data, type Effect } from "effect"

import type { Widget, WidgetId } from "../entity/widget"

export class WidgetRepositoryError extends Data.TaggedError(
    "WidgetRepositoryError",
)<{
    cause: unknown
    operation: "findActiveById"
}> {}

export type WidgetRepositoryService = {
    findActiveById: (
        id: WidgetId,
    ) => Effect.Effect<Widget | null, WidgetRepositoryError>
}

export const WidgetRepository =
    Context.GenericTag<WidgetRepositoryService>("WidgetRepository")
```

A repository is a domain port, not a container for all module logic. Expose only
the persistence capabilities required by domain use cases.

## 6. Extract persistence by specific case

Put one raw operation in each `data/source/` file:

```ts
export const findActiveWidgetById = async (
    database: Database,
    id: WidgetId,
) => database.query.widgets.findFirst({
    where: (table, { and, eq, isNull }) =>
        and(eq(table.id, id), isNull(table.deletedAt)),
})
```

Prefer `find-active-widget-by-id.ts`, `create-widget.ts`, and
`soft-delete-widget.ts`. Do not create generic `queries.ts`, `commands.ts`, or
one large source file. Specific case names preserve filtering and scope.

## 7. Map persistence models

When a Drizzle result differs from the domain shape, map it in `data/model/`:

```ts
export const toWidget = (row: WidgetRow): Widget => ({
    id: WidgetId(row.id),
    name: row.name,
    deletedAt: row.deletedAt,
})
```

Database types stay on the data side of the boundary.

## 8. Implement the data repository adapter

The adapter wires sources, maps rows, converts Promises to Effects, and scopes
infrastructure failures:

```ts
export const makeWidgetRepositoryLayer = (database: Database) =>
    Layer.succeed(WidgetRepository, {
        findActiveById: (id) =>
            Effect.tryPromise({
                try: async () => {
                    const row = await findActiveWidgetById(database, id)
                    return row ? toWidget(row) : null
                },
                catch: (cause) =>
                    new WidgetRepositoryError({
                        cause,
                        operation: "findActiveById",
                    }),
            }),
    })
```

It does not decide application workflow, HTTP status, or response shape.

## 9. Implement the domain use-case graph

```ts
const requireWidget = (widget: Widget | null) => {
    if (widget) {
        return Effect.succeed(widget)
    }

    return Effect.fail(widgetNotFound)
}

export const readWidget = (id: WidgetId) =>
    Effect.gen(function* () {
        const repository = yield* WidgetRepository
        const widget = yield* repository.findActiveById(id)
        return yield* requireWidget(widget)
    }).pipe(
        Effect.catchTag("WidgetRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
```

The generator is A. The outer pipe scopes E. It imports contracts, not adapters.
Application errors contain semantic codes; delivery maps those codes to HTTP
messages and statuses.

## 10. Build delivery DTOs and presenters

Elysia schemas belong in `delivery/dto/`. HTTP presenters validate request parameters, apply
auth/permission checks, invoke the use case through the shared application
runtime, and format the existing response:

```ts
return runService(
    readWidget(params.id),
    responseOptions,
)
```

Do not put persistence, layer provisioning, or domain decisions in the
presenter. Per-request `Effect.provide(FeatureLayer)` rebuilds feature layers and
splits resource ownership across HTTP handlers.

## 11. Compose production requirements

`layer.ts` is the feature composition constructor:

```ts
import type { Database } from "@/db/database"
import { makeWidgetRepositoryLayer } from "./data/repository/widget-repository"

export const makeWidgetLayer = (database: Database) =>
    makeWidgetRepositoryLayer(database)
```

`app/runtime.ts` owns long-lived resources and calls every feature constructor:

```ts
const acquireResources = Effect.acquireRelease(
    Effect.sync(() => makeApplicationResources()),
    releaseApplicationResources,
)

export const ApplicationLayer = Layer.unwrapScoped(
    acquireResources.pipe(
        Effect.map((resources) =>
            Layer.mergeAll(
                makeWidgetLayer(resources.database),
                otherFeatureLayers(resources),
            ),
        ),
    ),
)
```

Production clients are created inside the runtime scope, not at import time.
The same scope releases PostgreSQL and Redis during graceful shutdown. Tests do
not use this production graph; they provide capability tags directly.

## 12. Prove the test graph

Provide the domain tag directly:

```ts
readWidget(id).pipe(
    Effect.provideService(WidgetRepository, inMemoryWidgetRepository),
    Effect.runPromise,
)
```

Do not mock implementation modules. Test success, domain guards,
operation-specific errors, side-effect order, soft-delete behavior, and
pagination. Add integration tests when SQL behavior moves.

## 13. Verify

```sh
bun test test/unit/widgets
bun run check
git diff --check
rg "@/db|@/app/config|@/utils/services/locks|sendEmail|Bun\\.password|ulid" \
  src/widgets/domain
```

The final search should have no production dependency matches.

## Completion checklist

- [ ] A/E/R, boundary, production, and test graphs are named.
- [ ] Domain entities are independent of Elysia and Drizzle.
- [ ] Domain use cases import contracts, not adapters.
- [ ] Repository errors are tagged, operation-aware, and retain `cause`.
- [ ] Raw persistence is split by named case under `data/source/`.
- [ ] The data repository only wires sources, mapping, and errors.
- [ ] `layer.ts` is the only feature composition root for production values.
- [ ] Delivery preserves the public HTTP contract.
- [ ] Tests swap Effect services rather than mocking modules.
- [ ] Focused tests and the complete `bun run check` pass.
