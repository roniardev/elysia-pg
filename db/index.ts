import { makeDatabase } from "@/db/database"

const defaultDatabase = makeDatabase()

export const db = defaultDatabase.database
export const closeDatabase = defaultDatabase.close
