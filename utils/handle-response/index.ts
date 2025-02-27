	import {
		ErrorMessage,
		type SuccessMessage,
	} from "@/common/enum/response-message";

	export const handleResponse = (
		message: ErrorMessage | SuccessMessage,
		callback: () => void,
		data?: Record<string, unknown>,
	) => {
		callback();

		const isErrorMessage = Object.values(ErrorMessage).includes(
			message as ErrorMessage,
		);

		return {
			status: !isErrorMessage,
			message,
			data,
		};
	};
