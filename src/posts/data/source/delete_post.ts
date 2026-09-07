import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { posts } from "@/db/schema"
import type { Post } from "@/src/posts/domain/entity/post"
import type { Locks } from "@/utils/services/lock-manager"

export const deletePost = (
    database: Database,
    locks: Locks,
    post: Post,
    lockOwner: string,
) => locks.createLock(`${lockOwner}:delete-post`).run(async () => {
    await database.delete(posts).where(eq(posts.id, post.id))
})
