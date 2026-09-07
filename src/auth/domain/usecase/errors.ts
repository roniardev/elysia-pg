import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"

export const authError = (code: ApplicationErrorCode) =>
    applicationError(code)

export const internalAuthError = () =>
    Effect.fail(authError(ApplicationErrorCode.INTERNAL))
