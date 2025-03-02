import { Elysia, t } from "elysia";

export const createPermissionModel = new Elysia().model({
  createPermissionModel: t.Object({
    name: t.String(),
    description: t.Optional(t.String()),
  }),
});

export const readAllPermissionModel = new Elysia().model({
  readAllPermissionModel: t.Object({
    page: t.Number(),
    limit: t.Number(),
    sort: t.Optional(t.String()),
    search: t.Optional(t.String()),
  }),
});

export const updatePermissionModel = new Elysia().model({
  updatePermissionModel: t.Object({
    name: t.Optional(t.String()),
    description: t.Optional(t.String()),
  }),
});

export const deletePermissionModel = new Elysia().model({
  deletePermissionModel: t.Object({
    id: t.String(),
  }),
});

export const readPermissionModel = new Elysia().model({
  readPermissionModel: t.Object({
    id: t.String(),
  }),
}); 