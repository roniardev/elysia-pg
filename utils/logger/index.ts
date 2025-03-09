import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};

const colors = {
	error: "red",
	warn: "yellow",
	info: "green",
	http: "magenta",
	debug: "blue",
};

const format = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	winston.format.json(),
	winston.format.errors({ stack: true }),
);

const devConsoleFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	winston.format.colorize({ all: true }),
	winston.format.printf(
		(info) =>
			`${info.timestamp} ${info.level}: ${info.message} ${info.stack ? `\n${info.stack}` : ""} ${Object.keys(info.metadata || "").length > 0 ? `\n${JSON.stringify(info.metadata)}` : ""}`,
	),
);

winston.addColors(colors);

const transports = [
	new DailyRotateFile({
		dirname: "logs",
		filename: "%DATE%.log",
		datePattern: "YYYY-MM-DD",
		maxSize: "20m",
		maxFiles: "14d",
		level: "error",
	}),
	new winston.transports.Console({
		level: "error",
	}),
];

const logger = winston.createLogger({
	levels,
	format,
	transports,
	defaultMeta: {
		service: "api",
	},
	exitOnError: false,
});

export default logger;
