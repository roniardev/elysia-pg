import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application_error"
import type { PostId, UserId } from "@/src/general/domain/entity_id"
import { PostRepository } from "@/src/posts/domain/repository/post_repository"

export const deletePostUsecase = (id: PostId, userId: UserId) =>
    Effect.gen(function* () {
        const repository = yield* PostRepository
        const post = yield* repository.getOwnedPostById(id, userId)

        if (!post) {
            return yield* Effect.fail(
                applicationError(
                    ApplicationErrorCode.POST_DELETE_TARGET_NOT_FOUND,
                ),
            )
        }

        yield* repository.deletePost(post, userId)

        return post
    }).pipe(
        Effect.catchTag("PostRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
