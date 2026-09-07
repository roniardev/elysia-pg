# Feature Code Style

Feature code uses one consistent, function-oriented style.

## Feature layout

```text
src/<feature>/
  data/
    model/
    repository/
    source/
  delivery/
    dto/
    presenter/
      http/
  domain/
    entity/
    repository/
    usecase/
  index.ts
  layer.ts
```

The dependency direction is:

```text
delivery → domain ← data
                    ↑
                  layer
```

## Naming

Name files after the operation and use snake case:

```text
get_list_post_usecase.ts
post_repository.ts
post_repository_impl.ts
get_post_by_id_persistent.ts
```

Use explicit operation names:

```text
get_post_by_id
get_list_post
create_post
update_post
delete_post
```

Use `get` for retrieval and a meaningful verb for a mutation. Do not use
generic names such as `get_data`, `set_data`, `process_data`, or `handle_data`.

Use operation-specific parameter and response shapes:

```text
GetPostByIdParam
GetListPostParam
CreatePostParam
UpdatePostParam
GetPostResponse
GetListPostResponse
```

Avoid generic `Input`, `Request`, `Payload`, `Data`, and `Result` names inside
the feature graph. HTTP DTOs may use transport-specific names at the delivery
boundary.

## Function-oriented Effect code

Use functions for use cases, repository adapters, mappings, and pure domain
rules. Do not introduce application classes or infrastructure implementation
classes.

Effect tagged errors remain class declarations because that is how Effect
represents structured tagged errors. They are error values, not OOP service
objects.

Each use case should make its graph visible:

```ts
export const getPostUsecase = (
    param: GetPostParam,
): Effect.Effect<
    Post,
    GetPostError | PostRepositoryError,
    PostRepositoryService
> =>
    Effect.gen(function* () {
        const repository = yield* PostRepository
        const post = yield* repository.getPostById(param)

        if (!post) {
            return yield* Effect.fail(
                new GetPostError({
                    code: ApplicationErrorCode.PostNotFound,
                }),
            )
        }

        return post
    })
```

The `Effect.gen` body is the success graph (`A`). Its yielded capabilities
are the requirements (`R`), and tagged errors are the failure channel (`E`).
Use `.pipe()` outside the graph for retry, recovery, logging, and error
translation.

## Repository naming

The domain contract is named after the capability:

```text
domain/repository/post_repository.ts
```

The data adapter is named explicitly as its implementation:

```text
data/repository/post_repository_impl.ts
```

The contract is an Effect `Context` tag. The implementation is a function
that constructs its `Layer`. Persistence operations remain in
case-specific files under `data/source/`.

## Boundary and compatibility

Schemas belong in `delivery/dto/` and transform unknown transport data into
trusted parameters. Domain code does not import from `data/` or `delivery`.
The HTTP contract remains stable while internal names and graph structure are
refactored.

## Application-scoped resources

Application resources have one owner and one lifecycle. Database connections,
Redis clients, and locks are acquired and released by `app/runtime.ts`.
Feature layers receive those resources at composition time and expose only
their feature capability tags to domain graphs.

Production composition is:

```text
app/runtime
  → feature layer
    → repository capability
      → case-specific source
```

Tests provide the capability directly and do not acquire application
resources. The use-case graph remains unchanged.
