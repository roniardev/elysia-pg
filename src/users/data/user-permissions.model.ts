import { userPermissions } from "@/db/schema/user-permissions";

export interface UserPermissionModel {
  id: string;
  userId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date | null;
  revoked: boolean;
}

export interface CreateUserPermissionModel {
  userId: string;
  permissionId: string;
}

export interface UpdateUserPermissionModel {
  revoked?: boolean;
}

export const mapToUserPermissionModel = (data: typeof userPermissions.$inferSelect): UserPermissionModel => {
  return {
    id: data.id,
    userId: data.userId,
    permissionId: data.permissionId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    revoked: data.revoked,
  };
}; 