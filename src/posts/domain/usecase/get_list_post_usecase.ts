import { Effect } from "effect"

import type { AuthorizationScope } from "@/src/authorization/domain/entity/authorization"
import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type { UserId } from "@/src/general/domain/entity-id"
import type { PostListQuery } from "@/src/posts/domain/entity/post"
import { PostRepository } from "@/src/posts/domain/repository/post_repository"
import { getPagination } from "@/utils/pagination"

export const getListPostUsecase = (
    param: PostListQuery,
    userId: UserId,
    scope: AuthorizationScope | null,
) =>
    Effect.gen(function* () {
        if (param.page === 0) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PAGE_INVALID),
            )
        }

        const repository = yield* PostRepository
        const postScope = { scope, userId }
        const data = yield* repository.getListPost(param, postScope)
        const total = yield* repository.getPostCount(param, postScope)
        const { totalPage, attributes } = getPagination(
            param.page,
            param.limit,
            total,
        )

        if (param.page > totalPage) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PAGE_NOT_FOUND),
            )
        }

        return { data, attributes }
    }).pipe(
        Effect.catchTag("PostRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.FAILED_TO_READ_POST),
            ),
        ),
    )
