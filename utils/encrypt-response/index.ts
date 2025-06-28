import Crypto from "@/utils/crypto"
import type { GeneralResponse } from "@/common/model/general-response"

export const encryptResponse = (response: GeneralResponse) => {
    if (!response.data) return
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const responseData: any = {
        data: response.data,
    }

    if (response.total) {
        responseData.meta = {
            total: response.total,
            totalPage: response.totalPage,
            page: response.page,
            limit: response.limit,
        }
    }

    const encryptedData = Crypto.encrypt(JSON.stringify(responseData))

    return {
        status: response.status,
        message: response.message,
        data: encryptedData,
    }
}
