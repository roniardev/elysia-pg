import { Context, Layer } from "effect"

import { db } from "@/db"

export type PermissionsDatabase = typeof db

export class PermissionsDatabaseService extends Context.Tag(
    "PermissionsDatabase",
)<PermissionsDatabaseService, PermissionsDatabase>() {}

export const PermissionsDatabaseLive = Layer.succeed(
    PermissionsDatabaseService,
    db,
)
