import type { Database } from "@/db/database"

export type SeedDatabase = Pick<Database, "insert">
