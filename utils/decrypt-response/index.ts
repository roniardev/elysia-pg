import Crypto from "@/utils/crypto"

export type DecryptedResponse<T> = {
    data: T
    meta?: {
        total: number
        totalPage: number
        page: number
        limit: number
    }
}

export const decryptResponse = <T>(
    response: string,
): DecryptedResponse<T> | undefined => {
    if (!response) return
    const decryptedData = Crypto.decrypt(response)
    const responseData = JSON.parse(decryptedData)
    const res: DecryptedResponse<T> = {
        data: responseData.data.data || responseData.data,
    }

    if (responseData?.meta?.total) {
        res.meta = {
            total: responseData.meta.total,
            totalPage: responseData.meta.totalPage,
            page: responseData.meta.page,
            limit: responseData.meta.limit,
        }
    }

    return res
}
