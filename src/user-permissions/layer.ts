import { Layer } from "effect"

import type { Database } from "@/db/database"
import { IdGeneratorLayer } from "@/src/general/service/id_generator"
import { makeUserPermissionRepositoryLayer } from "@/src/user-permissions/data/repository/user_permission_repository_impl"
import type { Locks } from "@/utils/services/lock-manager"

export const makeUserPermissionLayer = (database: Database, locks: Locks) =>
    Layer.mergeAll(
        IdGeneratorLayer,
        makeUserPermissionRepositoryLayer(database, locks),
    )
