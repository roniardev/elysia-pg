import { Context, Data, Effect, Layer } from "effect"
import { SignJWT } from "jose"

import type { UserId } from "@/src/general/domain/entity-id"

export class EmailTokenSignerError extends Data.TaggedError(
    "EmailTokenSignerError",
)<{
        cause: unknown
    }> {}

export type EmailTokenSignerService = {
    readonly sign: (
        userId: UserId,
    ) => Effect.Effect<string, EmailTokenSignerError>
}

export const EmailTokenSigner =
    Context.GenericTag<EmailTokenSignerService>("EmailTokenSigner")

export const makeEmailTokenSignerLayer = (secret: string) =>
    Layer.succeed(EmailTokenSigner, {
        sign: (userId: UserId) =>
            Effect.tryPromise({
                try: () =>
                    new SignJWT({ id: userId })
                        .setProtectedHeader({ alg: "HS256" })
                        .setIssuedAt()
                        .setExpirationTime("25m")
                        .sign(new TextEncoder().encode(secret)),
                catch: (cause) => new EmailTokenSignerError({ cause }),
            }),
    })
