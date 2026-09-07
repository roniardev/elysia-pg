import { Layer } from "effect"

import { config } from "@/app/config"
import type { Database } from "@/db/database"
import { makeEmailSenderLayer } from "@/src/general/service/email_sender"
import { makeEmailTokenSignerLayer } from "@/src/general/service/email_token_signer"
import { makeFrontendConfigLayer } from "@/src/general/service/frontend_config"
import { IdGeneratorLayer } from "@/src/general/service/id_generator"
import { PasswordHasherLayer } from "@/src/general/service/password_hasher"
import { makeUserRepositoryLayer } from "@/src/users/data/repository/user_repository_impl"
import { sendEmail } from "@/utils/send-email"
import type { Locks } from "@/utils/services/lock-manager"

export const makeUserLayer = (database: Database, locks: Locks) =>
    Layer.mergeAll(
        makeEmailSenderLayer(sendEmail),
        makeEmailTokenSignerLayer(config.JWT_EMAIL_SECRET),
        makeFrontendConfigLayer(config.FRONTEND_URL),
        IdGeneratorLayer,
        PasswordHasherLayer,
        makeUserRepositoryLayer(database, locks),
    )
