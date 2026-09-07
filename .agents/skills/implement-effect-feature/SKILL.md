---
name: implement-effect-feature
description: Implement or migrate a feature to this project's graph-first Effect and DDD architecture with domain use cases, case-specific data sources, Context requirements, and swappable tests.
version: 2.0.0
metadata:
  tags: [elysia, effect, typescript, repository, implementation, migration]
  related_skills: [design-effect-graph, review-effect-architecture]
---

# Implement Effect Feature

Use for new features and complete vertical migrations.

Feature code is function-oriented. Follow
`docs/architecture/CODE_STYLE.md`: use snake-case operation filenames,
explicit `get`/`create`/`update`/`delete` names, and no application or
infrastructure implementation classes. Effect tagged errors remain class
declarations because they are structured error values.

## Read

1. `AGENTS.md`
2. `docs/architecture/FEATURE_IMPLEMENTATION_GUIDE.md`
3. `docs/architecture/TESTING_EFFECT_GRAPHS.md`
4. `docs/architecture/WALKTHROUGH_USER_CREATION.md` for a complete example
5. For legacy code, `docs/architecture/MIGRATION_GUIDE.md`

## Workflow

1. Produce or confirm the design from `design-effect-graph`.
2. Inspect existing behavior and tests. Preserve HTTP compatibility.
3. Add framework-independent shapes under `domain/entity/`.
4. Add one tagged, operation-aware repository error beside its `Context`
   contract under `domain/repository/`.
5. Extract each raw persistence operation to a specifically named
   `data/source/<case>.ts` file. Never group them into generic query/command
   buckets.
6. Add persistence mapping under `data/model/` when database and domain shapes
   differ.
7. Wire sources and construct the repository layer in
   `data/repository/<feature>_repository_impl.ts`.
8. Pass Drizzle, locks, and configuration into that constructor from `layer.ts`.
9. Reuse focused shared capabilities from `src/general/service/`; add a
   co-located contract/layer only when the capability is genuinely reusable.
10. Rewrite orchestration under `domain/usecase/`:
   - `Effect.gen` is A;
   - domain guards are named nodes;
   - outer `.pipe()` scopes E;
   - application errors carry semantic codes, never HTTP status or response text;
   - inline mapping is only for documented divergent strategies.
11. Put Elysia schemas under `delivery/dto/`.
12. Put HTTP handlers under `delivery/presenter/http/` and provide the feature
    layer there.
13. Compose `<Feature>Layer` in `layer.ts`.
14. Add unit tests that provide complete in-memory contracts.
15. Update `docs/architecture/MIGRATION_GUIDE.md`.

## Dependency direction

```text
delivery → domain ← data
                  ↑
                layer.ts
```

Domain imports neither data nor delivery. `data/source/` may import Drizzle.
Only `layer.ts` supplies production values.

## Forbidden in migrated domain files

```text
@/db
@/app/config
@/utils/services/locks
sendEmail
Bun.password
ulid
```

## Gates

```sh
bun test test/unit/<feature>
bun run check
git diff --check
rg "@/db|@/app/config|@/utils/services/locks|sendEmail|Bun\\.password|ulid" \
  src/<feature>/domain
```

Report the final production graph, test graph, changed contracts, compatibility
notes, and exact verification results.
