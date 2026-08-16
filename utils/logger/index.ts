import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"

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
