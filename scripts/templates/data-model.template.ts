/**
 * Template for generating data model files
 */
export const dataModelTemplate = (sourceName: string) => `import { Elysia, t } from "elysia"

export const create${sourceName}Model = new Elysia().model({
  create${sourceName}Model: t.Object({
    name: t.String(),
    // Add other fields specific to your model here
  }),
})

export const readAll${sourceName}Model = new Elysia().model({
  readAll${sourceName}Model: t.Object({
    page: t.Number(),
    limit: t.Number(),
    sort: t.Optional(t.String()),
    search: t.Optional(t.String()),
  }),
})

export const update${sourceName}Model = new Elysia().model({
  update${sourceName}Model: t.Object({
    name: t.Optional(t.String()),
    // Add other fields specific to your model here
  }),
})

export const delete${sourceName}Model = new Elysia().model({
  delete${sourceName}Model: t.Object({
    id: t.String(),
  }),
})

export const read${sourceName}Model = new Elysia().model({
  read${sourceName}Model: t.Object({
    id: t.String(),
  }),
})
`