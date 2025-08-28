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
import { opentelemetry } from '@elysiajs/opentelemetry'

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

    export const app = new Elysia({
        serve: {
            idleTimeout: 255,
            maxRequestBodySize: 1024 * 1024 * 10, // 10MB,
            development: config.NODE_ENV === "development",
        },
    })
        .use(
    		opentelemetry({
    			spanProcessors: [
    				new BatchSpanProcessor(
    					new OTLPTraceExporter({
                            url: 'https://api.axiom.co/v1/traces',
                            headers: {
                                Authorization: `Bearer xaat-17a69791-efa0-4aa0-a14d-48ddf6fc1648`,
                                'X-Axiom-Dataset': 'elysia_pg'
                            }
                        })
    				)
    			]
    		})
    	)
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