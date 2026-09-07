import { Layer } from "effect"

import type { Database } from "@/db/database"
import { IdGeneratorLayer } from "@/src/general/service/id_generator"
import { makePostRepositoryLayer } from "@/src/posts/data/repository/post_repository_impl"
import type { Locks } from "@/utils/services/lock-manager"

export const makePostLayer = (database: Database, locks: Locks) =>
    Layer.mergeAll(
        IdGeneratorLayer,
        makePostRepositoryLayer(database, locks),
    )
