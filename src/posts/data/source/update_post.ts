import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { posts } from "@/db/schema"
import type {
    Post,
    UpdatePostParam,
} from "@/src/posts/domain/entity/post"
import type { Locks } from "@/utils/services/lock-manager"

export const updatePost = (
    database: Database,
    locks: Locks,
    post: Post,
    param: UpdatePostParam,
    lockOwner: string,
) => locks.createLock(`${lockOwner}:update-post`).run(async () => {
    await database
        .update(posts)
        .set({
            title: param.title || post.title,
            excerpt: param.excerpt || post.excerpt,
            content: param.content || post.content,
            status: param.status || post.status,
            visibility: param.visibility || post.visibility,
            tags: param.tags || post.tags,
            updatedAt: new Date(),
        })
        .where(eq(posts.id, post.id))

    return database.query.posts.findFirst({
        where: (table, { eq: eqField }) => eqField(table.id, post.id),
    })
})
