import type { Database } from "@/db/database"
import { posts } from "@/db/schema"
import type { CreatePostRecord } from "@/src/posts/domain/entity/post"

export const createPost = async (
    database: Database,
    param: CreatePostRecord,
) => {
    await database.insert(posts).values({
        id: param.id,
        userId: param.userId,
        title: param.title,
        excerpt: param.excerpt,
        content: param.content,
    })
}
