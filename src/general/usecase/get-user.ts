import { db } from "@/db"
import type { Permission, User } from "@/db/schema"

type GetUser = {
    identifier: string
    type: "email" | "id"
    condition?: {
        deleted?: boolean
        emailVerified?: boolean
    }
    extend?: {
        permissions?: boolean
    }
}

type GetUserResponse = {
    valid: boolean
    message: string
    user: (User & { permissions?: Permission[] }) | null
}

export const getUser = async ({
    identifier,
    type,
    condition,
    extend,
}: GetUser): Promise<GetUserResponse> => {
    const withPermissions = extend?.permissions || undefined

    let withOption: { permissions: true } | undefined

    if (withPermissions) {
        withOption = { permissions: true }
    }

    const user = (await db.query.users.findFirst({
        where: (table, { eq, and, isNull }) => {
            const conditions = [eq(table[type], identifier)]

            if (!condition?.deleted) {
                conditions.push(isNull(table.deletedAt))
            }

            if (condition?.emailVerified) {
                conditions.push(eq(table.emailVerified, true))
            }

            return and(...conditions)
        },
        with: withOption,
    })) as User & { permissions?: Permission[] }

    if (!user) {
        return {
            valid: false,
            message: "User not found",
            user: null,
        }
    }

    return {
        valid: true,
        message: "User found",
        user,
    }
}
