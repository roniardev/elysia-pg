import { Context, Layer } from "effect"

export type FrontendConfigService = {
    readonly url: string
}

export const FrontendConfig =
    Context.GenericTag<FrontendConfigService>("FrontendConfig")

export const makeFrontendConfigLayer = (url: string) =>
    Layer.succeed(FrontendConfig, { url })
