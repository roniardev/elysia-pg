import { Context, Layer } from "effect"

import { db } from "@/db"

export type PostsDatabase = typeof db

export class PostsDatabaseService extends Context.Tag("PostsDatabase")<
    PostsDatabaseService,
    PostsDatabase
>() {}

export const PostsDatabaseLive = Layer.succeed(PostsDatabaseService, db)
