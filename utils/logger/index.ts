import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"
import { config } from "@/app/config"

export type RequestLogContext = {
    requestId: string
    method: string
    path: string
    startedAt: number
    error?: unknown
}

export const createRequestLogContext = (request: Request): RequestLogContext => ({
    requestId: crypto.randomUUID(),
    method: request.method,
    path: new URL(request.url).pathname,
    startedAt: performance.now(),
})

export const logHttpRequest = (params: {
    context: RequestLogContext
    statusCode: number
    outcome: "success" | "error"
    error?: unknown
}) => {
    const { context, statusCode, outcome, error } = params
    let errorDetails = error
    if (error instanceof Error) {
        errorDetails = {
            type: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    logger.info({
        event: "http_request",
        request_id: context.requestId,
        method: context.method,
        path: context.path,
        status_code: statusCode,
        outcome,
        duration_ms: Math.round(performance.now() - context.startedAt),
        environment: config.NODE_ENV,
        service_version: config.APP_VERSION,
        commit_sha: config.COMMIT_SHA,
        region: config.REGION,
        instance_id: config.INSTANCE_ID,
        error: errorDetails,
    })
}

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
}

const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
}

const format = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.json(),
    winston.format.errors({ stack: true }),
)

const devConsoleFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
        let line = `${info.timestamp} ${info.level}: ${info.message}`
        if (info.stack) {
            line += `\n${info.stack}`
        }
        if (Object.keys(info.metadata || "").length > 0) {
            line += `\n${JSON.stringify(info.metadata)}`
        }
        if (info.path) {
            line += `\n${info.path}`
        }
        return line
    }),
)

winston.addColors(colors)

const transports = [
    new DailyRotateFile({
        dirname: "logs",
        filename: "%DATE%.log",
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "14d",
        level: "debug",
        format: format,
    }),
    new winston.transports.Console({
        level: "debug",
        format: devConsoleFormat,
    }),
]

const logger = winston.createLogger({
    levels,
    format,
    transports,
    defaultMeta: {
        service: "api",
    },
    exitOnError: false,
})

export default logger
