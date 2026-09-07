import { Effect } from "effect"

import type { AuthorizationScope } from "@/src/authorization/domain/entity/authorization"
import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type { PostId, UserId } from "@/src/general/domain/entity-id"
import { PostRepository } from "@/src/posts/domain/repository/post_repository"

export const getPostUsecase = (
    id: PostId,
    userId: UserId,
    scope: AuthorizationScope | null,
) =>
    Effect.gen(function* () {
        const repository = yield* PostRepository
        const post = yield* repository.getPostById(id, { scope, userId })

        if (!post) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.POST_NOT_FOUND),
            )
        }

        return post
    }).pipe(
        Effect.catchTag("PostRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.FAILED_TO_READ_POST),
            ),
        ),
    )
