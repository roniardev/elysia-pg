import { describe, expect, test } from "bun:test"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { toApplicationErrorResponse } from "@/src/general/delivery/application_error_response"
import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application_error"

describe("Application error HTTP mapping", () => {
    test("maps domain absence without storing HTTP status in the error", () => {
        const error = applicationError(ApplicationErrorCode.USER_NOT_FOUND)
        const response = toApplicationErrorResponse(error)

        expect(error).not.toHaveProperty("status")
        expect(error.code).toBe(ApplicationErrorCode.USER_NOT_FOUND)
        expect(response).toEqual({
            message: ErrorMessage.USER_NOT_FOUND,
            status: ResponseErrorStatus.NOT_FOUND,
        })
    })

    test("preserves context-specific legacy responses", () => {
        const response = toApplicationErrorResponse(
            applicationError(
                ApplicationErrorCode.POST_DELETE_TARGET_NOT_FOUND,
            ),
        )

        expect(response).toEqual({
            message: ErrorMessage.POST_NOT_FOUND,
            status: ResponseErrorStatus.INTERNAL_SERVER_ERROR,
        })
    })

    test("maps token failure variants to their existing statuses", () => {
        const invalidFormat = toApplicationErrorResponse(
            applicationError(ApplicationErrorCode.EMAIL_TOKEN_INVALID_FORMAT),
        )
        const missing = toApplicationErrorResponse(
            applicationError(ApplicationErrorCode.EMAIL_TOKEN_NOT_FOUND),
        )
        const rejected = toApplicationErrorResponse(
            applicationError(ApplicationErrorCode.EMAIL_TOKEN_REJECTED),
        )

        expect(invalidFormat.status).toBe(ResponseErrorStatus.BAD_REQUEST)
        expect(missing.status).toBe(ResponseErrorStatus.NOT_FOUND)
        expect(rejected.status).toBe(ResponseErrorStatus.FORBIDDEN)
    })
})
