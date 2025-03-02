import { t } from "elysia";

export const readPermissionResponse = t.Object({
  message: t.String(),
  data: t.Array(
    t.Object({
      id: t.String(),
      name: t.String(),
      description: t.Optional(t.String()),
      createdAt: t.String(),
      updatedAt: t.String(),
    }),
  ),
});

export type IReadPermissionResponse = typeof readPermissionResponse.static; 