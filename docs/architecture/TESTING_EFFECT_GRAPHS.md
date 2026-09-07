# Testing Effect Graphs

## What a test proves

An Effect service test proves:

1. the A graph transforms values correctly;
2. each expected E branch is scoped correctly;
3. R contains replaceable capabilities rather than hidden imports.

Tests should not know how the production repository layer builds SQL.

## Test graph

```ts
service param
  → production service function
    → Context tag
      → deterministic test implementation
```

Do not replace the service, monkey-patch imported modules, or start PostgreSQL
for service unit tests.

## Repository test implementation

Build the complete contract with configurable behavior:

```ts
const makeRepository = (
    options: {
        getById?: Widget | null
        onCreate?: (record: CreateWidgetRecord) => void
    } = {},
): WidgetRepositoryService => ({
    create: (record) =>
        Effect.sync(() => {
            options.onCreate?.(record)
        }),
    getById: () => Effect.succeed(options.getById ?? null),
})
```

A complete object means contract additions cause a type error in tests, forcing
the test graph to evolve with production.

## Success test

```ts
const result = await readWidget(widget.id).pipe(
    Effect.provideService(
        WidgetRepository,
        makeRepository({ getById: widget }),
    ),
    Effect.runPromise,
)

expect(result.id).toBe(widget.id)
```

## Domain failure test

```ts
const result = await readWidget(widget.id).pipe(
    Effect.provideService(WidgetRepository, makeRepository()),
    Effect.either,
    Effect.runPromise,
)

expect(result._tag).toBe("Left")
if (result._tag === "Left") {
    expect(result.left.message).toBe(ErrorMessage.WIDGET_NOT_FOUND)
}
```

## Infrastructure error-scoping test

```ts
const repository = {
    ...makeRepository(),
    getById: () =>
        Effect.fail(new WidgetRepositoryError({
            cause: new Error("connection reset"),
            operation: "getById",
        })),
}

const result = await readWidget(widget.id).pipe(
    Effect.provideService(WidgetRepository, repository),
    Effect.either,
    Effect.runPromise,
)

expect(result._tag).toBe("Left")
if (result._tag === "Left") {
    expect(result.left.message).toBe(
        ErrorMessage.INTERNAL_SERVER_ERROR,
    )
}
```

Assert the scoped public error, not logs or the provider's exception text.

## Side-effect ordering test

Capture calls to prove graph edges:

```ts
const calls: string[] = []

const repository = {
    findByEmail: () =>
        Effect.sync(() => {
            calls.push("find")
            return null
        }),
    create: () =>
        Effect.sync(() => {
            calls.push("create")
        }),
}
```

For workflows such as account creation, assert that persistence occurs before
email delivery and that a failed prerequisite prevents later effects.

## Determinism

Replace:

- generated IDs with `IdGenerator`;
- time with Effect clock/test clock when behavior depends on time;
- token signing with its capability tag;
- hashing with `PasswordHasher`;
- mail delivery with `EmailSender`;
- repositories with complete in-memory contracts.

Avoid assertions against real current time, random ULIDs, provider responses, or
environment configuration.

## What belongs elsewhere

- Repository integration tests prove SQL and transaction behavior.
- Route tests prove Elysia validation, authentication, status, and envelopes.
- Service tests prove A/E/R orchestration.
- End-to-end tests prove the deployed graph.

Do not force one test layer to prove all four concerns.

## Commands

```sh
# One feature
bun test test/unit/<feature>

# All graph unit tests
bun run test:unit

# Complete local gate
bun run check
```

Unit tests belong in `test/unit/<feature>/`. They must be importable without
required production environment variables.
