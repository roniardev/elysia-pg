import { Effect } from "effect"

import type { AuthorizationScope } from "@/src/authorization/domain/entity/authorization"
import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type { PostId, UserId } from "@/src/general/domain/entity-id"
import type { UpdatePostParam } from "@/src/posts/domain/entity/post"
import { PostRepository } from "@/src/posts/domain/repository/post_repository"

const postNotFound = () =>
    applicationError(ApplicationErrorCode.POST_NOT_FOUND)

export const updatePostUsecase = (
    id: PostId,
    param: UpdatePostParam,
    userId: UserId,
    scope: AuthorizationScope | null,
) =>
    Effect.gen(function* () {
        const repository = yield* PostRepository
        const post = yield* repository.getPostById(id, { scope, userId })

        if (!post) {
            return yield* Effect.fail(postNotFound())
        }

        const updatedPost = yield* repository.updatePost(post, param, userId)

        if (!updatedPost) {
            return yield* Effect.fail(postNotFound())
        }

        return updatedPost
    }).pipe(
        Effect.catchTag("PostRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.FAILED_TO_UPDATE_POST),
            ),
        ),
    )
