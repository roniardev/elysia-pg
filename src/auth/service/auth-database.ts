import { Context, Layer } from "effect"
import { db } from "@/db"

export type AuthDatabase = typeof db

export class AuthDatabaseService extends Context.Tag("AuthDatabase")<
    AuthDatabaseService,
    AuthDatabase
>() {}

export const AuthDatabaseLive = Layer.succeed(AuthDatabaseService, db)
