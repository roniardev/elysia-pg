import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import { UserRepository } from "@/src/users/domain/repository/user_repository"
import { getPagination } from "@/utils/pagination"

export type GetListUserParam = {
    page: number
    limit: number
}

export const getListUserUsecase = (param: GetListUserParam) =>
    Effect.gen(function* () {
        if (param.page === 0) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PAGE_INVALID),
            )
        }

        const repository = yield* UserRepository
        const total = yield* repository.getCountActiveUsers()
        const data = yield* repository.getListActiveUsers(param)
        const { totalPage, attributes } = getPagination(
            Number(param.page),
            Number(param.limit),
            total,
        )

        if (param.page > totalPage && totalPage > 0) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PAGE_NOT_FOUND),
            )
        }

        return {
            data: data.map((user) => ({
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                photo: user.photo,
                permissions: user.permissions,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt?.toISOString() ?? null,
            })),
            attributes,
        }
    }).pipe(
        Effect.catchTag("UserRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.INTERNAL),
            ),
        ),
    )
