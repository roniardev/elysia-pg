import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { ServiceError } from "@/src/general/service-error"
import { getUser } from "@/src/general/usecase/get-user"

export const readUser = (id: string) =>
    Effect.gen(function* () {
        const user = yield* Effect.tryPromise({
            try: () =>
                getUser({
                    identifier: id,
                    type: "id",
                    extend: {
                        permissions: true,
                    },
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!user.user) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        return {
            id: user.user.id,
            email: user.user.email,
            emailVerified: user.user.emailVerified,
            permissions: user.user.permissions,
        }
    })
