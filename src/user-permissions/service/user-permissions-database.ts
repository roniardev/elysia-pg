import { Context, Layer } from "effect"

import { db } from "@/db"

export type UserPermissionsDatabase = typeof db

export class UserPermissionsDatabaseService extends Context.Tag(
    "UserPermissionsDatabase",
)<UserPermissionsDatabaseService, UserPermissionsDatabase>() {}

export const UserPermissionsDatabaseLive = Layer.succeed(
    UserPermissionsDatabaseService,
    db,
)
