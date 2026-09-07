import { Layer } from "effect"

import { config } from "@/app/config"
import type { Database } from "@/db/database"
import { makeAuthNotificationLayer } from "@/src/auth/data/repository/auth_notification_service_impl"
import { makeAuthRepositoryLayer } from "@/src/auth/data/repository/auth_repository_impl"
import { makeAuthSessionLayer } from "@/src/auth/data/repository/auth_session_repository_impl"
import { makeAuthTokenLayer } from "@/src/auth/data/repository/auth_token_service_impl"
import { makeEmailSenderLayer } from "@/src/general/service/email_sender"
import { makeFrontendConfigLayer } from "@/src/general/service/frontend_config"
import { IdGeneratorLayer } from "@/src/general/service/id_generator"
import { PasswordHasherLayer } from "@/src/general/service/password_hasher"
import type { Locks } from "@/utils/services/lock-manager"
import type { RedisClient } from "@/utils/services/redis-client"
import { sendEmail } from "@/utils/send-email"

export const makeAuthLayer = (
    database: Database,
    locks: Locks,
    redis: RedisClient,
) =>
    Layer.mergeAll(
        makeEmailSenderLayer(sendEmail),
        makeFrontendConfigLayer(config.FRONTEND_URL),
        IdGeneratorLayer,
        PasswordHasherLayer,
        makeAuthNotificationLayer(locks, sendEmail),
        makeAuthRepositoryLayer(database, locks),
        makeAuthSessionLayer(redis, locks, config),
        makeAuthTokenLayer(config),
    )
