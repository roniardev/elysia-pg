import { Brand } from "effect"

export type UserId = string & Brand.Brand<"UserId">
export type PostId = string & Brand.Brand<"PostId">
export type PermissionId = string & Brand.Brand<"PermissionId">
export type UserPermissionId = string & Brand.Brand<"UserPermissionId">
export type AuthTokenId = string & Brand.Brand<"AuthTokenId">

export const UserId = Brand.nominal<UserId>()
export const PostId = Brand.nominal<PostId>()
export const PermissionId = Brand.nominal<PermissionId>()
export const UserPermissionId = Brand.nominal<UserPermissionId>()
export const AuthTokenId = Brand.nominal<AuthTokenId>()
