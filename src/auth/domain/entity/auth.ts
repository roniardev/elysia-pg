import type { User } from "@/src/users/domain/entity/user"
import type {
    AuthTokenId,
    UserId,
} from "@/src/general/domain/entity_id"

export type AuthUser = User

export type AuthSession = {
    accessToken: string
    refreshToken: string
}

export type AuthTokenKind =
    | "access"
    | "email"
    | "refresh"
    | "registrationEmail"

export type StoredAuthToken = {
    expiresAt: Date
    hashedToken: string
    id: AuthTokenId
    revoked: boolean
    userId: UserId
}

export type LoginParam = {
    email: string
    password: string
}

export type RegisterParam = LoginParam & {
    confirmPassword: string
}

export type ForgotPasswordParam = {
    email: string
}

export type ResetPasswordParam = {
    confirmPassword: string
    password: string
    token: string
}

export type VerifyEmailParam = {
    token: string
}
