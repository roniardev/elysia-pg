import type { Database } from "@/db/database"
import { emailVerificationTokens } from "@/db/schema"

export const createEmailVerificationToken = (
    database: Database,
    param: {
        email: string
        expiresAt: Date
        hashedToken: string
        id: string
        userId: string
    },
) => database.insert(emailVerificationTokens).values(param)
