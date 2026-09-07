import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { config } from "@/app/config.ts"
import * as schema from "@/db/schema"

export const makeDatabase = () => {
    const client = postgres(config.DATABASE_URL)
    const database = drizzle(client, {
        casing: "snake_case",
        schema,
    })

    return {
        database,
        close: () => client.end(),
    }
}

export type Database = ReturnType<typeof makeDatabase>["database"]
