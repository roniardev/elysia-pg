import { Effect, Layer } from "effect"

import { resetPasswordTemplate } from "@/common/email-templates/reset-password"
import {
    AuthNotification,
    AuthNotificationError,
} from "@/src/auth/domain/repository/auth_notification_service"
import type { SendEmail } from "@/src/general/service/email_sender"
import type { Locks } from "@/utils/services/lock-manager"

export const makeAuthNotificationLayer = (
    locks: Locks,
    sendEmail: SendEmail,
) => Layer.succeed(AuthNotification, {
    sendPasswordReset: (email, userId, token) => Effect.tryPromise({
        try: async () => {
            await locks
                .createLock(`${email}:forgot-password:${userId}:sendEmail`)
                .run(async () => {
                    await sendEmail(
                        email,
                        "Reset your password",
                        resetPasswordTemplate(token),
                    )
                })
        },
        catch: (cause) => new AuthNotificationError({ cause }),
    }),
})
