import {
    ErrorMessage,
    type SuccessMessage,
} from "@/common/enum/response-message"

export const handleResponse = (params: {
    message: ErrorMessage | SuccessMessage
    callback: () => void
    data?: Record<string, unknown> | Record<string, unknown>[] | null
    attributes?: Record<string, unknown>
    path?: string
}) => {
    const { message, callback, data, attributes } = params
    callback()

    const isErrorMessage = Object.values(ErrorMessage).includes(
        message as ErrorMessage,
    )

    return {
        status: !isErrorMessage,
        message,
        data,
        ...attributes,
    }
}
