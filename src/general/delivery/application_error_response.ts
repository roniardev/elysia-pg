import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import {
    ApplicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"

type ErrorResponse = {
    message: ErrorMessage
    status: ResponseErrorStatus
}

const badRequest = (message: ErrorMessage): ErrorResponse => ({
    message,
    status: ResponseErrorStatus.BAD_REQUEST,
})

const forbidden = (message: ErrorMessage): ErrorResponse => ({
    message,
    status: ResponseErrorStatus.FORBIDDEN,
})

const internal = (message: ErrorMessage): ErrorResponse => ({
    message,
    status: ResponseErrorStatus.INTERNAL_SERVER_ERROR,
})

const notFound = (message: ErrorMessage): ErrorResponse => ({
    message,
    status: ResponseErrorStatus.NOT_FOUND,
})

const errorResponses: Record<ApplicationErrorCode, ErrorResponse> = {
    [ApplicationErrorCode.EMAIL_ALREADY_VERIFIED]: forbidden(
        ErrorMessage.EMAIL_ALREADY_VERIFIED,
    ),
    [ApplicationErrorCode.EMAIL_NOT_VERIFIED]: forbidden(
        ErrorMessage.EMAIL_NOT_VERIFIED,
    ),
    [ApplicationErrorCode.EMAIL_TOKEN_EXPIRED]: forbidden(
        ErrorMessage.EMAIL_TOKEN_EXPIRED,
    ),
    [ApplicationErrorCode.EMAIL_TOKEN_INVALID_FORMAT]: badRequest(
        ErrorMessage.INVALID_EMAIL_TOKEN,
    ),
    [ApplicationErrorCode.EMAIL_TOKEN_NOT_FOUND]: notFound(
        ErrorMessage.INVALID_EMAIL_TOKEN,
    ),
    [ApplicationErrorCode.EMAIL_TOKEN_REJECTED]: forbidden(
        ErrorMessage.INVALID_EMAIL_TOKEN,
    ),
    [ApplicationErrorCode.FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN]: internal(
        ErrorMessage.FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN,
    ),
    [ApplicationErrorCode.FAILED_TO_CREATE_USER]: internal(
        ErrorMessage.FAILED_TO_CREATE_USER,
    ),
    [ApplicationErrorCode.FAILED_TO_DELETE_USER]: internal(
        ErrorMessage.FAILED_TO_DELETE_USER,
    ),
    [ApplicationErrorCode.FAILED_TO_READ_POST]: internal(
        ErrorMessage.FAILED_TO_READ_POST,
    ),
    [ApplicationErrorCode.FAILED_TO_SEND_EMAIL]: internal(
        ErrorMessage.FAILED_TO_SEND_EMAIL,
    ),
    [ApplicationErrorCode.FAILED_TO_UPDATE_POST]: internal(
        ErrorMessage.FAILED_TO_UPDATE_POST,
    ),
    [ApplicationErrorCode.INTERNAL]: internal(
        ErrorMessage.INTERNAL_SERVER_ERROR,
    ),
    [ApplicationErrorCode.INVALID_CREDENTIAL_FORMAT]: badRequest(
        ErrorMessage.INVALID_CREDENTIALS,
    ),
    [ApplicationErrorCode.INVALID_CREDENTIALS]: forbidden(
        ErrorMessage.INVALID_CREDENTIALS,
    ),
    [ApplicationErrorCode.INVALID_USER]: badRequest(ErrorMessage.INVALID_USER),
    [ApplicationErrorCode.PAGE_INVALID]: badRequest(ErrorMessage.PAGE_INVALID),
    [ApplicationErrorCode.PAGE_NOT_FOUND]: badRequest(
        ErrorMessage.PAGE_NOT_FOUND,
    ),
    [ApplicationErrorCode.PASSWORDS_DO_NOT_MATCH]: badRequest(
        ErrorMessage.PASSWORD_DO_NOT_MATCH,
    ),
    [ApplicationErrorCode.PERMISSION_ALREADY_ASSIGNED]: badRequest(
        ErrorMessage.PERMISSION_ALREADY_ASSIGNED,
    ),
    [ApplicationErrorCode.PERMISSION_NOT_FOUND]: notFound(
        ErrorMessage.PERMISSION_NOT_FOUND,
    ),
    [ApplicationErrorCode.POST_DELETE_TARGET_NOT_FOUND]: internal(
        ErrorMessage.POST_NOT_FOUND,
    ),
    [ApplicationErrorCode.POST_NOT_FOUND]: badRequest(
        ErrorMessage.POST_NOT_FOUND,
    ),
    [ApplicationErrorCode.SESSION_ALREADY_EXISTS]: forbidden(
        ErrorMessage.SESSION_ALREADY_EXISTS,
    ),
    [ApplicationErrorCode.UNAUTHORIZED]: {
        message: ErrorMessage.UNAUTHORIZED,
        status: ResponseErrorStatus.UNAUTHORIZED,
    },
    [ApplicationErrorCode.UNAUTHORIZED_PERMISSION]: forbidden(
        ErrorMessage.UNAUTHORIZED_PERMISSION,
    ),
    [ApplicationErrorCode.USER_ALREADY_EXISTS]: badRequest(
        ErrorMessage.USER_ALREADY_EXISTS,
    ),
    [ApplicationErrorCode.USER_NOT_FOUND]: notFound(
        ErrorMessage.USER_NOT_FOUND,
    ),
    [ApplicationErrorCode.USER_PERMISSION_NOT_FOUND]: notFound(
        ErrorMessage.USER_PERMISSION_NOT_FOUND,
    ),
}

export const toApplicationErrorResponse = (
    error: ApplicationError,
): ErrorResponse => errorResponses[error.code]
