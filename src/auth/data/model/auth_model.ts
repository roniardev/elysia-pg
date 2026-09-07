import type {
    AuthUser,
    StoredAuthToken,
} from "@/src/auth/domain/entity/auth"
import {
    AuthTokenId,
    UserId,
} from "@/src/general/domain/entity-id"

type AuthUserRow = Omit<AuthUser, "id"> & {
    id: string
}

type StoredAuthTokenRow = Omit<StoredAuthToken, "id" | "userId"> & {
    id: string
    userId: string
}

export const toAuthUser = (row: AuthUserRow): AuthUser => ({
    ...row,
    id: UserId(row.id),
})

export const toStoredAuthToken = (
    row: StoredAuthTokenRow,
): StoredAuthToken => ({
    ...row,
    id: AuthTokenId(row.id),
    userId: UserId(row.userId),
})
