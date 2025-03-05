import { t } from "elysia";

export const readUserPermissionResponse = t.Object({
  message: t.String(),
  data: t.Array(
    t.Object({
      id: t.String(),
      userId: t.String(),
      permissionId: t.String(),
      createdAt: t.String(),
      updatedAt: t.String(),
      revoked: t.Boolean(),
    }),
  ),
});

export type IReadUserPermissionResponse = typeof readUserPermissionResponse.static; 