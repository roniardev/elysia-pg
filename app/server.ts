import { cors } from "@elysia/cors"
import { opentelemetry } from "@elysia/opentelemetry"
import { serverTiming } from "@elysia/server-timing"
import { openapi } from "@elysia/openapi"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node"
import { Elysia, ValidationError } from "elysia"
import { compression } from "elysia-compress"
import { config } from "@/app/config"
import type { GeneralResponse } from "@/common/model/general-response"
import { auth } from "@/src/auth"
import { permissions } from "@/src/permissions"
import { posts } from "@/src/posts"
import { users } from "@/src/users"
import { userPermissions } from "@/src/user-permissions"
import { encryptResponse } from "@/utils/encrypt-response"
import {
    createRequestLogContext,
    logHttpRequest,
    type RequestLogContext,
} from "@/utils/logger"

const otlpHeaders: Record<string, string> = {
    "X-Axiom-Dataset": config.OTLP_AXIOM_DATASET,
}

if (config.OTLP_AXIOM_TOKEN) {
    otlpHeaders.Authorization = `Bearer ${config.OTLP_AXIOM_TOKEN}`
}

const requestContexts = new WeakMap<Request, RequestLogContext>()

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
                        url: config.OTLP_TRACE_ENDPOINT,
                        headers: otlpHeaders,
                    }),
                ),
            ],
        }),
    )
    .use(compression())
    .request(({ request, set }) => {
        const context = createRequestLogContext(request)
        requestContexts.set(request, context)
        set.headers["x-request-id"] = context.requestId
    })
    .use(openapi())
    .use(
        cors({
            origin: config.CORS_ORIGIN.split(","),
        }),
    )
    .use(serverTiming())
    .error(({ error, set, request }) => {
        const context = requestContexts.get(request)
        if (context) {
            requestContexts.set(request, {
                ...context,
                error,
            })
        }

        if (error instanceof ValidationError) {
            const resError = error.all as unknown as Array<
                Record<string, string | number>
            >
            const name = error.all[0] as unknown as Record<string, string>
            const err = resError.filter(
                (item) =>
                    (Number(item?.type) || 0) >= 40 &&
                    (Number(item?.type) || 0) < 50 &&
                    item?.type,
            )

            set.status = 400
            return {
                status: false,
                message: name.summary,
                err: err,
            }
        }

        if (error instanceof Error && error.message === "Internal Server Error") {
            return {
                status: false,
                message: "Internal Server Error",
            }
        }
    })
    .afterResponse(({ request, responseValue, set }) => {
        const context = requestContexts.get(request)
        if (!context) {
            return
        }

        let statusCode = Number(set.status)
        if (!statusCode && responseValue instanceof Response) {
            statusCode = responseValue.status
        }
        if (!statusCode) {
            statusCode = 200
        }
        let outcome: "success" | "error" = "success"
        if (statusCode >= 400) {
            outcome = "error"
        }
        logHttpRequest({
            context,
            statusCode,
            outcome,
            error: context.error,
        })
        requestContexts.delete(request)
    })
    .afterHandle(({ responseValue }) =>
        encryptResponse(responseValue as GeneralResponse),
    )
    .use(auth)
    .use(posts)
    .use(users)
    .use(permissions)
    .use(userPermissions)

export type ElysiaApp = typeof app
