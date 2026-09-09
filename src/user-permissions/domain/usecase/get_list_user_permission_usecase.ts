import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application_error"
import {
    toUserPermissionResponse,
    type UserPermissionListQuery,
} from "@/src/user-permissions/domain/entity/user_permission"
import { UserPermissionRepository } from "@/src/user-permissions/domain/repository/user_permission_repository"
import { getPagination } from "@/utils/pagination"

export const getListUserPermissionUsecase = (
    param: UserPermissionListQuery,
) =>
    Effect.gen(function* () {
        if (param.page === 0) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PAGE_INVALID),
            )
        }

        const repository = yield* UserPermissionRepository
        const list = yield* repository.getListUserPermissions(param)
        const total = yield* repository.getCountUserPermissions(param)
        const { totalPage, attributes } = getPagination(
            param.page,
            param.limit,
            total,
        )

        if (param.page > totalPage && totalPage > 0) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PAGE_NOT_FOUND),
            )
        }

        return {
            data: list.map(toUserPermissionResponse),
            attributes,
        }
    }).pipe(
        Effect.catchTag("UserPermissionRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
