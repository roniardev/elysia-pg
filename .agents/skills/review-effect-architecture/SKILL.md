---
name: review-effect-architecture
description: Review this project's DDD/Effect code for graph fidelity, dependency direction, case-specific sources, hidden requirements, error leakage, and test-layer quality.
version: 2.0.0
metadata:
  tags: [elysia, effect, review, architecture, testing]
  related_skills: [design-effect-graph, implement-effect-feature]
---

# Review Effect Architecture

Use for pull-request review, migration audit, or architecture health checks.

Also verify `docs/architecture/CODE_STYLE.md`: feature filenames use snake
case, operations have explicit names, and application and infrastructure
implementations remain function-oriented rather than class-based.

## Read

1. `AGENTS.md`
2. `docs/architecture/EFFECT_DESIGN_THINKING.md`
3. `docs/architecture/FEATURE_IMPLEMENTATION_GUIDE.md`
4. Changed feature files and tests

## Review order

1. Reconstruct the A call graph from the domain use-case body.
2. Verify every branch and yielded effect belongs to that graph.
3. Enumerate actual E types and confirm each layer scopes its own errors.
4. Enumerate actual R and search for hidden infrastructure imports.
5. Verify domain imports neither `data/` nor `delivery/`.
6. Verify domain errors contain no HTTP status or response-message dependency.
7. Verify raw persistence is split into specifically named `data/source/`
   cases, not generic query/command buckets.
8. Verify the data repository wires sources and errors rather than owning
   application orchestration.
9. Verify Elysia validates untrusted request parameters before domain execution.
10. Verify behavior wrappers do not reshape the success graph.
11. Verify resource acquisition/release has a lifecycle owner.
12. Compare production and test graphs; only provided R should differ.
13. Check HTTP compatibility and migration status documentation.
14. Run focused tests and `bun run check`.

## Search gates

```sh
rg "@/db|@/app/config|@/utils/services/locks|sendEmail|Bun\\.password|ulid" \
  src/<feature>/domain
rg "from .*\\/(data|delivery)" src/<feature>/domain
rg "Effect\\.tryPromise|Effect\\.provide" src/<feature>/domain
```

Investigate every result:

- `tryPromise` normally belongs in a repository or capability layer.
- `provide` normally belongs at the boundary or runtime composition root.
- production infrastructure imports never belong in a migrated domain.
- domain imports never point outward to data or delivery.

## Findings format

Order findings by severity. Each finding includes:

- file and line;
- violated A/E/R or boundary/scope rule;
- runtime or maintenance consequence;
- smallest coherent correction;
- missing test that would prove the correction.

Do not report stylistic preferences as architecture defects. If no defects are
found, state remaining risks and verification coverage.
