import bearer from "@elysiajs/bearer"
import type { Elysia } from "elysia"

import type {
    ManagePermission,
    ManageUserPermission,
    PostPermission,
    UserPermission,
} from "@/common/enum/permissions"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { getScope } from "@/src/general/usecase/get-scope"
import { getUser } from "@/src/general/usecase/get-user"
import { verifyAuth } from "@/src/general/usecase/verify-auth"
import { verifyPermission } from "@/src/general/usecase/verify-permission"

type Permission =
    | PostPermission
    | UserPermission
    | ManagePermission
    | ManageUserPermission

export type AuthContext = {
    userId: string
    scope: string | null
}

export const requirePermission =
    (
        permission: Permission,
        options?: {
            scope?: boolean
        },
    ) =>
    (app: Elysia) =>
        app
            .use(jwtAccessSetup)
            .use(bearer())
            .state("auth", {} as AuthContext)
            .guard({
                beforeHandle: async ({ bearer, jwtAccess, set, store }) => {
                    const validToken = await jwtAccess.verify(bearer)

                    if (!validToken || !bearer) {
                        set.status = ResponseErrorStatus.UNAUTHORIZED
                        return {
                            status: false,
                            message: ErrorMessage.UNAUTHORIZED,
                        }
                    }

                    const { valid: isAuthorized } = await verifyAuth(
                        bearer,
                        validToken,
                    )

                    if (!isAuthorized) {
                        set.status = ResponseErrorStatus.UNAUTHORIZED
                        return {
                            status: false,
                            message: ErrorMessage.UNAUTHORIZED,
                        }
                    }

                    const existingUser = await getUser({
                        identifier: validToken.id,
                        type: "id",
                        condition: {
                            deleted: false,
                        },
                    })

                    if (!existingUser.user) {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                        return {
                            status: false,
                            message: ErrorMessage.INVALID_USER,
                        }
                    }

                    const { valid, permission: userPermissionId } =
                        await verifyPermission(permission, existingUser.user.id)

                    if (!valid || !userPermissionId) {
                        set.status = ResponseErrorStatus.FORBIDDEN
                        return {
                            status: false,
                            message: ErrorMessage.UNAUTHORIZED_PERMISSION,
                        }
                    }

                    let scope: string | null = null

                    if (options?.scope) {
                        scope = await getScope(userPermissionId)
                    }

                    store.auth = {
                        userId: existingUser.user.id,
                        scope,
                    }
                },
            })
