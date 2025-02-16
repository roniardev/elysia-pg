import dayjs from "dayjs";
import type { JWTPayloadSpec } from "@elysiajs/jwt";

import { redis } from "@/utils/services/redis";

export const verifyAuth = async (
	bearer: string,
	token: {
		id: string;
	} & JWTPayloadSpec,
): Promise<{
	valid: boolean;
	message: string;
}> => {
	if (typeof token !== "object") {
		return {
			valid: false,
			message: "Unauthorized",
		};
	}

	const existingRefreshToken = await redis.get(`${token.id}:refreshToken`);

	const existingAccessToken = await redis.get(`${token.id}:accessToken`);

	if (token?.exp && token.exp < dayjs().unix()) {
		return {
			valid: false,
			message: "Unauthorized",
		};
	}

	if (bearer !== existingAccessToken) {
		return {
			valid: false,
			message: "Unauthorized",
		};
	}

	if (!existingRefreshToken || !existingAccessToken) {
		return {
			valid: false,
			message: "Forbidden",
		};
	}

	return {
		valid: true,
		message: "Authorized",
	};
};
