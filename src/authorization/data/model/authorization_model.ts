import { Scope } from "@/common/enum/scopes"
import type { AuthorizationScope } from "@/src/authorization/domain/entity/authorization"

export const toAuthorizationScope = (
    value: string | null,
): AuthorizationScope | null => {
    if (value === Scope.PERSONAL) {
        return value
    }

    if (value === Scope.GLOBAL) {
        return value
    }

    if (value === Scope.SUPER_ADMIN) {
        return value
    }

    if (value === null) {
        return null
    }

    throw new Error(`Unknown authorization scope: ${value}`)
}
