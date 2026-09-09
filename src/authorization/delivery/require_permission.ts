import bearer from "@elysiajs/bearer"
import { Effect } from "effect"
import type { Elysia } from "elysia"

import { runApplicationEffect } from "@/app/runtime"
import type {
    AuthorizationScope,
    PermissionName,
} from "@/src/authorization/domain/entity/authorization"
import { authorizeRequestUsecase } from "@/src/authorization/domain/usecase/authorize_request_usecase"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { toApplicationErrorResponse } from "@/src/general/delivery/application_error_response"
import type { UserId } from "@/src/general/domain/entity_id"

export type AuthContext = {
    scope: AuthorizationScope | null
    userId: UserId
}

export const requirePermission =
    (
        permission: PermissionName,
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

                        const authorizationResult = await authorizeRequestUsecase({
                            accessToken: bearer,
                            permission,
                            tokenExpiresAt: validToken.exp,
                            userId: validToken.id,
                        }).pipe(
                            Effect.either,
                            runApplicationEffect,
                        )

                        if (authorizationResult._tag === "Left") {
                            const response = toApplicationErrorResponse(
                                authorizationResult.left,
                            )
                            set.status = response.status
                            return {
                                status: false,
                                message: response.message,
                            }
                        }

                        let scope: AuthorizationScope | null = null

                        if (options?.scope) {
                            scope = authorizationResult.right.scope
                        }

                        store.auth = {
                            userId: authorizationResult.right.userId,
                            scope,
                        }
                    },
                })
