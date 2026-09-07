import { Effect } from "effect"

import {
    type ApplicationRequirements,
    runApplicationEffect,
} from "@/app/runtime"
import type { SuccessMessage } from "@/common/enum/response-message"
import {
    toApplicationErrorResponse,
} from "@/src/general/delivery/application-error-response"
import type { ApplicationError } from "@/src/general/domain/application-error"
import { handleResponse } from "@/utils/handle-response"

export const runService = async <
    Data,
    Requirements extends ApplicationRequirements,
>(
    effect: Effect.Effect<Data, ApplicationError, Requirements>,
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
    const result = await runApplicationEffect(Effect.either(effect))

    if (result._tag === "Left") {
        const response = toApplicationErrorResponse(result.left)

        return handleResponse({
            message: response.message,
            callback: () => {
                set.status = response.status
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
