import { Elysia } from "elysia"
import { Logestic } from "logestic"
import { cors } from "@elysiajs/cors"
import { serverTiming } from "@elysiajs/server-timing"
import { swagger } from "@elysiajs/swagger"

import { config } from "./config"

import { posts } from "@/src/posts"
import { auth } from "@/src/auth"
import { users } from "@/src/users"
import { permissions } from "@/src/permissions"
import logger from "@/utils/logger"
import { encryptResponse } from "@/utils/encrypt-response"

    export const app = new Elysia({
        serve: {
            idleTimeout: 255,
            maxRequestBodySize: 1024 * 1024 * 10, // 10MB,
            development: config.NODE_ENV === "development",
        },
    })
        .use(Logestic.preset("fancy"))
        .use(swagger())
        .use(
            cors({
                origin: config.CORS_ORIGIN.split(","),
            }),
        )
        .use(serverTiming())
        .onError(({ error, code, set }) => {
            switch (code) {
                case "VALIDATION": {
                    const resError = error.all as unknown as Array<
                        Record<string, string | number>
                    >
                    const name = error.all[0] as unknown as Record<
                        string,
                        string
                    >
                    const err = resError.filter(
                        (err) =>
                            (Number(err?.type) || 0) >= 40 &&
                            (Number(err?.type) || 0) < 50 &&
                            err?.type,
                    )

                    set.status = 400
                    return {
                        status: false,
                        message: name.summary,
                        err: err,
                    }
                }

                case "INTERNAL_SERVER_ERROR": {
                    logger.error(error)
                    return {
                        status: false,
                        message: error.message,
                        err: error,
                    }
                }
            }
        })
        .onAfterHandle(({ response, request }) => {
            console.log({
                from: "server",
                response,
                request,
            })
            return encryptResponse(response)
        })
        .use(auth)
        .use(posts)
        .use(users)
        .use(permissions)

export type ElysiaApp = typeof app