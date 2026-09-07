---
name: design-effect-graph
description: Design a DDD-aligned Elysia/Effect feature by naming shapes and producing its A, E, R, dependency, boundary, production, and test graphs before implementation.
version: 2.0.0
metadata:
  tags: [elysia, effect, architecture, design, graph]
  related_skills: [implement-effect-feature, review-effect-architecture]
---

# Design Effect Graph

Use when adding a feature, changing a workflow, or planning a legacy migration.

Use the function-oriented naming and layout rules in
`docs/architecture/CODE_STYLE.md`. The graph is expressed by functions and
Effect layers, not application or infrastructure classes.

## Read

1. `AGENTS.md`
2. `docs/architecture/EFFECT_DESIGN_THINKING.md`
3. Relevant `src/<feature>/`, schema, routes, and tests

## Workflow

1. State the problem, caller, success value, invariants, and compatibility
   constraints.
2. Name entities, records, IDs, variants, use-case params, and errors.
3. Draw A as an indented call graph. Mark every node Effect or Stream.
4. Enumerate every E breakpoint. Classify retry, escape, propagate, or die.
5. Enumerate R per node. Identify existing tags before proposing new ones.
6. Mark untrusted boundaries and their Elysia schemas.
7. Mark behavior wrappers: timeout, retry, tracing, caching, logging.
8. Mark acquired resources and lifecycle owners.
9. Draw production and test graphs separately.
10. Place nodes in `domain`, `data`, or `delivery`; verify dependencies point
    `delivery → domain ← data`.
11. Split raw persistence by specific business case, not generic
    query/command categories.
12. Compare plausible designs and select the one with the smallest coherent
    capability surface.

## Required output

```text
Shapes:
- ...

A:
param
  → node
    → node

E:
- node → failure → strategy

R:
- node → Context tag

Boundary:
- ...

Placement:
- domain/entity: ...
- domain/repository: ...
- domain/usecase: ...
- data/source/<specific-case>: ...
- data/repository: ...
- delivery: ...

Production:
HTTP presenter
  → ...

Tests:
domain use case
  → ...

Compatibility:
- ...
```

Do not write implementation code until every yielded operation has an A, E, and
R classification.
