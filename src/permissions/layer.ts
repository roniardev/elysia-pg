import { Layer } from "effect"

import type { Database } from "@/db/database"
import { IdGeneratorLayer } from "@/src/general/service/id_generator"
import { makePermissionRepositoryLayer } from "@/src/permissions/data/repository/permission_repository_impl"
import type { Locks } from "@/utils/services/lock-manager"

export const makePermissionLayer = (database: Database, locks: Locks) =>
    Layer.mergeAll(
        IdGeneratorLayer,
        makePermissionRepositoryLayer(database, locks),
    )
