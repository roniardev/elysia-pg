import type { Database } from "@/db/database"
import { posts } from "@/db/schema"
import type {
    PostListQuery,
    PostScope,
} from "@/src/posts/domain/entity/post"
import { buildPostWhere } from "@/src/posts/data/source/list_posts"

export const getPostCount = (
    database: Database,
    param: PostListQuery,
    scope: PostScope,
) => database.$count(posts, buildPostWhere(param.search, scope))
