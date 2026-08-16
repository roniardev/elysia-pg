export type PaginationAttributes = {
    total: number
    page: number
    limit: number
    totalPage: number
}

export const getPagination = (page: number, limit: number, total: number) => {
    if (page === -1) {
        let totalPage = 1
        if (total === 0) {
            totalPage = 0
        }

        return {
            offset: 0,
            totalPage,
            attributes: {
                total,
                page,
                limit: total,
                totalPage,
            },
        }
    }

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
