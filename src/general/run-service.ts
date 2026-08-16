import { Effect } from "effect"

import type { SuccessMessage } from "@/common/enum/response-message"
import type { ServiceError } from "@/src/general/service-error"
import { handleResponse } from "@/utils/handle-response"

export const runService = async <Data>(
    effect: Effect.Effect<Data, ServiceError>,
    options: {
        set: { status?: number | string }
        path: string
        success: {
            message: SuccessMessage
            status: number
            data?: (
                data: Data,
            ) => Record<string, unknown> | Record<string, unknown>[] | null
            attributes?: (data: Data) => Record<string, unknown>
        }
    },
) => {
    const { set, path, success } = options
    const result = await Effect.runPromise(Effect.either(effect))

    if (result._tag === "Left") {
        return handleResponse({
            message: result.left.message,
            callback: () => {
                set.status = result.left.status
            },
            path,
        })
    }

    return handleResponse({
        message: success.message,
        callback: () => {
            set.status = success.status
        },
        data: success.data?.(result.right),
        attributes: success.attributes?.(result.right),
        path,
    })
}
