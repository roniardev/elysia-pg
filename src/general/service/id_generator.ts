import { Context, Effect, Layer } from "effect"
import { ulid } from "ulid"

export type IdGeneratorService = {
    readonly generate: Effect.Effect<string>
}

export const IdGenerator =
    Context.GenericTag<IdGeneratorService>("IdGenerator")

export const IdGeneratorLayer = Layer.succeed(IdGenerator, {
    generate: Effect.sync(ulid),
})
