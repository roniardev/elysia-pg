export type PaginationAttributes = {
    total: number
    page: number
    limit: number
    totalPage: number
}

export const getPagination = (page: number, limit: number, total: number) => {
    const totalPage = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    return {
        offset,
        totalPage,
        attributes: {
            total,
            page,
            limit,
            totalPage,
        },
    }
}
