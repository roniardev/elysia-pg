# ADR-0001: Graph-first Effect feature architecture

Status: Accepted

## Context

Feature services used Effect for asynchronous control flow but directly imported
Drizzle, configuration, locks, token libraries, email clients, password hashing,
and ID generation. Their `R` channel was empty even though execution had many
runtime requirements. Services also converted provider exceptions beside each
happy-path operation, obscuring the call graph and requiring production
environment configuration in tests.

## Decision

Feature services will:

- request dependencies through focused Effect `Context` tags;
- express persistence through a feature repository contract;
- keep a contract, tagged error, and layer constructor in one capability file;
- inject production values only from each feature's `layer.ts`;
- use tagged operation-aware infrastructure errors;
- scope infrastructure failures in the service's outer `.pipe()`;
- provide production layers at the Elysia boundary;
- use the same service function in production and tests.

Feature migrations preserve the public HTTP contract and proceed one vertical
graph at a time.

## Consequences

Benefits:

- `R` documents runtime requirements at compile time;
- service tests do not need PostgreSQL or production environment variables;
- infrastructure failures cannot leak across feature layers;
- service bodies are readable call graphs;
- production providers can change without rewriting application orchestration.

Costs:

- capability files are denser because contracts and layer constructors are
  co-located;
- feature layers add explicit wiring;
- legacy and migrated styles coexist during the staged migration;
- application-scoped resource acquisition remains a follow-up migration.
