import { Context, Layer } from "effect"

import { db } from "@/db"

export type UsersDatabase = typeof db

export class UsersDatabaseService extends Context.Tag("UsersDatabase")<
    UsersDatabaseService,
    UsersDatabase
>() {}

export const UsersDatabaseLive = Layer.succeed(UsersDatabaseService, db)
