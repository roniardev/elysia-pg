import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application_error"
import type { PermissionListQuery } from "@/src/permissions/domain/entity/permission"
import { PermissionRepository } from "@/src/permissions/domain/repository/permission_repository"
import { getPagination } from "@/utils/pagination"

export type ReadAllPermissionParam = PermissionListQuery

export const getListPermissionUsecase = (param: ReadAllPermissionParam) =>
    Effect.gen(function* () {
        if (param.page === 0) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PAGE_INVALID),
            )
        }

        const repository = yield* PermissionRepository
        const data = yield* repository.getListActivePermissions(param)
        const total = yield* repository.getCountActivePermissions(param.search)
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

        return { data, attributes }
    }).pipe(
        Effect.catchTag("PermissionRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.INTERNAL),
            ),
        ),
    )
