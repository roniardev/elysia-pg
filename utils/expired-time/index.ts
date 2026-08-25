import dayjs from "dayjs"

import { config } from "@/app/config"

export const getExpiredRefreshToken = () => dayjs().unix() + config.REFRESH_TOKEN_EXPIRE_TIME

export const getExpiredAccessToken = () => dayjs().unix() + config.ACCESS_TOKEN_EXPIRE_TIME

export default {
    getExpiredRefreshToken,
    getExpiredAccessToken,
}
