import { t } from "elysia"

import {
    AuthTokenId,
    PermissionId,
    PostId,
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity_id"
import { ULID_PATTERN } from "@/utils/ulid"

const ulidSchema = t.String({ pattern: ULID_PATTERN })

export const userIdSchema = t.Transform(ulidSchema)
    .Decode(UserId)
    .Encode((value) => value)

export const postIdSchema = t.Transform(ulidSchema)
    .Decode(PostId)
    .Encode((value) => value)

export const permissionIdSchema = t.Transform(ulidSchema)
    .Decode(PermissionId)
    .Encode((value) => value)

export const userPermissionIdSchema = t.Transform(ulidSchema)
    .Decode(UserPermissionId)
    .Encode((value) => value)

export const authTokenIdSchema = t.Transform(ulidSchema)
    .Decode(AuthTokenId)
    .Encode((value) => value)
