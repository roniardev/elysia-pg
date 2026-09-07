import { Context, Data, Effect, Layer } from "effect"

export class PasswordHasherError extends Data.TaggedError(
    "PasswordHasherError",
)<{
        cause: unknown
    }> {}

export type PasswordHasherService = {
    readonly hash: (
        value: string,
    ) => Effect.Effect<string, PasswordHasherError>
    readonly verify: (
        value: string,
        hash: string,
    ) => Effect.Effect<boolean, PasswordHasherError>
}

export const PasswordHasher =
    Context.GenericTag<PasswordHasherService>("PasswordHasher")

export const PasswordHasherLayer = Layer.succeed(PasswordHasher, {
    hash: (value: string) =>
        Effect.tryPromise({
            try: () => Bun.password.hash(value),
            catch: (cause) => new PasswordHasherError({ cause }),
        }),
    verify: (value: string, hash: string) =>
        Effect.tryPromise({
            try: () => Bun.password.verify(value, hash),
            catch: (cause) => new PasswordHasherError({ cause }),
        }),
})
