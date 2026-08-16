import { config } from "@/app/config"
import type { GeneralResponse } from "@/common/model/general-response"
import Crypto from "@/utils/crypto"

export const encryptResponse = (response: GeneralResponse) => {
    if (!config.IS_ENCRYPT_RESPONSE) return response
    if (!response.data) return
    // biome-ignore lint/suspicious/noExplicitAny: reflect-json data has unknown shape until encrypted
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
