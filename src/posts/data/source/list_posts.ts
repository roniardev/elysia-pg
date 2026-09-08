import { and, asc, desc, eq, isNull, like, type SQL } from "drizzle-orm"

import { Scope } from "@/common/enum/scopes"
import Sorting from "@/common/enum/sorting"
import type { Database } from "@/db/database"
import { posts } from "@/db/schema"
import type {
    PostListQuery,
    PostScope,
} from "@/src/posts/domain/entity/post"

export const buildPostWhere = (
    search: string | undefined,
    scope: PostScope,
): SQL | undefined => {
    const conditions = [isNull(posts.deletedAt)]

    if (scope.scope === Scope.PERSONAL) {
        conditions.push(eq(posts.userId, scope.userId))
    }

    if (search) {
        conditions.push(like(posts.title, `%${search}%`))
    }

    return and(...conditions)
}

export const getListPosts = (
    database: Database,
    param: PostListQuery,
    scope: PostScope,
) => {
    let orderBy = desc(posts.createdAt)

    if (param.sort === Sorting.ASC) {
        orderBy = asc(posts.createdAt)
    }

    const options = {
        where: buildPostWhere(param.search, scope),
        orderBy,
        with: {
            user: {
                columns: {
                    id: true,
                },
            },
        },
    } as const

    if (param.page === -1) {
        return database.query.posts.findMany(options)
    }

    return database.query.posts.findMany({
        ...options,
        limit: param.limit,
        offset: (param.page - 1) * param.limit,
    })
}
