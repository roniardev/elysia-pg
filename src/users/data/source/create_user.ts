import type { Database } from "@/db/database"
import {
    emailVerificationTokens,
    userPermissions,
    users,
} from "@/db/schema"
import type { CreateUserRecord } from "@/src/users/domain/entity/user"

export const createUser = (
    database: Database,
    user: CreateUserRecord,
) =>
    database.transaction(async (transaction) => {
        await transaction.insert(users).values({
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            hashedPassword: user.hashedPassword,
        })

        if (user.emailVerification) {
            await transaction.insert(emailVerificationTokens).values({
                ...user.emailVerification,
                email: user.email,
                userId: user.id,
            })
        }

        if (user.permissions.length > 0) {
            await transaction.insert(userPermissions).values(
                user.permissions.map((permission) => ({
                    ...permission,
                    userId: user.id,
                })),
            )
        }
    })
