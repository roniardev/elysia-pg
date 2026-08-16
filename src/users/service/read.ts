import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { getUser } from "@/src/general/usecase/get-user"
import { UserServiceError } from "@/src/users/service/error"

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
                return new UserServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!user.user) {
            return yield* Effect.fail(
                new UserServiceError(
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
