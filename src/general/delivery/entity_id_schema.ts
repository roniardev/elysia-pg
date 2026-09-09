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

export const userIdSchema = t.Codec(ulidSchema)
    .Decode(UserId)
    .Encode((value) => value)

export const postIdSchema = t.Codec(ulidSchema)
    .Decode(PostId)
    .Encode((value) => value)

export const permissionIdSchema = t.Codec(ulidSchema)
    .Decode(PermissionId)
    .Encode((value) => value)

export const userPermissionIdSchema = t.Codec(ulidSchema)
    .Decode(UserPermissionId)
    .Encode((value) => value)

export const authTokenIdSchema = t.Codec(ulidSchema)
    .Decode(AuthTokenId)
    .Encode((value) => value)
