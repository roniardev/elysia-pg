import type { ResponseErrorStatus } from "@/common/enum/response-status";

export const handleErrorResponse = (
	status: ResponseErrorStatus,
	message: string,
	callback: () => void,
) => {
	callback();
	return {
		status: false,
		message,
	};
};
