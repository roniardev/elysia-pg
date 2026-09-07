import type { Database } from "@/db/database"
import { posts } from "@/db/schema"
import type { PostScope } from "@/src/posts/domain/entity/post"
import { scopeWhere } from "@/src/general/scope_where"

export const getPostById = (
    database: Database,
    id: string,
    scope: PostScope,
) => database.query.posts.findFirst({
    where: scopeWhere(posts, id, scope.userId, scope.scope),
})
