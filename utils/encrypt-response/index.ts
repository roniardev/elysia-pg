import Crypto from "@/utils/crypto";
import type { GeneralResponse } from "@/common/model/general-response";

export const encryptResponse = (response: GeneralResponse) => {
	if (!response.data) return;
	const encryptedData = Crypto.encrypt(JSON.stringify(response.data));

	return {
		status: response.status,
		message: response.message,
		data: encryptedData,
	};
};
