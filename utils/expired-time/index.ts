import dayjs from "dayjs";

import { config } from "@/app/config";

export const getExpiredRefreshToken = () => {
	return dayjs().unix() + config.REFRESH_TOKEN_EXPIRE_TIME;
};

export const getExpiredAccessToken = () => {
	return dayjs().unix() + config.ACCESS_TOKEN_EXPIRE_TIME;
};

export default {
	getExpiredRefreshToken,
	getExpiredAccessToken,
};