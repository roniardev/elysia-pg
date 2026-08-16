import { eq } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { users } from "@/db/schema"
import { getUser } from "@/src/general/usecase/get-user"
import { UserServiceError } from "@/src/users/service/error"
import { verrou } from "@/utils/services/locks"

export const deleteUser = (id: string) =>
    Effect.gen(function* () {
        const existingUser = yield* Effect.tryPromise({
            try: () =>
                getUser({
                    identifier: id,
                    type: "id",
                }),
            catch: (error) => {
                console.error(error)
                return new UserServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingUser.user) {
            return yield* Effect.fail(
                new UserServiceError(
                    ErrorMessage.USER_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        if (existingUser.user.deletedAt) {
            return yield* Effect.fail(
                new UserServiceError(
                    ErrorMessage.USER_ALREADY_DELETED,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        const { user } = existingUser

        yield* Effect.tryPromise({
            try: () =>
                verrou.createLock(`user:${user.id}`).run(async () => {
                    // await 15s
                    await new Promise((resolve) => setTimeout(resolve, 15000))

                    await db
                        .update(users)
                        .set({
                            deletedAt: new Date(),
                        })
                        .where(eq(users.id, user.id))
                }),
            catch: (error) => {
                console.error(error)
                return new UserServiceError(
                    ErrorMessage.FAILED_TO_DELETE_USER,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return { id: user.id }
    })
