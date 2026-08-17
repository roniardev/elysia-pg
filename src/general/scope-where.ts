import { and, eq, type SQL, type SQLWrapper } from "drizzle-orm"

import { Scope } from "@/common/enum/scopes"

/**
 * Build a where clause that restricts to the owning user when scope is
 * PERSONAL, otherwise scopes to the row id alone.
 */
export const scopeWhere = <T extends { id: SQLWrapper; userId: SQLWrapper }>(
    table: T,
    id: string,
    userId: string,
    scope: string | null,
): SQL => {
    if (scope === Scope.PERSONAL) {
        return and(eq(table.id, id), eq(table.userId, userId)) as SQL
    }
    return eq(table.id, id)
}
