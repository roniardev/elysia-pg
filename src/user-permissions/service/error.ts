import type { ErrorMessage } from "@/common/enum/response-message"
import type { ResponseErrorStatus } from "@/common/enum/response-status"

export class UserPermissionServiceError extends Error {
    constructor(
        readonly message: ErrorMessage,
        readonly status: ResponseErrorStatus,
    ) {
        super(message)
        this.name = "UserPermissionServiceError"
    }
}
