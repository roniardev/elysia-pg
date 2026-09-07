import { Context, Data, Effect, Layer } from "effect"

export class EmailSenderError extends Data.TaggedError("EmailSenderError")<{
    cause: unknown
}> {}

export type SendEmailParam = {
    html: string
    subject: string
    to: string
}

export type EmailSenderService = {
    readonly send: (
        param: SendEmailParam,
    ) => Effect.Effect<void, EmailSenderError>
}

export const EmailSender =
    Context.GenericTag<EmailSenderService>("EmailSender")

export type SendEmail = (
    to: string,
    subject: string,
    html: string,
) => Promise<unknown>

export const makeEmailSenderLayer = (sendEmail: SendEmail) =>
    Layer.succeed(EmailSender, {
        send: ({ html, subject, to }) =>
            Effect.tryPromise({
                try: async () => {
                    await sendEmail(to, subject, html)
                },
                catch: (cause) => new EmailSenderError({ cause }),
            }),
    })
