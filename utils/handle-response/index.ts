import {
    ErrorMessage,
    type SuccessMessage,
} from "@/common/enum/response-message"
import logger from "../logger"

export const handleResponse = (params: {
    message: ErrorMessage | SuccessMessage
    callback: () => void
    data?: Record<string, unknown> | Record<string, unknown>[] | null
    attributes?: Record<string, unknown>
    path?: string
}) => {
    const { message, callback, data, attributes, path } = params
    callback()

    const isErrorMessage = Object.values(ErrorMessage).includes(
        message as ErrorMessage,
    )

    logger.info({
        message,
        data,
        attributes,
        path: `Response:${path}`,
    })

    return {
        status: !isErrorMessage,
        message,
        data,
        ...attributes,
    }
}
