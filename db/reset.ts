import { getTableName } from "drizzle-orm"
import { db } from "@/db"
import {
    emailVerificationTokens,
    passwordResetTokens,
    permissions,
    posts,
    scopes,
    scopeUserPermissions,
    userPermissions,
    users,
} from "@/db/schema"

const tables = [
    scopeUserPermissions,
    scopes,
    userPermissions,
    permissions,
    posts,
    emailVerificationTokens,
    passwordResetTokens,
    users,
]

for (const table of tables) {
    const name = getTableName(table)
    console.log(`Resetting ${name}`)
    await db.delete(table)
    console.log(`Resetted ${name}`)
    const tableResult = await db.select().from(table)
    console.log(`${name} result: `, tableResult)
}

console.log("Database resetted")

process.exit(0)
