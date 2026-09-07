import { and, isNull } from "drizzle-orm"

import type { Database } from "@/db/database"
import { users } from "@/db/schema"

export const getCountActiveUsers = (database: Database) =>
    database.$count(users, and(isNull(users.deletedAt)))
