import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import {
    PostId,
    type UserId,
} from "@/src/general/domain/entity-id"
import { IdGenerator } from "@/src/general/service/id_generator"
import type { CreatePostParam } from "@/src/posts/domain/entity/post"
import { PostRepository } from "@/src/posts/domain/repository/post_repository"

export const createPostUsecase = (param: CreatePostParam, userId: UserId) =>
    Effect.gen(function* () {
        const idGenerator = yield* IdGenerator
        const repository = yield* PostRepository
        const id = PostId(yield* idGenerator.generate)

        return yield* repository.createPost({
            ...param,
            id,
            userId,
        })
    }).pipe(
        Effect.catchTag("PostRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
