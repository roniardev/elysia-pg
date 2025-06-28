import Crypto from "@/utils/crypto"

export const decryptResponse = (response: string) => {
    if (!response) return
    const decryptedData = Crypto.decrypt(response)
    const responseData = JSON.parse(decryptedData)
    const res: any = {}

    res.data = responseData.data.data || responseData.data

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
