import { UserPermissionModel } from "./user-permissions.model";

export interface UserPermissionResponse {
  id: string;
  userId: string;
  permissionId: string;
  createdAt: string;
  updatedAt: string | null;
  revoked: boolean;
}

export const mapToUserPermissionResponse = (model: UserPermissionModel): UserPermissionResponse => {
  return {
    id: model.id,
    userId: model.userId,
    permissionId: model.permissionId,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt?.toISOString() ?? null,
    revoked: model.revoked,
  };
}; 